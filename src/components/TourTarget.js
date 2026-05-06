import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useTour } from '../config/TourContext';

/**
 * Wraps a UI element so the tour overlay can find and highlight it.
 * Usage:
 *   <TourTarget id="home-fab"><MyButton /></TourTarget>
 */
export default function TourTarget({ id, children, style }) {
  const tour = useTour();
  const ref = useRef(null);

  useEffect(() => {
    if (!tour) return;
    tour.registerTarget(id, ref);
    return () => tour.unregisterTarget(id);
  }, [id, tour]);

  return (
    <View ref={ref} collapsable={false} style={style}>
      {children}
    </View>
  );
}
