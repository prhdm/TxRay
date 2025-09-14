import React from 'react';
import InventoryPage from "@/features/inventory/components/InventoryPage";
import AnalyticsPage from "@/features/analytics/components/AnalyticsPage";
import ProfilePage from "@/features/profile/components/ProfilePage";
import {NavigationPage} from "@/features/navigation/lib/NavigationContext";

interface PageRendererProps {
    currentPage: NavigationPage;
}

export const PageRenderer: React.FC<PageRendererProps> = ({currentPage}) => {
    switch (currentPage) {
        case 'inventory':
            return <InventoryPage/>;
        case 'analytics':
            return <AnalyticsPage/>;
        case 'profile':
            return <ProfilePage/>;
        default:
            return <InventoryPage/>;
    }
};
