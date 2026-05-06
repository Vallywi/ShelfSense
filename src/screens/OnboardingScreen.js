import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ImageBackground, Dimensions, Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../config/ThemeContext';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: 'Manage your pantry\neasily',
    subtitle: 'Without too much work',
    image: require('../assets/onboarding/onboarding1.png'),
  },
  {
    id: '2',
    title: 'Easily find\nexpired items',
    subtitle: 'Without hassle',
    image: require('../assets/onboarding/onboarding2.png'),
  },
  {
    id: '3',
    title: 'Shop your\npantry items',
    subtitle: 'Without worries',
    image: require('../assets/onboarding/onboarding3.png'),
  },
];

export default function OnboardingScreen({ navigation }) {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems && viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const getItemLayout = (_, index) => ({ length: width, offset: width * index, index });

  const scrollToNext = async () => {
    if (currentIndex < SLIDES.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      try {
        await AsyncStorage.setItem('hasOnboarded', 'true');
        navigation.replace('Login');
      } catch (err) {
        console.log('Error @setItem: ', err);
      }
    }
  };

  const handleSkip = async () => {
    try {
      await AsyncStorage.setItem('hasOnboarded', 'true');
      navigation.replace('Login');
    } catch (err) {}
  };

  const Slide = ({ item }) => (
    <View style={styles.slide}>
      <ImageBackground source={item.image} style={styles.image} resizeMode="cover">
        <View style={styles.overlay}>
          <View style={styles.content}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        </View>
      </ImageBackground>
    </View>
  );

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      {/* Skip button */}
      {!isLastSlide && (
        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.8}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      <FlatList
        data={SLIDES}
        renderItem={({ item }) => <Slide item={item} />}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        getItemLayout={getItemLayout}
        ref={slidesRef}
      />

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.pagination}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [10, 28, 10],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.4, 1, 0.4],
              extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={i.toString()}
                style={[styles.dot, { width: dotWidth, opacity, backgroundColor: theme.primary }]}
              />
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: theme.primaryDeep, shadowColor: theme.primaryDeep }]}
          onPress={scrollToNext}
          activeOpacity={0.85}
        >
          {isLastSlide ? (
            <Text style={styles.nextBtnText}>Get Started</Text>
          ) : (
            <Ionicons name="chevron-forward" size={26} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  slide: { width, height },
  image: { width, height, justifyContent: 'flex-end' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    paddingBottom: 160,
  },
  content: { paddingHorizontal: 30 },
  title: {
    fontSize: 38, fontWeight: '900', color: '#FFFFFF',
    lineHeight: 46, letterSpacing: 0.3,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 18, color: '#FFFFFF', marginTop: 10,
    fontWeight: '500', opacity: 0.92,
  },

  skipBtn: {
    position: 'absolute', top: 50, right: 20, zIndex: 10,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)',
  },
  skipText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },

  footer: {
    position: 'absolute', bottom: 50, width: '100%',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 30,
  },
  pagination: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { height: 10, borderRadius: 5 },

  nextBtn: {
    minWidth: 60, height: 60, borderRadius: 30,
    paddingHorizontal: 20,
    justifyContent: 'center', alignItems: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10,
    elevation: 8,
  },
  nextBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', letterSpacing: 0.5 },
});
