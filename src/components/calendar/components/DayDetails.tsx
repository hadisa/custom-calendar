'use client';

import React from 'react';
import { format } from 'date-fns';
import { ShiftEvent } from './type';

interface DayDetailsProps {
    date: Date;
    events: ShiftEvent[];
    onClose: () => void;
}

const DayDetails: React.FC<DayDetailsProps> = ({ date, events, onClose }) => {
    const dayEvents = events.filter(event => 
        event.start.toDateString() === date.toDateString()
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{format(date, 'EEEE, MMMM d, yyyy')}</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Events</h3>
                        {dayEvents.length > 0 ? (
                            <div className="space-y-2">
                                {dayEvents.map(event => (
                                    <div 
                                        key={event.id}
                                        className="p-3 rounded-lg border"
                                        style={{ 
                                            borderLeft: `4px solid ${event.color || '#3B82F6'}`,
                                            backgroundColor: `${event.color || '#3B82F6'}10`
                                        }}
                                    >
                                        <div className="font-medium">{event.title}</div>
                                        <div className="text-sm text-gray-600">
                                            {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">No events scheduled for this day</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DayDetails; 