import * as React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WorkTwoToneIcon from '@mui/icons-material/WorkTwoTone';
import StadiumTwoToneIcon from '@mui/icons-material/StadiumTwoTone';
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import AutoAwesomeTwoToneIcon from '@mui/icons-material/AutoAwesomeTwoTone';
import { Outlet, useNavigate } from 'react-router';
import { createTheme } from '@mui/material/styles';
import LogoutIcon from '@mui/icons-material/Logout'; // Import logout icon
import axios from 'axios'; // For making API calls

// const NAVIGATION = [
//     {
//         kind: 'header',
//         title: 'Main items',
//     },
//     {
//         segment: 'dashboard',
//         title: 'Dashboard',
//         icon: <DashboardIcon />,
//     },
//     {
//         segment: 'career-fair',
//         title: 'Join Event',
//         icon: <StadiumTwoToneIcon />,
//     },
//     {
//         segment: 'dashboard/avatar-creation',
//         title: 'Avatar Customization',
//         icon: <AutoAwesomeTwoToneIcon />,
//     },
//     {
//         segment: 'dashboard/recommended-jobs',
//         title: 'Recommended Jobs',
//         icon: <WorkTwoToneIcon />,
//     },
//     {
//         kind: 'divider',
//     },
//     {
//         kind: 'footer',
//         title: 'Logout',
//         icon: <LogoutIcon />,
//         onClick: () => { },
//     },
// ];
// Navigation items configuration

const BRANDING = {
    title: 'PLUS',
    logo: <img src='/ln3.png' />,
    homeUrl: '/dashboard',
};

const Theme = createTheme({
    cssVariables: {
        colorSchemeSelector: 'data-toolpad-color-scheme',
    },
    colorSchemes: { dark: true },
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 600,
            lg: 1200,
            xl: 1536,
        },
    },
    palette: {
        mode: 'dark',
        primary: {
            main: '#6745FCFF',
        },
        background: {
            default: '#080808',
            paper: '#1A1A1A',
        },
        text: {
            primary: '#FFFFFF',
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    margin: 0,
                    padding: 0,
                    background: 'linear-gradient(0deg, #080808FF, #5016ADFF 100%)',
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: 'fixed',
                    minHeight: '100vh',
                    overflow: 'hidden',
                },
                html: {
                    overflow: 'hidden',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#1A1A1AD5',
                    borderBottom: '1px solid rgb(147, 102, 219)',
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#1A1A1A',
                    borderRight: '1px solid rgb(147, 102, 219)',
                },
            },
        },
    },
});

export default function Home({ role }) {
    const navigate = useNavigate();
    console.log(role)
    // Logout method
    const logout = async () => {
        try {
            await axios.post('http://localhost:5050/api/logout', {}, { withCredentials: true });
            navigate('/'); // Redirect to the login page or home page after logout
        } catch (err) {
            console.error('Error during logout:', err);
        }
    };
    // Navigation configuration
    const NAVIGATION = [
        {
            kind: 'header',
            title: 'Main items',
        },
        {
            segment: 'dashboard',
            title: 'Dashboard',
            icon: <DashboardIcon />,
        },
        {
            segment: 'career-fair',
            title: 'Join Event',
            icon: <StadiumTwoToneIcon />,
        },
        {
            segment: 'dashboard/avatar-creation',
            title: 'Avatar Customization',
            icon: <AutoAwesomeTwoToneIcon />,
        },
        role === 'employer'
            ? {
                segment: 'dashboard/job-applications',
                title: 'Job Applications',
                icon: <WorkTwoToneIcon />,
            }
            : {
                segment: 'dashboard/recommended-jobs',
                title: 'Recommended Jobs',
                icon: <WorkTwoToneIcon />,
            },
        {
            kind: 'divider',
        },
        {
            kind: 'footer',
            title: 'Logout',
            icon: <LogoutIcon />,
            onClick: logout,
        },
    ];



    // Add the logout method to the footer navigation item
    const navigationWithLogout = NAVIGATION.map((item) => {
        if (item.kind === 'footer') {
            return {
                ...item,
                onClick: logout, // Attach the logout method
            };
        }
        return item;
    });

    return (
        <ReactRouterAppProvider
            navigation={navigationWithLogout}
            branding={BRANDING}
            theme={Theme}
            defaultColorScheme="dark"
            colorSchemeStorageKey={null}
        >
            <Outlet />
        </ReactRouterAppProvider>
    );
}