"use client"
import { useCalendar } from "./context";
import { formatTime } from "./lib";
import { ShiftEvent } from "./type";

const Event: React.FC<{
    event: ShiftEvent;
    resourceColor: string;
    currentView: 'week' | 'day' | 'month-detailed' | 'quarter-detailed';
}> = ({ event, resourceColor, currentView }) => {
    const startMinutes = event.start.getHours() * 60 + event.start.getMinutes();
    const endMinutes = event.end.getHours() * 60 + event.end.getMinutes();
    const durationMinutes = endMinutes - startMinutes;
    const { deleteEvent } = useCalendar(); // Get deleteEvent from context

    const handleDelete = (e: React.MouseEvent) => {
        // Removed async
        e.stopPropagation(); // Prevent cell click from firing
        if (window.confirm(`Are you sure you want to delete "${event.title}"?`)) {
            deleteEvent(event.id); // Removed await
        }
    };

    if (currentView === 'day') {
        // Horizontal positioning for Day view
        const leftPosition = (startMinutes / (24 * 60)) * 100;
        const eventWidth = (durationMinutes / (24 * 60)) * 100;

        return (
            <div
                className='group absolute z-10 rounded-md p-1 text-xs font-medium text-white shadow-md' // Added group for hover effects
                style={{
                    backgroundColor: resourceColor,
                    top: '2px', // Small offset from top
                    height: 'calc(100% - 4px)', // Fill height
                    left: `${leftPosition}%`,
                    width: `${eventWidth}%`,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    minWidth: '40px'
                }}
                title={`${event.title} (${formatTime(event.start)} - ${formatTime(event.end)})`}>
                {event.title}
                <button
                    onClick={handleDelete}
                    className='absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100'
                    title='Delete Event'>
                    &times;
                </button>
            </div>
        );
    } else if (currentView === 'month-detailed' || currentView === 'quarter-detailed') {
        // Compact indicator for detailed month/quarter views
        return (
            <div
                className='group relative mb-0.5 overflow-hidden rounded-sm px-1 py-0.5 text-xs font-medium text-ellipsis whitespace-nowrap text-white shadow-sm' // Added group
                style={{
                    backgroundColor: resourceColor
                }}
                title={`${event.title} (${formatTime(event.start)} - ${formatTime(event.end)})`}>
                {event.title}
                <button
                    onClick={handleDelete}
                    className='absolute top-0 right-0 flex h-3 w-3 items-center justify-center rounded-full bg-red-600 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100'
                    title='Delete Event'>
                    &times;
                </button>
            </div>
        );
    } else {
        // 'week' view - simple block stacking
        return (
            <div
                className='group relative mb-1 rounded-md p-1 text-xs font-medium text-white shadow-sm' // Added group
                style={{
                    backgroundColor: resourceColor,
                    width: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}
                title={`${event.title} (${formatTime(event.start)} - ${formatTime(event.end)})`}>
                {event.title}
                <span className='ml-1 text-gray-100 opacity-80'>{formatTime(event.end)}</span>
                <button
                    onClick={handleDelete}
                    className='absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100'
                    title='Delete Event'>
                    &times;
                </button>
            </div>
        );
    }
};

export default Event