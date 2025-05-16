"use client"
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addDays, addMonths, addQuarters, subMonths, subQuarters } from 'date-fns';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Calendar } from '@/registry/new-york-v4/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/new-york-v4/ui/popover';
import { MainCalendar } from './MainCalendar';
import { ShiftForm } from './ShiftForm';
import { CalendarContext } from './components/context';
import { CalendarView, ShiftEvent, ShiftGroup, Resource } from './types';

// Sample data
const initialShiftGroups: ShiftGroup[] = [
    { id: '1', name: 'Nursing', isExpanded: true },
    { id: '2', name: 'Doctors', isExpanded: true },
    { id: '3', name: 'Support Staff', isExpanded: true }
];

const initialResources: Resource[] = [
    { id: '1', name: 'John Doe', color: '#4CAF50', groupId: '1' },
    { id: '2', name: 'Jane Smith', color: '#2196F3', groupId: '1' },
    { id: '3', name: 'Dr. Johnson', color: '#9C27B0', groupId: '2' },
    { id: '4', name: 'Dr. Williams', color: '#FF9800', groupId: '2' },
    { id: '5', name: 'Mike Brown', color: '#F44336', groupId: '3' }
];

export const AppComponent: React.FC = () => {
    const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
    const [currentView, setCurrentView] = useState<CalendarView>('week');
    const [shiftGroups, setShiftGroups] = useState<ShiftGroup[]>(initialShiftGroups);
    const [resources] = useState<Resource[]>(initialResources);
    const [events, setEvents] = useState<ShiftEvent[]>([]);
    const [isShiftFormOpen, setIsShiftFormOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [popupPosition, setPopupPosition] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
    const [defaultResourceId, setDefaultResourceId] = useState<string>();
    const [groupNameForOpenShift, setGroupNameForOpenShift] = useState<string>();

    const openAddShiftForm = (
        date: Date | null = null,
        event?: React.MouseEvent,
        resourceId?: string,
        groupName?: string
    ) => {
        setSelectedDate(date);
        if (event) {
            setPopupPosition({ x: event.clientX, y: event.clientY });
        } else {
            setPopupPosition({ x: null, y: null });
        }
        setDefaultResourceId(resourceId);
        setGroupNameForOpenShift(groupName);
        setIsShiftFormOpen(true);
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            setCurrentWeekStart(date);
        }
    };

    const addEvent = (newEvent: Omit<ShiftEvent, 'id'>) => {
        const event: ShiftEvent = {
            ...newEvent,
            id: uuidv4()
        };
        setEvents((prev) => [...prev, event]);
    };

    const toggleGroupExpansion = (groupId: string) => {
        setShiftGroups((prev) =>
            prev.map((group) => (group.id === groupId ? { ...group, isExpanded: !group.isExpanded } : group))
        );
    };

    const deleteEvent = (eventId: string) => {
        setEvents((prev) => prev.filter((event) => event.id !== eventId));
    };

    const goToPrevious = () => {
        switch (currentView) {
            case 'day':
            case 'week':
                setCurrentWeekStart((prev) => addDays(prev, -7));
                break;
            case 'month':
            case 'month-detailed':
                setCurrentWeekStart((prev) => subMonths(prev, 1));
                break;
            case 'quarter':
            case 'quarter-detailed':
                setCurrentWeekStart((prev) => subQuarters(prev, 1));
                break;
            default:
                break;
        }
    };

    const goToNext = () => {
        switch (currentView) {
            case 'day':
            case 'week':
                setCurrentWeekStart((prev) => addDays(prev, 7));
                break;
            case 'month':
            case 'month-detailed':
                setCurrentWeekStart((prev) => addMonths(prev, 1));
                break;
            case 'quarter':
            case 'quarter-detailed':
                setCurrentWeekStart((prev) => addQuarters(prev, 1));
                break;
            default:
                break;
        }
    };

    return (
        <CalendarContext.Provider
            value={{
                shiftGroups,
                resources,
                events,
                addEvent,
                toggleGroupExpansion,
                deleteEvent
            }}>
            <div className='flex h-screen flex-col'>
                <div className='flex items-center justify-between border-b border-gray-200 bg-white p-4'>
                    <div className='flex items-center gap-4'>
                        <Button variant='outline' onClick={goToPrevious}>
                            Previous
                        </Button>
                        <Button variant='outline' onClick={goToNext}>
                            Next
                        </Button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant='outline'>Select Date</Button>
                            </PopoverTrigger>
                            <PopoverContent className='w-auto p-0'>
                                <Calendar mode='single' selected={currentWeekStart} onSelect={handleDateSelect} />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className='flex items-center gap-2'>
                        <Button
                            variant={currentView === 'week' ? 'default' : 'outline'}
                            onClick={() => setCurrentView('week')}>
                            Week
                        </Button>
                        <Button
                            variant={currentView === 'day' ? 'default' : 'outline'}
                            onClick={() => setCurrentView('day')}>
                            Day
                        </Button>
                        <Button
                            variant={currentView === 'month' ? 'default' : 'outline'}
                            onClick={() => setCurrentView('month')}>
                            Month
                        </Button>
                        <Button
                            variant={currentView === 'quarter' ? 'default' : 'outline'}
                            onClick={() => setCurrentView('quarter')}>
                            Quarter
                        </Button>
                    </div>
                </div>
                <div className='flex-1 overflow-auto'>
                    <MainCalendar
                        currentWeekStart={currentWeekStart}
                        currentView={currentView}
                        onCellClick={openAddShiftForm}
                    />
                </div>
                <ShiftForm
                    isOpen={isShiftFormOpen}
                    onClose={() => setIsShiftFormOpen(false)}
                    initialDate={selectedDate}
                    popupX={popupPosition.x}
                    popupY={popupPosition.y}
                    defaultResourceId={defaultResourceId}
                    groupNameForOpenShift={groupNameForOpenShift}
                />
            </div>
        </CalendarContext.Provider>
    );
}; 