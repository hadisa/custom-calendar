"use client"; // This directive is crucial for client-side functionality in Next.js

import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO, getMonth, getYear, getQuarter, startOfQuarter, endOfQuarter, addQuarters, subQuarters } from 'date-fns';

// Import shadcn/ui components from the specified path
import { Button } from "@/registry/new-york-v4/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/registry/new-york-v4/ui/popover";
import { Calendar } from "@/registry/new-york-v4/ui/calendar";

// --- Utility for Tailwind CSS class merging (simplified clsx/tailwind-merge) ---
type ClassValue = string | boolean | null | undefined;
function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ');
}

// --- Global Constants for Calendar Layout ---
const DAY_VIEW_HOUR_WIDTH_PX = 50; // Width of each hour column in Day view
const DAY_VIEW_TOTAL_WIDTH_PX = 24 * DAY_VIEW_HOUR_WIDTH_PX; // Total width of the 24-hour timeline in Day view
const DEFAULT_DAY_COLUMN_MIN_WIDTH_PX = 120; // Default minimum width for day columns in week/month/quarter detailed views

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
  addEvent: (event: Omit<ShiftEvent, 'id'>) => void; // Reverted to sync
  toggleGroupExpansion: (groupId: string) => void; // Reverted to sync
  deleteEvent: (eventId: string) => void; // Reverted to sync
  // Removed userId, isLoading
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

const Event: React.FC<{ event: ShiftEvent; resourceColor: string; currentView: 'week' | 'day' | 'month-detailed' | 'quarter-detailed' | 'year-detailed' }> = ({ event, resourceColor, currentView }) => {
  const startMinutes = event.start.getHours() * 60 + event.start.getMinutes();
  const endMinutes = event.end.getHours() * 60 + event.end.getMinutes();
  const durationMinutes = endMinutes - startMinutes;
  const { deleteEvent } = useCalendar(); // Get deleteEvent from context

  const handleDelete = (e: React.MouseEvent) => { // Removed async
    e.stopPropagation(); // Prevent cell click from firing
    if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
      deleteEvent(event.id); // Removed await
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
        <button
          onClick={handleDelete}
          className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          title="Delete Event"
        >
          &times;
        </button>
      </div>
    );
  } else if (currentView === 'month-detailed' || currentView === 'quarter-detailed' || currentView === 'year-detailed') {
    // Compact indicator for detailed month/quarter/year views
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
        className="relative rounded-md p-1 text-xs font-medium text-white shadow-sm mb-1 group" // Added group
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
const ResourceRow: React.FC<{ resource: Resource; daysInView: Date[]; currentView: 'week' | 'day' | 'month-detailed' | 'quarter-detailed'; onCellClick: (date: Date, event: React.MouseEvent, resourceId?: string, groupName?: string) => void }> = ({ resource, daysInView, currentView, onCellClick }) => {
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
      {/* This flex-grow div will contain the horizontally scrolling content */}
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
              width: currentView === 'day' ? `${DAY_VIEW_TOTAL_WIDTH_PX}px` : `${DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px`, // Fixed width for day/week/month/quarter detailed days
              minWidth: currentView === 'day' ? `${DAY_VIEW_TOTAL_WIDTH_PX}px` : `${DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px`,
              padding: '4px', // Add some padding inside the cell
            }}
            onClick={(e) => onCellClick(day, e, resource.id)} // Pass the event object and resource.id here
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
 * @component DailyNotesRow
 * Renders a row for daily notes, spanning across the displayed days/hours.
 */
const DailyNotesRow: React.FC<{ daysInView: Date[]; currentView: 'week' | 'day' | 'month-detailed' | 'quarter-detailed'; onCellClick: (date: Date, event: React.MouseEvent, resourceId?: string, groupName?: string) => void }> = ({ daysInView, currentView, onCellClick }) => {
  // Placeholder for daily notes data - you might fetch this from state/context later
  const dailyNotes: { [key: string]: string } = {
    [format(new Date(2025, 4, 26), 'yyyy-MM-dd')]: 'Team meeting at 10 AM',
    [format(new Date(2025, 4, 27), 'yyyy-MM-dd')]: 'Client demo prep',
  };

  return (
    <div className="flex border-b border-gray-200 bg-gray-50">
      <div className="w-32 flex-shrink-0 p-3 text-sm font-semibold text-gray-800 border-r border-gray-200">
        Daily Notes
      </div>
      {currentView === 'day' && (
        <div className="w-16 flex-shrink-0 p-3 text-center text-sm font-semibold text-gray-600 border-r border-gray-200">
          {/* Empty cell to align with 24 Hrs header */}
        </div>
      )}
      <div className="flex flex-grow">
        {daysInView.map((day) => (
          <div
            key={`daily-note-${day.toISOString()}`}
            className={cn(
              "relative border-r border-gray-200 last:border-r-0 p-2 text-xs text-gray-700 overflow-hidden cursor-pointer",
              currentView === 'day' ? 'flex-none' : 'flex-none' // flex-none for day, flex-none for week/detailed
            )}
            style={{
              height: '50px', // Fixed height for daily notes row
              minHeight: '50px',
              width: currentView === 'day' ? `${DAY_VIEW_TOTAL_WIDTH_PX}px` : `${DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px`, // Fixed width for day/week/month/quarter detailed days
              minWidth: currentView === 'day' ? `${DAY_VIEW_TOTAL_WIDTH_PX}px` : `${DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px`,
            }}
            onClick={(e) => onCellClick(day, e)}
          >
            {/* Placeholder for daily notes content */}
            {dailyNotes[format(day, 'yyyy-MM-dd')] || ''}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * @component OpenShiftsRow
 * Renders a row for open shifts for a specific group.
 */
const OpenShiftsRow: React.FC<{ group: ShiftGroup; daysInView: Date[]; currentView: 'week' | 'day' | 'month-detailed' | 'quarter-detailed'; onCellClick: (date: Date, event: React.MouseEvent, resourceId?: string, groupName?: string) => void }> = ({ group, daysInView, currentView, onCellClick }) => {
  const { events, resources } = useCalendar();
  const openShiftResourceId = resources.find(res => res.name === 'Open Shifts')?.id || 'open-shift-resource-id';
  const openShiftColor = resources.find(res => res.name === 'Open Shifts')?.color || '#9CA3AF'; // Default gray

  const openShiftsForGroupAndDay = (day: Date) => {
    return events.filter(event =>
      isSameDay(event.start, day) &&
      event.resourceId === openShiftResourceId &&
      event.title.startsWith(`Open Shift for ${group.name}`) // Filter by group name for dummy data
    );
  };

  return (
    <div className="flex border-b border-gray-200 bg-gray-50">
      <div className="w-32 flex-shrink-0 p-3 text-sm font-semibold text-gray-800 border-r border-gray-200">
        Open shifts
      </div>
      {currentView === 'day' && (
        <div className="w-16 flex-shrink-0 p-3 text-center text-sm font-semibold text-gray-600 border-r border-gray-200">
          {/* Empty cell to align with 24 Hrs header */}
        </div>
      )}
      <div className="flex flex-grow">
        {daysInView.map((day) => (
          <div
            key={`open-shift-${group.id}-${day.toISOString()}`}
            className={cn(
              "relative border-r border-gray-200 last:border-r-0 p-2 text-xs text-gray-700 overflow-hidden cursor-pointer",
              currentView === 'day' ? 'flex-none' : 'flex-none'
            )}
            style={{
              height: '50px', // Fixed height for open shifts row
              minHeight: '50px',
              width: currentView === 'day' ? `${DAY_VIEW_TOTAL_WIDTH_PX}px` : `${DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px`,
              minWidth: currentView === 'day' ? `${DAY_VIEW_TOTAL_WIDTH_PX}px` : `${DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px`,
            }}
            onClick={(e) => onCellClick(day, e, openShiftResourceId, group.name)} // Pass openShiftResourceId AND group.name
          >
            {/* Display open shifts for this day and group */}
            {openShiftsForGroupAndDay(day).map(shift => (
              <div
                key={shift.id}
                className="rounded-sm px-1 py-0.5 text-xs font-medium text-white shadow-sm mb-0.5 overflow-hidden text-ellipsis whitespace-nowrap"
                style={{ backgroundColor: openShiftColor }}
                title={`${shift.title} (${formatTime(shift.start)} - ${formatTime(shift.end)})`}
              >
                {shift.title}
              </div>
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
const ShiftForm: React.FC<{ isOpen: boolean; onClose: () => void; initialDate: Date | null; popupX: number | null; popupY: number | null; defaultResourceId?: string; groupNameForOpenShift?: string }> = ({ isOpen, onClose, initialDate, popupX, popupY, defaultResourceId, groupNameForOpenShift }) => {
  const { resources, addEvent } = useCalendar();
  const [resourceId, setResourceId] = useState<string>(defaultResourceId || resources[0]?.id || '');
  const [title, setTitle] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [endTime, setEndTime] = useState<string>('17:00');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setResourceId(defaultResourceId || resources[0]?.id || ''); // Set default resource on open
      setTitle('');
      const dateToUse = initialDate || new Date(); // Use initialDate if provided, else current date
      setStartDate(format(dateToUse, 'yyyy-MM-dd'));
      setStartTime('09:00'); // Default start time
      setEndDate(format(dateToUse, 'yyyy-MM-dd'));
      setEndTime('17:00'); // Default end time
      setErrorMessage('');
    }
  }, [isOpen, resources, initialDate, defaultResourceId]); // Add defaultResourceId to dependencies

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

  const handleSubmit = (e: React.FormEvent) => { // Removed async
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

    let finalTitle = title.trim();
    if (resourceId === 'open-shift-resource-id' && groupNameForOpenShift) {
      finalTitle = `Open Shift for ${groupNameForOpenShift}: ${finalTitle}`;
    }

    addEvent({
      resourceId,
      title: finalTitle, // Use the potentially modified title
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
              disabled={defaultResourceId === 'open-shift-resource-id'} // Disable if it's an open shift
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
const MainCalendar: React.FC<{ currentWeekStart: Date; currentView: 'week' | 'day' | 'year' | 'quarter' | 'month' | 'month-detailed' | 'quarter-detailed'; onCellClick: (date: Date, event: React.MouseEvent, resourceId?: string, groupName?: string) => void }> = ({ currentWeekStart, currentView, onCellClick }) => {
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
        {/* Scrollable Header Content */}
        <div className="flex flex-grow overflow-x-auto" id="scroll-header"> {/* Added id for synchronization */}
          <div className="flex" style={{ minWidth: currentView === 'day' ? `${DAY_VIEW_TOTAL_WIDTH_PX}px` : `${columnsToDisplay.length * DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px` }}>
            {currentView === 'day' ? (
              headerColumns.map((col) => (
                <div
                  key={col.key}
                  className="flex-none p-3 text-center text-xs font-semibold text-gray-600 border-r border-gray-200"
                  style={{ width: `${DAY_VIEW_HOUR_WIDTH_PX}px` }} // Fixed width for each hour column
                >
                  {col.label}
                </div>
              ))
            ) : (
              (columnsToDisplay as Date[]).map((day) => (
                <div
                  key={day.toISOString()}
                  className="flex-none p-3 text-center text-sm font-semibold text-gray-600 border-r border-gray-200"
                  style={{ minWidth: `${DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px` }} // Use minWidth for responsiveness
                >
                  {formatDateHeader(day)}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Daily Notes Row */}
      {(currentView === 'day' || currentView === 'week' || currentView === 'month-detailed' || currentView === 'quarter-detailed') && (
        <div className="flex border-b border-gray-200 bg-gray-50">
          <div className="w-32 flex-shrink-0 p-3 text-sm font-semibold text-gray-800 border-r border-gray-200">
            Daily Notes
          </div>
          {currentView === 'day' && (
            <div className="w-16 flex-shrink-0 p-3 text-center text-sm font-semibold text-gray-600 border-r border-gray-200">
              {/* Empty cell to align with 24 Hrs header */}
            </div>
          )}
          <div className="flex flex-grow overflow-x-auto" id="scroll-daily-notes"> {/* Added id for synchronization */}
            <div className="flex" style={{ minWidth: currentView === 'day' ? `${DAY_VIEW_TOTAL_WIDTH_PX}px` : `${columnsToDisplay.length * DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px` }}>
              {(columnsToDisplay as Date[]).map((day) => (
                <div
                  key={`daily-note-${day.toISOString()}`}
                  className={cn(
                    "relative border-r border-gray-200 last:border-r-0 p-2 text-xs text-gray-700 overflow-hidden cursor-pointer",
                    currentView === 'day' ? 'flex-none' : 'flex-none'
                  )}
                  style={{
                    height: '50px', // Fixed height for daily notes row
                    minHeight: '50px',
                    width: currentView === 'day' ? `${DAY_VIEW_TOTAL_WIDTH_PX}px` : `${DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px`, // Fixed width for day/week/month/quarter detailed days
                    minWidth: currentView === 'day' ? `${DAY_VIEW_TOTAL_WIDTH_PX}px` : `${DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px`,
                  }}
                  onClick={(e) => onCellClick(day, e)}
                >
                  {/* Placeholder for daily notes content */}
                  {format(day, 'MMM d') === format(new Date(2025, 4, 26), 'MMM d') && 'Team meeting'}
                  {format(day, 'MMM d') === format(new Date(2025, 4, 27), 'MMM d') && 'Client prep'}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Calendar Body: Shift Groups and Resource Rows */}
      <div className="flex-grow overflow-y-auto" style={{ maxHeight: 'calc(100vh - 250px)' }}>
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

            {/* Open Shifts Row for each group */}
            {group.isExpanded && (
              <OpenShiftsRow group={group} daysInView={currentView === 'day' ? [currentWeekStart] : (columnsToDisplay as Date[])} currentView={currentView} onCellClick={onCellClick} />
            )}

            {/* Resources belonging to this group - conditionally rendered */}
            {group.isExpanded && (
              <div className="transition-all duration-300 ease-in-out overflow-hidden">
                <div className="flex overflow-x-auto" id={`scroll-group-${group.id}`}> {/* Added id for synchronization */}
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
              </div>
            )}
          </div>
        ))}
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

  // Add a dummy resource for "Open Shifts"
  const [resources, setResources] = useState<Resource[]>([
    { id: 'res-1', name: 'Alice Johnson', color: '#EF4444', groupId: 'group-ops' },
    { id: 'res-2', name: 'Bob Williams', color: '#3B82F6', groupId: 'group-ops' },
    { id: 'res-3', name: 'Charlie Brown', color: '#10B981', groupId: 'group-sales' },
    { id: 'res-4', name: 'Diana Prince', color: '#F59E0B', groupId: 'group-sales' },
    { id: 'res-5', name: 'Eve Davis', color: '#6366F1', groupId: 'group-support' },
    { id: 'open-shift-resource-id', name: 'Open Shifts', color: '#9CA3AF', groupId: 'N/A' }, // Special resource for open shifts
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
    // Dummy open shifts
    {
      id: 'open-evt-1',
      resourceId: 'open-shift-resource-id',
      title: 'Open Shift for Operations Team',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 0, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0, 0),
    },
    {
      id: 'open-evt-2',
      resourceId: 'open-shift-resource-id',
      title: 'Open Shift for Sales Department',
      start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 16, 0, 0),
      end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 20, 0, 0),
    },
  ]);

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(today); // Initialize with deterministic date
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'week' | 'day' | 'year' | 'quarter' | 'month' | 'month-detailed' | 'quarter-detailed'>('week'); // Added 'quarter-detailed' to view options

  // State to hold the date for the new event form and popup coordinates
  const [newEventFormDate, setNewEventFormDate] = useState<Date | null>(null);
  const [popupCoords, setPopupCoords] = useState<{ x: number; y: number } | null>(null);
  const [defaultResourceIdForForm, setDefaultResourceIdForForm] = useState<string | undefined>(undefined);
  const [groupNameForOpenShift, setGroupNameForOpenShift] = useState<string | undefined>(undefined);


  // Function to open the add shift form, optionally with an initial date and click event
  const openAddShiftForm = (date: Date | null = null, event?: React.MouseEvent, resourceId?: string, groupName?: string) => {
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

  const addEvent = (newEvent: Omit<ShiftEvent, 'id'>) => { // Removed async
    setEvents((prevEvents) => [
      ...prevEvents,
      { ...newEvent, id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` },
    ]);
  };

  /**
   * @function toggleGroupExpansion
   * Toggles the `isExpanded` state for a specific shift group.
   * @param {string} groupId - The ID of the group to toggle.
   */
  const toggleGroupExpansion = (groupId: string) => { // Removed async
    setShiftGroups((prevGroups) =>
      prevGroups.map((group) =>
        group.id === groupId ? { ...group, isExpanded: !group.isExpanded } : group
      )
    );
  };

  // Function to delete event from local state
  const deleteEvent = (eventId: string) => { // Removed async
    setEvents((prevEvents) => prevEvents.filter(event => event.id !== eventId));
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
    deleteEvent,
    // Removed userId, isLoading
  };

  // Removed isLoading and error display logic

  return (
    <CalendarContext.Provider value={calendarContextValue}>
      <div className="min-h-screen bg-gray-100 p-4 font-sans antialiased text-gray-900">
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
        <script src="https://cdn.tailwindcss.com"></script>

        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Microsoft Shifts Clone (Dummy Data Only)
          </h1>
          {/* Removed userId display */}

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
              <Button
                variant={currentView === 'year-detailed' ? 'default' : 'outline'}
                onClick={() => setCurrentView('year-detailed')}
              >
                Year (Detailed)
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

        <ShiftForm isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} initialDate={newEventFormDate} popupX={popupCoords?.x || null} popupY={popupCoords?.y || null} defaultResourceId={defaultResourceIdForForm} groupNameForOpenShift={groupNameForOpenShift} />
      </div>
    </CalendarContext.Provider>
  );
};

export default App;
