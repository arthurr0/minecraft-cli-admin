#!/bin/bash

SCRIPT_DIR="/opt/minecraft"
CONFIG_FILE="$SCRIPT_DIR/config.json"
BACKUP_DIR="$SCRIPT_DIR/backups"

# Function for logging
log() {
    echo "$1"
}

# Function to check required tools
check_dependencies() {
    local missing_tools=()
    
    for tool in jq screen java netstat; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log "ERROR: Missing required tools: ${missing_tools[*]}"
        log "Install missing tools before using the script"
        exit 1
    fi
}

# Function to check backup tools
check_backup_dependencies() {
    local missing_tools=()
    local action="$1"
    
    # Check tar - required for all backups
    if ! command -v tar >/dev/null 2>&1; then
        missing_tools+=("tar")
    fi
    
    # Check compression - prefer zstd, then xz, finally gzip
    local compression_tool=""
    if command -v zstd >/dev/null 2>&1; then
        compression_tool="zstd"
    elif command -v xz >/dev/null 2>&1; then
        compression_tool="xz"  
    elif command -v gzip >/dev/null 2>&1; then
        compression_tool="gzip"
    else
        missing_tools+=("zstd or xz or gzip")
    fi
    
    # Check s3cmd or rclone for S3 backups
    if [ "$action" = "s3" ]; then
        if ! command -v s3cmd >/dev/null 2>&1 && ! command -v rclone >/dev/null 2>&1; then
            missing_tools+=("s3cmd or rclone")
        fi
    fi
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        log "ERROR: Missing backup tools: ${missing_tools[*]}"
        return 1
    fi
    
    echo "$compression_tool"
    return 0
}

# Function to validate server name
validate_server_name() {
    local server_name="$1"
    
    # Check if name is not empty
    if [ -z "$server_name" ]; then
        log "ERROR: Server name cannot be empty"
        return 1
    fi
    
    # Check if name contains only allowed characters (alphanumeric, hyphens, underscores)
    if ! echo "$server_name" | grep -q '^[a-zA-Z0-9_-]*$'; then
        log "ERROR: Server name '$server_name' contains invalid characters"
        log "Only letters, numbers, hyphens and underscores are allowed"
        return 1
    fi
    
    # Check name length (max 32 characters)
    if [ ${#server_name} -gt 32 ]; then
        log "ERROR: Server name '$server_name' is too long (max 32 characters)"
        return 1
    fi
    
    return 0
}

# Function to create default configuration
create_default_config() {
    log "Creating default configuration in $CONFIG_FILE"
    
    cat > "$CONFIG_FILE" << 'EOF'
{
  "servers": {
    "survival": {
      "type": "spigot-params",
      "path": "/opt/minecraft/survival",
      "port": 25565
    }
  },
  "server_types": {
    "spigot-params": {
      "memory": "2G",
      "min_memory": "1G",
      "jvm_flags": [
        "-XX:+UseG1GC",
        "-XX:+ParallelRefProcEnabled",
        "-XX:MaxGCPauseMillis=200",
        "-XX:+UnlockExperimentalVMOptions",
        "-XX:+DisableExplicitGC",
        "-XX:+AlwaysPreTouch",
        "-XX:G1NewSizePercent=30",
        "-XX:G1MaxNewSizePercent=40",
        "-XX:G1HeapRegionSize=8M",
        "-XX:G1ReservePercent=20",
        "-XX:G1HeapWastePercent=5",
        "-XX:G1MixedGCCountTarget=4",
        "-XX:InitiatingHeapOccupancyPercent=15",
        "-XX:G1MixedGCLiveThresholdPercent=90",
        "-XX:G1RSetUpdatingPauseTimePercent=5",
        "-XX:SurvivorRatio=32",
        "-XX:+PerfDisableSharedMem",
        "-XX:MaxTenuringThreshold=1",
        "-Dusing.aikars.flags=https://mcflags.emc.gs",
        "-Daikars.new.flags=true"
      ]
    },
    "proxy-params": {
      "memory": "512M",
      "min_memory": "256M",
      "jvm_flags": [
        "-XX:+UseG1GC",
        "-XX:G1HeapRegionSize=4M",
        "-XX:+UnlockExperimentalVMOptions",
        "-XX:+ParallelRefProcEnabled",
        "-XX:+AlwaysPreTouch"
      ]
    }
  }
}
EOF
    
    if [ $? -eq 0 ]; then
        log "Created default configuration"
        log "Edit $CONFIG_FILE to customize server settings"
    else
        log "ERROR: Failed to create default configuration"
        exit 1
    fi
}

# Function to check and initialize configuration
check_and_init_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        log "WARNING: Configuration file not found $CONFIG_FILE"
        create_default_config
    fi
    
    # Check if config is valid JSON
    if ! jq . "$CONFIG_FILE" >/dev/null 2>&1; then
        log "ERROR: Configuration file $CONFIG_FILE contains invalid JSON"
        log "Check file syntax or delete it to create new default configuration"
        exit 1
    fi
}

# Function to check if port is in use
is_port_in_use() {
    local port=$1
    netstat -tuln | grep -q ":$port "
    return $?
}

# Function to check if server is running
is_server_running() {
    local server_name="$1"
    screen -list | grep -q "$server_name"
    return $?
}

# Function to get server information from config.json
get_server_config() {
    local server_name="$1"
    local key="$2"
    jq -r ".servers.\"$server_name\".$key" "$CONFIG_FILE"
}

# Function to get server type configuration
get_server_type_config() {
    local server_name="$1"
    local key="$2"
    local server_type=$(jq -r ".servers.\"$server_name\".type" "$CONFIG_FILE")
    jq -r ".server_types.\"$server_type\".$key" "$CONFIG_FILE"
}

# Function to update server.properties
update_server_properties() {
    local server_path=$1
    local port=$2
    local properties_file="$server_path/server.properties"
    
    # Check if file exists
    if [ ! -f "$properties_file" ]; then
        log "ERROR: server.properties file not found in $server_path"
        return 1
    fi
    
    # Create backup copy
    cp "$properties_file" "${properties_file}.bak"
    
    # Add informational comment if it doesn't exist
    if ! grep -q "# Port managed by network script" "$properties_file"; then
        echo -e "# Port managed by network script - do not modify manually!\n$(cat $properties_file)" > "$properties_file"
    fi
    
    # Update or add port
    if grep -q "^server-port=" "$properties_file"; then
        sed -i "s/^server-port=.*/server-port=$port/" "$properties_file"
    else
        echo "server-port=$port" >> "$properties_file"
    fi
    
    log "Updated port in $properties_file to $port"
    return 0
}

# Function to check and configure port
configure_server_port() {
    local server_name=$1
    local server_type=$(get_server_config "$server_name" "type")
    
    # Ignore port configuration for proxy (velocity)
    if [ "$server_type" = "proxy-params" ]; then
        log "Server $server_name is proxy type - skipping port configuration"
        return 0
    fi
    
    local port=$(get_server_config "$server_name" "port")
    local server_path=$(get_server_config "$server_name" "path")
    
    if [ -z "$port" ]; then
        log "ERROR: Port not configured for server $server_name"
        return 1
    fi
    
    if is_port_in_use "$port"; then
        log "ERROR: Port $port is already in use!"
        return 1
    fi
    
    update_server_properties "$server_path" "$port"
    return $?
}

# Function to send command to server
send_command() {
    local server_name="$1"
    local command="$2"
    if is_server_running "$server_name"; then
        screen -S "$server_name" -X stuff "$command$(printf '\r')"
        log "Sent command '$command' to server $server_name"
        return 0
    else
        log "Server $server_name is not running"
        return 1
    fi
}

# Function to start server
start_server() {
    local server_name="$1"
    
    if ! validate_server_name "$server_name"; then
        return 1
    fi
    
    # Check if server exists in configuration
    if [ "$(get_server_config "$server_name" "type")" = "null" ]; then
        log "ERROR: Server '$server_name' does not exist in configuration"
        return 1
    fi
    
    if is_server_running "$server_name"; then
        log "Server $server_name is already running"
        return 1
    fi
    
    local server_type=$(get_server_config "$server_name" "type")
    
    # Check and configure port before starting (only for non-proxy)
    if [ "$server_type" != "proxy-params" ]; then
        if ! configure_server_port "$server_name"; then
            return 1
        fi
    fi
    
    local server_path=$(get_server_config "$server_name" "path")
    local memory=$(get_server_type_config "$server_name" "memory")
    local min_memory=$(get_server_type_config "$server_name" "min_memory")
    local jvm_flags=$(get_server_type_config "$server_name" "jvm_flags[]" | tr '\n' ' ')
    
    # Create logs directory if it doesn't exist
    local server_logs_dir="$server_path/logs"
    mkdir -p "$server_logs_dir"
    
    cd "$server_path" || exit 1
    
    log "Starting server $server_name with parameters:"
    log "Path: $server_path"
    log "Memory: $memory"
    log "Min Memory: $min_memory"
    log "JVM Flags: $jvm_flags"
    
    # Start server without additional logging (server has its own logs)
    if [ "$server_type" = "proxy-params" ]; then
        screen -dmS "$server_name" bash -c "java -Xmx$memory -Xms$min_memory $jvm_flags -jar velocity.jar"
    else
        screen -dmS "$server_name" bash -c "java -Dproc_name=$server_name -Xmx$memory -Xms$min_memory $jvm_flags -jar server.jar nogui"
    fi
    
    # Check if server started
    sleep 5
    if is_server_running "$server_name"; then
        log "Started server $server_name"
    else
        log "ERROR: Server $server_name did not start correctly!"
        log "Check server logs in directory: $server_path/logs/"
        
        # Check if server logs exist to display
        local latest_log=""
        if [ -f "$server_path/logs/latest.log" ]; then
            latest_log="$server_path/logs/latest.log"
        else
            latest_log=$(ls -t "$server_path/logs"/*.log 2>/dev/null | head -n 1)
        fi
        
        if [ -n "$latest_log" ] && [ -f "$latest_log" ]; then
            log "Last 10 lines from server logs:"
            tail -n 10 "$latest_log" | while read -r line; do
                log "  $line"
            done
        fi
        return 1
    fi
}

# Function to stop server
stop_server() {
    local server_name="$1"
    
    if ! validate_server_name "$server_name"; then
        return 1
    fi
    
    if is_server_running "$server_name"; then
        send_command "$server_name" "stop"
        log "Stopping server $server_name"
        
        # Wait for graceful shutdown (60 seconds)
        local counter=0
        while is_server_running "$server_name" && [ $counter -lt 60 ]; do
            sleep 1
            counter=$((counter + 1))
        done
        
        # If server didn't stop gracefully, use force kill
        if is_server_running "$server_name"; then
            log "WARNING: Graceful shutdown failed, forcing stop"
            local pid=$(screen -list | grep "$server_name" | awk '{print $1}' | cut -d. -f1)
            
            if [ -n "$pid" ]; then
                # First TERM
                kill -TERM "$pid" 2>/dev/null
                sleep 5
                
                # If still running, use KILL
                if ps -p "$pid" >/dev/null 2>&1; then
                    kill -KILL "$pid" 2>/dev/null
                    sleep 2
                fi
                
                # Clean up screen session
                screen -wipe >/dev/null 2>&1
            fi
            
            # Check if it succeeded
            if is_server_running "$server_name"; then
                log "ERROR: Failed to stop server $server_name"
                return 1
            else
                log "Server $server_name was forcibly stopped"
            fi
        else
            log "Server $server_name was stopped gracefully"
        fi
    else
        log "Server $server_name is not running"
        return 1
    fi
}

# Function to display server status
show_status() {
    echo "Minecraft servers status:"
    echo "------------------------"
    
    local servers=$(jq -r '.servers | keys[]' "$CONFIG_FILE")
    
    for server in $servers; do
        local server_type=$(get_server_config "$server" "type")
        echo -n "$server"
        
        # Different display for proxy and regular servers
        if [ "$server_type" = "proxy-params" ]; then
            echo -n " (Velocity proxy): "
        else
            local port=$(get_server_config "$server" "port")
            echo -n " (Port: $port): "
        fi
        
        if is_server_running "$server"; then
            local pid=$(screen -list | grep "$server" | awk '{print $1}' | cut -d. -f1)
            local uptime=$(ps -p "$pid" -o etime= 2>/dev/null)
            local memory=$(ps -p "$pid" -o rss= 2>/dev/null)
            memory=$((memory / 1024)) # Convert to MB
            echo "RUNNING (PID: $pid, Uptime: $uptime, RAM: ${memory}MB)"
            
            # Show recent errors from logs if they exist
            #local server_path=$(get_server_config "$server" "path")
            #local latest_log="$server_path/logs/latest.log"
            #if [ -f "$latest_log" ]; then
            #    echo "Recent errors from logs (if any):"
            #    grep -i "error\|exception\|crash" "$latest_log" | tail -n 5
            #fi
        else
            if [ "$server_type" != "proxy-params" ] && is_port_in_use "$port"; then
                echo "STOPPED (Port $port is busy!)"
            else
                echo "STOPPED"
            fi
        fi
    done
}

# Function to display logs
show_logs() {
    local server_name="$1"
    local lines="${2:-50}"  # show last 50 lines by default
    
    if ! validate_server_name "$server_name"; then
        return 1
    fi
    
    # Check if server exists in configuration
    if [ "$(get_server_config "$server_name" "type")" = "null" ]; then
        log "ERROR: Server '$server_name' does not exist in configuration"
        return 1
    fi
    
    local server_path=$(get_server_config "$server_name" "path")
    local logs_dir="$server_path/logs"
    
    if [ ! -d "$logs_dir" ]; then
        log "Logs directory does not exist for server $server_name ($logs_dir)"
        return 1
    fi
    
    # Prefer latest.log if it exists, otherwise find newest file
    local latest_log=""
    if [ -f "$logs_dir/latest.log" ]; then
        latest_log="$logs_dir/latest.log"
    else
        # Find newest .log file (without screen logs)
        latest_log=$(find "$logs_dir" -name "*.log" -type f -not -name "server_*" 2>/dev/null | xargs ls -t 2>/dev/null | head -n 1)
        
        # If no logs exist, check if there are any files
        if [ -z "$latest_log" ]; then
            latest_log=$(ls -t "$logs_dir"/*.log 2>/dev/null | head -n 1)
        fi
    fi
    
    if [ -z "$latest_log" ] || [ ! -f "$latest_log" ]; then
        log "No log files found for server $server_name in $logs_dir"
        return 1
    fi
    
    echo "Last $lines lines from $(basename "$latest_log"):"
    tail -n "$lines" "$latest_log"
}

# Function for local server backup
backup_server_local() {
    local server_name="$1"
    
    if ! validate_server_name "$server_name"; then
        return 1
    fi
    
    # Check if server exists in configuration
    if [ "$(get_server_config "$server_name" "type")" = "null" ]; then
        log "ERROR: Server '$server_name' does not exist in configuration"
        return 1
    fi
    
    # Check backup tools
    local compression_tool
    compression_tool=$(check_backup_dependencies "local")
    if [ $? -ne 0 ]; then
        return 1
    fi
    
    local server_path=$(get_server_config "$server_name" "path")
    
    if [ ! -d "$server_path" ]; then
        log "ERROR: Server directory $server_path does not exist"
        return 1
    fi
    
    # Create backups directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    local timestamp=$(date '+%Y-%m-%d_%H-%M-%S')
    local backup_name="${server_name}_backup_${timestamp}"
    
    # Determine compression extension and tar options
    local extension=""
    local tar_options=""
    case "$compression_tool" in
        "zstd")
            extension=".tar.zst"
            tar_options="--zstd"
            ;;
        "xz")
            extension=".tar.xz"
            tar_options="-J"
            ;;
        "gzip")
            extension=".tar.gz"
            tar_options="-z"
            ;;
    esac
    
    local backup_file="$BACKUP_DIR/${backup_name}${extension}"
    
    log "Starting backup of server $server_name"
    log "Source: $server_path"
    log "Target: $backup_file"
    log "Compression: $compression_tool"
    
    # Check if server is running and force save-all if needed
    local server_was_running=false
    if is_server_running "$server_name"; then
        server_was_running=true
        log "Server $server_name is running - preparing for backup"
        send_command "$server_name" "save-all"
        sleep 5
        send_command "$server_name" "save-all"  # Double save-all for safety
        sleep 3
        send_command "$server_name" "save-off"
        sleep 15  # Extended wait time for write completion
        log "Disabled auto-save, starting backup..."
    fi
    
    # Perform backup
    local parent_dir=$(dirname "$server_path")
    local server_dir_name=$(basename "$server_path")
    
    # Check if we can enter parent directory
    if ! cd "$parent_dir"; then
        log "ERROR: Cannot change to directory $parent_dir"
        return 1
    fi
    
    # Check if server directory exists
    if [ ! -d "$server_dir_name" ]; then
        log "ERROR: Server directory $server_dir_name does not exist in $parent_dir"
        return 1
    fi
    
    # Calculate size to pack (for progress)
    log "Estimating data size..."
    local total_size=$(du -sb "$server_dir_name" 2>/dev/null | cut -f1)
    local total_size_mb=$((total_size / 1024 / 1024))
    
    log "Creating archive (${total_size_mb}MB)..."
    echo -n "Progress: "
    
    # Wykonaj tar z progress bar
    if tar $tar_options --exclude="*.log" --exclude="logs/latest.log" --exclude="crash-reports" -cf "$backup_file" "$server_dir_name" &
    then
        local tar_pid=$!
        
        # Progress bar
        while kill -0 $tar_pid 2>/dev/null; do
            if [ -f "$backup_file" ]; then
                local current_size=$(stat -f%z "$backup_file" 2>/dev/null || stat -c%s "$backup_file" 2>/dev/null || echo "0")
                local current_mb=$((current_size / 1024 / 1024))
                local percent=0
                if [ $total_size_mb -gt 0 ]; then
                    percent=$(( (current_mb * 100) / total_size_mb ))
                    if [ $percent -gt 100 ]; then
                        percent=100
                    fi
                fi
                printf "\rProgress: [%-50s] %d%% (%dMB)" $(printf '#%.0s' $(seq 1 $((percent/2)))) $percent $current_mb
            else
                printf "\rProgress: [%-50s] 0%% (0MB)" ""
            fi
            sleep 1
        done
        
        # Wait for tar to complete
        wait $tar_pid
        local tar_exit_code=$?
        
        echo  # nowa linia po progress bar
        
        # Handle different tar exit codes
        # 0 = success, 1 = warnings but backup OK, 2+ = critical errors
        if [ $tar_exit_code -eq 0 ] || [ $tar_exit_code -eq 1 ]; then
            # Re-enable auto-save if it was disabled
            if [ "$server_was_running" = true ]; then
                send_command "$server_name" "save-on"
            fi
            
            local backup_size=$(du -h "$backup_file" | cut -f1)
            
            if [ $tar_exit_code -eq 0 ]; then
                log "Backup completed successfully"
            else
                log "Backup completed with warnings (files may have changed during creation)"
                log "This is normal for a running server - backup should be valid"
            fi
            
            log "Backup file: $backup_file"
            log "Size: $backup_size"
            
            # Check archive integrity
            case "$compression_tool" in
                "zstd")
                    if tar --zstd -tf "$backup_file" >/dev/null 2>&1; then
                        log "Archive integrity confirmed"
                    else
                        log "WARNING: Archive may be corrupted"
                    fi
                    ;;
                "xz")
                    if tar -Jtf "$backup_file" >/dev/null 2>&1; then
                        log "Archive integrity confirmed"
                    else
                        log "WARNING: Archive may be corrupted"
                    fi
                    ;;
                "gzip")
                    if tar -ztf "$backup_file" >/dev/null 2>&1; then
                        log "Archive integrity confirmed"
                    else
                        log "WARNING: Archive may be corrupted"
                    fi
                    ;;
            esac
            
            return 0
        else
            # Re-enable auto-save if it was disabled
            if [ "$server_was_running" = true ]; then
                send_command "$server_name" "save-on"
            fi
            
            log "ERROR: Failed to create backup"
            rm -f "$backup_file" 2>/dev/null
            return 1
        fi
    else
        # Re-enable auto-save if it was disabled
        if [ "$server_was_running" = true ]; then
            send_command "$server_name" "save-on"
        fi
        
        log "ERROR: Failed to start tar"
        return 1
    fi
}

# Funkcja do backupu na S3
backup_server_s3() {
    local server_name="$1"
    local s3_bucket="$2"
    local s3_path="${3:-backups}"  # default path in bucket
    
    if ! validate_server_name "$server_name"; then
        return 1
    fi
    
    # Check if server exists in configuration
    if [ "$(get_server_config "$server_name" "type")" = "null" ]; then
        log "ERROR: Server '$server_name' does not exist in configuration"
        return 1
    fi
    
    if [ -z "$s3_bucket" ]; then
        log "ERROR: Nie podano nazwy bucketu S3"
        return 1
    fi
    
    # Check backup tools S3
    local compression_tool
    compression_tool=$(check_backup_dependencies "s3")
    if [ $? -ne 0 ]; then
        return 1
    fi
    
    # First create local backup
    if ! backup_server_local "$server_name"; then
        log "ERROR: Failed to create local backup"
        return 1
    fi
    
    # Find newest backup
    local latest_backup=$(ls -t "$BACKUP_DIR"/${server_name}_backup_* 2>/dev/null | head -n 1)
    
    if [ -z "$latest_backup" ]; then
        log "ERROR: No local backup found to upload"
        return 1
    fi
    
    local backup_filename=$(basename "$latest_backup")
    local s3_destination="s3://${s3_bucket}/${s3_path}/${backup_filename}"
    
    log "Uploading backup to S3: $s3_destination"
    
    # Use s3cmd or rclone depending on availability
    local upload_success=false
    
    if command -v s3cmd >/dev/null 2>&1; then
        log "Using s3cmd for upload"
        if s3cmd put "$latest_backup" "$s3_destination"; then
            upload_success=true
        fi
    elif command -v rclone >/dev/null 2>&1; then
        log "Using rclone for upload"
        # Assume remote is named "s3"
        if rclone copy "$latest_backup" "s3:${s3_bucket}/${s3_path}/"; then
            upload_success=true
        fi
    fi
    
    if [ "$upload_success" = true ]; then
        log "Backup uploaded successfully to S3"
        log "S3 location: $s3_destination"
        
        # Optionally remove local backup after successful upload
        # Uncomment the line below if you want to automatically remove local backups
        # rm -f "$latest_backup" && log "Removed local backup: $latest_backup"
        
        return 0
    else
        log "ERROR: Failed to upload backup to S3"
        return 1
    fi
}

# Funkcja do przywracania backupu
restore_server() {
    local server_name="$1"
    local backup_file="$2"
    local force="${3:-false}"
    
    if ! validate_server_name "$server_name"; then
        return 1
    fi
    
    # Check if server exists in configuration
    if [ "$(get_server_config "$server_name" "type")" = "null" ]; then
        log "ERROR: Server '$server_name' does not exist in configuration"
        return 1
    fi
    
    # Check if backup file was provided
    if [ -z "$backup_file" ]; then
        log "ERROR: Backup file to restore not provided"
        log "Available backups for server $server_name:"
        ls -la "$BACKUP_DIR"/${server_name}_backup_* 2>/dev/null | awk '{print $9, $5, $6, $7, $8}' || log "No available backups"
        return 1
    fi
    
    # Check if backup file exists
    if [ ! -f "$backup_file" ]; then
        # If full path not provided, check in backups directory
        if [ ! -f "$BACKUP_DIR/$backup_file" ]; then
            log "ERROR: Plik backupu '$backup_file' nie istnieje"
            log "Check available backups: ls $BACKUP_DIR/${server_name}_backup_*"
            return 1
        else
            backup_file="$BACKUP_DIR/$backup_file"
        fi
    fi
    
    local server_path=$(get_server_config "$server_name" "path")
    
    # Check if server is running
    if is_server_running "$server_name"; then
        if [ "$force" != "true" ]; then
            log "ERROR: Serwer $server_name jest uruchomiony!"
            log "Stop server before restoring or use --force"
            log "Usage: $0 restore $server_name $backup_file --force"
            return 1
        else
            log "Stopping server $server_name before restoration..."
            if ! stop_server "$server_name"; then
                log "ERROR: Failed to stop server $server_name"
                return 1
            fi
            sleep 3
        fi
    fi
    
    # Check compression type based on extension
    local compression_tool=""
    local tar_options=""
    case "$backup_file" in
        *.tar.zst)
            if ! command -v zstd >/dev/null 2>&1; then
                log "ERROR: Missing zstd tool to extract file"
                return 1
            fi
            compression_tool="zstd"
            tar_options="--zstd"
            ;;
        *.tar.xz)
            if ! command -v xz >/dev/null 2>&1; then
                log "ERROR: Missing xz tool to extract file"
                return 1
            fi
            compression_tool="xz"
            tar_options="-J"
            ;;
        *.tar.gz)
            if ! command -v gzip >/dev/null 2>&1; then
                log "ERROR: Missing gzip tool to extract file"
                return 1
            fi
            compression_tool="gzip"
            tar_options="-z"
            ;;
        *)
            log "ERROR: Unrecognized backup file format: $backup_file"
            log "Supported formats: .tar.zst, .tar.xz, .tar.gz"
            return 1
            ;;
    esac
    
    log "Rozpoczynam przywracanie backupu serwera $server_name"
    log "Plik backupu: $backup_file"
    log "Docelowy katalog: $server_path"
    log "Compression: $compression_tool"
    
    # Check archive integrity before restoration
    log "Checking archive integrity..."
    if ! tar $tar_options -tf "$backup_file" >/dev/null 2>&1; then
        log "ERROR: Backup file is corrupted or cannot be read"
        return 1
    fi
    log "Archive integrity confirmed"
    
    # Create backup of current state (if directory exists)
    if [ -d "$server_path" ]; then
        local timestamp=$(date '+%Y-%m-%d_%H-%M-%S')
        local emergency_backup="$BACKUP_DIR/${server_name}_before_restore_${timestamp}.tar.gz"
        
        log "Tworzenie awaryjnego backupu obecnego stanu..."
        local parent_dir=$(dirname "$server_path")
        local server_dir_name=$(basename "$server_path")
        
        if cd "$parent_dir" && tar -czf "$emergency_backup" "$server_dir_name" >/dev/null 2>&1; then
            log "Utworzono awaryjny backup: $emergency_backup"
        else
            log "WARNING: Failed to create emergency backup"
        fi
        
        # Remove current server directory
        log "Usuwanie obecnego katalogu serwera..."
        rm -rf "$server_path"
    fi
    
    # Create parent directory if it doesn't exist
    local parent_dir=$(dirname "$server_path")
    mkdir -p "$parent_dir"
    
    # Restore backup
    log "Przywracanie danych z backupu..."
    if cd "$parent_dir" && tar $tar_options -xf "$backup_file"; then
        log "Backup was restored successfully"
        
        # Check if server directory exists after restoration
        if [ ! -d "$server_path" ]; then
            log "WARNING: Server directory $server_path does not exist after restoration"
            log "Check backup contents: tar $tar_options -tf \"$backup_file\""
        fi
        
        # Set file owner (if running as root)
        if [ "$(id -u)" -eq 0 ] && [ -d "$server_path" ]; then
            log "Setting file owner..."
            chown -R minecraft:minecraft "$server_path" 2>/dev/null || log "WARNING: Failed to change file owner"
        fi
        
        log "Restoration completed successfully"
        log "You can now start the server: $0 start $server_name"
        return 0
    else
        log "ERROR: Failed to restore backup"
        
        # Restore emergency backup if it exists
        if [ -f "$emergency_backup" ]; then
            log "Przywracanie awaryjnego backupu..."
            if cd "$parent_dir" && tar -xzf "$emergency_backup" >/dev/null 2>&1; then
                log "Restored emergency backup"
            else
                log "ERROR: Failed to restore emergency backup!"
            fi
        fi
        return 1
    fi
}

# Function to list backups
list_backups() {
    local server_name="${1:-all}"
    
    if [ "$server_name" != "all" ] && ! validate_server_name "$server_name"; then
        return 1
    fi
    
    echo "Available backups:"
    echo "=================="
    
    if [ "$server_name" = "all" ]; then
        # Show all backups
        local backups=$(ls -t "$BACKUP_DIR"/*_backup_* 2>/dev/null)
    else
        # Show backups for specific server
        local backups=$(ls -t "$BACKUP_DIR"/${server_name}_backup_* 2>/dev/null)
    fi
    
    if [ -z "$backups" ]; then
        if [ "$server_name" = "all" ]; then
            echo "No available backups"
        else
            echo "No available backups for server '$server_name'"
        fi
        return 1
    fi
    
    printf "%-40s %-12s %-20s %s\n" "Filename" "Size" "Creation date" "Server"
    printf "%-40s %-12s %-20s %s\n" "----------------------------------------" "------------" "--------------------" "----------"
    
    for backup in $backups; do
        local filename=$(basename "$backup")
        local size=$(du -h "$backup" 2>/dev/null | cut -f1 || echo "N/A")
        local date=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$backup" 2>/dev/null || stat -c "%y" "$backup" 2>/dev/null | cut -d' ' -f1-2 | cut -d'.' -f1 || echo "N/A")
        local server=$(echo "$filename" | cut -d'_' -f1)
        
        printf "%-40s %-12s %-20s %s\n" "$filename" "$size" "$date" "$server"
    done
}

# Function to remove old backups (retention)
cleanup_old_backups() {
    local server_name="${1:-all}"
    local keep_days="${2:-7}"  # 7 days by default
    
    log "Cleaning old backups (older than $keep_days days)"
    
    if [ "$server_name" = "all" ]; then
        # Remove all old backups
        find "$BACKUP_DIR" -name "*_backup_*" -type f -mtime +$keep_days -print0 | while IFS= read -r -d '' file; do
            log "Removing old backup: $(basename "$file")"
            rm -f "$file"
        done
    else
        if ! validate_server_name "$server_name"; then
            return 1
        fi
        
        # Remove old backups for specific server
        find "$BACKUP_DIR" -name "${server_name}_backup_*" -type f -mtime +$keep_days -print0 | while IFS= read -r -d '' file; do
            log "Removing old backup for server $server_name: $(basename "$file")"
            rm -f "$file"
        done
    fi
    
    log "Backup cleanup completed"
}

# Script initialization
check_dependencies
check_and_init_config

# Main function
case "$1" in
    start)
        if [ -z "$2" ]; then
            echo "Usage: $0 start <server_name>"
            exit 1
        fi
        start_server "$2" && screen -x "$2"
        ;;
    stop)
        if [ -z "$2" ]; then
            echo "Usage: $0 stop <server_name>"
            exit 1
        fi
        stop_server "$2"
        ;;
    restart)
        if [ -z "$2" ]; then
            echo "Usage: $0 restart <server_name>"
            exit 1
        fi
        stop_server "$2" && start_server "$2" && screen -x "$2"
        ;;
    status)
        show_status
        ;;
    logs)
        if [ -z "$2" ]; then
            echo "Usage: $0 logs <server_name> [line_count]"
            exit 1
        fi
        show_logs "$2" "$3"
        ;;
    console)
        if [ -z "$2" ]; then
            echo "Usage: $0 console <server_name>"
            exit 1
        fi
        if is_server_running "$2"; then
            screen -x "$2"
        else
            echo "Server $2 is not running"
            exit 1
        fi
        ;;
    backup)
        if [ -z "$2" ]; then
            echo "Usage: $0 backup <server_name> [s3_bucket] [s3_path]"
            echo "  Local backup: $0 backup <server_name>"
            echo "  S3 backup: $0 backup <server_name> <bucket_name> [path_in_bucket]"
            exit 1
        fi
        
        if [ -z "$3" ]; then
            # Local backup
            backup_server_local "$2"
        else
            # S3 backup
            backup_server_s3 "$2" "$3" "$4"
        fi
        ;;
    restore)
        if [ -z "$2" ]; then
            echo "Usage: $0 restore <server_name> <backup_file> [--force]"
            echo "  $0 restore <server> <backup_file>        - Restore backup (server must be stopped)"  
            echo "  $0 restore <server> <backup_file> --force - Restore backup (will automatically stop server)"
            exit 1
        fi
        
        # Check if third parameter is --force
        force="false"
        if [ "$4" = "--force" ]; then
            force="true"
        fi
        
        restore_server "$2" "$3" "$force"
        ;;
    list)
        server_name="${2:-all}"
        list_backups "$server_name"
        ;;
    cleanup)
        server_name="${2:-all}"
        keep_days="${3:-7}"
        cleanup_old_backups "$server_name" "$keep_days"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|logs|console|backup|restore|list|cleanup} [arguments...]"
        echo ""
        echo "Server commands:"
        echo "  start <server>                     - Start server"
        echo "  stop <server>                      - Stop server"
        echo "  restart <server>                   - Restart server"
        echo "  status                             - Show status of all servers"
        echo "  logs <server> [lines]              - Show server logs (50 lines by default)"
        echo "  console <server>                   - Connect to server console"
        echo ""
        echo "Backup commands:"
        echo "  backup <server>                    - Create local server backup"
        echo "  backup <server> <bucket> [path]    - Create backup and upload to S3"
        echo "  restore <server> <backup> [--force] - Restore server backup"
        echo "  list [server]                      - Show available backups"
        echo "  cleanup [server] [days]             - Remove old backups (older than 7 days by default)"
        echo ""
        echo "Examples:"
        echo "  $0 backup survival                 - Local backup of 'survival' server"
        echo "  $0 backup survival my-bucket       - Backup to S3 bucket 'my-bucket'" 
        echo "  $0 list survival                   - Show backups for 'survival' server"
        echo "  $0 list                            - Show all backups"
        echo "  $0 restore survival survival_backup_2024-01-15_12-30-45.tar.zst"
        echo "  $0 restore survival backup_file.tar.zst --force"
        echo "  $0 cleanup survival 14             - Remove 'survival' server backups older than 14 days"
        exit 1
        ;;
esac

exit 0
