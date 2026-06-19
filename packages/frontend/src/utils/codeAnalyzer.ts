export interface CodeIssue {
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
  hint?: string;
  code: string;
}

export function analyzeCode(code: string): CodeIssue[] {
  const issues: CodeIssue[] = [];
  const lines = code.split('\n');

  let setupCount = 0;
  let loopCount = 0;
  let hasSerialPrint = false;
  let hasSerialBegin = false;
  let hasDelayInSetup = false;
  let hasDelayInLoop = false;
  let serialPrintLine = 1;
  let serialPrintCol = 1;

  let currentBlock = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trim = line.trim();
    const lowerLine = line.toLowerCase();
    const lineNum = i + 1;

    // Detect block
    if (trim.indexOf('void ') !== -1 && trim.indexOf('setup') !== -1 && trim.indexOf('(') !== -1) {
      setupCount++;
      currentBlock = 'setup';
    } else if (trim.indexOf('void ') !== -1 && trim.indexOf('loop') !== -1 && trim.indexOf('(') !== -1) {
      loopCount++;
      currentBlock = 'loop';
    }

    let spIndex = line.indexOf('Serial.print');
    if (spIndex !== -1) {
      if (!hasSerialPrint) {
        serialPrintLine = lineNum;
        serialPrintCol = spIndex + 1;
      }
      hasSerialPrint = true;
    }
    if (line.indexOf('Serial.begin') !== -1) {
      hasSerialBegin = true;
    }

    // CHECK VERY_LARGE_DELAY
    let dIndex = line.indexOf('delay(');
    if (dIndex !== -1) {
      if (currentBlock === 'setup') hasDelayInSetup = true;
      if (currentBlock === 'loop') hasDelayInLoop = true;

      const argsStart = dIndex + 6;
      const parenIndex = line.indexOf(')', argsStart);
      if (parenIndex !== -1) {
        const valArg = line.substring(argsStart, parenIndex).trim();
        // Check if string contains only digits
        let isNumeric = true;
        for (let j = 0; j < valArg.length; j++) {
          if (valArg.charCodeAt(j) < 48 || valArg.charCodeAt(j) > 57) {
            isNumeric = false;
            break;
          }
        }
        if (isNumeric && valArg.length > 0) {
          const valNum = parseInt(valArg, 10);
          if (valNum > 10000) {
            issues.push({
              line: lineNum,
              column: dIndex + 1,
              severity: 'info',
              message: `Very large delay of ${valNum}ms found.`,
              hint: 'Consider using millis() for non-blocking delays.',
              code: 'VERY_LARGE_DELAY'
            });
          }
        }
      }
    }

    // CHECK ANALOGWRITE_ON_NON_PWM
    let awIndex = line.indexOf('analogWrite(');
    if (awIndex !== -1) {
      const argsStart = awIndex + 12;
      const commaIndex = line.indexOf(',', argsStart);
      if (commaIndex !== -1) {
        const pinArg = line.substring(argsStart, commaIndex).trim();
        let isNumeric = true;
        for (let j = 0; j < pinArg.length; j++) {
          if (pinArg.charCodeAt(j) < 48 || pinArg.charCodeAt(j) > 57) {
            isNumeric = false;
            break;
          }
        }
        if (isNumeric && pinArg.length > 0) {
          const pinNum = parseInt(pinArg, 10);
          if (pinNum !== 3 && pinNum !== 5 && pinNum !== 6 && pinNum !== 9 && pinNum !== 10 && pinNum !== 11) {
            issues.push({
              line: lineNum,
              column: awIndex + 1,
              severity: 'warning',
              message: `Pin ${pinNum} does not support hardware PWM.`,
              hint: 'Use PWM pins: 3, 5, 6, 9, 10, 11',
              code: 'ANALOGWRITE_ON_NON_PWM'
            });
          }
        }
      }
    }

    // CHECK COMMON_MISSPELLINGS
    const spellings = [
      { lower: 'digitalwrite', correct: 'digitalWrite' },
      { lower: 'analogread', correct: 'analogRead' },
      { lower: 'analogwrite', correct: 'analogWrite' },
      { lower: 'pinmode', correct: 'pinMode' },
      { lower: 'serial.print', correct: 'Serial.print' },
      { lower: 'serial.begin', correct: 'Serial.begin' },
      { lower: 'digitalread', correct: 'digitalRead' }
    ];

    for (const sp of spellings) {
      const idx = lowerLine.indexOf(sp.lower);
      if (idx !== -1 && line.indexOf(sp.correct) === -1) {
        issues.push({
          line: lineNum,
          column: idx + 1,
          severity: 'error',
          message: `Possible misspelling of ${sp.correct}.`,
          hint: 'Arduino language is case-sensitive.',
          code: 'COMMON_MISSPELLINGS'
        });
      }
    }

    // CHECK MISSING_SEMICOLON_HINT
    if (trim.endsWith(')') && 
        !trim.startsWith('//') &&
        trim.indexOf('if') !== 0 && 
        trim.indexOf('for') !== 0 && 
        trim.indexOf('while') !== 0 && 
        trim.indexOf('else') !== 0 &&
        trim.indexOf('void') === -1) {
      issues.push({
        line: lineNum,
        column: line.length,
        severity: 'info',
        message: 'Statement may be missing a semicolon.',
        hint: 'Add a ; at the end of the line',
        code: 'MISSING_SEMICOLON_HINT'
      });
    }
  }

  // CHECK MISSING_SETUP and CHECK MISSING_LOOP
  if (setupCount === 0 && loopCount === 0) {
    issues.push({
      line: 1,
      column: 1,
      severity: 'error',
      message: 'Missing setup() and loop() functions.',
      hint: 'Every Arduino program requires void setup() and void loop().',
      code: 'MISSING_SETUP_LOOP'
    });
  } else {
    if (setupCount === 0) {
      issues.push({
        line: 1,
        column: 1,
        severity: 'error',
        message: 'Missing setup() function.',
        hint: 'Arduino programs require a void setup() { ... } block.',
        code: 'MISSING_SETUP'
      });
    }
    if (loopCount === 0) {
      issues.push({
        line: 1,
        column: 1,
        severity: 'error',
        message: 'Missing loop() function.',
        hint: 'Arduino programs require a void loop() { ... } block.',
        code: 'MISSING_LOOP'
      });
    }
  }

  // CHECK MULTIPLE_SETUP_OR_LOOP
  if (setupCount > 1) {
    issues.push({ line: 1, column: 1, severity: 'error', message: 'Multiple setup() functions defined.', code: 'MULTIPLE_SETUP' });
  }
  if (loopCount > 1) {
    issues.push({ line: 1, column: 1, severity: 'error', message: 'Multiple loop() functions defined.', code: 'MULTIPLE_LOOP' });
  }

  // CHECK SERIAL_WITHOUT_BEGIN
  if (hasSerialPrint && !hasSerialBegin) {
    issues.push({
      line: serialPrintLine,
      column: serialPrintCol,
      severity: 'warning',
      message: 'Serial.print used without Serial.begin.',
      hint: 'Add Serial.begin(9600); inside setup() before using Serial.',
      code: 'SERIAL_WITHOUT_BEGIN'
    });
  }

  // CHECK DELAY_IN_SETUP_ONLY
  if (hasDelayInSetup && !hasDelayInLoop) {
    issues.push({
      line: 1,
      column: 1,
      severity: 'info',
      message: 'Delay is only used in setup().',
      hint: 'This runs only once. Is this intentional?',
      code: 'DELAY_IN_SETUP_ONLY'
    });
  }

  return issues;
}
