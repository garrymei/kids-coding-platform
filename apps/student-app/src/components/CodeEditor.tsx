import { useEffect, useMemo, useRef } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as MonacoEditor from 'monaco-editor';

type SupportedLanguage = 'python' | 'javascript';

export interface CodeEditorProps {
  language: SupportedLanguage;
  value: string;
  onChange: (nextValue: string) => void;
  height?: number | string;
  readOnly?: boolean;
  diffSource?: string | null;
}

const LANGUAGE_MAPPING: Record<SupportedLanguage, string> = {
  python: 'python',
  javascript: 'javascript',
};

const EDITOR_OPTIONS: MonacoEditor.editor.IStandaloneEditorConstructionOptions = {
  fontFamily: "JetBrains Mono, 'Fira Code', 'Consolas', 'Courier New', monospace",
  fontSize: 14,
  minimap: { enabled: false },
  automaticLayout: true,
  scrollBeyondLastLine: false,
  renderWhitespace: 'selection',
  tabSize: 2,
};

/**
 * Monaco-based code editor with optional diff highlighting.
 */
export function CodeEditor({
  language,
  value,
  onChange,
  height = 360,
  readOnly = false,
  diffSource,
}: CodeEditorProps) {
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof MonacoEditor | null>(null);
  const decorationIdsRef = useRef<string[]>([]);

  const normalizedDiffSource = useMemo(
    () => (typeof diffSource === 'string' ? diffSource : null),
    [diffSource],
  );

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
  };

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) {
      return;
    }

    if (!normalizedDiffSource) {
      decorationIdsRef.current = editorRef.current.deltaDecorations(decorationIdsRef.current, []);
      return;
    }

    const currentModel = editorRef.current.getModel();
    if (!currentModel) {
      return;
    }

    const currentLines = currentModel.getLinesContent();
    const referenceLines = normalizedDiffSource.split('\n');
    const maxLength = Math.max(currentLines.length, referenceLines.length);

    const diffLineNumbers: number[] = [];
    for (let index = 0; index < maxLength; index += 1) {
      const left = referenceLines[index] ?? '';
      const right = currentLines[index] ?? '';
      if (left !== right) {
        diffLineNumbers.push(index + 1);
      }
    }

    const decorations = diffLineNumbers.map((lineNumber) => ({
      range: new monacoRef.current!.Range(lineNumber, 1, lineNumber, 1),
      options: {
        isWholeLine: true,
        className: 'code-editor-diff-line',
        marginClassName: 'code-editor-diff-gutter',
      },
    }));

    decorationIdsRef.current = editorRef.current.deltaDecorations(
      decorationIdsRef.current,
      decorations,
    );
  }, [normalizedDiffSource, value]);

  useEffect(() => {
    return () => {
      if (editorRef.current) {
        editorRef.current.dispose();
      }
    };
  }, []);

  return (
    <div style={{ height, position: 'relative' }}>
      <Editor
        language={LANGUAGE_MAPPING[language]}
        theme="vs-dark"
        value={value}
        options={{ ...EDITOR_OPTIONS, readOnly }}
        onMount={handleMount}
        onChange={(nextValue) => {
          onChange(nextValue ?? '');
        }}
      />
    </div>
  );
}
