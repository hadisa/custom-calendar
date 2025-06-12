'use client';

import { cn } from '@/lib/utils';

import { useCalendar } from './context';
import { formatTime } from './lib';
import { DAY_VIEW_TOTAL_WIDTH_PX, DEFAULT_DAY_COLUMN_MIN_WIDTH_PX, ShiftGroup } from './type';
import { isSameDay } from 'date-fns';

/**
 * @component OpenShiftsRow
 * Renders a row for open shifts for a specific group.
 */
const OpenShiftsRow: React.FC<{
    group: ShiftGroup;
    daysInView: Date[];
    currentView: 'week' | 'day' | 'month-detailed' | 'quarter-detailed';
    onCellClick: (date: Date, event: React.MouseEvent, resourceId?: string, groupName?: string) => void;
}> = ({ group, daysInView, currentView, onCellClick }) => {
    const { events, resources } = useCalendar();
    const openShiftResourceId = resources.find((res) => res.name === 'Open Shifts')?.id || 'open-shift-resource-id';
    const openShiftColor = resources.find((res) => res.name === 'Open Shifts')?.color || '#9CA3AF'; // Default gray

    const openShiftsForGroupAndDay = (day: Date) => {
        return events.filter(
            (event) =>
                isSameDay(event.start, day) &&
                event.resourceId === openShiftResourceId &&
                event.title.startsWith(`Open Shift for ${group.name}`) // Filter by group name for dummy data
        );
    };

    return (
        <div className='flex border-b border-gray-200 bg-red-50'>
            <div className='w-32 flex-shrink-0 border-r border-gray-200 p-3 text-sm font-semibold text-gray-800'>
                Open shifts
            </div>
            {currentView === 'day' && (
                <div className='w-16 flex-shrink-0 border-r border-gray-200 p-3 text-center text-sm font-semibold text-gray-600'>
                    {/* Empty cell to align with 24 Hrs header */}
                </div>
            )}
            <div className='relative flex flex-grow'>
                <div className='absolute inset-0 bg-red-50' /> {/* Background color that extends when scrolling */}
                {daysInView.map((day) => (
                    <div
                        key={`open-shift-${group.id}-${day.toISOString()}`}
                        className={cn(
                            'relative cursor-pointer overflow-hidden border-r border-gray-200 p-2 text-xs text-gray-700 last:border-r-0',
                            currentView === 'day' ? 'flex-none' : 'flex-none'
                        )}
                        style={{
                            height: '50px', // Fixed height for open shifts row
                            minHeight: '50px',
                            width:
                                currentView === 'day'
                                    ? `${DAY_VIEW_TOTAL_WIDTH_PX}px`
                                    : `${DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px`,
                            minWidth:
                                currentView === 'day'
                                    ? `${DAY_VIEW_TOTAL_WIDTH_PX}px`
                                    : `${DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px`,
                            backgroundImage:
                                'linear-gradient(to bottom, transparent calc(100% - 1px), #e5e7eb calc(100% - 1px))',
                            backgroundSize: '100% 50px' // Match the cell height
                        }}
                        onClick={(e) => onCellClick(day, e, openShiftResourceId, group.name)} // Pass openShiftResourceId AND group.name
                    >
                        {/* Display open shifts for this day and group */}
                        {openShiftsForGroupAndDay(day).map((shift) => (
                            <div
                                key={shift.id}
                                className='mb-0.5 overflow-hidden rounded-sm px-1 py-0.5 text-xs font-medium text-ellipsis whitespace-nowrap text-white shadow-sm'
                                style={{ backgroundColor: openShiftColor }}
                                title={`${shift.title} (${formatTime(shift.start)} - ${formatTime(shift.end)})`}>
                                {shift.title}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OpenShiftsRow;
