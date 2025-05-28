import HomePage from '@/app/(delete-this-and-modify-page.tsx)/HomePage';
import { AppComponent } from '@/components/calendar/App';
import AppCalendar from '@/components/calendar/components/custom-calendar';
import Apps from '@/components/calendar/custom-calendar';

/**
 * The main page component that renders the HomePage component.
 *
 * @returns {JSX.Element} The rendered HomePage component.
 */
const Page = () => {
    // return  <Apps />;
    return <AppCalendar />;
   

    //  <HomePage />;
};

export default Page;
