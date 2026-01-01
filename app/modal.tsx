import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet } from 'react-native';
import { useEffect, useState, useRef } from 'react';

import EditScreenInfo from '@/components/EditScreenInfo';
import { Text, View } from '@/components/Themed';

export default function ModalScreen() {
  const [isMounted, setIsMounted] = useState(false);
  // @ts-ignore: Ref type mismatch for Web vs Native
  const containerRef = useRef<View>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && Platform.OS === 'web') {
        // Short timeout to ensure the element is in the DOM
        setTimeout(() => {
            // @ts-ignore: focus() exists on the DOM node in Web
            containerRef.current?.focus();
        }, 100);
    }
  }, [isMounted]);

  if (!isMounted) return null;

  return (
    <View 
        style={styles.container} 
        ref={containerRef}
        // @ts-ignore: React Native Web prop
        dataSet={{ tabIndex: -1 }}
        aria-modal="true"
        // @ts-ignore: 'dialog' is valid on Web
        accessibilityRole="dialog"
    >
      <Text style={styles.title}>Modal</Text>
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <EditScreenInfo path="app/modal.tsx" />

      {/* Use a light status bar on iOS to account for the black space above the modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
