'use client';

import { cn } from '@/lib/utils';

import OpenShiftsRow from './OpenShiftsRow';
import ResourceRow from './ResourceRow';
import TimeDisplay from './TimeDisplay';
import { useCalendar } from './context';
import { formatDateHeader, getDaysInWeek } from './lib';
import {
    DAY_VIEW_HOUR_WIDTH_PX,
    DAY_VIEW_TOTAL_WIDTH_PX,
    DEFAULT_DAY_COLUMN_MIN_WIDTH_PX,
    Resource,
    ShiftEvent,
    ShiftGroup
} from './type';
import {
    addDays,
    addMonths,
    endOfMonth,
    endOfQuarter,
    endOfWeek,
    format,
    getMonth,
    getQuarter,
    getYear,
    isSameDay,
    isSameMonth,
    startOfMonth,
    startOfQuarter,
    startOfWeek
} from 'date-fns';

const MainCalendar: React.FC<{
    currentWeekStart: Date;
    currentView: 'week' | 'day' | 'year' | 'quarter' | 'month' | 'month-detailed' | 'quarter-detailed';
    onCellClick: (date: Date, event: React.MouseEvent, resourceId?: string, groupName?: string) => void;
}> = ({ currentWeekStart, currentView, onCellClick }) => {
    const { shiftGroups, resources, toggleGroupExpansion, events } = useCalendar();

    // Determine which days/columns to display based on the current view
    let columnsToDisplay: Date[] = [];
    let headerColumns: { label: string; key: string }[] = [];

    if (currentView === 'week') {
        columnsToDisplay = getDaysInWeek(currentWeekStart);
    } else if (currentView === 'day') {
        columnsToDisplay = [currentWeekStart];
        headerColumns = Array.from({ length: 24 }).map((_, i) => ({
            label: format(new Date(2000, 0, 1, i), 'ha').toLowerCase(),
            key: `hour-header-${i}`
        }));
    } else if (currentView === 'month' || currentView === 'month-detailed') {
        const startOfCurrentMonth = startOfMonth(currentWeekStart);
        const endOfCurrentMonth = endOfMonth(currentWeekStart);
        const startDay = startOfWeek(startOfCurrentMonth, { weekStartsOn: 0 });
        const endDay = endOfWeek(endOfCurrentMonth, { weekStartsOn: 0 });

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

    // Enhanced UI components
    const DayCell = ({ day, isCurrentMonth }: { day: Date; isCurrentMonth: boolean }) => {
        const eventCount = events.filter((e: ShiftEvent) => isSameDay(e.start, day)).length;
        const isToday = isSameDay(day, new Date());

        return (
            <div
                className={cn(
                    'relative flex h-24 flex-col rounded-lg border p-2 transition-all hover:shadow-md',
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50 text-gray-400',
                    isToday ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                )}>
                <div className='flex items-center justify-between'>
                    <span
                        className={cn(
                            'text-sm font-medium',
                            isToday
                                ? 'flex h-6 w-6 items-center justify-center rounded-full bg-white text-white'
                                : ''
                        )}>
                        {format(day, 'd')}
                    </span>
                    {eventCount > 0 && (
                        <span className='rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800'>
                            {eventCount} {eventCount === 1 ? 'event' : 'events'}
                        </span>
                    )}
                </div>
                <div className='mt-1 flex-1 overflow-hidden'>
                    {events.slice(0, 2).map(
                        (event: ShiftEvent) =>
                            isSameDay(event.start, day) && (
                                <div
                                    key={event.id}
                                    className='mb-1 truncate rounded bg-blue-50 px-1 py-0.5 text-xs text-blue-800'>
                                    {event.title}
                                </div>
                            )
                    )}
                    {eventCount > 2 && <div className='text-xs text-gray-500'>+{eventCount - 2} more</div>}
                </div>
            </div>
        );
    };

    const HourCell = ({ hour }: { hour: { label: string; key: string } }) => {
        const currentHour = parseInt(hour.label.replace('am', '').replace('pm', ''));
        const isBusinessHour = currentHour >= 9 && currentHour <= 17;

        return (
            <div
                key={hour.key}
                className={cn(
                    'flex-none border-r border-gray-200 p-2 text-center text-xs font-semibold',
                    isBusinessHour ? 'bg-blue-50 text-blue-800' : 'bg-gray-50 text-gray-600'
                )}
                style={{ width: `${DAY_VIEW_HOUR_WIDTH_PX}px` }}>
                <div className='flex flex-col items-center'>
                    <span>{hour.label}</span>
                    <span className='text-xs font-normal text-gray-400'>
                        {currentHour % 12 === 0 ? 12 : currentHour % 12}:00
                    </span>
                </div>
            </div>
        );
    };

    const DateHeader = ({ day }: { day: Date }) => {
        const isToday = isSameDay(day, new Date());
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

        return (
            <div
                className={cn(
                    'flex-none border-r border-gray-200 p-2 text-center',
                    isWeekend ? 'bg-gray-50' : 'bg-white',
                    isToday ? 'border-b-2 border-b-blue-500' : ''
                )}
                style={{ minWidth: `${DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px` }}>
                <div className='flex flex-col items-center'>
                    <span className='text-xs font-medium text-gray-500'>{format(day, 'EEE')}</span>
                    <span
                        className={cn(
                            'text-sm font-semibold',
                            isToday
                                ? 'flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white'
                                : 'text-gray-800'
                        )}>
                        {format(day, 'd')}
                    </span>
                    <span className='text-xs text-gray-500'>{format(day, 'MMM')}</span>
                </div>
            </div>
        );
    };

    const GroupHeader = ({ group }: { group: ShiftGroup }) => {
        return (
            <div className='flex w-32 flex-shrink-0 items-center justify-between border-r border-gray-300 p-3'>
                <div className='flex items-center'>
                    <div className='mr-2 h-3 w-3 rounded-full' style={{ backgroundColor: group.color || '#6b7280' }} />
                    <span className='truncate text-sm font-bold text-gray-900'>{group.name}</span>
                </div>
                <svg
                    className={`h-4 w-4 transform text-gray-700 transition-transform duration-200 ${
                        group.isExpanded ? 'rotate-90' : ''
                    }`}
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                    xmlns='http://www.w3.org/2000/svg'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5l7 7-7 7' />
                </svg>
            </div>
        );
    };

    // Render different layouts based on currentView
    if (currentView === 'year') {
        const months = Array.from({ length: 12 }).map((_, i) => new Date(currentWeekStart.getFullYear(), i, 1));

        return (
            <div className='flex flex-col rounded-xl border border-gray-200  shadow-sm'>
                <TimeDisplay />
                <div className='p-6'>
                    <h2 className='mb-6 text-center text-2xl font-bold text-gray-800'
                     style={{ backgroundColor: 'var(--resource-cell-shift)' }}>
                        {currentWeekStart.getFullYear()} Year View
                    </h2>
                    <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
                        {months.map((monthDate) => {
                            const monthEvents = events.filter(
                                (e: ShiftEvent) =>
                                    getMonth(e.start) === getMonth(monthDate) && getYear(e.start) === getYear(monthDate)
                            );

                            return (
                                <div
                                    key={monthDate.toISOString()}
                                    className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md'>
                                    <h3 className='mb-3 text-center text-lg font-semibold text-gray-800'>
                                        {format(monthDate, 'MMMM')}
                                    </h3>
                                    <div className='mb-3 grid grid-cols-7 gap-1'>
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                                            <div key={day} className='text-center text-xs text-gray-500'>
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    <div className='flex items-center justify-between'>
                                        <span className='text-sm text-gray-600'>Events: {monthEvents.length}</span>
                                        <span className='rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800'>
                                            {monthEvents.filter((e: ShiftEvent) => e.status === 'confirmed').length}{' '}
                                            confirmed
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    } else if (currentView === 'quarter') {
        const currentQuarter = getQuarter(currentWeekStart);
        const startOfCurrentQuarter = startOfQuarter(currentWeekStart);
        const endOfCurrentQuarter = endOfQuarter(currentWeekStart);

        const monthsInQuarter = Array.from({ length: 3 }).map((_, i) => addMonths(startOfCurrentQuarter, i));

        return (
            <div className='flex flex-col rounded-xl border border-gray-200  shadow-sm'
            style={{ backgroundColor: 'var(--quarter-month-shift)' }}
            >
                <TimeDisplay />
                <div className='p-6'>
                    <h2 className='mb-6 text-center text-2xl font-bold text-gray-800'>
                        Q{currentQuarter} - {format(startOfCurrentQuarter, 'MMM yyyy')} to{' '}
                        {format(endOfCurrentQuarter, 'MMM yyyy')}
                    </h2>
                    <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3'>
                        {monthsInQuarter.map((monthDate) => {
                            const monthEvents = events.filter(
                                (e: ShiftEvent) =>
                                    getMonth(e.start) === getMonth(monthDate) && getYear(e.start) === getYear(monthDate)
                            );

                            return (
                                <div
                                    key={monthDate.toISOString()}
                                    className='rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md'>
                                    <h3 className='mb-3 text-center text-lg font-semibold text-gray-800'>
                                        {format(monthDate, 'MMMM')}
                                    </h3>
                                    <div className='mb-3 grid grid-cols-7 gap-1'>
                                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
                                            <div key={day} className='text-center text-xs text-gray-500'>
                                                {day}
                                            </div>
                                        ))}
                                    </div>
                                    <div className='flex items-center justify-between'>
                                        <span className='text-sm text-gray-600'>Events: {monthEvents.length}</span>
                                        <span className='rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800'>
                                            {monthEvents.filter((e: ShiftEvent) => e.status === 'confirmed').length}{' '}
                                            confirmed
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    } else if (currentView === 'month') {
        const startOfCurrentMonth = startOfMonth(currentWeekStart);
        const endOfCurrentMonth = endOfMonth(currentWeekStart);
        const startDay = startOfWeek(startOfCurrentMonth, { weekStartsOn: 0 });
        const endDay = endOfWeek(endOfCurrentMonth, { weekStartsOn: 0 });

        let currentDay = startDay;
        const allDaysInMonthView: Date[] = [];
        while (currentDay <= endDay) {
            allDaysInMonthView.push(currentDay);
            currentDay = addDays(currentDay, 1);
        }

        const daysOfWeekHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return (
            <div className='flex flex-col rounded-xl border border-gray-200 shadow-sm'
            style={{ backgroundColor: 'var(--quarter-month-shift)' }}>
                <TimeDisplay />
                <div className='p-6'>
                    <h2 className='mb-4 text-center text-2xl font-bold text-gray-800'>
                        {format(currentWeekStart, 'MMMM yyyy')}
                    </h2>
                    <div className='mb-2 grid grid-cols-7 gap-1 text-center text-sm font-semibold text-gray-600'>
                        {daysOfWeekHeaders.map((day) => (
                            <div key={day} className='p-2'>
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className='grid grid-cols-7 gap-1'>
                        {allDaysInMonthView.map((day) => (
                            <DayCell
                                key={day.toISOString()}
                                day={day}
                                isCurrentMonth={isSameMonth(day, currentWeekStart)}
                            />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Default rendering for 'week', 'day', 'month-detailed', and 'quarter-detailed' views
    return (
        <div className='flex flex-col rounded-xl border bg-yellow-300 border-gray-200 bg-red-600 shadow-sm'>
            <TimeDisplay />

            {/* Calendar Header */}
            <div className='flex w-full border-b border-gray-200 bg-gray-50'>
                <div className='w-32 flex-shrink-0 border-r border-gray-200 p-3 text-sm font-semibold text-gray-600'>
                    Groups
                </div>

                {currentView === 'day' && (
                    <div className='w-16 flex-shrink-0 border-r border-gray-200 p-3 text-center text-sm font-semibold text-gray-600'>
                        24 Hrs
                    </div>
                )}

                <div className='flex flex-grow overflow-x-auto bg-yellow-600'>
                    <div
                        className='flex'
                        style={{
                            minWidth:
                                currentView === 'day'
                                    ? `${DAY_VIEW_TOTAL_WIDTH_PX}px`
                                    : `${columnsToDisplay.length * DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px`
                        }}>
                        {currentView === 'day'
                            ? headerColumns.map((col) => <HourCell key={col.key} hour={col} />)
                            : (columnsToDisplay as Date[]).map((day) => (
                                  <DateHeader key={day.toISOString()} day={day} />
                              ))}
                    </div>
                </div>
            </div>

            {/* Daily Notes Row */}
            {(currentView === 'day' ||
                currentView === 'week' ||
                currentView === 'month-detailed' ||
                currentView === 'quarter-detailed') && (
                <div className='flex border-b border-gray-200 bg-gray-50'>
                    <div className='w-32 flex-shrink-0 border-r border-gray-200 p-3 text-sm font-semibold text-gray-800'>
                        Daily Notes
                    </div>
                    {currentView === 'day' && (
                        <div className='w-16 flex-shrink-0 border-r border-gray-200 p-3  text-center text-sm font-semibold text-gray-600'>
                            {/* Empty cell to align with 24 Hrs header */}
                        </div>
                    )}
                    <div className='flex flex-grow overflow-x-auto' style={{ backgroundColor: 'var(--header-shift)' }}>
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
                                        'relative cursor-pointer border-r border-gray-200 p-2 text-xs text-gray-700 last:border-r-0',
                                        'transition-colors hover:bg-blue-50',
                                        isSameDay(day, new Date()) ? 'bg-blue-100' : ''
                                    )}
                                    style={{
                                        height: '50px',
                                        minHeight: '50px',
                                        width:
                                            currentView === 'day'
                                                ? `${DAY_VIEW_TOTAL_WIDTH_PX}px`
                                                : `${DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px`,
                                        minWidth:
                                            currentView === 'day'
                                                ? `${DAY_VIEW_TOTAL_WIDTH_PX}px`
                                                : `${DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px`
                                    }}
                                    onClick={(e) => onCellClick(day, e)}>
                                    {format(day, 'MMM d') === format(new Date(2025, 4, 26), 'MMM d') && (
                                        <div className='absolute right-2 left-2 truncate rounded bg-blue-100 px-2 py-1 text-xs text-blue-800'>
                                            Team meeting
                                        </div>
                                    )}
                                    {format(day, 'MMM d') === format(new Date(2025, 4, 27), 'MMM d') && (
                                        <div className='absolute right-2 left-2 truncate rounded bg-purple-100 px-2 py-1 text-xs text-purple-800'>
                                            Client prep
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Calendar Body: Shift Groups and Resource Rows */}
            <div className='relative w-full flex-grow overflow-y-auto' 
            //  style={{ backgroundColor: 'var(--row-shift)', maxHeight: 'calc(100vh - 250px)' }}
             >
                {shiftGroups.map((group: ShiftGroup) => (
                    <div key={group.id} className='relative w-full last:mb-0'>
                        {/* Group Header Row */}
                        <div
                            className='flex w-full cursor-pointer border-b border-gray-200 bg-gray-50 transition-colors hover:bg-gray-100'
                            onClick={() => toggleGroupExpansion(group.id)}>
                            <GroupHeader group={group} />

                            {currentView === 'day' && (
                                <div className='w-16 flex-shrink-0 border-r border-gray-200'></div>
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

                        {/* Resources belonging to this group */}
                        {group.isExpanded && (
                            <div className='transition-all duration-300 ease-in-out bg-green-200'>
                                {resources
                                    .filter((res: Resource) => res.groupId === group.id)
                                    .map((resource: Resource) => (
                                        <ResourceRow
                                            key={resource.id}
                                            resource={resource}
                                            daysInView={
                                                currentView === 'day'
                                                    ? [currentWeekStart]
                                                    : (columnsToDisplay as Date[])
                                            }
                                            currentView={currentView}
                                            onCellClick={onCellClick}
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
