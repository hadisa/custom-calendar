import { useMemo } from 'react';

import { ShiftEvent } from './type';
import { format, getMonth, getYear } from 'date-fns';

export const YearView: React.FC<{ year: number; events: ShiftEvent[] }> = ({ year, events }) => {
    const months = useMemo(() => Array.from({ length: 12 }).map((_, i) => new Date(year, i, 1)), [year]);

    return (
        <div className='p-6'>
            <h2 className='mb-6 text-center text-2xl font-bold text-gray-800'>{year} Year View</h2>
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
                {months.map((monthDate) => {
                    const monthEvents = events.filter(
                        (e) => getMonth(e.start) === getMonth(monthDate) && getYear(e.start) === getYear(monthDate)
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
                                    {monthEvents.filter((e) => e.status === 'confirmed').length} confirmed
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
