'use client';

import { createContext, useContext } from 'react';
import { CalendarContextType } from '../types';


// --- Context Creation ---
const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

/**
 * @function useCalendar
 * A custom hook to consume the CalendarContext.
 */
const useCalendar = () => {
    const context = useContext(CalendarContext);
    if (!context) {
        throw new Error('useCalendar must be used within a CalendarProvider');
    }

    return context;
};

export { CalendarContext, useCalendar };
