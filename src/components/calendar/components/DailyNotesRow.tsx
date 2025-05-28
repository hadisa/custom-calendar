import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { DAY_VIEW_TOTAL_WIDTH_PX, DEFAULT_DAY_COLUMN_MIN_WIDTH_PX } from "./type";

/**
 * @component DailyNotesRow
 * Renders a row for daily notes, spanning across the displayed days/hours.
 */
const DailyNotesRow: React.FC<{
    daysInView: Date[];
    currentView: 'week' | 'day' | 'month-detailed' | 'quarter-detailed';
    onCellClick: (date: Date, event: React.MouseEvent, resourceId?: string, groupName?: string) => void;
}> = ({ daysInView, currentView, onCellClick }) => {
    // Placeholder for daily notes data - you might fetch this from state/context later
    const dailyNotes: { [key: string]: string } = {
        [format(new Date(2025, 4, 26), 'yyyy-MM-dd')]: 'Team meeting at 10 AM',
        [format(new Date(2025, 4, 27), 'yyyy-MM-dd')]: 'Client demo prep'
    };

    return (
        <div className='flex border-b border-gray-200 bg-gray-50'>
            <div className='w-32 flex-shrink-0 border-r border-gray-200 p-3 text-sm font-semibold text-gray-800'>
                Daily Notes
            </div>
            {currentView === 'day' && (
                <div className='w-16 flex-shrink-0 border-r border-gray-200 p-3 text-center text-sm font-semibold text-gray-600'>
                    {/* Empty cell to align with 24 Hrs header */}
                </div>
            )}
            <div className='flex flex-grow'>
                {daysInView.map((day) => (
                    <div
                        key={`daily-note-${day.toISOString()}`}
                        className={cn(
                            'relative cursor-pointer overflow-hidden border-r border-gray-200 p-2 text-xs text-gray-700 last:border-r-0',
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
                        {dailyNotes[format(day, 'yyyy-MM-dd')] || ''}
                    </div>
                ))}
            </div>
        </div>
    );
};