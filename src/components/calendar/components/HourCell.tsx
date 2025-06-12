import { cn } from '@/lib/utils';

import { DAY_VIEW_HOUR_WIDTH_PX } from './type';

export const HourCell: React.FC<{ hour: { label: string; key: string } }> = ({ hour }) => {
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
