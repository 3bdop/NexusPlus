// import * as React from 'react';
// import { AppProvider } from '@toolpad/core/AppProvider';
// import { DashboardLayout } from '@toolpad/core/DashboardLayout';
// import { extendTheme } from '@mui/material/styles';
// import { Outlet, useNavigate } from 'react-router-dom'
// import AutoAwesomeTwoToneIcon from '@mui/icons-material/AutoAwesomeTwoTone';;
// import StadiumTwoToneIcon from '@mui/icons-material/StadiumTwoTone';
// import WorkTwoToneIcon from '@mui/icons-material/WorkTwoTone';
// import {
//     Dashboard as DashboardIcon,
//     Event as EventIcon,
//     Build as BuildIcon,
//     Work as WorkIcon,
//     Settings as SettingsIcon,
//     ExitToApp as ExitToAppIcon,
// } from '@mui/icons-material';

// const demoTheme = extendTheme({
//     colorSchemes: { light: true, dark: true },
//     colorSchemeSelector: 'class',
//     breakpoints: {
//         values: {
//             xs: 0,
//             sm: 600,
//             md: 600,
//             lg: 1200,
//             xl: 1536,
//         },
//     },
// });

// const NAVIGATION = [
//     {
//         kind: 'header',
//         title: 'Main Menu',
//     },
//     {
//         segment: 'dashboard',
//         title: 'Dashboard',
//         icon: <DashboardIcon />,
//     },
//     {
//         segment: 'career-fair',
//         title: 'Career Fair',
//         icon: <StadiumTwoToneIcon />,
//     },
//     {
//         segment: 'avatar-creation',
//         title: 'Avatar Creation',
//         icon: <AutoAwesomeTwoToneIcon />,
//     },
//     {
//         segment: 'recommended-jobs',
//         title: 'Recommended Jobs',
//         icon: <WorkTwoToneIcon />,
//     },
//     {
//         kind: 'divider',
//     },
//     {
//         kind: 'header',
//         title: 'Account',
//     },
//     {
//         segment: 'settings',
//         title: 'Settings',
//         icon: <SettingsIcon />,
//     },
//     {
//         segment: 'logout',
//         title: 'Logout',
//         icon: <ExitToAppIcon />,
//     },
// ];

// export default function DashboardLayoutWrapper() {
//     const navigate = useNavigate();

//     const router = React.useMemo(() => ({
//         pathname: window.location.pathname,
//         searchParams: new URLSearchParams(window.location.search),
//         navigate: (path) => navigate(path),
//     }), [navigate]);

//     const BRANDING = {
//         title: 'NEXUSPLUS',

//     };

//     return (
//         <AppProvider
//             navigation={NAVIGATION}
//             router={router}
//             theme={demoTheme}
//         >
//             <DashboardLayout branding={BRANDING} >
//                 <Outlet />
//             </DashboardLayout>
//         </AppProvider>
//     );
// }

import * as React from 'react';
import { Outlet } from 'react-router';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';

export default function Layout() {
    return (
        <DashboardLayout>
            <PageContainer>
                <Outlet />
            </PageContainer>
        </DashboardLayout>
    );
}