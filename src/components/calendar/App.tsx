'use client';

import React, { useState } from 'react';

import { cn } from '@/lib/utils';
import { Button } from '@/registry/new-york-v4/ui/button';
import { Calendar } from '@/registry/new-york-v4/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/registry/new-york-v4/ui/popover';
import { ToggleGroup, ToggleGroupItem } from '@/registry/new-york-v4/ui/toggle-group';

import { MainCalendar } from './MainCalendar';
import { ShiftForm } from './ShiftForm';
import { CalendarContext } from './components/context';
import { CalendarView, Resource, ShiftEvent, ShiftGroup } from './types';
import { addDays, addMonths, addQuarters, format, subMonths, subQuarters } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// Assuming you have a utility for class concatenation

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

    const getFormattedDateRange = () => {
        // This is a simplified example. For full date range display for week/month/quarter,
        // you'd need more complex logic using date-fns to determine the start and end of the visible range.
        return format(currentWeekStart, 'PPP');
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
                    <div className='flex items-center gap-2'>
                        <Button variant='outline' size='icon' onClick={goToPrevious} aria-label='Previous'>
                            <ChevronLeft className='h-4 w-4' />
                        </Button>
                        <Button variant='outline' size='icon' onClick={goToNext} aria-label='Next'>
                            <ChevronRight className='h-4 w-4' />
                        </Button>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={'outline'}
                                    className={cn(
                                        'w-[240px] justify-start text-left font-normal',
                                        !currentWeekStart && 'text-muted-foreground'
                                    )}>
                                    <CalendarIcon className='mr-2 h-4 w-4' />
                                    {currentWeekStart ? format(currentWeekStart, 'PPP') : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className='w-auto p-0'>
                                <Calendar
                                    mode='single'
                                    selected={currentWeekStart}
                                    onSelect={handleDateSelect}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <h2 className='ml-4 text-lg font-semibold'>{getFormattedDateRange()}</h2>
                    </div>
                    <ToggleGroup
                        type='single'
                        value={currentView}
                        onValueChange={(value: CalendarView) => setCurrentView(value)}
                        className='gap-1'>
                        <ToggleGroupItem value='day' aria-label='Toggle day view'>
                            Day
                        </ToggleGroupItem>
                        <ToggleGroupItem value='week' aria-label='Toggle week view'>
                            Week
                        </ToggleGroupItem>
                        <ToggleGroupItem value='month' aria-label='Toggle month view'>
                            Month
                        </ToggleGroupItem>
                        <ToggleGroupItem value='quarter' aria-label='Toggle quarter view'>
                            Quarter
                        </ToggleGroupItem>
                    </ToggleGroup>
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
