import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CompilationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
  hint?: string;
}

export interface CompileResult {
  success: boolean;
  hex?: string;
  errors?: CompilationError[];
  warnings?: CompilationError[];
}

const MOCK_BLINK_HEX = `:100000000C9434000C944E000C944E000C944E0068
:100010000C944E000C944E000C944E000C944E0020
:100020000C944E000C944E000C944E000C944E0010
:100030000C944E000C944E000C944E000C944E0000
:100040000C944E000C944E000C944E000C944E00F0
:100050000C944E000C944E000C944E000C944E00E0
:100060000C944E000C944E000C944E000C944E00D0
:100070000C944E000C944E000C944E000C944E00C0
:0400000300003E000000BB
:00000001FF`;

function getHintFromMessage(message: string): string | undefined {
  const msg = message.toLowerCase();
  if (msg.includes('was not declared in this scope')) {
    return 'check spelling or missing include';
  }
  if (msg.includes("expected ';'")) {
    return 'missing semicolon on previous line';
  }
  if (msg.includes('no matching function for call')) {
    return 'wrong argument types';
  }
  if (msg.includes('servo') || msg.includes('liquidcrystal')) {
    return 'specific include directive needed';
  }
  return undefined;
}

function parseOutput(stderr: string, tempDir: string): { errors: CompilationError[], warnings: CompilationError[] } {
  const errors: CompilationError[] = [];
  const warnings: CompilationError[] = [];
  // Strip ANSI escape codes and Windows carriage returns (\r)
  const cleanStderr = stderr
    .replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
    .replace(/\r/g, '');
  const lines = cleanStderr.split('\n');
  
  // Format: {filepath}:{line}:{column}: {type}: {message}
  // Using greedy (.*) for filepath to handle Windows drive letters (e.g., C:\...)
  const regex = /^(.*):(\d+):(\d+):\s*(error|warning|fatal error):\s*(.*)$/i;

  for (const line of lines) {
    const match = line.match(regex);
    if (match) {
      let filepath = match[1];
      const lineNum = parseInt(match[2], 10);
      const colNum = parseInt(match[3], 10);
      const typeStr = match[4].toLowerCase();
      const message = match[5].trim();
      
      const severity = typeStr.includes('error') ? 'error' : 'warning';
      
      // Strip temp directory path prefix
      if (filepath.startsWith(tempDir)) {
        filepath = filepath.substring(tempDir.length);
        if (filepath.startsWith(path.sep)) {
          filepath = filepath.substring(1);
        }
      }

      const compilationError: CompilationError = {
        line: lineNum,
        column: colNum,
        message: message,
        severity: severity,
        hint: getHintFromMessage(message)
      };

      if (severity === 'error') {
        errors.push(compilationError);
      } else {
        warnings.push(compilationError);
      }
    }
  }

  return { errors, warnings };
}

export async function compileSketch(code: string, board: string = 'arduino'): Promise<CompileResult> {
  const sketchId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const sketchName = `sketch_${sketchId}`;
  const tempDir = path.join(os.tmpdir(), sketchName);
  const sketchPath = path.join(tempDir, `${sketchName}.ino`);

  const isEsp = board === 'esp32' || code.includes('WiFi.h') || code.includes('BluetoothSerial.h');
  const fqbn = isEsp ? 'esp32:esp32:esp32' : 'arduino:avr:uno';

  let processedCode = code;
  if (isEsp && !code.includes('LED_BUILTIN 2')) {
    processedCode = `#ifndef LED_BUILTIN\n#define LED_BUILTIN 2\n#endif\n#line 1 "${sketchName}.ino"\n` + code;
  }

  try {
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(sketchPath, processedCode, 'utf-8');

    // Run arduino-cli
    const CLI = process.platform === 'win32' 
      ? '"C:\\Users\\madha\\bin\\arduino-cli.exe"'
      : 'arduino-cli';
      
    const command = `${CLI} compile --no-color --fqbn ${fqbn} --output-dir "${tempDir}" "${tempDir}"`;

    try {
      const { stdout, stderr } = await execAsync(command, { 
        timeout: 90000,
        maxBuffer: 8 * 1024 * 1024 // 8MB
      });

      // On success, scan the temp directory for the output binary/hex file
      const files = fs.readdirSync(tempDir);
      const binFile = files.find(f => f.endsWith('.bin') && !f.includes('bootloader') && !f.includes('partitions'));
      const hexFile = files.find(f => f.endsWith('.hex') && !f.includes('bootloader'));
      const outputFile = isEsp ? (binFile || hexFile) : hexFile;
      
      if (!outputFile) {
        return {
          success: false,
          errors: [{
            line: 0,
            column: 0,
            message: `Compilation succeeded but no ${isEsp ? '.bin' : '.hex'} file was generated.`,
            severity: 'error'
          }]
        };
      }

      const outputContent = fs.readFileSync(path.join(tempDir, outputFile), isEsp ? 'base64' : 'utf-8');
      const { errors, warnings } = parseOutput(stderr, tempDir);

      return {
        success: true,
        hex: outputContent,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (execError: any) {
      // Command failed
      const errorMessage = (execError.stderr || execError.message || '').toLowerCase();
      const isNotFound = execError.code === 'ENOENT' || 
                         errorMessage.includes('not recognized') || 
                         errorMessage.includes('not found');

      if (isNotFound) {
        console.warn('arduino-cli not found, using mock hex for development');
        return {
          success: true,
          hex: MOCK_BLINK_HEX
        };
      }

      const stderr = execError.stderr || execError.message || '';
      const { errors, warnings } = parseOutput(stderr, tempDir);

      // If parsing failed to find structured errors, return a generic one
      if (errors.length === 0) {
        errors.push({
          line: 0,
          column: 0,
          message: stderr.trim() || 'Unknown compilation error',
          severity: 'error'
        });
      }

      return {
        success: false,
        errors,
        warnings: warnings.length > 0 ? warnings : undefined
      };
    }
  } finally {
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch (rmError) {
      console.error(`Failed to cleanup temp directory ${tempDir}:`, rmError);
    }
  }
}
