'use client';

import React from 'react';
import { format, isSameDay } from 'date-fns';
import { Resource, ShiftEvent } from './type';
import { cn } from '@/lib/utils';

interface ResourceRowProps {
    resource: Resource;
    daysInView: Date[];
    currentView: 'week' | 'day' | 'year' | 'quarter' | 'month' | 'month-detailed' | 'quarter-detailed';
    onCellClick: (date: Date, event: React.MouseEvent, resourceId?: string, groupName?: string) => void;
}

const ResourceRow: React.FC<ResourceRowProps> = ({ resource, daysInView, currentView, onCellClick }) => {
    // Get events for this resource
    const events = resource.events || [];

    // Calculate event positions
    const getEventLeftPosition = (start: Date, dayStart: Date) => {
        const hours = start.getHours() + start.getMinutes() / 60;
        return hours * 60; // 60px per hour
    };

    const getEventWidth = (start: Date, end: Date) => {
        const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // duration in hours
        return duration * 60; // 60px per hour
    };

    return (
        <div className='flex w-full border-b border-gray-200 last:border-b-0'>
            {/* Resource Name Cell */}
            <div
                className='w-32 flex-shrink-0 border-r border-gray-200 p-3 text-sm font-semibold text-gray-600'
                style={{ backgroundColor: resource.color + '20' }}>
                {resource.name}
            </div>

            {/* Events Cells */}
            <div className='flex flex-grow overflow-x-auto'>
                <div
                    className='flex'
                    style={{
                        minWidth: currentView === 'day' ? '1440px' : `${daysInView.length * 200}px`
                    }}>
                    {daysInView.map((day) => (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                'relative cursor-pointer border-r border-gray-200 p-2 text-xs text-gray-700 last:border-r-0',
                                currentView === 'day' ? 'flex-none' : 'flex-none'
                            )}
                            style={{
                                height: '50px',
                                minHeight: '50px',
                                width: currentView === 'day' ? '1440px' : '200px',
                                minWidth: currentView === 'day' ? '1440px' : '200px'
                            }}
                            onClick={(e) => onCellClick(day, e, resource.id)}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onCellClick(day, e, resource.id);
                            }}>
                            {/* Render events for this day and resource */}
                            {events
                                .filter((event) => isSameDay(event.start, day))
                                .map((event) => (
                                    <div
                                        key={event.id}
                                        className="absolute rounded-md p-1 text-xs text-white truncate"
                                        style={{
                                            backgroundColor: event.color || '#3B82F6',
                                            left: `${getEventLeftPosition(event.start, day)}px`,
                                            width: `${getEventWidth(event.start, event.end)}px`,
                                            top: '2px',
                                            height: 'calc(100% - 4px)'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onCellClick(day, e, resource.id);
                                        }}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            onCellClick(day, e, resource.id);
                                        }}>
                                        {event.title}
                                    </div>
                                ))}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ResourceRow;
