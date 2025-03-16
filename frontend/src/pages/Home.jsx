import React, { useState } from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WorkTwoToneIcon from '@mui/icons-material/WorkTwoTone';
import StadiumTwoToneIcon from '@mui/icons-material/StadiumTwoTone';
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import AutoAwesomeTwoToneIcon from '@mui/icons-material/AutoAwesomeTwoTone';
import { Outlet, useNavigate } from 'react-router';
import { createTheme } from '@mui/material/styles';
import LogoutIcon from '@mui/icons-material/Logout'; // Import logout icon
import { Avatar, Box, Tooltip, IconButton, Menu, MenuItem, Typography } from '@mui/material';

import axios from 'axios';
import { Settings } from '@mui/icons-material';
import { SettingsIcon } from 'lucide-react';

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
    const [anchorElUser, setAnchorElUser] = useState(null);

    const handleOpenUserMenu = (event) => {
        setAnchorElUser(event.currentTarget);
    };
    const handleCloseUserMenu = () => {
        setAnchorElUser(null);
    };

    const handleLogout = async () => {
        handleCloseUserMenu(); // Close menu first
        try {
            const res = await axios.post('http://localhost:5050/api/logout', {}, {
                withCredentials: true
            });
            if (res.status === 200) {
                navigate('/');
            }
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const settings = ['Logout'];

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
    ];



    return (
        <ReactRouterAppProvider
            navigation={NAVIGATION}
            branding={BRANDING}
            theme={Theme}
            defaultColorScheme="dark"
            colorSchemeStorageKey={null}
        >
            <Box sx={{
                position: 'absolute',
                right: 20,
                top: 16,
                zIndex: 9999
            }}>
                <Tooltip title="Open settings">
                    <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                        <SettingsIcon fontSize={"large"} />
                    </IconButton>
                </Tooltip>

                <Menu
                    sx={{ mt: '45px' }}
                    anchorEl={anchorElUser}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    keepMounted
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                >
                    {settings.map((setting) => (
                        <MenuItem
                            key={setting}
                            onClick={setting === 'Logout' ? handleLogout : handleCloseUserMenu}
                        >
                            <Typography textAlign="center">
                                {setting}
                            </Typography>
                        </MenuItem>
                    ))}
                </Menu>
            </Box>
            <Outlet />
        </ReactRouterAppProvider>
    );
}