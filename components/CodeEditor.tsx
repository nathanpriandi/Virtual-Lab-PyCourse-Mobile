import React from 'react';
import { Platform } from 'react-native';
import CodeEditorNative from './CodeEditorNative';
import CodeEditorWeb from './CodeEditorWeb';

interface CodeEditorProps {
  initialCode: string | null;
  onSave?: (code: string) => void;
  onReady?: () => void;
}

export default function CodeEditor(props: CodeEditorProps) {
  if (Platform.OS === 'web') {
    return <CodeEditorWeb {...props} />;
  }
  return <CodeEditorNative {...props} />;
}
