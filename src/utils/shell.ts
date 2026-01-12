import { execa, type ExecaError } from 'execa';

export interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  success: boolean;
}

export async function shell(command: string, args: string[] = []): Promise<ShellResult> {
  try {
    const result = await execa(command, args);
    return {
      stdout: String(result.stdout ?? ''),
      stderr: String(result.stderr ?? ''),
      exitCode: result.exitCode ?? 0,
      success: true,
    };
  } catch (error) {
    const execaError = error as ExecaError;
    return {
      stdout: String(execaError.stdout ?? ''),
      stderr: String(execaError.stderr ?? ''),
      exitCode: execaError.exitCode ?? 1,
      success: false,
    };
  }
}

export async function shellWithInput(command: string, args: string[], input: string): Promise<ShellResult> {
  try {
    const result = await execa(command, args, { input });
    return {
      stdout: String(result.stdout ?? ''),
      stderr: String(result.stderr ?? ''),
      exitCode: result.exitCode ?? 0,
      success: true,
    };
  } catch (error) {
    const execaError = error as ExecaError;
    return {
      stdout: String(execaError.stdout ?? ''),
      stderr: String(execaError.stderr ?? ''),
      exitCode: execaError.exitCode ?? 1,
      success: false,
    };
  }
}

export async function commandExists(command: string): Promise<boolean> {
  const result = await shell('which', [command]);
  return result.success;
}
