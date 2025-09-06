import { useCallback } from "react";

export const useDebounce = () => {
  return useCallback(
    function <Args extends unknown[], R>(
      fn: (...args: Args) => R,
      delay: number
    ) {
      let timeout: NodeJS.Timeout;

      const debouncedFn = (...args: Args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          fn(...args);
        }, delay);
      };

      (debouncedFn as typeof debouncedFn & { cancel: () => void }).cancel = () => {
        clearTimeout(timeout);
      };

      return debouncedFn as typeof debouncedFn & { cancel: () => void };
    },
    []
  );
};
