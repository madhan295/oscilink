/**
 * ESP32 Sketch Runtime Engine & C++ to JS Transpiler
 * Executes Arduino C++ sketches for ESP32 in a cooperative, asynchronous environment.
 */

export interface Esp32RunnerCallbacks {
  onPinChange: (pinId: string, voltage: number) => void;
  onPinModeChange?: (pinId: string, mode: string) => void;
  getPinVoltage: (pinId: string) => number;
  onSerialOutput: (text: string) => void;
  onServoAngle?: (pinId: string, angle: number) => void;
  onTone?: (pinId: string, frequency: number) => void;
  getDistanceCm: () => number;
  getSensorValues: () => { temperature: number; humidity: number };
  onLcdUpdate?: (lcdData: { rows: string[]; cursorRow: number; cursorCol: number; backlight: boolean }) => void;
}

const ESP32_VALID_PINS = new Set([
  '3V3', 'EN', 'VP', 'VN', 'D34', 'D35', 'D32', 'D33', 'D25', 'D26', 'D27',
  'D14', 'D12', 'GND_L', 'D13', 'SD2', 'SD3', 'CMD', '5V',
  'GND_R1', 'D23', 'D22', 'TX0', 'RX0', 'D21', 'GND_R2', 'D19', 'D18',
  'D5', 'TX2', 'RX2', 'D4', 'CLK', 'D2', 'D15', 'SD1', 'SD0', 'D6'
]);

export function normalizeEsp32Pin(pin: any): string {
  if (pin === undefined || pin === null) return 'D2';
  const p = String(pin).trim().toUpperCase();
  if (ESP32_VALID_PINS.has(p)) return p;

  if (p === 'LED_BUILTIN' || p === 'BUILTIN_LED') return 'D2';
  if (p === 'BOOT') return 'CLK';
  if (p === 'SDA') return 'D21';
  if (p === 'SCL') return 'D22';
  if (p === 'TX') return 'TX0';
  if (p === 'RX') return 'RX0';

  const numStr = p.replace(/^GPIO_?NUM_?|^GPIO|^D/i, '');
  const num = parseInt(numStr, 10);
  if (!isNaN(num)) {
    if (num === 0) return 'CLK';
    if (num === 1) return 'TX0';
    if (num === 3) return 'RX0';
    if (num === 16) return 'RX2';
    if (num === 17) return 'TX2';
    if (num === 36) return 'VP';
    if (num === 39) return 'VN';
    const dName = `D${num}`;
    if (ESP32_VALID_PINS.has(dName)) return dName;
  }

  return p;
}

export function transpileArduinoToJs(cppCode: string): string {
  let js = cppCode;

  // 1. Protect string literals
  const strings: string[] = [];
  js = js.replace(/"([^"\\]*(\\.[^"\\]*)*)"/g, (match) => {
    strings.push(match);
    return `__STR_${strings.length - 1}__`;
  });

  // 2. Remove / comment out preprocessor directives
  js = js.replace(/[ \t]*#\s*include\s*[<"][^>"]*[>"]/g, '// [include omitted]');
  js = js.replace(/^[ \t]*#\s*define\s+(\w+)\s+(.+)$/gm, 'const $1 = $2;');
  js = js.replace(/^[ \t]*#\s*define\s+(\w+)\s*$/gm, 'const $1 = true;');
  js = js.replace(/^[ \t]*#\s*(ifdef|ifndef|endif|else|elif|pragma).*$/gm, '// [macro omitted]');

  // 3. Convert class instantiations:
  js = js.replace(/\b(LiquidCrystal_I2C|LiquidCrystal|DHT)\s+(\w+)\s*\(([^;]*)\);/g, 'let $2 = new $1($3);');
  js = js.replace(/\b(Servo|ESP32Servo)\s+(\w+)\s*;/g, 'let $2 = new Servo();');
  js = js.replace(/\b(Servo|ESP32Servo)\s+(\w+)\s*\(([^;]*)\);/g, 'let $2 = new Servo($3);');

  // 4. Convert variable declarations:
  const types = [
    'unsigned\\s+long', 'long', 'unsigned\\s+int', 'int', 'float', 'double',
    'char', 'bool', 'boolean', 'byte', 'uint8_t', 'uint16_t', 'uint32_t',
    'int8_t', 'int16_t', 'int32_t', 'size_t', 'short', 'unsigned\\s+short', 'String'
  ];
  const typePattern = types.join('|');

  // Replace const declarations first: const int x = 1; -> const x = 1;
  const constVarRegex = new RegExp(`\\bconst\\s+(?:${typePattern})\\s+`, 'g');
  js = js.replace(constVarRegex, 'const ');

  // Collect user function names to await them
  const userFuncs = new Set<string>();
  const funcDefRegex = new RegExp(`\\b(?:void|${typePattern})\\s+(\\w+)\\s*\\(([^)]*)\\)\\s*\\{`, 'g');
  let match;
  while ((match = funcDefRegex.exec(js)) !== null) {
    if (match[1] !== 'if' && match[1] !== 'while' && match[1] !== 'for' && match[1] !== 'switch') {
      userFuncs.add(match[1]);
    }
  }

  // Convert function definitions: void foo(...) { -> async function foo(...) {
  const funcReplaceRegex = new RegExp(`\\b(?:void|${typePattern})\\s+(\\w+)\\s*\\(([^)]*)\\)\\s*\\{`, 'g');
  js = js.replace(funcReplaceRegex, 'async function $1($2) {');

  // Clean parameter lists of functions: async function foo(int times, float speed) -> async function foo(times, speed)
  js = js.replace(/async\s+function\s+(\w+)\s*\(([^)]*)\)\s*\{/g, (_m, funcName, params) => {
    const cleanParams = params.replace(new RegExp(`\\b(?:const\\s+)?(?:${typePattern})\\s*[*&]?\\s*`, 'g'), '');
    return `async function ${funcName}(${cleanParams}) {`;
  });

  // Replace remaining variable declarations: int x = 1; -> let x = 1;
  const varRegex = new RegExp(`\\b(?:${typePattern})\\s+`, 'g');
  js = js.replace(varRegex, 'let ');

  // 5. Transform delay & delayMicroseconds & yield to await
  js = js.replace(/(?<!await\s+)\bdelay\s*\(/g, 'await delay(');
  js = js.replace(/(?<!await\s+)\bdelayMicroseconds\s*\(/g, 'await delayMicroseconds(');
  js = js.replace(/(?<!await\s+)\byield\s*\(/g, 'await yield(');

  // 6. Transform calls to user-defined async functions
  for (const funcName of userFuncs) {
    if (funcName === 'setup' || funcName === 'loop') continue;
    const callRegex = new RegExp(`(?<!(?:async\\s+|function\\s+|\\.|await\\s+))\\b${funcName}\\s*\\(`, 'g');
    js = js.replace(callRegex, `await ${funcName}(`);
  }

  // 7. Inject cancellation / cooperative yield inside loops
  js = js.replace(/\bwhile\s*\(([^)]+)\)\s*\{/g, 'while ($1) { await __yieldCheck(); ');
  js = js.replace(/\bfor\s*\(([^)]+)\)\s*\{/g, 'for ($1) { await __yieldCheck(); ');

  // 8. Restore string literals
  js = js.replace(/__STR_(\d+)__/g, (_, idx) => strings[parseInt(idx, 10)]);

  return js;
}

export class Esp32Runner {
  private code: string;
  private callbacks: Esp32RunnerCallbacks;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private isStopped: boolean = false;
  private startTime: number = 0;
  private serialInputBuffer: string = '';
  private pinModes: Map<string, string> = new Map();
  private adcResolution: number = 12; // 12-bit default for ESP32 (0-4095)
  private executionPromise: Promise<void> | null = null;
  private stopResolve: (() => void) | null = null;
  private resumeResolve: (() => void) | null = null;

  constructor(code: string, callbacks: Esp32RunnerCallbacks) {
    this.code = code;
    this.callbacks = callbacks;
  }

  public async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.isPaused = false;
    this.isStopped = false;
    this.startTime = performance.now();

    const transpiledJs = transpileArduinoToJs(this.code);
    const env = this.createEnvironment();

    try {
      const runnerFn = new Function(...Object.keys(env), `
        return (async () => {
          ${transpiledJs}
          if (typeof setup === 'function') {
            await setup();
          }
          while (!__checkStopped()) {
            await __waitIfPaused();
            if (typeof loop === 'function') {
              await loop();
            }
            await yield();
          }
        })();
      `);

      this.executionPromise = runnerFn(...Object.values(env));
      await this.executionPromise;
    } catch (err: any) {
      if (err && err.message === 'SIM_STOPPED') {
        // Normal stop, ignore
      } else {
        console.error('ESP32 Execution Error:', err);
        this.callbacks.onSerialOutput(`\n[ESP32 Runtime Error] ${err?.message || String(err)}\n`);
      }
    } finally {
      this.isRunning = false;
      if (this.stopResolve) {
        this.stopResolve();
        this.stopResolve = null;
      }
    }
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    if (this.isPaused) {
      this.isPaused = false;
      if (this.resumeResolve) {
        this.resumeResolve();
        this.resumeResolve = null;
      }
    }
  }

  public stop(): void {
    this.isStopped = true;
    this.isRunning = false;
    this.isPaused = false;
    if (this.resumeResolve) {
      this.resumeResolve();
      this.resumeResolve = null;
    }
  }

  public sendSerialInput(text: string): void {
    this.serialInputBuffer += text;
  }

  private createEnvironment(): Record<string, any> {
    const runner = this;

    const delayAsync = (ms: number) => {
      return new Promise<void>((resolve, reject) => {
        if (runner.isStopped) return reject(new Error('SIM_STOPPED'));
        setTimeout(() => {
          if (runner.isStopped) reject(new Error('SIM_STOPPED'));
          else resolve();
        }, Math.max(1, ms));
      });
    };

    const delayMicrosecondsAsync = (us: number) => {
      return delayAsync(Math.max(1, us / 1000));
    };

    const yieldAsync = () => {
      return new Promise<void>((resolve, reject) => {
        if (runner.isStopped) return reject(new Error('SIM_STOPPED'));
        setTimeout(() => {
          if (runner.isStopped) reject(new Error('SIM_STOPPED'));
          else resolve();
        }, 0);
      });
    };

    let yieldCounter = 0;
    const yieldCheck = async () => {
      if (runner.isStopped) throw new Error('SIM_STOPPED');
      if (++yieldCounter % 200 === 0) {
        await yieldAsync();
      }
    };

    const waitIfPaused = async () => {
      if (runner.isStopped) throw new Error('SIM_STOPPED');
      if (runner.isPaused) {
        await new Promise<void>((resolve) => {
          runner.resumeResolve = resolve;
        });
        if (runner.isStopped) throw new Error('SIM_STOPPED');
      }
    };

    class SimServo {
      private pin: string | null = null;
      attach(pin: any) {
        this.pin = normalizeEsp32Pin(pin);
      }
      write(angle: number) {
        if (this.pin && runner.callbacks.onServoAngle) {
          runner.callbacks.onServoAngle(this.pin, angle);
        }
      }
      read(): number {
        return 90;
      }
    }

    class SimLiquidCrystal_I2C {
      private cols: number;
      private rows: number;
      private curRow: number = 0;
      private curCol: number = 0;
      private textRows: string[] = [];
      private backlightOn: boolean = true;

      constructor(_addr: number, cols: number, rows: number) {
        this.cols = cols || 16;
        this.rows = rows || 2;
        this.clear();
      }
      init() { this.clear(); }
      begin() { this.clear(); }
      clear() {
        this.textRows = Array(this.rows).fill(' '.repeat(this.cols));
        this.curRow = 0;
        this.curCol = 0;
        this.flush();
      }
      setCursor(col: number, row: number) {
        this.curCol = Math.max(0, Math.min(this.cols - 1, col));
        this.curRow = Math.max(0, Math.min(this.rows - 1, row));
      }
      print(val: any) {
        const str = String(val);
        const r = this.curRow;
        let line = this.textRows[r] || ' '.repeat(this.cols);
        const before = line.substring(0, this.curCol);
        const after = line.substring(this.curCol + str.length);
        this.textRows[r] = (before + str + after).padEnd(this.cols, ' ').substring(0, this.cols);
        this.curCol += str.length;
        this.flush();
      }
      backlight() { this.backlightOn = true; this.flush(); }
      noBacklight() { this.backlightOn = false; this.flush(); }
      private flush() {
        if (runner.callbacks.onLcdUpdate) {
          runner.callbacks.onLcdUpdate({
            rows: [...this.textRows],
            cursorRow: this.curRow,
            cursorCol: this.curCol,
            backlight: this.backlightOn
          });
        }
      }
    }

    class SimDHT {
      begin() {}
      readTemperature(): number {
        return runner.callbacks.getSensorValues().temperature;
      }
      readHumidity(): number {
        return runner.callbacks.getSensorValues().humidity;
      }
    }

    return {
      // Constants
      HIGH: 1,
      LOW: 0,
      OUTPUT: 1,
      INPUT: 0,
      INPUT_PULLUP: 2,
      LED_BUILTIN: 2,
      WL_CONNECTED: 3,
      WL_IDLE_STATUS: 0,
      WL_NO_SSID_AVAIL: 1,
      DHT11: 11,
      DHT22: 22,

      // Pin aliases
      D2: 'D2', D4: 'D4', D5: 'D5', D12: 'D12', D13: 'D13', D14: 'D14', D15: 'D15',
      D16: 'RX2', D17: 'TX2', D18: 'D18', D19: 'D19', D21: 'D21', D22: 'D22', D23: 'D23',
      D25: 'D25', D26: 'D26', D27: 'D27', D32: 'D32', D33: 'D33', D34: 'D34', D35: 'D35',
      VP: 'VP', VN: 'VN', CLK: 'CLK', TX0: 'TX0', RX0: 'RX0', TX2: 'TX2', RX2: 'RX2',

      // Digital & Analog I/O
      pinMode: (pin: any, mode: any) => {
        const pinId = normalizeEsp32Pin(pin);
        const modeStr = mode === 2 || mode === 'INPUT_PULLUP' ? 'INPUT_PULLUP' : mode === 1 || mode === 'OUTPUT' ? 'OUTPUT' : 'INPUT';
        runner.pinModes.set(pinId, modeStr);
        if (runner.callbacks.onPinModeChange) {
          runner.callbacks.onPinModeChange(pinId, modeStr);
        }
        if (modeStr === 'INPUT_PULLUP') {
          // If pullup, seed with 3.3V unless grounded externally
          const currentV = runner.callbacks.getPinVoltage(pinId);
          if (currentV === 0) {
            runner.callbacks.onPinChange(pinId, 3.3);
          }
        }
      },

      digitalWrite: (pin: any, val: any) => {
        const pinId = normalizeEsp32Pin(pin);
        const isHigh = val === 1 || val === true || val === 'HIGH' || Number(val) > 0;
        const voltage = isHigh ? 3.3 : 0.0;
        runner.callbacks.onPinChange(pinId, voltage);
      },

      digitalRead: (pin: any): number => {
        const pinId = normalizeEsp32Pin(pin);
        const v = runner.callbacks.getPinVoltage(pinId);
        if (v > 1.65) return 1;
        const mode = runner.pinModes.get(pinId);
        if (mode === 'INPUT_PULLUP' && v === 0) {
          // Pull-up pulls high unless connected to ground
          return 1;
        }
        return 0;
      },

      analogRead: (pin: any): number => {
        const pinId = normalizeEsp32Pin(pin);
        const v = runner.callbacks.getPinVoltage(pinId);
        const maxAdc = Math.pow(2, runner.adcResolution) - 1;
        return Math.min(maxAdc, Math.max(0, Math.round((v / 3.3) * maxAdc)));
      },

      analogWrite: (pin: any, val: number) => {
        const pinId = normalizeEsp32Pin(pin);
        const duty = Math.min(255, Math.max(0, val)) / 255.0;
        runner.callbacks.onPinChange(pinId, duty * 3.3);
      },

      analogReadResolution: (bits: number) => {
        runner.adcResolution = Math.max(9, Math.min(12, bits));
      },

      // ESP32 LEDC PWM
      ledcSetup: (_channel: number, _freq: number, _resolution: number) => {},
      ledcAttachPin: (pin: any, _channel: number) => {
        normalizeEsp32Pin(pin);
      },
      ledcWrite: (_channel: number, duty: number) => {
        // Find attached pin or apply
        const v = (duty / 255.0) * 3.3;
        runner.callbacks.onPinChange('D2', v);
      },

      // Pulse and Tone
      pulseIn: (pin: any, _val: any, _timeout?: number): number => {
        normalizeEsp32Pin(pin);
        const dist = runner.callbacks.getDistanceCm();
        // HC-SR04 pulse duration is ~58 microseconds per cm
        return Math.round(dist * 58);
      },

      tone: (pin: any, freq: number) => {
        const pinId = normalizeEsp32Pin(pin);
        if (runner.callbacks.onTone) {
          runner.callbacks.onTone(pinId, freq);
        }
      },

      noTone: (pin: any) => {
        const pinId = normalizeEsp32Pin(pin);
        if (runner.callbacks.onTone) {
          runner.callbacks.onTone(pinId, 0);
        }
      },

      // Timing
      delay: delayAsync,
      delayMicroseconds: delayMicrosecondsAsync,
      yield: yieldAsync,
      __yieldCheck: yieldCheck,
      __checkStopped: () => runner.isStopped,
      __waitIfPaused: waitIfPaused,

      millis: (): number => {
        return Math.floor(performance.now() - runner.startTime);
      },

      micros: (): number => {
        return Math.floor((performance.now() - runner.startTime) * 1000);
      },

      // Math & utilities
      map: (val: number, in_min: number, in_max: number, out_min: number, out_max: number): number => {
        return (val - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
      },
      constrain: (amt: number, low: number, high: number): number => {
        return amt < low ? low : amt > high ? high : amt;
      },
      min: Math.min,
      max: Math.max,
      abs: Math.abs,
      sq: (x: number) => x * x,
      sqrt: Math.sqrt,
      pow: Math.pow,
      random: (minOrMax: number, max?: number) => {
        if (max === undefined) {
          return Math.floor(Math.random() * minOrMax);
        }
        return Math.floor(Math.random() * (max - minOrMax) + minOrMax);
      },
      randomSeed: () => {},
      bit: (b: number) => 1 << b,
      bitRead: (v: number, b: number) => (v >> b) & 1,
      bitSet: (v: number, b: number) => v | (1 << b),
      bitClear: (v: number, b: number) => v & ~(1 << b),
      bitWrite: (v: number, b: number, bit: number) => bit ? (v | (1 << b)) : (v & ~(1 << b)),
      lowByte: (w: number) => w & 0xFF,
      highByte: (w: number) => (w >> 8) & 0xFF,

      // Serial
      Serial: {
        begin: (_baud: number) => {},
        print: (val: any) => runner.callbacks.onSerialOutput(String(val)),
        println: (val: any) => runner.callbacks.onSerialOutput((val !== undefined ? String(val) : '') + '\n'),
        write: (val: any) => {
          if (typeof val === 'number') {
            runner.callbacks.onSerialOutput(String.fromCharCode(val));
          } else {
            runner.callbacks.onSerialOutput(String(val));
          }
        },
        available: () => runner.serialInputBuffer.length,
        read: () => {
          if (runner.serialInputBuffer.length === 0) return -1;
          const ch = runner.serialInputBuffer.charCodeAt(0);
          runner.serialInputBuffer = runner.serialInputBuffer.substring(1);
          return ch;
        },
        readString: () => {
          const s = runner.serialInputBuffer;
          runner.serialInputBuffer = '';
          return s;
        }
      },

      // WiFi Mock
      WiFi: {
        begin: (_ssid: string, _pass?: string) => {},
        status: () => 3, // WL_CONNECTED
        localIP: () => '192.168.1.100',
        macAddress: () => '24:6F:28:80:12:34',
        mode: () => {},
        disconnect: () => {}
      },

      // Libraries & Classes
      Servo: SimServo,
      ESP32Servo: SimServo,
      LiquidCrystal_I2C: SimLiquidCrystal_I2C,
      LiquidCrystal: SimLiquidCrystal_I2C,
      DHT: SimDHT
    };
  }
}
