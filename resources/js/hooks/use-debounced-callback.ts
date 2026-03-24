import { useCallback, useEffect, useRef } from 'react';

export function useDebouncedCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (...args: any[]) => void,
    delay: number,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    deps: any[] = [],
) {
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Clear timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    const debouncedCallback = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (...args: any[]) => {
            // Clear existing timeout
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Set new timeout
            timeoutRef.current = setTimeout(() => {
                callback(...args);
            }, delay);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [callback, delay, ...deps],
    );

    return debouncedCallback;
}

export default useDebouncedCallback;
