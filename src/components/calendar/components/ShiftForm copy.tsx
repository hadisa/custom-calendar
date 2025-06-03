
"use client"
import { format, parseISO } from "date-fns";

import { useState, useRef, useEffect } from "react";

import { useCalendar } from "./context";
import { Button } from "@/registry/new-york-v4/ui/button";

/**
 * @component ShiftForm
 * A form component to add new shift events.
 */
const ShiftForm: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    initialDate: Date | null;
    popupX: number | null;
    popupY: number | null;
    defaultResourceId?: string;
    groupNameForOpenShift?: string;
}> = ({ isOpen, onClose, initialDate, popupX, popupY, defaultResourceId, groupNameForOpenShift }) => {
    const { resources, addEvent } = useCalendar();
    const [resourceId, setResourceId] = useState<string>(defaultResourceId || resources[0]?.id || '');
    const [title, setTitle] = useState<string>('');
    const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState<string>('09:00');
    const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [endTime, setEndTime] = useState<string>('17:00');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setResourceId(defaultResourceId || resources[0]?.id || ''); // Set default resource on open
            setTitle('');
            const dateToUse = initialDate || new Date(); // Use initialDate if provided, else current date
            setStartDate(format(dateToUse, 'yyyy-MM-dd'));
            setStartTime('09:00'); // Default start time
            setEndDate(format(dateToUse, 'yyyy-MM-dd'));
            setEndTime('17:00'); // Default end time
            setErrorMessage('');
        }
    }, [isOpen, resources, initialDate, defaultResourceId]); // Add defaultResourceId to dependencies

    useEffect(() => {
        if (isOpen && modalRef.current && popupX !== null && popupY !== null) {
            const modalElement = modalRef.current;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Get modal dimensions (after it's rendered)
            // Use clientWidth/clientHeight for current rendered dimensions
            const modalWidth = modalElement.offsetWidth;
            const modalHeight = modalElement.offsetHeight;

            // Calculate desired position
            let newLeft = popupX;
            let newTop = popupY;

            // Adjust if too close to right edge
            if (newLeft + modalWidth > viewportWidth - 20) {
                // 20px padding from right
                newLeft = viewportWidth - modalWidth - 20;
            }
            // Adjust if too close to bottom edge
            if (newTop + modalHeight > viewportHeight - 20) {
                // 20px padding from bottom
                newTop = viewportHeight - modalHeight - 20;
            }

            // Ensure it doesn't go off left/top edge
            if (newLeft < 20) newLeft = 20;
            if (newTop < 20) newTop = 20;

            modalElement.style.position = 'fixed'; // Ensure it's fixed for direct positioning
            modalElement.style.left = `${newLeft}px`;
            modalElement.style.top = `${newTop}px`;
            modalElement.style.transform = 'none'; // Remove any previous centering transform
        }
    }, [isOpen, popupX, popupY]); // Re-run when these change

    const handleSubmit = (e: React.FormEvent) => {
        // Removed async
        e.preventDefault();
        setErrorMessage('');

        const startDateTime = parseISO(`${startDate}T${startTime}:00`);
        const endDateTime = parseISO(`${endDate}T${endTime}:00`);

        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
            setErrorMessage('Invalid date or time format.');

            return;
        }

        if (endDateTime <= startDateTime) {
            setErrorMessage('End time must be after start time.');

            return;
        }

        if (!resourceId || !title.trim()) {
            setErrorMessage('Please select a resource and enter a title.');

            return;
        }

        let finalTitle = title.trim();
        if (resourceId === 'open-shift-resource-id' && groupNameForOpenShift) {
            finalTitle = `Open Shift for ${groupNameForOpenShift}: ${finalTitle}`;
        }

        addEvent({
            resourceId,
            title: finalTitle, // Use the potentially modified title
            start: startDateTime,
            end: endDateTime
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className='bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-gray-600'>
            {' '}
            {/* Backdrop */}
            <div ref={modalRef} className='w-full max-w-md rounded-lg bg-white p-6 shadow-xl'>
                {' '}
                {/* Changed to relative positioning, will be fixed by JS */}
                <h2 className='mb-4 text-2xl font-bold text-gray-800'>Add New Shift</h2>
                <form onSubmit={handleSubmit}>
                    {errorMessage && (
                        <div
                            className='relative mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700'
                            role='alert'>
                            <span className='block sm:inline'>{errorMessage}</span>
                        </div>
                    )}

                    <div className='mb-4'>
                        <label htmlFor='resource' className='mb-2 block text-sm font-semibold text-gray-700'>
                            Resource:
                        </label>
                        <select
                            id='resource'
                            className='w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none'
                            value={resourceId}
                            onChange={(e) => setResourceId(e.target.value)}
                            required
                            disabled={defaultResourceId === 'open-shift-resource-id'} // Disable if it's an open shift
                        >
                            {resources.map((res) => (
                                <option key={res.id} value={res.id}>
                                    {res.name} (Group: {resources.find((r) => r.id === res.id)?.groupId || 'N/A'}){' '}
                                    {/* Show group name for context */}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className='mb-4'>
                        <label htmlFor='title' className='mb-2 block text-sm font-semibold text-gray-700'>
                            Shift Title:
                        </label>
                        <input
                            type='text'
                            id='title'
                            className='w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none'
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder='e.g., Morning Shift, Meeting'
                            required
                        />
                    </div>

                    <div className='mb-4 grid grid-cols-2 gap-4'>
                        <div>
                            <label htmlFor='startDate' className='mb-2 block text-sm font-semibold text-gray-700'>
                                Start Date:
                            </label>
                            <input
                                type='date'
                                id='startDate'
                                className='w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none'
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor='startTime' className='mb-2 block text-sm font-semibold text-gray-700'>
                                Start Time:
                            </label>
                            <input
                                type='time'
                                id='startTime'
                                className='w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none'
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className='mb-6 grid grid-cols-2 gap-4'>
                        <div>
                            <label htmlFor='endDate' className='mb-2 block text-sm font-semibold text-gray-700'>
                                End Date:
                            </label>
                            <input
                                type='date'
                                id='endDate'
                                className='w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none'
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor='endTime' className='mb-2 block text-sm font-semibold text-gray-700'>
                                End Time:
                            </label>
                            <input
                                type='time'
                                id='endTime'
                                className='w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none'
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className='flex justify-end gap-2'>
                        <Button type='button' variant='secondary' onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type='submit'>Add Shift</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShiftForm;