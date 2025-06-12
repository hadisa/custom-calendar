"use client"
import { cn } from "@/lib/utils";
import { DAY_VIEW_TOTAL_WIDTH_PX, DEFAULT_DAY_COLUMN_MIN_WIDTH_PX, Resource } from "./type";
import { useCalendar } from "./context";
import { isSameDay } from "date-fns";
import Event from "./Event";

/**
 * @component ResourceRow
 * Renders a single resource's row, displaying their name and events.
 */
const ResourceRowTwo: React.FC<{
    resource: Resource;
    daysInView: Date[];
    currentView: 'week' | 'day' | 'month-detailed' | 'quarter-detailed';
    onCellClick: (date: Date, event: React.MouseEvent, resourceId?: string, groupName?: string) => void;
}> = ({ resource, daysInView, currentView, onCellClick }) => {
    const { events } = useCalendar();

    const resourceEvents = events.filter(
        (event) => event.resourceId === resource.id && daysInView.some((day) => isSameDay(day, event.start))
    );

    // For Day view, we need horizontal hourly grid lines
    const dayViewHourlyMarkers = Array.from({ length: 24 }).map((_, i) => i * 60);

    return (
        <div className='flex border-b border-gray-200 last:border-b-0'>
            <div className='flex w-32 flex-shrink-0 items-center justify-center border-r border-gray-200 bg-green-50 p-3 text-sm font-semibold text-gray-800'>
                {resource.name}
            </div>
            {/* This flex-grow div will contain the horizontally scrolling content */}
            <div className='relative flex flex-grow'>
                {daysInView.map((day) => (
                    <div
                        key={day.toISOString()}
                        className={cn(
                            'relative cursor-pointer border-r border-gray-200 last:border-r-0',
                            
                         currentView === 'day' ? 'flex-none' : 'flex-none' // flex-none for fixed width in all detailed views
                        )}
                        style={{
                            height: '100px', // Fixed height for rows in all detailed views
                            minHeight: '100px', // Min height for consistency
                            width:
                                currentView === 'day'
                                    ? `${DAY_VIEW_TOTAL_WIDTH_PX}px`
                                    : `${DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px`, // Fixed width for day/week/month/quarter detailed days
                            minWidth:
                                currentView === 'day'
                                    ? `${DAY_VIEW_TOTAL_WIDTH_PX}px`
                                    : `${DEFAULT_DAY_COLUMN_MIN_WIDTH_PX}px`,
                            padding: '4px' // Add some padding inside the cell
                        }}
                        onClick={(e) => onCellClick(day, e, resource.id)} // Pass the event object and resource.id here
                    >
                        {currentView === 'day' &&
                            dayViewHourlyMarkers.map((minutes) => (
                                <div
                                    key={`grid-day-${day.toISOString()}-${minutes}`}
                                    className={cn(
                                        'absolute h-full border-r border-gray-100',
                                        minutes % 60 === 0 ? 'border-gray-200' : 'border-gray-100' // Thicker line for full hours
                                    )}
                                    style={{ left: `${(minutes / (24 * 60)) * 100}%` }}></div>
                            ))}

                        {/* Render events for this specific day and resource */}
                        {resourceEvents
                            .filter((event) => isSameDay(event.start, day))
                            .map((event) => (
                                <Event 
                                    key={event.id}
                                    event={event}
                                    resourceColor={resource.color}
                                    currentView={currentView}
                                />
                            ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ResourceRowTwo;