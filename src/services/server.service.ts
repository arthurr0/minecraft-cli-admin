import { configService, ConfigService } from './config.service.js';
import { screenService, ScreenService } from './screen.service.js';
import { processService, ProcessService } from './process.service.js';
import { portService, PortService } from './port.service.js';
import { validateServerName } from '../utils/validator.js';
import type { ServerInfo, ServerActionResult } from '../types/server.js';

const GRACEFUL_SHUTDOWN_TIMEOUT = 60000;
const STARTUP_WAIT_TIME = 5000;

export class ServerService {
  constructor(
    private config: ConfigService = configService,
    private screen: ScreenService = screenService,
    private process: ProcessService = processService,
    private port: PortService = portService
  ) {}

  async start(serverName: string, attach: boolean = true): Promise<ServerActionResult> {
    const validation = validateServerName(serverName);
    if (!validation.valid) {
      return { success: false, message: validation.error!, error: validation.error };
    }

    const hasServer = await this.config.hasServer(serverName);
    if (!hasServer) {
      return { success: false, message: `Server '${serverName}' does not exist in configuration` };
    }

    const isRunning = await this.screen.exists(serverName);
    if (isRunning) {
      return { success: false, message: `Server ${serverName} is already running` };
    }

    const serverConfig = await this.config.getServer(serverName);
    const typeConfig = await this.config.getServerType(serverConfig.type);

    if (serverConfig.type !== 'proxy-params' && serverConfig.port) {
      const portInUse = await this.port.isInUse(serverConfig.port);
      if (portInUse) {
        return { success: false, message: `Port ${serverConfig.port} is already in use` };
      }

      await this.port.configureServerProperties(serverConfig.path, serverConfig.port);
    }

    const jvmArgs = [
      `-Xmx${typeConfig.memory}`,
      `-Xms${typeConfig.min_memory}`,
      ...typeConfig.jvm_flags
    ];

    const jar = serverConfig.type === 'proxy-params' ? 'velocity.jar' : 'server.jar';
    const javaArgs = serverConfig.type === 'proxy-params'
      ? ['java', ...jvmArgs, '-jar', jar]
      : ['java', `-Dproc_name=${serverName}`, ...jvmArgs, '-jar', jar, 'nogui'];

    const started = await this.screen.create(serverName, serverConfig.path, javaArgs);
    if (!started) {
      return { success: false, message: `Failed to start server ${serverName}` };
    }

    await this.sleep(STARTUP_WAIT_TIME);

    const running = await this.screen.exists(serverName);
    if (!running) {
      return { success: false, message: `Server ${serverName} did not start correctly` };
    }

    if (attach) {
      await this.screen.attach(serverName);
    }

    return { success: true, message: `Server ${serverName} started successfully` };
  }

  async stop(serverName: string, force: boolean = false): Promise<ServerActionResult> {
    const validation = validateServerName(serverName);
    if (!validation.valid) {
      return { success: false, message: validation.error!, error: validation.error };
    }

    const isRunning = await this.screen.exists(serverName);
    if (!isRunning) {
      return { success: false, message: `Server ${serverName} is not running` };
    }

    if (!force) {
      await this.screen.send(serverName, 'stop');

      const stopped = await this.waitForStop(serverName, GRACEFUL_SHUTDOWN_TIMEOUT);
      if (stopped) {
        await this.screen.wipe();
        return { success: true, message: `Server ${serverName} stopped gracefully` };
      }
    }

    return await this.forceStop(serverName);
  }

  private async forceStop(serverName: string): Promise<ServerActionResult> {
    const pid = await this.screen.getPid(serverName);

    if (pid) {
      await this.process.kill(pid, 'TERM');
      await this.sleep(5000);

      const stillRunning = await this.process.isRunning(pid);
      if (stillRunning) {
        await this.process.kill(pid, 'KILL');
        await this.sleep(2000);
      }
    }

    await this.screen.kill(serverName);
    await this.screen.wipe();

    const isRunning = await this.screen.exists(serverName);
    if (isRunning) {
      return { success: false, message: `Failed to stop server ${serverName}` };
    }

    return { success: true, message: `Server ${serverName} was force stopped` };
  }

  async restart(serverName: string): Promise<ServerActionResult> {
    const stopResult = await this.stop(serverName);
    if (!stopResult.success && !stopResult.message.includes('not running')) {
      return stopResult;
    }

    await this.sleep(2000);
    return await this.start(serverName, false);
  }

  async sendCommand(serverName: string, command: string): Promise<ServerActionResult> {
    const isRunning = await this.screen.exists(serverName);
    if (!isRunning) {
      return { success: false, message: `Server ${serverName} is not running` };
    }

    const sent = await this.screen.send(serverName, command);
    if (!sent) {
      return { success: false, message: `Failed to send command to ${serverName}` };
    }

    return { success: true, message: `Command sent to ${serverName}` };
  }

  async getStatus(serverName: string): Promise<ServerInfo> {
    const serverConfig = await this.config.getServer(serverName);
    const typeConfig = await this.config.getServerType(serverConfig.type);
    const isRunning = await this.screen.exists(serverName);

    const info: ServerInfo = {
      name: serverName,
      config: serverConfig,
      typeConfig,
      status: isRunning ? 'running' : 'stopped'
    };

    if (isRunning) {
      const screenPid = await this.screen.getPid(serverName);
      if (screenPid) {
        const childPids = await this.process.getChildPids(screenPid);
        const javaPid = childPids.length > 0 ? childPids[0] : screenPid;

        info.pid = javaPid;
        info.uptime = await this.process.getUptime(javaPid) ?? undefined;
        info.memoryMB = await this.process.getMemoryMB(javaPid) ?? undefined;
      }
    }

    if (serverConfig.port) {
      info.portInUse = await this.port.isInUse(serverConfig.port);
    }

    return info;
  }

  async getAllStatus(): Promise<ServerInfo[]> {
    const serverNames = await this.config.getServerNames();
    return Promise.all(serverNames.map(name => this.getStatus(name)));
  }

  async attachConsole(serverName: string): Promise<void> {
    const isRunning = await this.screen.exists(serverName);
    if (!isRunning) {
      throw new Error(`Server ${serverName} is not running`);
    }
    await this.screen.attach(serverName);
  }

  private async waitForStop(serverName: string, timeout: number): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const isRunning = await this.screen.exists(serverName);
      if (!isRunning) {
        return true;
      }
      await this.sleep(1000);
    }
    return false;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const serverService = new ServerService();
