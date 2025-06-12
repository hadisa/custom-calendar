'use client';

import React, { useMemo } from 'react';

import { cn } from '@/lib/utils';

import { DateHeader } from './DateHeader';
import { GroupHeader } from './GroupHeader';
import { HourCell } from './HourCell';
import { MonthView } from './MonthView';
import OpenShiftsRow from './OpenShiftsRow';
import { QuarterView } from './QuarterView';
import ResourceRow from './ResourceRow';
import TimeDisplay from './TimeDisplay';
import { YearView } from './YearView';
import { useCalendar } from './context';
import GroupRow from './groupRow';
import { formatDateHeader, getDaysInWeek } from './lib';
import {
    DAY_VIEW_HOUR_WIDTH_PX,
    DAY_VIEW_TOTAL_WIDTH_PX,
    DEFAULT_DAY_COLUMN_MIN_WIDTH_PX,
    MainCalendarProps,
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

const MainCalendar: React.FC<MainCalendarProps> = ({ currentWeekStart, currentView, onCellClick }) => {
    const { shiftGroups, resources, toggleGroupExpansion, events } = useCalendar();

    // Memoize columns to display based on current view
    const { columnsToDisplay, headerColumns } = useMemo(() => {
        let cols: Date[] = [];
        let headers: { label: string; key: string }[] = [];

        switch (currentView) {
            case 'week':
                cols = getDaysInWeek(currentWeekStart);
                break;
            case 'day':
                cols = [currentWeekStart];
                headers = Array.from({ length: 24 }).map((_, i) => ({
                    label: format(new Date(2000, 0, 1, i), 'ha').toLowerCase(),
                    key: `hour-header-${i}`
                }));
                break;
            case 'month':
            case 'month-detailed':
                const startOfCurrentMonth = startOfMonth(currentWeekStart);
                const endOfCurrentMonth = endOfMonth(currentWeekStart);
                const startDay = startOfWeek(startOfCurrentMonth, { weekStartsOn: 0 });
                const endDay = endOfWeek(endOfCurrentMonth, { weekStartsOn: 0 });

                let currentDay = startDay;
                while (currentDay <= endDay) {
                    cols.push(currentDay);
                    currentDay = addDays(currentDay, 1);
                }
                break;
            case 'quarter-detailed':
                const startOfCurrentQuarter = startOfQuarter(currentWeekStart);
                const endOfCurrentQuarter = endOfQuarter(currentWeekStart);
                const quarterStartDay = startOfWeek(startOfCurrentQuarter, { weekStartsOn: 0 });
                const quarterEndDay = endOfWeek(endOfCurrentQuarter, { weekStartsOn: 0 });

                let quarterDay = quarterStartDay;
                while (quarterDay <= quarterEndDay) {
                    cols.push(quarterDay);
                    quarterDay = addDays(quarterDay, 1);
                }
                break;
        }

        return { columnsToDisplay: cols, headerColumns: headers };
    }, [currentView, currentWeekStart]);

    // Special views (year, quarter, month) render completely different layouts
    if (currentView === 'year') {
        return (
            <div className='flex flex-col rounded-xl border border-gray-200 bg-gray-900 shadow-sm'>
                <TimeDisplay />
                <YearView year={currentWeekStart.getFullYear()} events={events} />
            </div>
        );
    }

    if (currentView === 'quarter') {
        const currentQuarter = getQuarter(currentWeekStart);
        const startOfCurrentQuarter = startOfQuarter(currentWeekStart);
        const endOfCurrentQuarter = endOfQuarter(currentWeekStart);

        return (
            <div className='flex flex-col rounded-xl border border-gray-200 bg-amber-500 shadow-sm'>
                <TimeDisplay />
                <QuarterView
                    quarter={currentQuarter}
                    startDate={startOfCurrentQuarter}
                    endDate={endOfCurrentQuarter}
                    events={events}
                />
            </div>
        );
    }

    if (currentView === 'month') {
        return (
            <div className='flex flex-col rounded-xl border border-gray-200 bg-amber-900 shadow-sm'>
                <TimeDisplay />
                <MonthView monthStart={currentWeekStart} events={events} />
            </div>
        );
    }

    return (
        <div className='flex w-full flex-col rounded-xl border border-gray-200 shadow-sm'>
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

                <div className='flex flex-grow overflow-x-auto'>
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
                            : columnsToDisplay.map((day) => <DateHeader key={day.toISOString()} day={day} />)}
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
                        <div className='w-16 flex-shrink-0 border-r border-gray-200 p-3 text-center text-sm font-semibold text-gray-600'>
                            {/* Empty cell to align with 24 Hrs header */}
                        </div>
                    )}
                    <div className='flex flex-grow overflow-x-auto'>
                        <div
                            className='flex'
                            style={{
                                minWidth:
                                    currentView === 'day'
                                        ? `${DAY_VIEW_TOTAL_WIDTH_PX}px`
                                        : `${columnsToDisplay.length * DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px`
                            }}>
                            {columnsToDisplay.map((day) => (
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
            <div
                className='relative w-full flex-grow overflow-y-auto bg-gray-50'
                style={{ backgroundColor: 'var(--group-shift)' }}>
                {shiftGroups.map((group) => (
                    <div key={group.id} className='relative w-full bg-white last:mb-0'>
                        {/* Group Header Row */}
                        <div className='flex w-full cursor-pointer border-b border-gray-200 transition-colors hover:bg-gray-100'>
                            <div className='w-32 flex-shrink-0 border-r border-gray-200 bg-gray-50'>
                                <GroupHeader group={group} onToggle={() => toggleGroupExpansion(group.id)} />
                            </div>

                            {currentView === 'day' && (
                                <div className='w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50'></div>
                            )}

                            <div className='w-full flex-grow overflow-hidden bg-gray-50'>
                                <div
                                    className='flex h-full w-full bg-gray-50'
                                    style={{
                                        minWidth:
                                            currentView === 'day'
                                                ? `${DAY_VIEW_TOTAL_WIDTH_PX}px`
                                                : `${columnsToDisplay.length * DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px`,
                                        backgroundColor: 'var(--group-shift)'
                                    }}>
                                    <div className='h-full p-3 text-sm font-semibold text-gray-600'>
                                        {/* Empty cell for group header spanning days/hours */}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Open Shifts Row for each group */}
                        {group.isExpanded && (
                            <OpenShiftsRow
                                group={group}
                                daysInView={currentView === 'day' ? [currentWeekStart] : columnsToDisplay}
                                currentView={currentView}
                                onCellClick={onCellClick}
                            />
                        )}
                        {/* <GroupRow
                            resource={undefined}
                            daysInView={[]}
                            currentView={'week'}
                            onCellClick={function (
                                date: Date,
                                event: React.MouseEvent,
                                resourceId?: string,
                                groupName?: string
                            ): void {
                                throw new Error('Function not implemented.');
                            }}
                        /> */}
                        {/* Resources belonging to this group */}
                        {group.isExpanded && (
                            <div className='transition-all duration-300 ease-in-out'>
                                {resources
                                    .filter((res) => res.groupId === group.id)
                                    .map((resource) => (
                                        <ResourceRow
                                            key={resource.id}
                                            resource={resource}
                                            daysInView={currentView === 'day' ? [currentWeekStart] : columnsToDisplay}
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
