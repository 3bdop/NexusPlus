import * as React from 'react';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { extendTheme } from '@mui/material/styles';
import { Outlet, useNavigate } from 'react-router-dom';
import {
    Dashboard as DashboardIcon,
    ListAlt as RequestsIcon,
    People as AttendeesIcon,
    Settings as SettingsIcon,
    ExitToApp as ExitToAppIcon,
} from '@mui/icons-material';

const employerTheme = extendTheme({
    colorSchemes: { light: true, dark: true },
    colorSchemeSelector: 'class',
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 600,
            lg: 1200,
            xl: 1536,
        },
    },
});

const EMPLOYER_NAVIGATION = [
    {
        kind: 'header',
        title: 'Employer Portal',
    },
    {
        segment: 'dashboard',
        title: 'Dashboard',
        icon: <DashboardIcon />,
    },
    {
        segment: 'requests',
        title: 'View Requests',
        icon: <RequestsIcon />,
    },
    {
        kind: 'divider',
    },
    {
        kind: 'header',
        title: 'Account',
    },
    {
        segment: 'settings',
        title: 'Settings',
        icon: <SettingsIcon />,
    },
    {
        segment: 'logout',
        title: 'Logout',
        icon: <ExitToAppIcon />,
    },
];

export default function EmployerLayout() {
    const navigate = useNavigate();

    const router = React.useMemo(() => ({
        pathname: window.location.pathname,
        searchParams: new URLSearchParams(window.location.search),
        navigate: (path) => navigate(path),
    }), [navigate]);

    return (
        <AppProvider
            navigation={EMPLOYER_NAVIGATION}
            router={router}
            theme={employerTheme}
        >
            <DashboardLayout>
                <Outlet />
            </DashboardLayout>
        </AppProvider>
    );
}