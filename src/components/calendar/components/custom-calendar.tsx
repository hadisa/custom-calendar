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
    addQuarters,
    endOfMonth,
    endOfQuarter,
    endOfWeek,
    format,
    getMonth,
    getQuarter,
    getYear,
    isSameDay,
    isSameMonth,
    parseISO,
    startOfMonth,
    startOfQuarter,
    startOfWeek,
    subMonths,
    subQuarters
} from 'date-fns';

import { formatTime } from './lib';
import MainCalendar from './MainCalendar';
import ShiftForm from './ShiftForm';
import { CalendarContext } from './context';
import { cn } from '@/lib/utils';
import { ShiftGroup, Resource, ShiftEvent, CalendarContextType } from './type';













/**
 * @component App
 * The root component of the Microsoft Shifts calendar application.
 * Manages the global state for shift groups, resources, and events.
 */
const AppCalendar: React.FC = () => {
    // Mock data for initial state - use deterministic dates to avoid hydration errors
    const today = new Date(2025, 4, 26, 0, 0, 0); // May 26, 2025, 00:00:00 (fixed for consistent SSR)

    const [shiftGroups, setShiftGroups] = useState<ShiftGroup[]>([
        { id: 'group-ops', name: 'Operations Team', isExpanded: true },
        { id: 'group-sales', name: 'Sales Department', isExpanded: true },
        { id: 'group-support', name: 'Customer Support', isExpanded: true }
    ]);

    // Add a dummy resource for "Open Shifts"
    const [resources, setResources] = useState<Resource[]>([
        { id: 'res-1', name: 'Alice Johnson', color: '#EF4444', groupId: 'group-ops' },
        { id: 'res-2', name: 'Bob Williams', color: '#3B82F6', groupId: 'group-ops' },
        { id: 'res-3', name: 'Charlie Brown', color: '#10B981', groupId: 'group-sales' },
        { id: 'res-4', name: 'Diana Prince', color: '#F59E0B', groupId: 'group-sales' },
        { id: 'res-5', name: 'Eve Davis', color: '#6366F1', groupId: 'group-support' },
        { id: 'open-shift-resource-id', name: 'Open Shifts', color: '#9CA3AF', groupId: 'N/A' } // Special resource for open shifts
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
        },
        // Dummy open shifts
        {
            id: 'open-evt-1',
            resourceId: 'open-shift-resource-id',
            title: 'Open Shift for Operations Team',
            start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 0, 0),
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0, 0)
        },
        {
            id: 'open-evt-2',
            resourceId: 'open-shift-resource-id',
            title: 'Open Shift for Sales Department',
            start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 16, 0, 0),
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 20, 0, 0)
        }
    ]);

    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(today); // Initialize with deterministic date
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [currentView, setCurrentView] = useState<
        'week' | 'day' | 'year' | 'quarter' | 'month' | 'month-detailed' | 'quarter-detailed'
    >('week'); // Added 'quarter-detailed' to view options

    // State to hold the date for the new event form and popup coordinates
    const [newEventFormDate, setNewEventFormDate] = useState<Date | null>(null);
    const [popupCoords, setPopupCoords] = useState<{ x: number; y: number } | null>(null);
    const [defaultResourceIdForForm, setDefaultResourceIdForForm] = useState<string | undefined>(undefined);
    const [groupNameForOpenShift, setGroupNameForOpenShift] = useState<string | undefined>(undefined);

    // Function to open the add shift form, optionally with an initial date and click event
    const openAddShiftForm = (
        date: Date | null = null,
        event?: React.MouseEvent,
        resourceId?: string,
        groupName?: string
    ) => {
        setNewEventFormDate(date);
        setDefaultResourceIdForForm(resourceId); // Set the resource ID for the form
        setGroupNameForOpenShift(groupName); // Set the group name for open shifts
        if (event) {
            setPopupCoords({ x: event.clientX, y: event.clientY });
        } else {
            setPopupCoords(null); // Reset if no click event (e.g., from "Add New Shift" button)
        }
        setIsFormOpen(true);
    };

    // Directly update currentWeekStart when a date is selected from the Calendar
    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setCurrentWeekStart(date);
            setIsDatePickerOpen(false); // Close popover after selection
        }
    };

    const addEvent = (newEvent: Omit<ShiftEvent, 'id'>) => {
        // Removed async
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
        // Removed async
        setShiftGroups((prevGroups) =>
            prevGroups.map((group) => (group.id === groupId ? { ...group, isExpanded: !group.isExpanded } : group))
        );
    };

    // Function to delete event from local state
    const deleteEvent = (eventId: string) => {
        // Removed async
        setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId));
    };

    // Generic navigation for previous/next based on current view
    const goToPrevious = () => {
        setCurrentWeekStart((prev) => {
            let newDate = new Date(prev);
            if (currentView === 'week') {
                newDate.setDate(prev.getDate() - 7);
            } else if (currentView === 'day') {
                newDate.setDate(prev.getDate() - 1);
            } else if (currentView === 'month' || currentView === 'month-detailed') {
                newDate = subMonths(newDate, 1);
            } else if (currentView === 'year') {
                newDate.setFullYear(prev.getFullYear() - 1);
            } else if (currentView === 'quarter' || currentView === 'quarter-detailed') {
                newDate = subQuarters(newDate, 1);
            }

            return newDate;
        });
    };

    const goToNext = () => {
        setCurrentWeekStart((prev) => {
            let newDate = new Date(prev);
            if (currentView === 'week') {
                newDate.setDate(prev.getDate() + 7);
            } else if (currentView === 'day') {
                newDate.setDate(prev.getDate() + 1);
            } else if (currentView === 'month' || currentView === 'month-detailed') {
                newDate = addMonths(newDate, 1);
            } else if (currentView === 'year') {
                newDate.setFullYear(prev.getFullYear() + 1);
            } else if (currentView === 'quarter' || currentView === 'quarter-detailed') {
                newDate = addQuarters(newDate, 1);
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
        toggleGroupExpansion,
        deleteEvent
        // Removed userId, isLoading
    };

    // Removed isLoading and error display logic

    return (
        <CalendarContext.Provider value={calendarContextValue}>
            <div className='min-h-screen bg-gray-100 p-4 font-sans text-gray-900 antialiased'>
                <style>
                    {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
          }
          /* Custom scrollbar for better visibility */
          ::-webkit-scrollbar {
            height: 8px;
            width: 8px;
          }
          ::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
          `}
                </style>
                <script src='https://cdn.tailwindcss.com'></script>

                <div className='mx-auto max-w-7xl py-6 sm:px-6 lg:px-8'>
                    <h1 className='mb-6 text-center text-3xl font-bold text-gray-900'>
                        Microsoft Shifts Clone (Dummy Data Only)
                    </h1>
                    {/* Removed userId display */}

                    <div className='mb-6 flex items-center justify-between'>
                        <div className='flex space-x-2'>
                            <Button onClick={goToPrevious} variant='outline'>
                                &larr; Previous{' '}
                                {currentView === 'week'
                                    ? 'Week'
                                    : currentView === 'day'
                                      ? 'Day'
                                      : currentView === 'month' || currentView === 'month-detailed'
                                        ? 'Month'
                                        : currentView === 'year'
                                          ? 'Year'
                                          : 'Quarter'}
                            </Button>
                            <Button onClick={goToNext} variant='outline'>
                                Next{' '}
                                {currentView === 'week'
                                    ? 'Week'
                                    : currentView === 'day'
                                      ? 'Day'
                                      : currentView === 'month' || currentView === 'month-detailed'
                                        ? 'Month'
                                        : currentView === 'year'
                                          ? 'Year'
                                          : 'Quarter'}{' '}
                                &rarr;
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
                                variant={currentView === 'month' ? 'default' : 'outline'}
                                onClick={() => setCurrentView('month')}>
                                Month
                            </Button>
                            <Button
                                variant={currentView === 'month-detailed' ? 'default' : 'outline'}
                                onClick={() => setCurrentView('month-detailed')}>
                                Month (Detailed)
                            </Button>
                            <Button
                                variant={currentView === 'quarter' ? 'default' : 'outline'}
                                onClick={() => setCurrentView('quarter')}>
                                Quarter
                            </Button>
                            <Button
                                variant={currentView === 'quarter-detailed' ? 'default' : 'outline'}
                                onClick={() => setCurrentView('quarter-detailed')}>
                                Quarter (Detailed)
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

                        <Button onClick={() => openAddShiftForm()}>Add New Shift</Button>
                    </div>

                    <MainCalendar
                        currentWeekStart={currentWeekStart}
                        currentView={currentView}
                        onCellClick={openAddShiftForm}
                    />
                </div>

                <ShiftForm
                    isOpen={isFormOpen}
                    onClose={() => setIsFormOpen(false)}
                    initialDate={newEventFormDate}
                    popupX={popupCoords?.x || null}
                    popupY={popupCoords?.y || null}
                    defaultResourceId={defaultResourceIdForForm}
                    groupNameForOpenShift={groupNameForOpenShift}
                />
            </div>
        </CalendarContext.Provider>
    );
};

export default AppCalendar;
