'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
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

const AppCalendar: React.FC = () => {
  const today = new Date(2025, 4, 26, 0, 0, 0);
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
    { id: 'res-5', name: 'Eve Davis', color: '#6366F1', groupId: 'group-support' },
    { id: 'open-shift-resource-id', name: 'Open Shifts', color: '#9CA3AF', groupId: 'N/A' }
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
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 9, 0, 0),
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
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 10, 0, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 18, 0, 0)
    },
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

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(today);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [currentView, setCurrentView] = useState<
    'week' | 'day' | 'year' | 'quarter' | 'month' | 'month-detailed' | 'quarter-detailed'
  >('week');

  const [newEventFormDate, setNewEventFormDate] = useState<Date | null>(null);
  const [popupCoords, setPopupCoords] = useState<{ x: number; y: number } | null>(null);
  const [defaultResourceIdForForm, setDefaultResourceIdForForm] = useState<string | undefined>(undefined);
  const [groupNameForOpenShift, setGroupNameForOpenShift] = useState<string | undefined>(undefined);

  const openAddShiftForm = (
    date: Date | null = null,
    event?: React.MouseEvent,
    resourceId?: string,
    groupName?: string
  ) => {
    setNewEventFormDate(date);
    setDefaultResourceIdForForm(resourceId);
    setGroupNameForOpenShift(groupName);
    if (event) {
      setPopupCoords({ x: event.clientX, y: event.clientY });
    } else {
      setPopupCoords(null);
    }
    setIsFormOpen(true);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentWeekStart(date);
      setIsDatePickerOpen(false);
    }
  };

  const addEvent = (newEvent: Omit<ShiftEvent, 'id'>) => {
    setEvents((prevEvents) => [
      ...prevEvents,
      { ...newEvent, id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }
    ]);
  };

  const toggleGroupExpansion = (groupId: string) => {
    setShiftGroups((prevGroups) =>
      prevGroups.map((group) => (group.id === groupId ? { ...group, isExpanded: !group.isExpanded } : group))
    );
  };

  const deleteEvent = (eventId: string) => {
    setEvents((prevEvents) => prevEvents.filter((event) => event.id !== eventId));
  };

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

  const calendarContextValue: CalendarContextType = {
    shiftGroups,
    resources,
    events,
    addEvent,
    toggleGroupExpansion,
    deleteEvent
  };

  return (
    <CalendarContext.Provider value={calendarContextValue}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 font-sans text-gray-900 antialiased">
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            body {
              font-family: 'Inter', sans-serif;
            }
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

        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <h1 className="text-3xl font-bold text-gray-800">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Shift Scheduler
                </span>
              </h1>
              
              <div className="flex items-center gap-3">
                <Button 
                  onClick={goToPrevious} 
                  variant="outline" 
                  className="h-9 w-9 p-0 hover:bg-gray-100"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </Button>
                
                <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 w-[240px] justify-center text-center font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentWeekStart ? format(currentWeekStart, 'MMMM d, yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={currentWeekStart}
                      onSelect={handleDateSelect}
                      initialFocus
                      className="rounded-md border shadow-md"
                    />
                  </PopoverContent>
                </Popover>
                
                <Button 
                  onClick={goToNext} 
                  variant="outline" 
                  className="h-9 w-9 p-0 hover:bg-gray-100"
                >
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <Button 
                onClick={() => openAddShiftForm()} 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Shift
              </Button>
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {[
                { value: 'day', label: 'Day' },
                { value: 'week', label: 'Week' },
                { value: 'month', label: 'Month' },
                { value: 'month-detailed', label: 'Month Detailed' },
                { value: 'quarter', label: 'Quarter' },
                { value: 'quarter-detailed', label: 'Quarter Detailed' },
                { value: 'year', label: 'Year' }
              ].map((view) => (
                <Button
                  key={view.value}
                  variant={currentView === view.value ? 'default' : 'outline'}
                  onClick={() => setCurrentView(view.value as any)}
                  className="h-8 rounded-md px-3 text-sm font-medium"
                >
                  {view.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <MainCalendar
              currentWeekStart={currentWeekStart}
              currentView={currentView}
              onCellClick={openAddShiftForm}
            />
          </div>
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

// Icon components for better UI
const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
    <line x1="16" x2="16" y1="2" y2="6" />
    <line x1="8" x2="8" y1="2" y2="6" />
    <line x1="3" x2="21" y1="10" y2="10" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </svg>
);

export default AppCalendar;