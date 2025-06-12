import { useMemo } from 'react';

import { cn } from '@/lib/utils';

import { ShiftEvent } from './type';
import { format, isSameDay } from 'date-fns';

export const DayCell: React.FC<{ day: Date; isCurrentMonth: boolean; events: ShiftEvent[] }> = ({
    day,
    isCurrentMonth,
    events
}) => {
    const dayEvents = useMemo(() => events.filter((e) => isSameDay(e.start, day)), [events, day]);
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
                        isToday ? 'flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white' : ''
                    )}>
                    {format(day, 'd')}
                </span>
                {dayEvents.length > 0 && (
                    <span className='rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800'>
                        {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
                    </span>
                )}
            </div>
            <div className='mt-1 flex-1 overflow-hidden'>
                {dayEvents.slice(0, 2).map((event) => (
                    <div key={event.id} className='mb-1 truncate rounded bg-blue-50 px-1 py-0.5 text-xs text-blue-800'>
                        {event.title}
                    </div>
                ))}
                {dayEvents.length > 2 && <div className='text-xs text-gray-500'>+{dayEvents.length - 2} more</div>}
            </div>
        </div>
    );
};
