import { useState, useCallback } from 'react';

interface HistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

interface UseUndoRedoReturn<T> {
    state: T;
    setState: (newState: T) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    reset: (newState: T) => void;
}

export function useUndoRedo<T>(initialState: T, maxHistory = 50): UseUndoRedoReturn<T> {
    const [history, setHistory] = useState<HistoryState<T>>({
        past: [],
        present: initialState,
        future: [],
    });

    const setState = useCallback(
        (newState: T) => {
            setHistory((currentHistory) => {
                const { past, present } = currentHistory;

                // Don't add to history if state hasn't changed
                if (JSON.stringify(present) === JSON.stringify(newState)) {
                    return currentHistory;
                }

                const newPast = [...past, present];

                // Limit history size
                if (newPast.length > maxHistory) {
                    newPast.shift();
                }

                return {
                    past: newPast,
                    present: newState,
                    future: [],
                };
            });
        },
        [maxHistory]
    );

    const undo = useCallback(() => {
        setHistory((currentHistory) => {
            const { past, present, future } = currentHistory;

            if (past.length === 0) return currentHistory;

            const previous = past[past.length - 1];
            const newPast = past.slice(0, past.length - 1);

            return {
                past: newPast,
                present: previous,
                future: [present, ...future],
            };
        });
    }, []);

    const redo = useCallback(() => {
        setHistory((currentHistory) => {
            const { past, present, future } = currentHistory;

            if (future.length === 0) return currentHistory;

            const next = future[0];
            const newFuture = future.slice(1);

            return {
                past: [...past, present],
                present: next,
                future: newFuture,
            };
        });
    }, []);

    const reset = useCallback((newState: T) => {
        setHistory({
            past: [],
            present: newState,
            future: [],
        });
    }, []);

    return {
        state: history.present,
        setState,
        undo,
        redo,
        canUndo: history.past.length > 0,
        canRedo: history.future.length > 0,
        reset,
    };
}
