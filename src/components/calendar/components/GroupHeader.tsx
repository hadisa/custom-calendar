import { ShiftGroup } from './type';

export const GroupHeader: React.FC<{ group: ShiftGroup; onToggle: () => void }> = ({ group, onToggle }) => {
    return (
        <div
            className='flex w-32 flex-shrink-0 items-center justify-between border-r border-gray-300 bg-amber-600 p-3'
            style={{ backgroundColor: 'var(--group-shift)' }}
            onClick={onToggle}>
            <div className='flex items-center'>
                <div className='mr-2 h-3 w-3 rounded-full' style={{ backgroundColor: group.color || '#6b7280' }} />
                <span className='truncate text-sm font-bold text-gray-900'>{group.name}</span>
            </div>
            <svg
                className={`h-4 w-4 transform text-gray-700 transition-transform duration-200 ${
                    group.isExpanded ? 'rotate-90' : ''
                }`}
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
                xmlns='http://www.w3.org/2000/svg'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 5l7 7-7 7' />
            </svg>
        </div>
    );
};
