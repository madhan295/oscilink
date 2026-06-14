import { useRef, useState, useImperativeHandle, forwardRef, useCallback, useEffect } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { useEditorStore } from '../../store/editorStore';
import { Wand2, Search, Type, Plus, Minus } from 'lucide-react';
import type { editor } from 'monaco-editor';
import { analyzeCode } from '../../utils/codeAnalyzer';

// Debounce helper
function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

import { CompilationError } from '../../types/simulation';

export interface CodeEditorRef {
  displayCompilationErrors: (errors: CompilationError[]) => void;
  displayStaticErrors: (errors: CompilationError[]) => void;
  clearErrors: () => void;
}

export const CodeEditor = forwardRef<CodeEditorRef>((_props, ref) => {
  const code = useEditorStore(state => state.code);
  const setCode = useEditorStore(state => state.setCode);
  const [fontSize, setFontSize] = useState(13);
  
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  const validateCode = useCallback((currentCode: string) => {
    if (!monacoRef.current || !editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    const issues = analyzeCode(currentCode);
    const setStaticErrors = useEditorStore.getState().setStaticErrors;

    setStaticErrors(issues.map(i => ({
      line: i.line,
      column: i.column,
      message: i.message,
      severity: i.severity === 'info' ? 'warning' : i.severity,
      hint: i.hint
    })));

    const markers = issues.map(err => {
      let severity = monacoRef.current!.MarkerSeverity.Error;
      if (err.severity === 'warning') severity = monacoRef.current!.MarkerSeverity.Warning;
      if (err.severity === 'info') severity = monacoRef.current!.MarkerSeverity.Info;

      // Make error into warning to visually distinguish from compiler errors
      if (err.severity === 'error') severity = monacoRef.current!.MarkerSeverity.Warning;

      const message = err.hint ? `${err.message}\nHint: ${err.hint}` : err.message;

      return {
        startLineNumber: err.line,
        startColumn: Math.max(1, err.column),
        endLineNumber: err.line,
        endColumn: err.column + 10, // Highlight a chunk
        message: message,
        severity: severity,
        source: 'arduino-static'
      };
    });

    monacoRef.current.editor.setModelMarkers(model, 'arduino-static', markers);
  }, []);

  useEffect(() => {
    if (isEditorReady) {
      const timer = setTimeout(() => {
        validateCode(code);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [code, isEditorReady, validateCode]);

  const debouncedSetCode = useDebounce((newCode: string) => {
    setCode(newCode);
  }, 300);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      debouncedSetCode(value);
    }
  };

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    setIsEditorReady(true);
  };

  const handleEditorWillMount = (monaco: Monaco) => {
    // Register Arduino snippets
    monaco.languages.registerCompletionItemProvider('cpp', {
      triggerCharacters: ['.', ':'],
      provideCompletionItems: (_model: any, _position: any) => {
        const suggestions = [
          // Pin Functions
          {
            label: 'digitalWrite',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'digitalWrite(${1:pin}, ${2:value});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Write a HIGH or a LOW value to a digital pin.',
          },
          {
            label: 'digitalRead',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'digitalRead(${1:pin})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Reads the value from a specified digital pin, either HIGH or LOW.',
          },
          {
            label: 'analogRead',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'analogRead(${1:pin})',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Reads the value from the specified analog pin.',
          },
          {
            label: 'analogWrite',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'analogWrite(${1:pin}, ${2:value});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Writes an analog value (PWM wave) to a pin.',
          },
          {
            label: 'pinMode',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'pinMode(${1:pin}, ${2:mode});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Configures the specified pin to behave either as an input or an output.',
          },
          // Time Functions
          {
            label: 'delay',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'delay(${1:ms});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Pauses the program for the amount of time (in milliseconds) specified as parameter.',
          },
          {
            label: 'millis',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'millis()',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Returns the number of milliseconds passed since the Arduino board began running the current program.',
          },
          {
            label: 'micros',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'micros()',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Returns the number of microseconds since the Arduino board began running the current program.',
          },
          {
            label: 'delayMicroseconds',
            kind: monaco.languages.CompletionItemKind.Function,
            insertText: 'delayMicroseconds(${1:us});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Pauses the program for the amount of time (in microseconds) specified as parameter.',
          },
          // Serial
          {
            label: 'Serial.begin',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'Serial.begin(${1:9600});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Sets the data rate in bits per second (baud) for serial data transmission.',
          },
          {
            label: 'Serial.print',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'Serial.print(${1:val});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Prints data to the serial port as human-readable ASCII text.',
          },
          {
            label: 'Serial.println',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'Serial.println(${1:val});',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Prints data to the serial port as human-readable ASCII text followed by a carriage return character.',
          },
          {
            label: 'Serial.read',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'Serial.read()',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Reads incoming serial data.',
          },
          {
            label: 'Serial.available',
            kind: monaco.languages.CompletionItemKind.Method,
            insertText: 'Serial.available()',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'Get the number of bytes (characters) available for reading from the serial port.',
          },
          // Constants
          { label: 'HIGH', kind: monaco.languages.CompletionItemKind.Constant, insertText: 'HIGH', documentation: 'Digital HIGH level.' },
          { label: 'LOW', kind: monaco.languages.CompletionItemKind.Constant, insertText: 'LOW', documentation: 'Digital LOW level.' },
          { label: 'INPUT', kind: monaco.languages.CompletionItemKind.Constant, insertText: 'INPUT', documentation: 'Pin configured as INPUT.' },
          { label: 'OUTPUT', kind: monaco.languages.CompletionItemKind.Constant, insertText: 'OUTPUT', documentation: 'Pin configured as OUTPUT.' },
          { label: 'INPUT_PULLUP', kind: monaco.languages.CompletionItemKind.Constant, insertText: 'INPUT_PULLUP', documentation: 'Pin configured as INPUT with internal pull-up resistor.' },
          { label: 'LED_BUILTIN', kind: monaco.languages.CompletionItemKind.Constant, insertText: 'LED_BUILTIN', documentation: 'Pin number of the built-in LED.' },
          { label: 'true', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'true' },
          { label: 'false', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'false' },
          // Data Types
          { label: 'int', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'int' },
          { label: 'long', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'long' },
          { label: 'float', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'float' },
          { label: 'double', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'double' },
          { label: 'char', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'char' },
          { label: 'byte', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'byte' },
          { label: 'boolean', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'boolean' },
          { label: 'String', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'String' },
          { label: 'word', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'word' },
          // Math Functions
          { label: 'abs', kind: monaco.languages.CompletionItemKind.Function, insertText: 'abs(${1:x})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
          { label: 'map', kind: monaco.languages.CompletionItemKind.Function, insertText: 'map(${1:value}, ${2:fromLow}, ${3:fromHigh}, ${4:toLow}, ${5:toHigh})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
          { label: 'constrain', kind: monaco.languages.CompletionItemKind.Function, insertText: 'constrain(${1:x}, ${2:a}, ${3:b})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
          { label: 'min', kind: monaco.languages.CompletionItemKind.Function, insertText: 'min(${1:x}, ${2:y})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
          { label: 'max', kind: monaco.languages.CompletionItemKind.Function, insertText: 'max(${1:x}, ${2:y})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
          { label: 'random', kind: monaco.languages.CompletionItemKind.Function, insertText: 'random(${1:min}, ${2:max})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
          { label: 'randomSeed', kind: monaco.languages.CompletionItemKind.Function, insertText: 'randomSeed(${1:seed});', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
          { label: 'sqrt', kind: monaco.languages.CompletionItemKind.Function, insertText: 'sqrt(${1:x})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
          { label: 'pow', kind: monaco.languages.CompletionItemKind.Function, insertText: 'pow(${1:base}, ${2:exponent})', insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet },
          // Control structures
          {
            label: 'if-else',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'if (${1:condition}) {\n\t$2\n} else {\n\t$3\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'if-else statement',
          },
          {
            label: 'for loop',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'for (int ${1:i} = 0; ${1:i} < ${2:count}; ${1:i}++) {\n\t$3\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'for loop statement',
          },
          {
            label: 'while loop',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: 'while (${1:condition}) {\n\t$2\n}',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            documentation: 'while loop statement',
          }
        ];
        
        return { suggestions };
      }
    });
  };

  useImperativeHandle(ref, () => ({
    displayCompilationErrors: (errors) => {
      if (!monacoRef.current || !editorRef.current) return;
      const model = editorRef.current.getModel();
      if (!model) return;

      const markers = errors.map(err => ({
        startLineNumber: err.line,
        startColumn: err.column,
        endLineNumber: err.line,
        endColumn: err.column + 1,
        message: err.message,
        severity: monacoRef.current!.MarkerSeverity.Error,
        source: 'arduino-compiler'
      }));

      monacoRef.current.editor.setModelMarkers(model, 'arduino-compiler', markers);
    },
    displayStaticErrors: (errors) => {
      if (!monacoRef.current || !editorRef.current) return;
      const model = editorRef.current.getModel();
      if (!model) return;

      const markers = errors.map(err => ({
        startLineNumber: err.line,
        startColumn: err.column,
        endLineNumber: err.line,
        endColumn: err.column + 1,
        message: err.message,
        severity: monacoRef.current!.MarkerSeverity.Error,
        source: 'arduino-static'
      }));

      monacoRef.current.editor.setModelMarkers(model, 'arduino-static', markers);
    },
    clearErrors: () => {
      if (!monacoRef.current || !editorRef.current) return;
      const model = editorRef.current.getModel();
      if (!model) return;
      monacoRef.current.editor.setModelMarkers(model, 'arduino-compiler', []);
      monacoRef.current.editor.setModelMarkers(model, 'arduino-static', []);
    }
  }));

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  };

  const handleFind = () => {
    if (editorRef.current) {
      editorRef.current.getAction('actions.find')?.run();
    }
  };

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 1, 32));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 1, 8));

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e]">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-3 h-[36px] min-h-[36px] border-b border-[#333] bg-[#252526] select-none">
        <div className="flex items-center">
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
            Arduino C++
          </span>
        </div>
        <div className="flex items-center gap-1 text-text-secondary">
          <button 
            onClick={handleFormat}
            className="p-1.5 rounded hover:bg-[#333] hover:text-text transition-colors"
            title="Format Code"
          >
            <Wand2 size={15} />
          </button>
          <button 
            onClick={handleFind}
            className="p-1.5 rounded hover:bg-[#333] hover:text-text transition-colors"
            title="Find/Replace (Ctrl+F)"
          >
            <Search size={15} />
          </button>
          <div className="w-px h-4 bg-[#444] mx-1" />
          <div className="flex items-center bg-[#1e1e1e] rounded border border-[#333] overflow-hidden">
            <button 
              onClick={decreaseFontSize}
              className="px-2 py-1 hover:bg-[#333] hover:text-text transition-colors border-r border-[#333]"
              title="Decrease Font Size"
            >
              <div className="flex items-center"><Type size={12} /><Minus size={10} className="ml-0.5" /></div>
            </button>
            <button 
              onClick={increaseFontSize}
              className="px-2 py-1 hover:bg-[#333] hover:text-text transition-colors"
              title="Increase Font Size"
            >
              <div className="flex items-center"><Type size={13} /><Plus size={10} className="ml-0.5" /></div>
            </button>
          </div>
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-grow w-full relative">
        <Editor
          height="100%"
          language="cpp"
          theme="vs-dark"
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          beforeMount={handleEditorWillMount}
          options={{
            fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
            fontSize: fontSize,
            fontLigatures: true,
            lineNumbers: "on",
            minimap: { enabled: false },
            wordWrap: "on",
            automaticLayout: true,
            autoClosingBrackets: "always",
            autoClosingQuotes: "always",
            bracketPairColorization: { enabled: true },
            glyphMargin: true,
            folding: true,
            padding: { top: 12 },
            suggest: { showInlineDetails: true },
            quickSuggestions: { other: true, comments: true, strings: true },
          }}
        />
      </div>
    </div>
  );
});

CodeEditor.displayName = 'CodeEditor';
