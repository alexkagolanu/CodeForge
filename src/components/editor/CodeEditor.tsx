/**
 * Monaco Code Editor Component
 */

import React from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { useTheme } from '@/contexts/ThemeContext';
import { SUPPORTED_LANGUAGES, type LanguageConfig } from '@/types';
import { cn } from '@/lib/utils';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: LanguageConfig;
  onLanguageChange?: (language: LanguageConfig) => void;
  languages?: LanguageConfig[];
  height?: string;
  readOnly?: boolean;
  className?: string;
  showLineNumbers?: boolean;
  showMinimap?: boolean;
}

export function CodeEditor({
  value,
  onChange,
  language,
  onLanguageChange,
  languages,
  height = '400px',
  readOnly = false,
  className,
  showLineNumbers = true,
  showMinimap = false,
}: CodeEditorProps) {
  const { resolvedTheme } = useTheme();

  const handleEditorDidMount: OnMount = (editor) => {
    editor.focus();
  };

  const handleEditorChange: OnChange = (value) => {
    onChange(value || '');
  };

  const editorTheme = resolvedTheme === 'dark' ? 'vs-dark' : 'light';

  return (
    <div className={cn('overflow-hidden rounded-lg border border-border', className)}>
      {onLanguageChange && (
        <div className="flex items-center gap-2 border-b border-border bg-secondary/50 px-3 py-2">
          <label className="text-xs font-medium text-muted-foreground">Language:</label>
          <select
            value={language.id}
            onChange={(e) => {
              const pool = languages && languages.length ? languages : SUPPORTED_LANGUAGES;
              const newLang = pool.find(l => l.id === e.target.value);
              if (newLang) onLanguageChange(newLang);
            }}
            className="rounded-md border border-border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {(languages && languages.length ? languages : SUPPORTED_LANGUAGES).map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <Editor
        height={height}
        language={language.monacoId}
        value={value}
        theme={editorTheme}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontLigatures: true,
          lineNumbers: showLineNumbers ? 'on' : 'off',
          minimap: { enabled: showMinimap },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
          padding: { top: 16, bottom: 16 },
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          renderLineHighlight: 'all',
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: true,
            indentation: true,
          },
        }}
        loading={
          <div className="flex h-full items-center justify-center bg-editor-bg">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        }
      />
    </div>
  );
}
