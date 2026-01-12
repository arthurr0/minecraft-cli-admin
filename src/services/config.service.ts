import { readFile, writeFile, access } from 'fs/promises';
import { constants } from 'fs';
import { ConfigSchema, type Config, type ServerConfig, type ServerTypeConfig } from '../types/config.js';
import { getConfigPath } from '../utils/paths.js';

const DEFAULT_CONFIG: Config = {
  servers: {},
  server_types: {
    'spigot-params': {
      memory: '2G',
      min_memory: '1G',
      jvm_flags: [
        '-XX:+UseG1GC',
        '-XX:+ParallelRefProcEnabled',
        '-XX:MaxGCPauseMillis=200',
        '-XX:+UnlockExperimentalVMOptions',
        '-XX:+DisableExplicitGC',
        '-XX:+AlwaysPreTouch',
        '-XX:G1NewSizePercent=30',
        '-XX:G1MaxNewSizePercent=40',
        '-XX:G1HeapRegionSize=8M',
        '-XX:G1ReservePercent=20',
        '-XX:G1HeapWastePercent=5',
        '-XX:G1MixedGCCountTarget=4',
        '-XX:InitiatingHeapOccupancyPercent=15',
        '-XX:G1MixedGCLiveThresholdPercent=90',
        '-XX:G1RSetUpdatingPauseTimePercent=5',
        '-XX:SurvivorRatio=32',
        '-XX:+PerfDisableSharedMem',
        '-XX:MaxTenuringThreshold=1'
      ]
    },
    'proxy-params': {
      memory: '512M',
      min_memory: '256M',
      jvm_flags: [
        '-XX:+UseG1GC',
        '-XX:G1HeapRegionSize=4M',
        '-XX:+UnlockExperimentalVMOptions',
        '-XX:+ParallelRefProcEnabled',
        '-XX:+AlwaysPreTouch',
        '-XX:MaxInlineLevel=15'
      ]
    }
  }
};

export class ConfigService {
  private config: Config | null = null;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || getConfigPath();
  }

  async exists(): Promise<boolean> {
    try {
      await access(this.configPath, constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  async load(): Promise<Config> {
    if (this.config) {
      return this.config;
    }

    const exists = await this.exists();
    if (!exists) {
      await this.createDefault();
    }

    const content = await readFile(this.configPath, 'utf-8');

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error(`Invalid JSON in ${this.configPath}`);
    }

    const result = ConfigSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`Invalid configuration: ${result.error.message}`);
    }

    this.config = result.data;
    return this.config;
  }

  async reload(): Promise<Config> {
    this.config = null;
    return this.load();
  }

  async createDefault(): Promise<void> {
    await writeFile(this.configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), 'utf-8');
  }

  async getServer(name: string): Promise<ServerConfig> {
    const config = await this.load();
    const server = config.servers[name];
    if (!server) {
      throw new Error(`Server '${name}' not found in configuration`);
    }
    return server;
  }

  async getServerType(typeName: string): Promise<ServerTypeConfig> {
    const config = await this.load();
    const serverType = config.server_types[typeName];
    if (!serverType) {
      throw new Error(`Server type '${typeName}' not found in configuration`);
    }
    return serverType;
  }

  async getServerNames(): Promise<string[]> {
    const config = await this.load();
    return Object.keys(config.servers);
  }

  async hasServer(name: string): Promise<boolean> {
    const config = await this.load();
    return name in config.servers;
  }

  getConfigPath(): string {
    return this.configPath;
  }
}

export const configService = new ConfigService();
