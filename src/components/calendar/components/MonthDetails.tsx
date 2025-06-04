'use client';

import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay } from 'date-fns';
import { ShiftEvent } from './type';

interface MonthDetailsProps {
    date: Date;
    events: ShiftEvent[];
    onClose: () => void;
    onDayClick: (date: Date) => void;
}

const MonthDetails: React.FC<MonthDetailsProps> = ({ date, events, onClose, onDayClick }) => {
    const startOfCurrentMonth = startOfMonth(date);
    const endOfCurrentMonth = endOfMonth(date);
    const startDay = startOfWeek(startOfCurrentMonth, { weekStartsOn: 0 });
    const endDay = endOfWeek(endOfCurrentMonth, { weekStartsOn: 0 });

    let currentDay = startDay;
    const allDaysInMonthView: Date[] = [];
    while (currentDay <= endDay) {
        allDaysInMonthView.push(currentDay);
        currentDay = addDays(currentDay, 1);
    }

    const daysOfWeekHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{format(date, 'MMMM yyyy')}</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-4">
                    <div className="grid grid-cols-7 gap-1">
                        {daysOfWeekHeaders.map((day) => (
                            <div key={day} className="text-center font-semibold text-gray-600 py-2">
                                {day}
                            </div>
                        ))}
                        {allDaysInMonthView.map((day) => {
                            const dayEvents = events.filter(event => isSameDay(event.start, day));
                            return (
                                <div
                                    key={day.toISOString()}
                                    onClick={() => onDayClick(day)}
                                    className={`
                                        min-h-[100px] p-2 border rounded-md cursor-pointer
                                        ${isSameMonth(day, date) ? 'bg-white' : 'bg-gray-50 text-gray-400'}
                                        hover:bg-gray-100 transition-colors
                                    `}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="text-sm font-medium">{format(day, 'd')}</span>
                                        {dayEvents.length > 0 && (
                                            <span className="text-xs bg-blue-100 text-blue-800 px-1 rounded">
                                                {dayEvents.length}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-1 space-y-1">
                                        {dayEvents.slice(0, 2).map(event => (
                                            <div
                                                key={event.id}
                                                className="text-xs p-1 rounded truncate"
                                                style={{
                                                    backgroundColor: `${event.color || '#3B82F6'}20`,
                                                    borderLeft: `2px solid ${event.color || '#3B82F6'}`
                                                }}
                                            >
                                                {event.title}
                                            </div>
                                        ))}
                                        {dayEvents.length > 2 && (
                                            <div className="text-xs text-gray-500">
                                                +{dayEvents.length - 2} more
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MonthDetails; 