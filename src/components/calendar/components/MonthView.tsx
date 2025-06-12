import { useMemo } from 'react';

import { DayCell } from './DayCell';
import { ShiftEvent } from './type';
import { addDays, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';

export const MonthView: React.FC<{ monthStart: Date; events: ShiftEvent[] }> = ({ monthStart, events }) => {
    const daysInMonthView = useMemo(() => {
        const startOfCurrentMonth = startOfMonth(monthStart);
        const endOfCurrentMonth = endOfMonth(monthStart);
        const startDay = startOfWeek(startOfCurrentMonth, { weekStartsOn: 0 });
        const endDay = endOfWeek(endOfCurrentMonth, { weekStartsOn: 0 });

        const days: Date[] = [];
        let currentDay = startDay;
        while (currentDay <= endDay) {
            days.push(currentDay);
            currentDay = addDays(currentDay, 1);
        }

        return days;
    }, [monthStart]);

    const daysOfWeekHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className='p-6'>
            <h2 className='mb-4 text-center text-2xl font-bold text-gray-800'>{format(monthStart, 'MMMM yyyy')}</h2>
            <div className='mb-2 grid grid-cols-7 gap-1 text-center text-sm font-semibold text-gray-600'>
                {daysOfWeekHeaders.map((day) => (
                    <div key={day} className='p-2'>
                        {day}
                    </div>
                ))}
            </div>
            <div className='grid grid-cols-7 gap-1'>
                {daysInMonthView.map((day) => (
                    <DayCell
                        key={day.toISOString()}
                        day={day}
                        isCurrentMonth={isSameMonth(day, monthStart)}
                        events={events}
                    />
                ))}
            </div>
        </div>
    );
};
