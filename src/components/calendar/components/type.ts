// --- Utility for Tailwind CSS class merging (simplified clsx/tailwind-merge) ---
export type ClassValue = string | boolean | null | undefined;
function cn(...inputs: ClassValue[]) {
    return inputs.filter(Boolean).join(' ');
}

// --- Global Constants for Calendar Layout ---
export const DAY_VIEW_HOUR_WIDTH_PX = 50; // Width of each hour column in Day view
export const DAY_VIEW_TOTAL_WIDTH_PX = 24 * DAY_VIEW_HOUR_WIDTH_PX; // Total width of the 24-hour timeline in Day view
export const DEFAULT_DAY_COLUMN_MIN_WIDTH_PX = 120; // Default minimum width for day columns in week/month/quarter detailed views

// --- Type Definitions ---

/**
 * @interface ShiftGroup
 * Defines the structure for a group of resources (e.g., a department, a team).
 * Each group has a unique ID, a name, and now an `isExpanded` property to control visibility.
 */
export interface ShiftGroup {
    id: string;
    name: string;
    isExpanded: boolean; // Added for expand/collapse functionality
}

/**
 * @interface Resource
 * Defines the structure for a calendar resource, such as an employee.
 * Includes a `groupId` to link it to a ShiftGroup.
 */
export interface Resource {
    id: string;
    name: string;
    color: string; // Hex color for visual distinction
    groupId: string; // ID of the shift group this resource belongs to
}

/**
 * @interface ShiftEvent
 * Defines the structure for a single shift or event on the calendar.
 */
export interface ShiftEvent {
    id: string;
    resourceId: string;
    title: string;
    start: Date;
    end: Date;
}

/**
 * @interface CalendarContextType
 * Defines the shape of the context object that will be provided to child components.
 * Now includes `shiftGroups` and `toggleGroupExpansion`.
 */
export interface CalendarContextType {
    shiftGroups: ShiftGroup[];
    resources: Resource[];
    events: ShiftEvent[];
    addEvent: (event: Omit<ShiftEvent, 'id'>) => void; // Reverted to sync
    toggleGroupExpansion: (groupId: string) => void; // Reverted to sync
    deleteEvent: (eventId: string) => void; // Reverted to sync
    // Removed userId, isLoading
}