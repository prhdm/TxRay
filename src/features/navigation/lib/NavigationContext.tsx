"use client";

import React, {createContext, ReactNode, useContext, useState} from 'react';

export type NavigationPage = 'inventory' | 'analytics' | 'profile';

interface NavigationContextType {
    currentPage: NavigationPage;
    setCurrentPage: (page: NavigationPage) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};

interface NavigationProviderProps {
    children: ReactNode;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({children}) => {
    const [currentPage, setCurrentPage] = useState<NavigationPage>('inventory');

    return (
        <NavigationContext.Provider value={{currentPage, setCurrentPage}}>
            {children}
        </NavigationContext.Provider>
    );
};
