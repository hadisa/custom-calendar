"use client"; // This directive is crucial for client-side functionality in Next.js

import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO, getMonth, getYear, getQuarter, startOfQuarter, endOfQuarter, addQuarters, subQuarters } from 'date-fns';

// Import shadcn/ui components from the specified path
import { Button } from "@/registry/new-york-v4/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/new-york-v4/ui/popover";
import { Calendar } from "@/registry/new-york-v4/ui/calendar";

// Firebase Imports
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

// --- Utility for Tailwind CSS class merging (simplified clsx/tailwind-merge) ---
type ClassValue = string | boolean | null | undefined;
function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ');
}

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
  addEvent: (event: Omit<ShiftEvent, 'id'>) => Promise<void>; // Now async
  toggleGroupExpansion: (groupId: string) => Promise<void>; // Now async
  deleteEvent: (eventId: string) => Promise<void>; // Added delete event
  userId: string | null; // Expose userId
  isLoading: boolean; // Loading state for data fetching
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

  return Array.from({ length: 7 }).map((_, i) =>
    addDays(startOfWeekDate, i)
  );
};

const formatTime = (date: Date): string => {
  return format(date, 'hh:mm a'); // e.g., "09:00 AM"
};

const formatDateHeader = (date: Date): string => {
  return format(date, 'EEE d'); // e.g., "Mon 24"
};

// --- Components ---

const Event: React.FC<{ event: ShiftEvent; resourceColor: string; currentView: 'week' | 'day' | 'month-detailed' | 'quarter-detailed' }> = ({ event, resourceColor, currentView }) => {
  const startMinutes = event.start.getHours() * 60 + event.start.getMinutes();
  const endMinutes = event.end.getHours() * 60 + event.end.getMinutes();
  const durationMinutes = endMinutes - startMinutes;
  const { deleteEvent } = useCalendar(); // Get deleteEvent from context

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent cell click from firing
    if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
      await deleteEvent(event.id);
    }
  };

  if (currentView === 'day') {
    // Horizontal positioning for Day view
    const leftPosition = (startMinutes / (24 * 60)) * 100;
    const eventWidth = (durationMinutes / (24 * 60)) * 100;
    
return (
      <div
        className="absolute rounded-md p-1 text-xs font-medium text-white shadow-md z-10 group" // Added group for hover effects
        style={{
          backgroundColor: resourceColor,
          top: '2px', // Small offset from top
          height: 'calc(100% - 4px)', // Fill height
          left: `${leftPosition}%`,
          width: `${eventWidth}%`,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: '40px',
        }}
        title={`${event.title} (${formatTime(event.start)} - ${formatTime(event.end)})`}
      >
        {event.title}
        <span className="ml-1 text-gray-100 opacity-80">{formatTime(event.start)}</span>
        <button
          onClick={handleDelete}
          className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          title="Delete Event"
        >
          &times;
        </button>
      </div>
    );
  } else if (currentView === 'month-detailed' || currentView === 'quarter-detailed') {
    // Compact indicator for detailed month/quarter views
    return (
      <div
        className="relative rounded-sm px-1 py-0.5 text-xs font-medium text-white shadow-sm mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap group" // Added group
        style={{
          backgroundColor: resourceColor,
        }}
        title={`${event.title} (${formatTime(event.start)} - ${formatTime(event.end)})`}
      >
        {event.title}
        <button
          onClick={handleDelete}
          className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-3 h-3 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          title="Delete Event"
        >
          &times;
        </button>
      </div>
    );
  }
  else { // 'week' view - simple block stacking
    return (
      <div
        className="relative rounded-md p-1 text-xs font-medium text-white shadow-md mb-1 group" // Added group
        style={{
          backgroundColor: resourceColor,
          width: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={`${event.title} (${formatTime(event.start)} - ${formatTime(event.end)})`}
      >
        {event.title}
        <span className="ml-1 text-gray-100 opacity-80">{formatTime(event.end)}</span>
        <button
          onClick={handleDelete}
          className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          title="Delete Event"
        >
          &times;
        </button>
      </div>
    );
  }
};

/**
 * @component ResourceRow
 * Renders a single resource's row, displaying their name and events.
 */
const ResourceRow: React.FC<{ resource: Resource; daysInView: Date[]; currentView: 'week' | 'day' | 'month-detailed' | 'quarter-detailed'; onCellClick: (date: Date, event: React.MouseEvent) => void }> = ({ resource, daysInView, currentView, onCellClick }) => {
  const { events } = useCalendar();

  const resourceEvents = events.filter(
    (event) =>
      event.resourceId === resource.id &&
      daysInView.some((day) => isSameDay(day, event.start))
  );

  // For Day view, we need horizontal hourly grid lines
  const dayViewHourlyMarkers = Array.from({ length: 24 }).map((_, i) => i * 60);

  return (
    <div className="flex border-b border-gray-200 last:border-b-0">
      <div className="w-32 flex-shrink-0 p-3 bg-gray-50 flex items-center justify-center text-sm font-semibold text-gray-800 border-r border-gray-200">
        {resource.name}
      </div>
      <div className="flex flex-grow">
        {daysInView.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "relative border-r border-gray-200 last:border-r-0 cursor-pointer",
              currentView === 'day' ? 'flex-none' : 'flex-none' // flex-none for fixed width in all detailed views
            )}
            style={{
              height: '100px', // Fixed height for rows in all detailed views
              minHeight: '100px', // Min height for consistency
              width: currentView === 'day' ? `${DAY_VIEW_TOTAL_WIDTH_PX}px` : '120px', // Fixed width for day/month/quarter detailed days
              minWidth: currentView === 'day' ? `${DAY_VIEW_TOTAL_WIDTH_PX}px` : '120px',
              padding: '4px', // Add some padding inside the cell
            }}
            onClick={(e) => onCellClick(day, e)} // Pass the event object here
          >
            {currentView === 'day' && dayViewHourlyMarkers.map((minutes) => (
              <div
                key={`grid-day-${day.toISOString()}-${minutes}`}
                className={cn(
                  "absolute h-full border-r border-gray-100",
                  minutes % 60 === 0 ? "border-gray-200" : "border-gray-100" // Thicker line for full hours
                )}
                style={{ left: `${(minutes / (24 * 60)) * 100}%` }}
              ></div>
            ))}

            {/* Render events for this specific day and resource */}
            {resourceEvents
              .filter((event) => isSameDay(event.start, day))
              .map((event) => (
                <Event key={event.id} event={event} resourceColor={resource.color} currentView={currentView} />
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
const ShiftForm: React.FC<{ isOpen: boolean; onClose: () => void; initialDate: Date | null; popupX: number | null; popupY: number | null }> = ({ isOpen, onClose, initialDate, popupX, popupY }) => {
  const { resources, addEvent } = useCalendar();
  const [resourceId, setResourceId] = useState<string>(resources[0]?.id || '');
  const [title, setTitle] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [endTime, setEndTime] = useState<string>('17:00');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setResourceId(resources[0]?.id || '');
      setTitle('');
      const dateToUse = initialDate || new Date(); // Use initialDate if provided, else current date
      setStartDate(format(dateToUse, 'yyyy-MM-dd'));
      setStartTime('09:00'); // Default start time
      setEndDate(format(dateToUse, 'yyyy-MM-dd'));
      setEndTime('17:00'); // Default end time
      setErrorMessage('');
    }
  }, [isOpen, resources, initialDate]); // Add initialDate to dependencies

  useEffect(() => {
    if (isOpen && modalRef.current && popupX !== null && popupY !== null) {
      const modalElement = modalRef.current;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Get modal dimensions (after it's rendered)
      // Use clientWidth/clientHeight for current rendered dimensions
      const modalWidth = modalElement.offsetWidth;
      const modalHeight = modalElement.offsetHeight;

      // Calculate desired position
      let newLeft = popupX;
      let newTop = popupY;

      // Adjust if too close to right edge
      if (newLeft + modalWidth > viewportWidth - 20) { // 20px padding from right
        newLeft = viewportWidth - modalWidth - 20;
      }
      // Adjust if too close to bottom edge
      if (newTop + modalHeight > viewportHeight - 20) { // 20px padding from bottom
        newTop = viewportHeight - modalHeight - 20;
      }

      // Ensure it doesn't go off left/top edge
      if (newLeft < 20) newLeft = 20;
      if (newTop < 20) newTop = 20;

      modalElement.style.position = 'fixed'; // Ensure it's fixed for direct positioning
      modalElement.style.left = `${newLeft}px`;
      modalElement.style.top = `${newTop}px`;
      modalElement.style.transform = 'none'; // Remove any previous centering transform
    }
  }, [isOpen, popupX, popupY]); // Re-run when these change

  const handleSubmit = async (e: React.FormEvent) => {
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

    await addEvent({
      resourceId,
      title: title.trim(),
      start: startDateTime,
      end: endDateTime,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50"> {/* Backdrop */}
      <div ref={modalRef} className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md"> {/* Changed to relative positioning, will be fixed by JS */}
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Add New Shift</h2>
        <form onSubmit={handleSubmit}>
          {errorMessage && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{errorMessage}</span>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="resource" className="block text-gray-700 text-sm font-semibold mb-2">
              Resource:
            </label>
            <select
              id="resource"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
              required
            >
              {resources.map((res) => (
                <option key={res.id} value={res.id}>
                  {res.name} (Group: {resources.find(r => r.id === res.id)?.groupId || 'N/A'}) {/* Show group name for context */}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="title" className="block text-gray-700 text-sm font-semibold mb-2">
              Shift Title:
            </label>
            <input
              type="text"
              id="title"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Morning Shift, Meeting"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="startDate" className="block text-gray-700 text-sm font-semibold mb-2">
                Start Date:
              </label>
              <input
                type="date"
                id="startDate"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="startTime" className="block text-gray-700 text-sm font-semibold mb-2">
                Start Time:
              </label>
              <input
                type="time"
                id="startTime"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label htmlFor="endDate" className="block text-gray-700 text-sm font-semibold mb-2">
                End Date:
              </label>
              <input
                type="date"
                id="endDate"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="endTime" className="mb-2 block text-sm font-semibold text-gray-700">
                End Time:
              </label>
              <input
                type="time"
                id="endTime"
                className="w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
            >
              Add Shift
            </Button>
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
const MainCalendar: React.FC<{ currentWeekStart: Date; currentView: 'week' | 'day' | 'year' | 'quarter' | 'month' | 'month-detailed' | 'quarter-detailed'; onCellClick: (date: Date, event: React.MouseEvent) => void }> = ({ currentWeekStart, currentView, onCellClick }) => {
  const { shiftGroups, resources, toggleGroupExpansion, events } = useCalendar(); // Destructure events here

  // Determine which days/columns to display based on the current view
  let columnsToDisplay: Date[] = [];
  let headerColumns: { label: string; key: string }[] = []; // For day view hours

  if (currentView === 'week') {
    columnsToDisplay = getDaysInWeek(currentWeekStart);
  } else if (currentView === 'day') {
    columnsToDisplay = [currentWeekStart]; // Single day for the column
    headerColumns = Array.from({ length: 24 }).map((_, i) => ({
      label: format(new Date(2000, 0, 1, i), 'ha').toLowerCase(), // e.g., 12am, 1am
      key: `hour-header-${i}`
    }));
  } else if (currentView === 'month' || currentView === 'month-detailed') {
    const startOfCurrentMonth = startOfMonth(currentWeekStart);
    const endOfCurrentMonth = endOfMonth(currentWeekStart);
    const startDay = startOfWeek(startOfCurrentMonth, { weekStartsOn: 0 }); // Start from Sunday of the first week
    const endDay = endOfWeek(endOfCurrentMonth, { weekStartsOn: 0 }); // End on Saturday of the last week

    let currentDay = startDay;
    while (currentDay <= endDay) {
      columnsToDisplay.push(currentDay);
      currentDay = addDays(currentDay, 1);
    }
  } else if (currentView === 'quarter-detailed') {
    const startOfCurrentQuarter = startOfQuarter(currentWeekStart);
    const endOfCurrentQuarter = endOfQuarter(currentWeekStart);
    const startDay = startOfWeek(startOfCurrentQuarter, { weekStartsOn: 0 });
    const endDay = endOfWeek(endOfCurrentQuarter, { weekStartsOn: 0 });

    let currentDay = startDay;
    while (currentDay <= endDay) {
      columnsToDisplay.push(currentDay);
      currentDay = addDays(currentDay, 1);
    }
  }


  // Render different layouts based on currentView
  if (currentView === 'year') {
    const months = Array.from({ length: 12 }).map((_, i) => new Date(currentWeekStart.getFullYear(), i, 1));
    
return (
      <div className="flex flex-col border border-gray-300 rounded-lg shadow-md overflow-hidden bg-white p-4">
        <h2 className="text-2xl font-bold text-center mb-4">{currentWeekStart.getFullYear()} Year View</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {months.map((monthDate) => (
            <div key={monthDate.toISOString()} className="border rounded-lg p-4 bg-gray-50 text-center">
              <h3 className="font-semibold text-lg mb-2">{format(monthDate, 'MMMM')}</h3>
              {/* Placeholder for month summary - can be expanded later */}
              <p className="text-sm text-gray-600">Events: {events.filter(e => getMonth(e.start) === getMonth(monthDate) && getYear(e.start) === getYear(monthDate)).length}</p>
            </div>
          ))}
        </div>
      </div>
    );
  } else if (currentView === 'quarter') {
    const currentQuarter = getQuarter(currentWeekStart);
    const startOfCurrentQuarter = startOfQuarter(currentWeekStart);
    const endOfCurrentQuarter = endOfQuarter(currentWeekStart);

    const monthsInQuarter = Array.from({ length: 3 }).map((_, i) => addMonths(startOfCurrentQuarter, i));

    return (
      <div className="flex flex-col border border-gray-300 rounded-lg shadow-md overflow-hidden bg-white p-4">
        <h2 className="text-2xl font-bold text-center mb-4">
          {format(startOfCurrentQuarter, 'MMM d')} - {format(endOfCurrentQuarter, 'MMM d,yyyy')} Quarter View
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {monthsInQuarter.map((monthDate) => (
            <div key={monthDate.toISOString()} className="border rounded-lg p-4 bg-gray-50 text-center">
              <h3 className="font-semibold text-lg mb-2">{format(monthDate, 'MMMM')}</h3>
              <p className="text-sm text-gray-600">Events: {events.filter(e => getMonth(e.start) === getMonth(monthDate) && getYear(e.start) === getYear(monthDate)).length}</p>
            </div>
          ))}
        </div>
      </div>
    );
  } else if (currentView === 'month') { // Summary Month view
    const startOfCurrentMonth = startOfMonth(currentWeekStart);
    const endOfCurrentMonth = endOfMonth(currentWeekStart);
    const startDay = startOfWeek(startOfCurrentMonth, { weekStartsOn: 0 }); // Start from Sunday of the first week
    const endDay = endOfWeek(endOfCurrentMonth, { weekStartsOn: 0 }); // End on Saturday of the last week

    let currentDay = startDay;
    const allDaysInMonthView: Date[] = [];
    while (currentDay <= endDay) {
      allDaysInMonthView.push(currentDay);
      currentDay = addDays(currentDay, 1);
    }

    const daysOfWeekHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
      <div className="flex flex-col border border-gray-300 rounded-lg shadow-md overflow-hidden bg-white p-4">
        <h2 className="text-2xl font-bold text-center mb-4">{format(currentWeekStart, 'MMMM,yyyy')} Month View</h2>
        <div className="grid grid-cols-7 text-center font-semibold text-gray-600 mb-2">
          {daysOfWeekHeaders.map(day => <div key={day}>{day}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {allDaysInMonthView.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "border rounded-md p-2 h-24 flex flex-col items-center justify-start",
                isSameMonth(day, currentWeekStart) ? "bg-gray-50" : "bg-gray-100 text-gray-400"
              )}
            >
              <span className="text-sm font-medium">{format(day, 'd')}</span>
              <p className="text-xs text-gray-600 mt-1">Events: {events.filter(e => isSameDay(e.start, day)).length}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default rendering for 'week', 'day', 'month-detailed', and 'quarter-detailed' views
  return (
    <div className="flex flex-col border border-gray-300 rounded-lg shadow-md overflow-hidden bg-white">
      {/* Calendar Header: Groups/Resources, and Days/Hours */}
      <div className="flex border-b border-gray-200 bg-gray-100">
        <div className="w-32 flex-shrink-0 p-3 text-sm font-semibold text-gray-600 border-r border-gray-200">
          Groups/Resources
        </div>
        {/* Render "24 Hrs" header for 'day' view */}
        {currentView === 'day' && (
          <div className="w-16 flex-shrink-0 p-3 text-center text-sm font-semibold text-gray-600 border-r border-gray-200">
            24 Hrs
          </div>
        )}
        {/* Render hours for 'day' view, or dates for 'week'/'month-detailed'/'quarter-detailed' view */}
        {currentView === 'day' ? (
          <div className="flex flex-grow" style={{ minWidth: `${DAY_VIEW_TOTAL_WIDTH_PX}px` }}>
            {headerColumns.map((col) => (
              <div
                key={col.key}
                className="flex-none p-3 text-center text-xs font-semibold text-gray-600 border-r border-gray-200"
                style={{ width: `${DAY_VIEW_HOUR_WIDTH_PX}px` }} // Fixed width for each hour column
              >
                {col.label}
              </div>
            ))}
          </div>
        ) : (
          (columnsToDisplay as Date[]).map((day) => (
            <div
              key={day.toISOString()}
              className="flex-1 p-3 text-center text-sm font-semibold text-gray-600 border-r border-gray-200"
            >
              {formatDateHeader(day)}
            </div>
          ))
        )}
      </div>

      {/* Calendar Body: Shift Groups and Resource Rows */}
      <div className="flex-grow overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
        <div className="flex">
          {/* Main Calendar Content Area */}
          <div className="flex-grow overflow-x-auto"> {/* This will handle horizontal scrolling for day/week views */}
            {shiftGroups.map((group) => (
              <div key={group.id} className="mb-2 last:mb-0">
                {/* Group Header Row */}
                <div
                  className="flex bg-gray-200 border-b border-t border-gray-300 cursor-pointer hover:bg-gray-300 transition duration-150 ease-in-out"
                  onClick={() => toggleGroupExpansion(group.id)}
                >
                  <div className="w-32 flex-shrink-0 p-3 text-sm font-bold text-gray-900 border-r border-gray-300 flex items-center justify-between">
                    <span>{group.name}</span>
                    {/* Arrow icon for expand/collapse */}
                    <svg
                      className={`w-4 h-4 text-gray-700 transform transition-transform duration-200 ${
                        group.isExpanded ? 'rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                  {/* Conditional empty cell for '24 Hrs' column in Day view */}
                  {currentView === 'day' && (
                    <div className="w-16 flex-shrink-0 border-r border-gray-300"></div>
                  )}
                  <div className="flex-grow p-3 text-sm font-semibold text-gray-600">
                    {/* Empty cell for group header spanning days/hours */}
                  </div>
                </div>

                {/* Resources belonging to this group - conditionally rendered */}
                {group.isExpanded && (
                  <div className="transition-all duration-300 ease-in-out overflow-hidden">
                    {resources
                      .filter((res) => res.groupId === group.id)
                      .map((resource) => (
                        <ResourceRow
                          key={resource.id}
                          resource={resource}
                          daysInView={currentView === 'day' ? [currentWeekStart] : (columnsToDisplay as Date[])}
                          currentView={currentView}
                          onCellClick={onCellClick} // Pass the click handler
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
    { id: 'group-support', name: 'Customer Support', isExpanded: true },
  ]);

  const [resources, setResources] = useState<Resource[]>([
    { id: 'res-1', name: 'Alice Johnson', color: '#EF4444', groupId: 'group-ops' },
    { id: 'res-2', name: 'Bob Williams', color: '#3B82F6', groupId: 'group-ops' },
    { id: 'res-3', name: 'Charlie Brown', color: '#10B981', groupId: 'group-sales' },
    { id: 'res-4', name: 'Diana Prince', color: '#F59E0B', groupId: 'group-sales' },
    { id: 'res-5', name: 'Eve Davis', color: '#6366F1', groupId: 'group-support' },
  ]);

  const [events, setEvents] = useState<ShiftEvent[]>([
    {
      id: 'evt-1',
      resourceId: 'res-1',
      title: 'Morning Shift',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0, 0),
    },
    {
      id: 'evt-2',
      resourceId: 'res-2',
      title: 'Afternoon Shift',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0, 0),
    },
    {
      id: 'evt-3',
      resourceId: 'res-1',
      title: 'Team Meeting',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 9, 0, 0), // Tomorrow
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 11, 0, 0),
    },
    {
      id: 'evt-4',
      resourceId: 'res-3',
      title: 'Client Call',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 10, 0, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 12, 0, 0),
    },
    {
      id: 'evt-5',
      resourceId: 'res-5',
      title: 'Support Desk',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 10, 0, 0), // Yesterday
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 18, 0, 0),
    },
  ]);

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(today); // Initialize with deterministic date
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'week' | 'day' | 'year' | 'quarter' | 'month' | 'month-detailed' | 'quarter-detailed'>('week'); // Added 'quarter-detailed' to view options

  // State to hold the date for the new event form and popup coordinates
  const [newEventFormDate, setNewEventFormDate] = useState<Date | null>(null);
  const [popupCoords, setPopupCoords] = useState<{ x: number; y: number } | null>(null);

  // Firebase state
  const [db, setDb] = useState<any>(null);
  const [auth, setAuth] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize Firebase and set up auth listener
  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const firebaseAuth = getAuth(app);

        setDb(firestore);
        setAuth(firebaseAuth);

        // Sign in anonymously or with custom token
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(firebaseAuth, __initial_auth_token);
        } else {
          await signInAnonymously(firebaseAuth);
        }

        onAuthStateChanged(firebaseAuth, (user) => {
          if (user) {
            setUserId(user.uid);
            setIsLoading(false);
          } else {
            setUserId(null);
            setIsLoading(false);
          }
        });
      } catch (err: any) {
        console.error("Firebase initialization error:", err);
        setError(`Failed to initialize Firebase: ${err.message}`);
        setIsLoading(false);
      }
    };

    initializeFirebase();
  }, []); // Run only once on component mount

  // Fetch data from Firestore in real-time
  useEffect(() => {
    if (!db || !userId) return;

    const fetchShiftGroups = () => {
      const q = query(collection(db, `artifacts/${__app_id}/users/${userId}/shiftGroups`));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const groups: ShiftGroup[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<ShiftGroup, 'id'>
        }));
        setShiftGroups(groups);
      }, (err) => {
        console.error("Error fetching shift groups:", err);
        setError(`Failed to fetch groups: ${err.message}`);
      });
      
return unsubscribe;
    };

    const fetchResources = () => {
      const q = query(collection(db, `artifacts/${__app_id}/users/${userId}/resources`));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const resourcesData: Resource[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as Omit<Resource, 'id'>
        }));
        setResources(resourcesData);
      }, (err) => {
        console.error("Error fetching resources:", err);
        setError(`Failed to fetch resources: ${err.message}`);
      });
      
return unsubscribe;
    };

    const fetchEvents = () => {
      const q = query(collection(db, `artifacts/${__app_id}/users/${userId}/events`));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const eventsData: ShiftEvent[] = snapshot.docs.map(doc => ({
          id: doc.id,
          title: doc.data().title,
          resourceId: doc.data().resourceId,
          start: doc.data().start.toDate(), // Convert Firestore Timestamp to Date
          end: doc.data().end.toDate(),     // Convert Firestore Timestamp to Date
        }));
        setEvents(eventsData);
      }, (err) => {
        console.error("Error fetching events:", err);
        setError(`Failed to fetch events: ${err.message}`);
      });
      
return unsubscribe;
    };

    // Run initial data population if collections are empty (first run)
    const populateInitialData = async () => {
      const groupsCollection = collection(db, `artifacts/${__app_id}/users/${userId}/shiftGroups`);
      const groupsSnapshot = await getDocs(groupsCollection);
      if (groupsSnapshot.empty) {
        console.log("Populating initial data...");
        const batch = writeBatch(db);

        const group1Ref = doc(groupsCollection, 'group-ops');
        batch.set(group1Ref, { name: 'Operations Team', isExpanded: true });
        const group2Ref = doc(groupsCollection, 'group-sales');
        batch.set(group2Ref, { name: 'Sales Department', isExpanded: true });
        const group3Ref = doc(groupsCollection, 'group-support');
        batch.set(group3Ref, { name: 'Customer Support', isExpanded: true });

        const resourcesCollection = collection(db, `artifacts/${__app_id}/users/${userId}/resources`);
        batch.set(doc(resourcesCollection, 'res-1'), { name: 'Alice Johnson', color: '#EF4444', groupId: 'group-ops' });
        batch.set(doc(resourcesCollection, 'res-2'), { name: 'Bob Williams', color: '#3B82F6', groupId: 'group-ops' });
        batch.set(doc(resourcesCollection, 'res-3'), { name: 'Charlie Brown', color: '#10B981', groupId: 'group-sales' });
        batch.set(doc(resourcesCollection, 'res-4'), { name: 'Diana Prince', color: '#F59E0B', groupId: 'group-sales' });
        batch.set(doc(resourcesCollection, 'res-5'), { name: 'Eve Davis', color: '#6366F1', groupId: 'group-support' });

        const eventsCollection = collection(db, `artifacts/${__app_id}/users/${userId}/events`);
        const todayForInit = new Date(2025, 4, 26, 0, 0, 0); // May 26, 2025, 00:00:00
        batch.set(doc(eventsCollection, 'evt-1'), { resourceId: 'res-1', title: 'Morning Shift', start: new Date(todayForInit.getFullYear(), todayForInit.getMonth(), todayForInit.getDate(), 9, 0, 0), end: new Date(todayForInit.getFullYear(), todayForInit.getMonth(), todayForInit.getDate(), 13, 0, 0) });
        batch.set(doc(eventsCollection, 'evt-2'), { resourceId: 'res-2', title: 'Afternoon Shift', start: new Date(todayForInit.getFullYear(), todayForInit.getMonth(), todayForInit.getDate(), 13, 0, 0), end: new Date(todayForInit.getFullYear(), todayForInit.getMonth(), todayForInit.getDate(), 17, 0, 0) });
        batch.set(doc(eventsCollection, 'evt-3'), { resourceId: 'res-1', title: 'Team Meeting', start: new Date(todayForInit.getFullYear(), todayForInit.getMonth(), todayForInit.getDate() + 1, 9, 0, 0), end: new Date(todayForInit.getFullYear(), todayForInit.getMonth(), todayForInit.getDate() + 1, 11, 0, 0) });
        batch.set(doc(eventsCollection, 'evt-4'), { resourceId: 'res-3', title: 'Client Call', start: new Date(todayForInit.getFullYear(), todayForInit.getMonth(), todayForInit.getDate() + 2, 10, 0, 0), end: new Date(todayForInit.getFullYear(), todayForInit.getMonth(), todayForInit.getDate() + 2, 12, 0, 0) });
        batch.set(doc(eventsCollection, 'evt-5'), { resourceId: 'res-5', title: 'Support Desk', start: new Date(todayForInit.getFullYear(), todayForInit.getMonth(), todayForInit.getDate() - 1, 10, 0, 0), end: new Date(todayForInit.getFullYear(), todayForInit.getMonth(), todayForInit.getDate() - 1, 18, 0, 0) });

        await batch.commit();
        console.log("Initial data populated.");
      }
    };

    populateInitialData(); // Call this to ensure data exists

    const unsubscribeGroups = fetchShiftGroups();
    const unsubscribeResources = fetchResources();
    const unsubscribeEvents = fetchEvents();

    return () => {
      unsubscribeGroups();
      unsubscribeResources();
      unsubscribeEvents();
    };
  }, [db, userId]); // Re-run when db or userId changes

  // Function to add event to Firestore
  const addEvent = async (newEvent: Omit<ShiftEvent, 'id'>) => {
    if (!db || !userId) {
      setError("Database not ready or user not authenticated.");
      
return;
    }
    try {
      await addDoc(collection(db, `artifacts/${__app_id}/users/${userId}/events`), {
        ...newEvent,
        start: newEvent.start, // Firestore handles Date objects
        end: newEvent.end,
      });
    } catch (e: any) {
      console.error("Error adding document: ", e);
      setError(`Failed to add event: ${e.message}`);
    }
  };

  // Function to delete event from Firestore
  const deleteEvent = async (eventId: string) => {
    if (!db || !userId) {
      setError("Database not ready or user not authenticated.");
      
return;
    }
    try {
      await deleteDoc(doc(db, `artifacts/${__app_id}/users/${userId}/events`, eventId));
    } catch (e: any) {
      console.error("Error deleting document: ", e);
      setError(`Failed to delete event: ${e.message}`);
    }
  };

  // Function to toggle group expansion in Firestore
  const toggleGroupExpansion = async (groupId: string) => {
    if (!db || !userId) {
      setError("Database not ready or user not authenticated.");
      
return;
    }
    const groupRef = doc(db, `artifacts/${__app_id}/users/${userId}/shiftGroups`, groupId);
    const currentGroup = shiftGroups.find(g => g.id === groupId);
    if (currentGroup) {
      try {
        await updateDoc(groupRef, {
          isExpanded: !currentGroup.isExpanded,
        });
      } catch (e: any) {
        console.error("Error updating group expansion: ", e);
        setError(`Failed to update group: ${e.message}`);
      }
    }
  };

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date(2025, 4, 26, 0, 0, 0)); // Initialize with deterministic date
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'week' | 'day' | 'year' | 'quarter' | 'month' | 'month-detailed' | 'quarter-detailed'>('week');

  // State to hold the date for the new event form and popup coordinates
  const [newEventFormDate, setNewEventFormDate] = useState<Date | null>(null);
  const [popupCoords, setPopupCoords] = useState<{ x: number; y: number } | null>(null);


  // Function to open the add shift form, optionally with an initial date and click event
  const openAddShiftForm = (date: Date | null = null, event?: React.MouseEvent) => {
    setNewEventFormDate(date);
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
    deleteEvent, // Provide deleteEvent
    userId,
    isLoading,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 text-gray-700">
        Loading application data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 text-red-800 p-4">
        <p className="font-bold text-lg">Error:</p>
        <p>{error}</p>
        <p className="mt-4 text-sm">Please ensure Firebase is correctly configured and accessible.</p>
      </div>
    );
  }

  return (
    <CalendarContext.Provider value={calendarContextValue}>
      <div className="min-h-screen bg-gray-100 p-4 font-sans antialiased text-gray-900">
        <style>
          {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          body {
            font-family: 'Inter', sans-serif;
          }
          `}
        </style>
        <script src="https://cdn.tailwindcss.com"></script>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Microsoft Shifts Clone (Firebase Enabled)
          </h1>
          {userId && (
            <p className="text-sm text-gray-600 text-center mb-4">
              Logged in as User ID: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{userId}</span>
            </p>
          )}

          <div className="flex justify-between items-center mb-6">
            <div className="flex space-x-2">
              <Button onClick={goToPrevious} variant="outline">
                &larr; Previous {currentView === 'week' ? 'Week' : currentView === 'day' ? 'Day' : currentView === 'month' || currentView === 'month-detailed' ? 'Month' : currentView === 'year' ? 'Year' : 'Quarter'}
              </Button>
              <Button onClick={goToNext} variant="outline">
                Next {currentView === 'week' ? 'Week' : currentView === 'day' ? 'Day' : currentView === 'month' || currentView === 'month-detailed' ? 'Month' : currentView === 'year' ? 'Year' : 'Quarter'} &rarr;
              </Button>
            </div>

            {/* View Selection Buttons */}
            <div className="flex space-x-2">
              <Button
                variant={currentView === 'day' ? 'default' : 'outline'}
                onClick={() => setCurrentView('day')}
              >
                Day
              </Button>
              <Button
                variant={currentView === 'week' ? 'default' : 'outline'}
                onClick={() => setCurrentView('week')}
              >
                Week
              </Button>
              <Button
                variant={currentView === 'month' ? 'default' : 'outline'}
                onClick={() => setCurrentView('month')}
              >
                Month
              </Button>
              <Button
                variant={currentView === 'month-detailed' ? 'default' : 'outline'}
                onClick={() => setCurrentView('month-detailed')}
              >
                Month (Detailed)
              </Button>
              <Button
                variant={currentView === 'quarter' ? 'default' : 'outline'}
                onClick={() => setCurrentView('quarter')}
              >
                Quarter
              </Button>
              <Button
                variant={currentView === 'quarter-detailed' ? 'default' : 'outline'}
                onClick={() => setCurrentView('quarter-detailed')}
              >
                Quarter (Detailed)
              </Button>
              <Button
                variant={currentView === 'year' ? 'default' : 'outline'}
                onClick={() => setCurrentView('year')}
              >
                Year
              </Button>
            </div>

            {/* Date Picker using shadcn/ui components */}
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal"
                  )}
                >
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
                    className="mr-2 h-4 w-4"
                  >
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
                    <line x1="16" x2="16" y1="2" y2="6"></line>
                    <line x1="8" x2="8" y1="2" y2="6"></line>
                    <line x1="3" x2="21" y1="10" y2="10"></line>
                  </svg>
                  {currentWeekStart ? format(currentWeekStart, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={currentWeekStart} // Calendar now directly uses currentWeekStart
                  onSelect={handleDateSelect} // Updates currentWeekStart and closes popover
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button onClick={() => openAddShiftForm()}>
              Add New Shift
            </Button>
          </div>

          <MainCalendar currentWeekStart={currentWeekStart} currentView={currentView} onCellClick={openAddShiftForm} />
        </div>

        <ShiftForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} initialDate={newEventFormDate} popupX={popupCoords?.x || null} popupY={popupCoords?.y || null} />
      </div>
    </CalendarContext.Provider>
  );
};

export default App;
