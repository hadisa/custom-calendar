/**
 * @component Calendar
 * The main calendar component that displays the week view,
 * including date headers and resource columns with their respective events.
 * @param {Object} props - The component props.
 * @param {Date} props.currentWeekStart - A Date object representing the start of the week to display.
 */
const Calendar: React.FC<{ currentWeekStart: Date }> = ({ currentWeekStart }) => {
    const { resources } = useCalendar();
    const daysInWeek = getDaysInWeek(currentWeekStart);

    return (
        <div className='flex flex-col overflow-hidden rounded-lg border border-gray-300 bg-white shadow-md'>
            {/* Calendar Header: Days of the Week */}
            <div className='flex border-b border-gray-200 bg-gray-100'>
                <div className='w-32 flex-shrink-0 border-r border-gray-200 p-3 text-sm font-semibold text-gray-600'>
                    Resources
                </div>
                {daysInWeek.map((day) => (
                    <div
                        key={day.toISOString()}
                        className='flex-1 border-r border-gray-200 p-3 text-center text-sm font-semibold text-gray-600'>
                        {formatDateHeader(day)}
                    </div>
                ))}
            </div>

            {/* Calendar Body: Resource Rows */}
            <div className='flex-grow'>
                {resources.map((resource) => (
                    <ResourceColumn key={resource.id} resource={resource} daysInWeek={daysInWeek} />
                ))}
            </div>
        </div>
    );
};
export default Calendar;
