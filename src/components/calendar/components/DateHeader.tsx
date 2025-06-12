import { cn } from '@/lib/utils';

import { DEFAULT_DAY_COLUMN_MIN_WIDTH_PX } from './type';
import { format, isSameDay } from 'date-fns';

export const DateHeader: React.FC<{ day: Date }> = ({ day }) => {
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
