import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Drives the interactive product tour.
 * - Steps describe targets that may live on different tabs/screens.
 * - Screens register their highlightable elements via `registerTarget(id, ref)`.
 * - When the tour advances, it asks the navigator to switch tabs first
 *   (via `tabSwitchRequest`), then waits for that target to become measurable.
 */

const TourContext = createContext(null);
export const useTour = () => useContext(TourContext);

// ── Default tour script ─────────────────────────────────────────
export const DEFAULT_TOUR_STEPS = [
  {
    id: 'home-summary',
    targetId: 'home-summary',
    tab: 'Home',
    title: 'At a glance',
    body: 'These cards show your pantry status — total items, what\'s expiring, what\'s already past.',
    placement: 'bottom',
  },
  {
    id: 'home-fab',
    targetId: 'home-fab',
    tab: 'Home',
    title: 'Add groceries',
    body: 'Tap here to add an item — scan a barcode, scan an expiry date, or type it in.',
    placement: 'top',
  },
  {
    id: 'home-filter',
    targetId: 'home-filter',
    tab: 'Home',
    title: 'Search & filter',
    body: 'Find items fast by name, status, or category. Sort by expiry to see what needs attention first.',
    placement: 'bottom',
  },
  {
    id: 'tab-recipes',
    targetId: 'tab-recipes',
    tab: 'Recipes',
    title: 'Recipes you can make',
    body: 'See recipes matched to what\'s currently in your pantry. Items expiring soon get prioritized.',
    placement: 'top',
  },
  {
    id: 'tab-chef',
    targetId: 'tab-chef',
    tab: 'Chef',
    title: 'Meet Chef Sage',
    body: 'Your AI cooking assistant. Ask anything: "What can I make with eggs?" or "Use what\'s expiring."',
    placement: 'top',
  },
  {
    id: 'tab-pantries',
    targetId: 'tab-pantries',
    tab: 'Pantries',
    title: 'Shared pantries',
    body: 'Create a pantry and invite family or roommates to share items together.',
    placement: 'top',
  },
  {
    id: 'tab-settings',
    targetId: 'tab-settings',
    tab: 'Settings',
    title: 'Make it yours',
    body: 'Toggle dark mode, manage notifications, and replay this tour anytime.',
    placement: 'top',
  },
];

const TOUR_DONE_KEY = 'shelfsenseTourCompleted';

export function TourProvider({ children }) {
  const [isActive, setIsActive] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [steps] = useState(DEFAULT_TOUR_STEPS);
  const [tabSwitchRequest, setTabSwitchRequest] = useState(null); // tab name to switch to
  const [hasCompleted, setHasCompleted] = useState(null);
  const targetsRef = useRef(new Map()); // id -> { ref, layout }
  const [, setTick] = useState(0); // force re-render when targets register

  useEffect(() => {
    AsyncStorage.getItem(TOUR_DONE_KEY).then(v => setHasCompleted(v === 'true'));
  }, []);

  const registerTarget = useCallback((id, ref) => {
    targetsRef.current.set(id, { ref });
    setTick(t => t + 1);
  }, []);

  const unregisterTarget = useCallback((id) => {
    targetsRef.current.delete(id);
  }, []);

  const getTargetRef = useCallback((id) => {
    return targetsRef.current.get(id)?.ref || null;
  }, []);

  const startTour = useCallback(() => {
    setCurrentIndex(0);
    setIsActive(true);
    const firstStep = steps[0];
    if (firstStep?.tab) setTabSwitchRequest(firstStep.tab);
  }, [steps]);

  const advance = useCallback(() => {
    setCurrentIndex(prev => {
      const next = prev + 1;
      if (next >= steps.length) {
        // End of tour
        AsyncStorage.setItem(TOUR_DONE_KEY, 'true');
        setHasCompleted(true);
        setIsActive(false);
        setTabSwitchRequest(null);
        return prev;
      }
      const nextStep = steps[next];
      if (nextStep?.tab) setTabSwitchRequest(nextStep.tab);
      return next;
    });
  }, [steps]);

  const back = useCallback(() => {
    setCurrentIndex(prev => {
      if (prev <= 0) return prev;
      const prevStep = steps[prev - 1];
      if (prevStep?.tab) setTabSwitchRequest(prevStep.tab);
      return prev - 1;
    });
  }, [steps]);

  const skip = useCallback(() => {
    AsyncStorage.setItem(TOUR_DONE_KEY, 'true');
    setHasCompleted(true);
    setIsActive(false);
    setTabSwitchRequest(null);
  }, []);

  const consumeTabSwitch = useCallback(() => {
    setTabSwitchRequest(null);
  }, []);

  const resetTourCompletion = useCallback(async () => {
    await AsyncStorage.removeItem(TOUR_DONE_KEY);
    setHasCompleted(false);
  }, []);

  const value = {
    isActive,
    currentIndex,
    currentStep: steps[currentIndex] || null,
    totalSteps: steps.length,
    steps,
    hasCompleted,
    tabSwitchRequest,
    consumeTabSwitch,
    registerTarget,
    unregisterTarget,
    getTargetRef,
    startTour,
    advance,
    back,
    skip,
    resetTourCompletion,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}
