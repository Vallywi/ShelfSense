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

  // IMPORTANT: don't put `tour` in this effect's deps. The TourContext's
  // value object is a fresh reference on every TourProvider render — and
  // TourProvider re-renders every time `targetsVersion` bumps (i.e. every
  // register/unregister). Including tour here would create a render loop
  // (cleanup unregisters → bumps version → re-render → effect re-runs →
  // re-registers → bumps version → ...). Use a ref instead and only
  // re-bind when the id actually changes.
  const tourRef = useRef(tour);
  useEffect(() => { tourRef.current = tour; });

  useEffect(() => {
    const t = tourRef.current;
    if (!t) return;
    t.registerTarget(id, ref);
    return () => {
      const cur = tourRef.current;
      cur?.unregisterTarget?.(id);
    };
  }, [id]);

  return (
    <View ref={ref} collapsable={false} style={style}>
      {children}
    </View>
  );
}
