
"use client";

// THIS HOOK IS DEPRECATED AND WILL BE REMOVED.
// Use useAppContext and data-service instead.

import { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const isClient = typeof window !== 'undefined';

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isClient) {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.log(error);
      return initialValue;
    }
  });

  useEffect(() => {
    if (!isClient) {
      return;
    }
    try {
       if (window.localStorage.getItem(key) === null) {
         window.localStorage.setItem(key, JSON.stringify(initialValue));
         setStoredValue(initialValue);
       }
    } catch (error) {
      console.log(error);
    }
  }, [key, initialValue, isClient]);


  const setValue = (value: T | ((val: T) => T)) => {
    if (!isClient) return;
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.log(error);
    }
  };
  
  return [storedValue, setValue];
}

export default useLocalStorage;
