'use client';

// This directive is crucial for client-side functionality in Next.js
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

// Import shadcn/ui components from the specified path
import { Button } from '@/registry/new-york-v4/ui/button';
import { Calendar } from '@/registry/new-york-v4/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/new-york-v4/ui/popover';

import {
    addDays,
    addMonths,
    endOfMonth,
    endOfWeek,
    format,
    getMonth,
    getYear,
    isSameDay,
    isSameMonth,
    parseISO,
    startOfMonth,
    startOfWeek,
    subMonths
} from 'date-fns';

// --- Utility for Tailwind CSS class merging (simplified clsx/tailwind-merge) ---
type ClassValue = string | boolean | null | undefined;
function cn(...inputs: ClassValue[]) {
    return inputs.filter(Boolean).join(' ');
}

// --- Global Constants for Calendar Layout ---
const HOUR_HEIGHT_PX = 60; // Height of one hour slot in pixels (increased for more detail)
const TOTAL_DAY_HEIGHT_PX = 24 * HOUR_HEIGHT_PX; // Total height of a day column (24 hours * 60px/hour)

// --- Type Definitions ---

/**
 * @interface ShiftGroup
 * Defines the structure for a group of resources (e.g., a department, a team).
 * Each group has a unique ID, a name, and now an `isExpanded` property to control visibility.
 */
interface ShiftGroup {
    id: string;
    name: string;
    isExpanded: boolean; // Added for expand/collapse functionality
}

/**
 * @interface Resource
 * Defines the structure for a calendar resource, such as an employee.
 * Includes a `groupId` to link it to a ShiftGroup.
 */
interface Resource {
    id: string;
    name: string;
    color: string; // Hex color for visual distinction
    groupId: string; // ID of the shift group this resource belongs to
}

/**
 * @interface ShiftEvent
 * Defines the structure for a single shift or event on the calendar.
 */
interface ShiftEvent {
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
interface CalendarContextType {
    shiftGroups: ShiftGroup[];
    resources: Resource[];
    events: ShiftEvent[];
    addEvent: (event: Omit<ShiftEvent, 'id'>) => void;
    toggleGroupExpansion: (groupId: string) => void; // Added for toggling group expansion
}

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

// --- Utility Functions ---
const getDaysInWeek = (startDate: Date): Date[] => {
    const day = startDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const startOfWeekDate = startOfWeek(startDate, { weekStartsOn: 0 }); // Ensure week starts on Sunday

    return Array.from({ length: 7 }).map((_, i) => addDays(startOfWeekDate, i));
};

const formatTime = (date: Date): string => {
    return format(date, 'hh:mm a'); // e.g., "09:00 AM"
};

const formatDateHeader = (date: Date): string => {
    return format(date, 'EEE d'); // e.g., "Mon 24"
};

// --- Components ---

const Event: React.FC<{ event: ShiftEvent; resourceColor: string }> = ({ event, resourceColor }) => {
    const startMinutes = event.start.getHours() * 60 + event.start.getMinutes();
    const endMinutes = event.end.getHours() * 60 + event.end.getMinutes();
    const durationMinutes = endMinutes - startMinutes;

    // Calculate top and height based on minute-to-pixel conversion
    const topPosition = (startMinutes / 60) * HOUR_HEIGHT_PX; // Position based on minutes within the hour
    const eventHeight = (durationMinutes / 60) * HOUR_HEIGHT_PX; // Height based on duration in minutes

    return (
        <div
            className='absolute z-10 rounded-md p-1 text-xs font-medium text-white shadow-md'
            style={{
                backgroundColor: resourceColor,
                top: `${topPosition}px`,
                height: `${eventHeight}px`,
                width: 'calc(100% - 4px)', // Adjust width to account for padding/margin within the cell
                left: '2px', // Small offset from left edge
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minHeight: '20px' // Ensure event is visible even if very short
            }}
            title={`${event.title} (${formatTime(event.start)} - ${formatTime(event.end)})`}>
            {event.title}
            <span className='ml-1 text-gray-100 opacity-80'>{formatTime(event.start)}</span>
        </div>
    );
};

/**
 * @component ResourceRow
 * Renders a single resource's row, displaying their name and events.
 */
const ResourceRow: React.FC<{ resource: Resource; daysInWeek: Date[] }> = ({ resource, daysInWeek }) => {
    const { events } = useCalendar();
    // Generate grid lines for every half hour
    const timeMarkers = Array.from({ length: 48 }).map((_, i) => i * 30); // 0, 30, 60, 90... minutes

    // Filter events relevant to this resource and the current week/day
    const resourceEvents = events.filter(
        (event) => event.resourceId === resource.id && daysInWeek.some((day) => isSameDay(day, event.start))
    );

    return (
        <div className='flex border-b border-gray-200 last:border-b-0'>
            <div className='flex w-32 flex-shrink-0 items-center justify-center border-r border-gray-200 bg-gray-50 p-3 text-sm font-semibold text-gray-800'>
                {resource.name}
            </div>
            <div className='flex flex-grow'>
                {daysInWeek.map((day) => (
                    <div
                        key={day.toISOString()}
                        className='relative flex-1 border-r border-gray-200 last:border-r-0'
                        style={{ height: `${TOTAL_DAY_HEIGHT_PX}px` }} // Set fixed height for day column
                    >
                        {/* Render hourly and half-hourly grid lines within each day cell */}
                        {timeMarkers.map((minutes) => (
                            <div
                                key={`grid-${day.toISOString()}-${minutes}`}
                                className={cn(
                                    'absolute w-full border-b border-gray-100',
                                    minutes % 60 === 0 ? 'border-gray-200' : 'border-gray-100' // Thicker line for full hours
                                )}
                                style={{ top: `${(minutes / 60) * HOUR_HEIGHT_PX}px` }}></div>
                        ))}

                        {/* Render events for this specific day and resource */}
                        {resourceEvents
                            .filter((event) => isSameDay(event.start, day))
                            .map((event) => (
                                <Event key={event.id} event={event} resourceColor={resource.color} />
                            ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * @component ShiftForm
 * A form component to add new shift events.
 */
const ShiftForm: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { resources, addEvent } = useCalendar();
    const [resourceId, setResourceId] = useState<string>(resources[0]?.id || '');
    const [title, setTitle] = useState<string>('');
    const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState<string>('09:00');
    const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [endTime, setEndTime] = useState<string>('17:00');
    const [errorMessage, setErrorMessage] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            setResourceId(resources[0]?.id || '');
            setTitle('');
            setStartDate(format(new Date(), 'yyyy-MM-dd'));
            setStartTime('09:00');
            setEndDate(format(new Date(), 'yyyy-MM-dd'));
            setEndTime('17:00');
            setErrorMessage('');
        }
    }, [isOpen, resources]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');

        const startDateTime = parseISO(`${startDate}T${startTime}:00`);
        const endDateTime = parseISO(`${endDate}T${endTime}:00`);

        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
            setErrorMessage('Invalid date or time format.');

            return;
        }

        if (endDateTime <= startDateTime) {
            setErrorMessage('End time must be after start time.');

            return;
        }

        if (!resourceId || !title.trim()) {
            setErrorMessage('Please select a resource and enter a title.');

            return;
        }

        addEvent({
            resourceId,
            title: title.trim(),
            start: startDateTime,
            end: endDateTime
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className='bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-gray-600'>
            <div className='w-full max-w-md rounded-lg bg-white p-6 shadow-xl'>
                <h2 className='mb-4 text-2xl font-bold text-gray-800'>Add New Shift</h2>
                <form onSubmit={handleSubmit}>
                    {errorMessage && (
                        <div
                            className='relative mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'
                            role='alert'>
                            <span className='block sm:inline'>{errorMessage}</span>
                        </div>
                    )}

                    <div className='mb-4'>
                        <label htmlFor='resource' className='mb-2 block text-sm font-semibold text-gray-700'>
                            Resource:
                        </label>
                        <select
                            id='resource'
                            className='w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none'
                            value={resourceId}
                            onChange={(e) => setResourceId(e.target.value)}
                            required>
                            {resources.map((res) => (
                                <option key={res.id} value={res.id}>
                                    {res.name} (Group: {resources.find((r) => r.id === res.id)?.groupId || 'N/A'}){' '}
                                    {/* Show group name for context */}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className='mb-4'>
                        <label htmlFor='title' className='mb-2 block text-sm font-semibold text-gray-700'>
                            Shift Title:
                        </label>
                        <input
                            type='text'
                            id='title'
                            className='w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none'
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder='e.g., Morning Shift, Meeting'
                            required
                        />
                    </div>

                    <div className='mb-4 grid grid-cols-2 gap-4'>
                        <div>
                            <label htmlFor='startDate' className='mb-2 block text-sm font-semibold text-gray-700'>
                                Start Date:
                            </label>
                            <input
                                type='date'
                                id='startDate'
                                className='w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none'
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor='startTime' className='mb-2 block text-sm font-semibold text-gray-700'>
                                Start Time:
                            </label>
                            <input
                                type='time'
                                id='startTime'
                                className='w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none'
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className='mb-6 grid grid-cols-2 gap-4'>
                        <div>
                            <label htmlFor='endDate' className='mb-2 block text-sm font-semibold text-gray-700'>
                                End Date:
                            </label>
                            <input
                                type='date'
                                id='endDate'
                                className='w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none'
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor='endTime' className='mb-2 block text-sm font-semibold text-gray-700'>
                                End Time:
                            </label>
                            <input
                                type='time'
                                id='endTime'
                                className='w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none'
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className='flex justify-end gap-2'>
                        <Button type='button' variant='secondary' onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type='submit'>Add Shift</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

/**
 * @component MainCalendar
 * The main calendar component that displays the week view,
 * including date headers and grouped resource rows with their respective events.
 * Renamed from Calendar to avoid naming conflict with the date picker Calendar component.
 */
const MainCalendar: React.FC<{ currentWeekStart: Date; currentView: 'week' | 'day' | 'year' }> = ({
    currentWeekStart,
    currentView
}) => {
    const { shiftGroups, resources, toggleGroupExpansion, events } = useCalendar(); // Destructure events here

    // Determine which days to display based on the current view
    let daysToDisplay: Date[] = [];
    if (currentView === 'week') {
        daysToDisplay = getDaysInWeek(currentWeekStart);
    } else if (currentView === 'day') {
        daysToDisplay = [currentWeekStart]; // For day view, only show the selected day
    }

    // Generate time labels for the time axis
    const timeLabels = Array.from({ length: 24 }).map((_, i) => {
        const hour = i % 12 === 0 ? 12 : i % 12;
        const ampm = i < 12 ? 'AM' : 'PM';

        return `${hour}:00 ${ampm}`;
    });

    if (currentView === 'year') {
        const months = Array.from({ length: 12 }).map((_, i) => new Date(currentWeekStart.getFullYear(), i, 1));

        return (
            <div className='flex flex-col overflow-hidden rounded-lg border border-gray-300 bg-white p-4 shadow-md'>
                <h2 className='mb-4 text-center text-2xl font-bold'>{currentWeekStart.getFullYear()} Year View</h2>
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
                    {months.map((monthDate) => (
                        <div key={monthDate.toISOString()} className='rounded-lg border bg-gray-50 p-4 text-center'>
                            <h3 className='mb-2 text-lg font-semibold'>{format(monthDate, 'MMMM')}</h3>
                            {/* Placeholder for month summary - can be expanded later */}
                            <p className='text-sm text-gray-600'>
                                Events:{' '}
                                {
                                    events.filter(
                                        (e) =>
                                            getMonth(e.start) === getMonth(monthDate) &&
                                            getYear(e.start) === getYear(monthDate)
                                    ).length
                                }
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className='flex flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow-md'>
            {/* Calendar Header: Groups/Resources, Time, and Days of the Week / Selected Day */}
            <div className='flex border-b border-gray-200 bg-gray-100'>
                <div className='w-32 flex-shrink-0 border-r border-gray-200 p-3 text-sm font-semibold text-gray-600'>
                    Groups/Resources
                </div>
                <div className='w-16 flex-shrink-0 border-r border-gray-200 p-3 text-right text-sm font-semibold text-gray-600'>
                    Time
                </div>
                {daysToDisplay.map((day) => (
                    <div
                        key={day.toISOString()}
                        className='flex-1 border-r border-gray-200 p-3 text-center text-sm font-semibold text-gray-600'>
                        {formatDateHeader(day)}
                    </div>
                ))}
            </div>

            {/* Calendar Body: Shift Groups and Resource Rows */}
            <div className='flex-grow overflow-y-auto' style={{ maxHeight: 'calc(100vh - 250px)' }}>
                {' '}
                {/* Added max height and scroll */}
                <div className='flex'>
                    {/* Time Axis Column */}
                    <div className='w-32 flex-shrink-0 border-r border-gray-200 bg-gray-50'>
                        {/* Empty cell to align with "Groups/Resources" header */}
                        <div className='h-full'>
                            {timeLabels.map((label, index) => (
                                <div
                                    key={`time-label-${index}`}
                                    className='relative pr-2 text-right text-xs text-gray-500'
                                    style={{ height: `${HOUR_HEIGHT_PX}px`, top: index === 0 ? '0' : '-10px' }} // Adjust top for better label alignment
                                >
                                    {label}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Main Calendar Content Area */}
                    <div className='flex-grow'>
                        {shiftGroups.map((group) => (
                            <div key={group.id} className='mb-2 last:mb-0'>
                                {/* Group Header Row */}
                                <div
                                    className='flex cursor-pointer border-t border-b border-gray-300 bg-gray-200 transition duration-150 ease-in-out hover:bg-gray-300'
                                    onClick={() => toggleGroupExpansion(group.id)}>
                                    <div className='flex w-32 flex-shrink-0 items-center justify-between border-r border-gray-300 p-3 text-sm font-bold text-gray-900'>
                                        <span>{group.name}</span>
                                        {/* Arrow icon for expand/collapse */}
                                        <svg
                                            className={`h-4 w-4 transform text-gray-700 transition-transform duration-200 ${
                                                group.isExpanded ? 'rotate-90' : ''
                                            }`}
                                            fill='none'
                                            stroke='currentColor'
                                            viewBox='0 0 24 24'
                                            xmlns='http://www.w3.org/2000/svg'>
                                            <path
                                                strokeLinecap='round'
                                                strokeLinejoin='round'
                                                strokeWidth='2'
                                                d='M9 5l7 7-7 7'></path>
                                        </svg>
                                    </div>
                                    {/* Empty cell for group header below Time column */}
                                    <div className='w-16 flex-shrink-0 border-r border-gray-300'></div>{' '}
                                    {/* This aligns with the time axis */}
                                    <div className='flex-grow p-3 text-sm font-semibold text-gray-600'>
                                        {/* Empty cell for group header spanning days */}
                                    </div>
                                </div>

                                {/* Resources belonging to this group - conditionally rendered */}
                                {group.isExpanded && (
                                    <div className='overflow-hidden transition-all duration-300 ease-in-out'>
                                        {resources
                                            .filter((res) => res.groupId === group.id)
                                            .map((resource) => (
                                                <ResourceRow
                                                    key={resource.id}
                                                    resource={resource}
                                                    daysInWeek={daysToDisplay}
                                                />
                                            ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * @component App
 * The root component of the Microsoft Shifts calendar application.
 * Manages the global state for shift groups, resources, and events.
 */
const App: React.FC = () => {
    // Mock data for initial state - use deterministic dates to avoid hydration errors
    const today = new Date(2025, 4, 26, 0, 0, 0); // May 26, 2025, 00:00:00 (fixed for consistent SSR)

    const [shiftGroups, setShiftGroups] = useState<ShiftGroup[]>([
        { id: 'group-ops', name: 'Operations Team', isExpanded: true },
        { id: 'group-sales', name: 'Sales Department', isExpanded: true },
        { id: 'group-support', name: 'Customer Support', isExpanded: true }
    ]);

    const [resources, setResources] = useState<Resource[]>([
        { id: 'res-1', name: 'Alice Johnson', color: '#EF4444', groupId: 'group-ops' },
        { id: 'res-2', name: 'Bob Williams', color: '#3B82F6', groupId: 'group-ops' },
        { id: 'res-3', name: 'Charlie Brown', color: '#10B981', groupId: 'group-sales' },
        { id: 'res-4', name: 'Diana Prince', color: '#F59E0B', groupId: 'group-sales' },
        { id: 'res-5', name: 'Eve Davis', color: '#6366F1', groupId: 'group-support' }
    ]);

    const [events, setEvents] = useState<ShiftEvent[]>([
        {
            id: 'evt-1',
            resourceId: 'res-1',
            title: 'Morning Shift',
            start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0),
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0, 0)
        },
        {
            id: 'evt-2',
            resourceId: 'res-2',
            title: 'Afternoon Shift',
            start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0, 0),
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0, 0)
        },
        {
            id: 'evt-3',
            resourceId: 'res-1',
            title: 'Team Meeting',
            start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 9, 0, 0), // Tomorrow
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 11, 0, 0)
        },
        {
            id: 'evt-4',
            resourceId: 'res-3',
            title: 'Client Call',
            start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 10, 0, 0),
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 12, 0, 0)
        },
        {
            id: 'evt-5',
            resourceId: 'res-5',
            title: 'Support Desk',
            start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 10, 0, 0), // Yesterday
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 18, 0, 0)
        }
    ]);

    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(today); // Initialize with deterministic date
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [currentView, setCurrentView] = useState<'week' | 'day' | 'year'>('week');

    // Directly update currentWeekStart when a date is selected from the Calendar
    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setCurrentWeekStart(date);
            setIsDatePickerOpen(false); // Close popover after selection
        }
    };

    const addEvent = (newEvent: Omit<ShiftEvent, 'id'>) => {
        setEvents((prevEvents) => [
            ...prevEvents,
            { ...newEvent, id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }
        ]);
    };

    /**
     * @function toggleGroupExpansion
     * Toggles the `isExpanded` state for a specific shift group.
     * @param {string} groupId - The ID of the group to toggle.
     */
    const toggleGroupExpansion = (groupId: string) => {
        setShiftGroups((prevGroups) =>
            prevGroups.map((group) => (group.id === groupId ? { ...group, isExpanded: !group.isExpanded } : group))
        );
    };

    // Generic navigation for previous/next based on current view
    const goToPrevious = () => {
        setCurrentWeekStart((prev) => {
            const newDate = new Date(prev);
            if (currentView === 'week') {
                newDate.setDate(prev.getDate() - 7);
            } else if (currentView === 'day') {
                newDate.setDate(prev.getDate() - 1);
            } else if (currentView === 'year') {
                newDate.setFullYear(prev.getFullYear() - 1);
            }

            return newDate;
        });
    };

    const goToNext = () => {
        setCurrentWeekStart((prev) => {
            const newDate = new Date(prev);
            if (currentView === 'week') {
                newDate.setDate(prev.getDate() + 7);
            } else if (currentView === 'day') {
                newDate.setDate(prev.getDate() + 1);
            } else if (currentView === 'year') {
                newDate.setFullYear(prev.getFullYear() + 1);
            }

            return newDate;
        });
    };

    // Provide the context value including shiftGroups and toggleGroupExpansion
    const calendarContextValue: CalendarContextType = {
        shiftGroups,
        resources,
        events,
        addEvent,
        toggleGroupExpansion
    };

    return (
        <CalendarContext.Provider value={calendarContextValue}>
            <div className='min-h-screen bg-gray-100 p-4 font-sans text-gray-900 antialiased'>
                <style>
                    {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
          }
          `}
                </style>
                <script src='https://cdn.tailwindcss.com'></script>

                <div className='mx-auto max-w-7xl py-6 sm:px-6 lg:px-8'>
                    <h1 className='mb-6 text-center text-3xl font-bold text-gray-900'>
                        Microsoft Shifts Clone (with Groups & shadcn UI)
                    </h1>
                    <div className='mb-6 flex items-center justify-between'>
                        <div className='flex space-x-2'>
                            <Button onClick={goToPrevious} variant='outline'>
                                &larr; Previous{' '}
                                {currentView === 'week' ? 'Week' : currentView === 'day' ? 'Day' : 'Year'}
                            </Button>
                            <Button onClick={goToNext} variant='outline'>
                                Next {currentView === 'week' ? 'Week' : currentView === 'day' ? 'Day' : 'Year'} &rarr;
                            </Button>
                        </div>

                        {/* View Selection Buttons */}
                        <div className='flex space-x-2'>
                            <Button
                                variant={currentView === 'day' ? 'default' : 'outline'}
                                onClick={() => setCurrentView('day')}>
                                Day
                            </Button>
                            <Button
                                variant={currentView === 'week' ? 'default' : 'outline'}
                                onClick={() => setCurrentView('week')}>
                                Week
                            </Button>
                            <Button
                                variant={currentView === 'year' ? 'default' : 'outline'}
                                onClick={() => setCurrentView('year')}>
                                Year
                            </Button>
                        </div>

                        {/* Date Picker using shadcn/ui components */}
                        <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={'outline'}
                                    className={cn('w-[280px] justify-start text-left font-normal')}>
                                    <svg
                                        xmlns='http://www.w3.org/2000/svg'
                                        width='24'
                                        height='24'
                                        viewBox='0 0 24 24'
                                        fill='none'
                                        stroke='currentColor'
                                        strokeWidth='2'
                                        strokeLinecap='round'
                                        strokeLinejoin='round'
                                        className='mr-2 h-4 w-4'>
                                        <rect width='18' height='18' x='3' y='4' rx='2' ry='2'></rect>
                                        <line x1='16' x2='16' y1='2' y2='6'></line>
                                        <line x1='8' x2='8' y1='2' y2='6'></line>
                                        <line x1='3' x2='21' y1='10' y2='10'></line>
                                    </svg>
                                    {currentWeekStart ? format(currentWeekStart, 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className='w-auto p-0'>
                                <Calendar
                                    mode='single'
                                    selected={currentWeekStart} // Calendar now directly uses currentWeekStart
                                    onSelect={handleDateSelect} // Updates currentWeekStart and closes popover
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        <Button onClick={() => setIsFormOpen(true)}>Add New Shift</Button>
                    </div>
                    <MainCalendar currentWeekStart={currentWeekStart} currentView={currentView} />{' '}
                    {/* Pass currentView */}
                </div>

                <ShiftForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} />
            </div>
        </CalendarContext.Provider>
    );
};

export default App;
