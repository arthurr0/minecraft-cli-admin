# minecraft-cli-admin - Minecraft Server Management Script

Comprehensive script for managing multiple Minecraft servers with backup support, monitoring, and automatic port management.

## Features

- ✅ Multiple Minecraft server management
- ✅ Automatic port configuration
- ✅ Support for Spigot/Paper servers and Velocity proxy
- ✅ Backup system (local and S3/Backblaze)
- ✅ Server status monitoring
- ✅ Graceful shutdown with fallback force kill
- ✅ Server name and configuration validation
- ✅ Automatic default configuration creation
- ✅ Optimal backup compression (zstd/xz/gzip)
- ✅ Backup retention management

## Requirements

### Basic Tools
- `bash` - system shell
- `jq` - JSON parser
- `screen` - terminal session manager
- `java` - Java runtime environment
- `netstat` - network port monitoring

### Backup Tools
- `tar` - archiver (required)
- `zstd` - compression (preferred) or `xz` or `gzip`
- `s3cmd` or `rclone` - for S3 backups only

### Tool Installation (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install jq screen openjdk-17-jre-headless net-tools tar zstd xz-utils gzip

# For S3 backups
sudo apt install s3cmd
# or
sudo apt install rclone
```

## Directory Structure

```
/opt/minecraft/
├── mc-cli          # Main script
├── config.json         # Server configuration (created automatically)
├── minecraft.log       # Script logs
├── backups/            # Local backups directory
├── survival/           # Example server
│   ├── server.jar
│   ├── server.properties
│   └── logs/
└── proxy/              # Example Velocity proxy
    ├── velocity.jar
    └── logs/
```

## Configuration

### config.json

The configuration file is created automatically on first run. Example structure:

```json
{
  "servers": {
    "survival": {
      "type": "spigot-params",
      "path": "/opt/minecraft/survival",
      "port": 25565
    },
    "creative": {
      "type": "spigot-params",
      "path": "/opt/minecraft/creative",
      "port": 25566
    },
    "proxy": {
      "type": "proxy-params",
      "path": "/opt/minecraft/proxy"
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
```

### Server Configuration Parameters

| Parameter | Description | Required |
|-----------|-------------|----------|
| `type` | Server type (spigot-params/proxy-params) | Yes |
| `path` | Server directory path | Yes |
| `port` | Server port (non-proxy only) | Yes* |

*Port is required only for `spigot-params` type servers

### Server Type Parameters

| Parameter | Description | Default Value |
|-----------|-------------|---------------|
| `memory` | Maximum RAM memory | - |
| `min_memory` | Minimum RAM memory | - |
| `jvm_flags` | JVM flags (array) | - |

## Usage

### Basic Commands

```bash
# Check status of all servers
./mc-cli status

# Start server
./mc-cli start survival

# Stop server
./mc-cli stop survival

# Restart server
./mc-cli restart survival

# Connect to server console
./mc-cli console survival

# Display server logs (last 50 lines)
./mc-cli logs survival

# Display last 100 lines of logs
./mc-cli logs survival 100
```

### Backup System

#### Local Backups

```bash
# Create local server backup
./mc-cli backup survival
```

**Local Backup Features:**
- Automatic compression selection: zstd → xz → gzip
- Exclusion of unnecessary files (logs, crash-reports)
- Graceful handling of running servers (save-all/save-off)
- Archive integrity verification
- Filename format: `{server}_backup_{YYYY-MM-DD_HH-MM-SS}.{ext}`

#### S3/Backblaze Backups

```bash
# Backup to S3 default "backups" directory
./mc-cli backup survival my-bucket

# Backup to S3 specific directory
./mc-cli backup survival my-bucket minecraft-servers

# Backup to S3 with full path
./mc-cli backup survival my-bucket servers/survival
```

**S3 Requirements:**
- Configured `s3cmd` or `rclone`
- Proper bucket permissions
- For rclone: remote named "s3"

#### Backup Management

```bash
# Remove survival server backups older than 14 days
./mc-cli cleanup survival 14

# Remove all backups older than 7 days (default)
./mc-cli cleanup all

# Remove all backups older than 3 days
./mc-cli cleanup all 3
```

### Automation (Crontab)

#### Example Crontab Entries

```bash
# Edit crontab
crontab -e

# Backup every 6 hours
0 */6 * * * /opt/minecraft/mc-cli backup survival my-bucket >/dev/null 2>&1

# Backup all servers daily at 2:00 AM
0 2 * * * /opt/minecraft/mc-cli backup survival my-bucket minecraft-backups >/dev/null 2>&1
0 2 * * * /opt/minecraft/mc-cli backup creative my-bucket minecraft-backups >/dev/null 2>&1

# Clean old backups weekly
0 0 * * 0 /opt/minecraft/mc-cli cleanup all 14 >/dev/null 2>&1

# Restart servers every 24h at 4:00 AM (optional)
0 4 * * * /opt/minecraft/mc-cli restart survival >/dev/null 2>&1
```

#### Backup All Servers Script

Create `backup-all.sh` file:

```bash
#!/bin/bash
SCRIPT_DIR="/opt/minecraft"
BUCKET="my-minecraft-backups"

# List of servers to backup
SERVERS=("survival" "creative" "minigames")

for server in "${SERVERS[@]}"; do
    echo "Backing up server: $server"
    $SCRIPT_DIR/mc-cli backup "$server" "$BUCKET" "daily-backups"
    
    if [ $? -eq 0 ]; then
        echo "✅ Backup $server completed successfully"
    else
        echo "❌ Backup $server failed"
    fi
done

# Clean old backups (older than 7 days)
$SCRIPT_DIR/mc-cli cleanup all 7
```

## Security

### Input Data Validation
- Server names: only a-z, A-Z, 0-9, -, _ (max 32 characters)
- Server existence checking in configuration
- JSON validation in configuration file

### Error Handling
- Graceful shutdown with fallback kill -9
- Auto-save restoration after backup
- Archive integrity verification
- Required tools availability checking

### File Permissions
```bash
# Set proper permissions
chmod +x mc-cli
chown minecraft:minecraft mc-cli config.json
```

## Troubleshooting

### Common Errors

#### "Missing required tools"
```bash
# Check what is installed
which jq screen java netstat

# Install missing tools
sudo apt install jq screen openjdk-17-jre-headless net-tools
```

#### "Port is already in use"
```bash
# Check what is using the port
netstat -tuln | grep :25565
sudo lsof -i :25565

# Kill process using the port
sudo kill -9 <PID>
```

#### "Cannot create backup"
```bash
# Check disk space
df -h

# Check directory permissions
ls -la /opt/minecraft/backups/
```

#### "Server won't start"
```bash
# Check logs
./mc-cli logs survival

# Check if server.jar file exists
ls -la /opt/minecraft/survival/server.jar

# Check permissions
ls -la /opt/minecraft/survival/
```

### Logs

All operations are logged to `/opt/minecraft/minecraft.log`:

```bash
# Watch logs live
tail -f /opt/minecraft/minecraft.log

# Check recent errors
grep "ERROR" /opt/minecraft/minecraft.log | tail -10
```

## Usage Examples

### Scenario 1: New Server Configuration

1. **Add server to configuration:**
```json
"skyblock": {
    "type": "spigot-params", 
    "path": "/opt/minecraft/skyblock",
    "port": 25567
}
```

2. **Create directory and copy files:**
```bash
mkdir -p /opt/minecraft/skyblock
cp server.jar /opt/minecraft/skyblock/
```

3. **Start server:**
```bash
./mc-cli start skyblock
```

### Scenario 2: Migration to New Server

1. **Create backup:**
```bash
./mc-cli backup survival my-backup-bucket migration
```

2. **On new server, download backup:**
```bash
s3cmd get s3://my-backup-bucket/migration/survival_backup_2024-01-15_12-30-45.tar.zst
```

3. **Extract and start:**
```bash
tar --zstd -xf survival_backup_2024-01-15_12-30-45.tar.zst
./mc-cli start survival
```

### Scenario 3: Regular Maintenance

```bash
#!/bin/bash
# maintenance.sh - maintenance script

echo "🔧 Starting server maintenance..."

# Stop all servers
for server in survival creative skyblock; do
    ./mc-cli stop $server
done

# Create backups
for server in survival creative skyblock; do
    ./mc-cli backup $server backup-bucket maintenance
done

# Clean old backups (older than 30 days)
./mc-cli cleanup all 30

# Start servers again
for server in survival creative skyblock; do
    ./mc-cli start $server
done

echo "✅ Maintenance completed!"
```

## License

This script is provided under the Apache License 2.0.

## Support

In case of problems:

1. Check logs: `/opt/minecraft/minecraft.log`
2. Make sure all requirements are met
3. Check file and directory permissions
4. Verify JSON configuration

---

*Last updated: 2024-01-15*