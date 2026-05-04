import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const SLIDES = [
  { title: "Track Your Pantry", text: "Easily monitor what you have and when it expires." },
  { title: "Avoid Food Waste", text: "Get alerts before your food goes bad." },
  { title: "Shop Smarter", text: "Discover recipes based on your expiring items." }
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.replace('Main');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.slideContainer}>
        <Text style={styles.title}>{SLIDES[currentIndex].title}</Text>
        <Text style={styles.text}>{SLIDES[currentIndex].text}</Text>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => (
            <View key={index} style={[styles.dot, currentIndex === index && styles.activeDot]} />
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>{currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', justifyContent: 'center' },
  slideContainer: { flex: 0.7, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 15, textAlign: 'center' },
  text: { fontSize: 16, color: '#aaa', textAlign: 'center', lineHeight: 24 },
  footer: { flex: 0.3, justifyContent: 'center', paddingHorizontal: 20 },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 30 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#333', marginHorizontal: 5 },
  activeDot: { backgroundColor: '#2ECC71', width: 20 },
  button: { backgroundColor: '#2ECC71', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});
