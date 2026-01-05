import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';

interface CodeEditorWebProps {
  initialCode: string | null;
  onSave?: (code: string) => void;
  onReady?: () => void;
}

export default function CodeEditorWeb({ initialCode, onSave, onReady }: CodeEditorWebProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        if (typeof event.data !== 'string') return;
        
        const data = JSON.parse(event.data);
        if (data.type === 'ready') {
          setIsEditorReady(true);
          if (onReady) onReady();
          
          if (initialCode && iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(
              JSON.stringify({ type: 'setCode', code: initialCode }),
              '*'
            );
          }
        } else if (data.type === 'save') {
          if (onSave) onSave(data.code);
        }
      } catch (e) {
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onReady, onSave, initialCode]);

  useEffect(() => {
    if (isEditorReady && initialCode && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ type: 'setCode', code: initialCode }),
        '*'
      );
    }
  }, [initialCode, isEditorReady]);


  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        src="/assets/editor.html"
        style={{
            width: '100%',
            height: '100%',
            border: 'none',
        }}
        title="Python Code Editor"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    overflow: 'hidden',
  },
});