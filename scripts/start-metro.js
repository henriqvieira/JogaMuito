#!/usr/bin/env node

const { spawn } = require('child_process');

const args = process.argv.slice(2);
const env = {
  ...process.env,
  NODE_OPTIONS: [process.env.NODE_OPTIONS, '--openssl-legacy-provider'].filter(Boolean).join(' '),
};

function runCommand(command, commandArgs, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      stdio: 'inherit',
      shell: false,
      env,
      ...options,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

(async () => {
  const adbCommand = process.platform === 'win32' ? 'adb.exe' : 'adb';

  try {
    await runCommand(adbCommand, ['reverse', 'tcp:8081', 'tcp:8081']);
  } catch (error) {
    console.warn('adb reverse skipped; no connected emulator/device was found.');
  }

  const command = process.platform === 'win32' ? process.execPath : process.execPath;
  const cliPath = require.resolve('react-native/cli.js');
  const child = spawn(
    command,
    [cliPath, 'start', '--reset-cache', '--host', '0.0.0.0', '--port', '8081', ...args],
    {
      stdio: 'inherit',
      shell: false,
      env,
    },
  );

  child.on('exit', (code) => {
    process.exit(code ?? 0);
  });
})();
