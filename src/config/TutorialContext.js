import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';

const TutorialContext = createContext();

export const useTutorial = () => useContext(TutorialContext);

export const TutorialProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [hasSeenTutorial, setHasSeenTutorial] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    if (currentUser) {
      AsyncStorage.getItem('hasSeenTutorial').then(value => {
        setHasSeenTutorial(value === 'true');
      });
      // Load user demographics
      AsyncStorage.getItem('userDemographics').then(json => {
        if (json) setUserProfile(JSON.parse(json));
      });
    }
  }, [currentUser]);

  const completeTutorial = async () => {
    await AsyncStorage.setItem('hasSeenTutorial', 'true');
    // Re-load profile after survey saves it
    const json = await AsyncStorage.getItem('userDemographics');
    if (json) setUserProfile(JSON.parse(json));
    setHasSeenTutorial(true);
  };

  const value = {
    hasSeenTutorial,
    completeTutorial,
    userProfile,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};

