import { jest } from '@jest/globals';
import { spawn } from 'child_process';
import { AgentExecutor } from '../src/services/AgentExecutor.js';

describe('AgentExecutor', () => {
  let executor;
  
  beforeEach(() => {
    executor = new AgentExecutor({
      maxMemoryMB: 100,
      timeoutMs: 5000
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('プロセスが正常に実行されること', async () => {
    const mockProcess = {
      pid: 123,
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn()
    };

    jest.spyOn(global, 'setTimeout');
    jest.spyOn(process, 'memoryUsage').mockReturnValue({ heapUsed: 50 * 1024 * 1024 });
    jest.spyOn(spawn, 'spawn').mockReturnValue(mockProcess);

    const command = 'echo';
    const args = ['test'];
    
    const result = await executor.execute(command, args);
    
    expect(result).toEqual({
      success: true,
      output: expect.any(String)
    });
  });

  it('メモリ制限を超えた場合エラーを返すこと', async () => {
    jest.spyOn(process, 'memoryUsage').mockReturnValue({ heapUsed: 200 * 1024 * 1024 });

    const command = 'echo';
    const args = ['test'];
    
    await expect(executor.execute(command, args)).rejects.toThrow('メモリ使用量が制限を超えました');
  });

  it('タイムアウトした場合エラーを返すこと', async () => {
    const mockProcess = {
      pid: 123,
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn()
    };

    jest.spyOn(spawn, 'spawn').mockReturnValue(mockProcess);

    const command = 'sleep';
    const args = ['10'];
    
    const executePromise = executor.execute(command, args);
    jest.advanceTimersByTime(6000);
    
    await expect(executePromise).rejects.toThrow('実行がタイムアウトしました');
  });
}); 