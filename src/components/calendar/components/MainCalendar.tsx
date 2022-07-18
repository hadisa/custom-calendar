"use client"

import { addDays, addMonths, endOfMonth, endOfQuarter, endOfWeek, format, getMonth, getQuarter, getYear, isSameDay, isSameMonth, startOfMonth, startOfQuarter, startOfWeek } from "date-fns";
import { formatDateHeader, getDaysInWeek } from "./lib";


import { useCalendar } from "./context";
import { cn } from "@/lib/utils";
import OpenShiftsRow from "./OpenShiftsRow";
import ResourceRow from "./ResourceRow";
import { DAY_VIEW_TOTAL_WIDTH_PX, DEFAULT_DAY_COLUMN_MIN_WIDTH_PX, DAY_VIEW_HOUR_WIDTH_PX } from "./type";

/**
 * @component MainCalendar
 * The main calendar component that displays the week view,
 * including date headers and grouped resource rows with their respective events.
 * Renamed from Calendar to avoid naming conflict with the date picker Calendar component.
 */
const MainCalendar: React.FC<{
    currentWeekStart: Date;
    currentView: 'week' | 'day' | 'year' | 'quarter' | 'month' | 'month-detailed' | 'quarter-detailed';
    onCellClick: (date: Date, event: React.MouseEvent, resourceId?: string, groupName?: string) => void;
}> = ({ currentWeekStart, currentView, onCellClick }) => {
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
            <div className='flex flex-col rounded-lg border border-gray-300 bg-white p-4 shadow-md'>
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
    } else if (currentView === 'quarter') {
        const currentQuarter = getQuarter(currentWeekStart);
        const startOfCurrentQuarter = startOfQuarter(currentWeekStart);
        const endOfCurrentQuarter = endOfQuarter(currentWeekStart);

        const monthsInQuarter = Array.from({ length: 3 }).map((_, i) => addMonths(startOfCurrentQuarter, i));

        return (
            <div className='flex flex-col  rounded-lg border border-gray-300 bg-white p-4 shadow-md'>
                <h2 className='mb-4 text-center text-2xl font-bold'>
                    {format(startOfCurrentQuarter, 'MMM d')} - {format(endOfCurrentQuarter, 'MMM d,yyyy')} Quarter View
                </h2>
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3'>
                    {monthsInQuarter.map((monthDate) => (
                        <div key={monthDate.toISOString()} className='rounded-lg border bg-gray-50 p-4 text-center'>
                            <h3 className='mb-2 text-lg font-semibold'>{format(monthDate, 'MMMM')}</h3>
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
    } else if (currentView === 'month') {
        // Summary Month view
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
            <div className='flex flex-col rounded-lg border border-gray-300 bg-white p-4 shadow-md'>
                <h2 className='mb-4 text-center text-2xl font-bold'>
                    {format(currentWeekStart, 'MMMM,yyyy')} Month View
                </h2>
                <div className='mb-2 grid grid-cols-7 text-center font-semibold text-gray-600'>
                    {daysOfWeekHeaders.map((day) => (
                        <div key={day}>{day}</div>
                    ))}
                </div>
                <div className='grid grid-cols-7 gap-1'>
                    {allDaysInMonthView.map((day) => (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                'flex h-24 flex-col items-center justify-start rounded-md border p-2',
                                isSameMonth(day, currentWeekStart) ? 'bg-gray-50' : 'bg-gray-100 text-gray-400'
                            )}>
                            <span className='text-sm font-medium'>{format(day, 'd')}</span>
                            <p className='mt-1 text-xs text-gray-600'>
                                Events: {events.filter((e) => isSameDay(e.start, day)).length}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Default rendering for 'week', 'day', 'month-detailed', and 'quarter-detailed' views
    return (
        <div className='flex flex-col  rounded-lg border border-gray-300 bg-white shadow-md'>
            {/* Calendar Header: Groups/Resources, and Days/Hours */}
            <div className='w-full flex border-b border-gray-200 bg-gray-100'>
                <div className='w-32 flex-shrink-0 border-r border-gray-200 p-3 text-sm font-semibold text-gray-600'>
                    Groups/Resources
                </div>
                {/* Render "24 Hrs" header for 'day' view */}
                {currentView === 'day' && (
                    <div className='w-16 flex-shrink-0 border-r border-gray-200 p-3 text-center text-sm font-semibold text-gray-600'>
                        24 Hrs
                    </div>
                )}
                {/* Scrollable Header Content */}
                <div className='flex flex-grow overflow-x-auto'>
                    {' '}
                    {/* This div now controls horizontal scrolling for the header */}
                    <div
                        className='flex'
                        style={{
                            minWidth:
                                currentView === 'day'
                                    ? `${DAY_VIEW_TOTAL_WIDTH_PX}px`
                                    : `${columnsToDisplay.length * DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px`
                        }}>
                        {currentView === 'day'
                            ? headerColumns.map((col) => (
                                  <div
                                      key={col.key}
                                      className='flex-none border-r border-gray-200 p-3 text-center text-xs font-semibold text-gray-600'
                                      style={{ width: `${DAY_VIEW_HOUR_WIDTH_PX}px` }} // Fixed width for each hour column
                                  >
                                      {col.label}
                                  </div>
                              ))
                            : (columnsToDisplay as Date[]).map((day) => (
                                  <div
                                      key={day.toISOString()}
                                      className='flex-none border-r border-gray-200 p-3 text-center text-sm font-semibold text-gray-600'
                                      style={{ minWidth: `${DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px` }} // Use minWidth for responsiveness
                                  >
                                      {formatDateHeader(day)}
                                  </div>
                              ))}
                    </div>
                </div>
            </div>

            {/* Daily Notes Row */}
            {(currentView === 'day' ||
                currentView === 'week' ||
                currentView === 'month-detailed' ||
                currentView === 'quarter-detailed') && (
                <div className='w-full bg-pink-300 flex border-b border-gray-200 bg-gray-50'>
                    <div className='w-32 flex-shrink-0 border-r border-gray-200 p-3 text-sm font-semibold text-gray-800'>
                        Daily Notes
                    </div>
                    {currentView === 'day' && (
                        <div className='w-16 flex-shrink-0 border-r border-gray-200 p-3 text-center text-sm font-semibold text-gray-600'>
                            {/* Empty cell to align with 24 Hrs header */}
                        </div>
                    )}
                    <div className='flex flex-grow overflow-x-auto'>
                        {' '}
                        {/* This div now controls horizontal scrolling for daily notes */}
                        <div
                            className='flex'
                            style={{
                                minWidth:
                                    currentView === 'day'
                                        ? `${DAY_VIEW_TOTAL_WIDTH_PX}px`
                                        : `${columnsToDisplay.length * DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px`
                            }}>
                            {(columnsToDisplay as Date[]).map((day) => (
                                <div
                                    key={`daily-note-${day.toISOString()}`}
                                    className={cn(
                                        'relative cursor-pointer  border-r border-gray-200 p-2 text-xs text-gray-700 last:border-r-0',
                                        currentView === 'day' ? 'flex-none' : 'flex-none' // flex-none for day, flex-none for week/detailed
                                    )}
                                    style={{
                                        height: '50px', // Fixed height for daily notes row
                                        minHeight: '50px',
                                        width:
                                            currentView === 'day'
                                                ? `${DAY_VIEW_TOTAL_WIDTH_PX}px`
                                                : `${DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px`, // Fixed width for day/week/month/quarter detailed days
                                        minWidth:
                                            currentView === 'day'
                                                ? `${DAY_VIEW_TOTAL_WIDTH_PX}px`
                                                : `${DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px`
                                    }}
                                    onClick={(e) => onCellClick(day, e)}>
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
            <div className='flex-grow overflow-y-auto' style={{ maxHeight: 'calc(100vh - 250px)' }}>
                {shiftGroups.map((group) => (
                    <div key={group.id} className='mb-2 last:mb-0'>
                        {/* Group Header Row */}
                        <div
                            className='w-full flex cursor-pointer border-t border-b border-gray-300 bg-gray-200 transition duration-150 ease-in-out hover:bg-gray-300'
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
                            {/* Conditional empty cell for '24 Hrs' column in Day view */}
                            {currentView === 'day' && (
                                <div className='w-16 flex-shrink-0 border-r border-gray-300'></div>
                            )}
                            <div className='flex-grow p-3 text-sm font-semibold text-gray-600'>
                                {/* Empty cell for group header spanning days/hours */}
                            </div>
                        </div>

                        {/* Open Shifts Row for each group */}
                        {group.isExpanded && (
                            <OpenShiftsRow
                                group={group}
                                daysInView={currentView === 'day' ? [currentWeekStart] : (columnsToDisplay as Date[])}
                                currentView={currentView}
                                onCellClick={onCellClick}
                            />
                        )}

                        {/* Resources belonging to this group - conditionally rendered */}
                        {group.isExpanded && (
                            <div className='transition-all duration-300 ease-in-out'>
                                {resources
                                    .filter((res) => res.groupId === group.id)
                                    .map((resource) => (
                                        <ResourceRow
                                            key={resource.id}
                                            resource={resource}
                                            daysInView={
                                                currentView === 'day'
                                                    ? [currentWeekStart]
                                                    : (columnsToDisplay as Date[])
                                            }
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
    );
};
  export default MainCalendar;