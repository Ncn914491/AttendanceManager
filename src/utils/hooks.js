import { useRef, useCallback } from 'react';

/**
 * A custom hook that creates a callback that always has the latest value of the dependencies.
 * This is a workaround for the missing useLatestCallback from react-native-paper.
 * 
 * @param {Function} callback - The callback function
 * @param {Array} deps - The dependencies array
 * @returns {Function} - The memoized callback function
 */
export const useLatestCallback = (callback, deps = []) => {
  const callbackRef = useRef(callback);
  
  // Update the ref whenever the callback changes
  callbackRef.current = callback;
  
  // Return a memoized version of the callback that always calls the latest version
  return useCallback((...args) => {
    return callbackRef.current(...args);
  }, deps);
};
