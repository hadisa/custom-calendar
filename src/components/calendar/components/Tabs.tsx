'use client';

import { cn } from '@/lib/utils';
import React from 'react';

interface Tab {
    id: string;
    label: string;
    icon?: React.ReactNode;
}

interface TabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
    return (
        <div className='mb-6 border-b border-gray-200'>
            <div className='flex space-x-8'>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            'group relative flex items-center space-x-2 border-b-2 py-4 text-sm font-medium transition-colors',
                            activeTab === tab.id
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        )}>
                        {tab.icon && <span className='h-5 w-5'>{tab.icon}</span>}
                        <span>{tab.label}</span>
                        {activeTab === tab.id && (
                            <span className='absolute -bottom-px left-0 h-0.5 w-full bg-blue-600' />
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Tabs; 