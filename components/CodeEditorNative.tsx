import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Asset } from 'expo-asset';

interface CodeEditorNativeProps {
  initialCode: string | null;
  onSave?: (code: string) => void;
  onReady?: () => void;
}

export default function CodeEditorNative({ initialCode, onSave, onReady }: CodeEditorNativeProps) {
  const webViewRef = useRef<WebView>(null);
  const [editorUri, setEditorUri] = React.useState<string | null>(null);

  useEffect(() => {
    const loadAsset = async () => {
      try {
        const asset = Asset.fromModule(require('../assets/editor.html'));
        await asset.downloadAsync();
        setEditorUri(asset.uri);
      } catch (error) {
        console.error('Error loading editor asset:', error);
      }
    };
    loadAsset();
  }, []);

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ready') {
        if (onReady) onReady();
        if (initialCode) {
          const injectCode = JSON.stringify({ type: 'setCode', code: initialCode });
          webViewRef.current?.postMessage(injectCode);
        }
      } else if (data.type === 'save') {
        if (onSave) onSave(data.code);
      }
    } catch (e) {
      console.log('Message error from WebView:', e);
    }
  };

  if (!editorUri) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: editorUri }}
      style={styles.webview}
      onMessage={handleMessage}
      javaScriptEnabled={true}
      originWhitelist={['*']}
      allowFileAccess={true}
      domStorageEnabled={true}
      scrollEnabled={true}
      nestedScrollEnabled={true}
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
    backgroundColor: '#1e1e1e',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
  },
});
