import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/registry/new-york-v4/ui/tabs';

import AppCalendar from './custom-calendar';
import AppCalendarBasic from './custom-calendar-basic';

export function TabsCalendarDemo() {
    return (
        <div className='flex w-full'>
            <Tabs defaultValue='account' className='w-full'>
                <TabsList>
                    <TabsTrigger value='account'>pro Calendar</TabsTrigger>
                    <TabsTrigger value='password'>Basic Calendar</TabsTrigger>
                </TabsList>
                <TabsContent className='w-full' value='account'>
                    <AppCalendar />;
                </TabsContent>
                <TabsContent className='w-full' value='password'>
                    <AppCalendarBasic />
                </TabsContent>
            </Tabs>
        </div>
    );
}
