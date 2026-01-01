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
        // Ensure the message is valid JSON before parsing
        if (typeof event.data !== 'string') return;
        
        const data = JSON.parse(event.data);
        if (data.type === 'ready') {
          setIsEditorReady(true);
          if (onReady) onReady();
          
          // Inject initial code once ready
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
        // Ignore parsing errors for messages that aren't ours
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onReady, onSave, initialCode]); // Added initialCode dependency to ensure it's available when ready

  // Also watch for initialCode changes if the editor is already ready
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
