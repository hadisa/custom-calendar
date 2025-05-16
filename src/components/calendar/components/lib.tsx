import { addDays, format, startOfWeek } from "date-fns";

// --- Utility Functions ---
export const getDaysInWeek = (startDate: Date): Date[] => {
    const day = startDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const startOfWeekDate = startOfWeek(startDate, { weekStartsOn: 0 }); // Ensure week starts on Sunday

    return Array.from({ length: 7 }).map((_, i) => addDays(startOfWeekDate, i));
};

export const formatTime = (date: Date): string => {
    return format(date, 'hh:mm a'); // e.g., "09:00 AM"
};

export const formatDateHeader = (date: Date): string => {
    return format(date, 'EEE d'); // e.g., "Mon 24"
};
