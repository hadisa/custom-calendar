'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

const TimeDisplay: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timerId);
    }, []);

    // Format the current time and date
    const formattedTime = format(currentTime, 'h:mm:ss a'); // e.g., 1:00:00 PM
    const formattedDate = format(currentTime, 'EEEE, MMMM d, yyyy'); // e.g., Monday, May 27, 2024

    return (
        <div className='mb-4 p-4 bg-gray-100 rounded-lg shadow-sm text-center'>
            <div className='text-2xl font-bold text-gray-800'>{formattedTime}</div>
            <div className='text-sm text-gray-600'>{formattedDate}</div>
        </div>
    );
};

export default TimeDisplay; 