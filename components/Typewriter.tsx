import React, { useState, useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';

interface TypewriterProps {
  texts: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseDuration?: number;
  style?: any;
}

export default function Typewriter({ 
  texts, 
  typingSpeed = 150, 
  deletingSpeed = 75, 
  pauseDuration = 2000,
  style 
}: TypewriterProps) {
  const [textIndex, setTextIndex] = useState(0); 
  const [displayedText, setDisplayedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[textIndex];
    let timeoutId;

    if (isDeleting) {
      if (displayedText.length > 0) {
        timeoutId = setTimeout(() => {
          setDisplayedText(displayedText.substring(0, displayedText.length - 1));
        }, deletingSpeed);
      } else {
        setIsDeleting(false);
        setTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
      }
    } else {
      if (displayedText.length < currentText.length) {
        timeoutId = setTimeout(() => {
          setDisplayedText(currentText.substring(0, displayedText.length + 1));
        }, typingSpeed);
      } else {
        timeoutId = setTimeout(() => {
          setIsDeleting(true);
        }, pauseDuration);
      }
    }
    return () => clearTimeout(timeoutId);
  }, [displayedText, isDeleting, textIndex, texts, typingSpeed, deletingSpeed, pauseDuration]);

  return (
    <Text style={[styles.typewriterText, style]}>
      {displayedText}|
    </Text>
  );
}

const styles = StyleSheet.create({
  typewriterText: {
    fontFamily: 'Courier', // Monospace font
    color: '#000',
    fontSize: 16,
  },
});
