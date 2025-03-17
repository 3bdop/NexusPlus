import React, { useState } from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WorkTwoToneIcon from '@mui/icons-material/WorkTwoTone';
import StadiumTwoToneIcon from '@mui/icons-material/StadiumTwoTone';
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import AutoAwesomeTwoToneIcon from '@mui/icons-material/AutoAwesomeTwoTone';
import { Outlet, useNavigate } from 'react-router';
import { createTheme } from '@mui/material/styles';
import { Box, Tooltip, IconButton, Menu, MenuItem, Typography } from '@mui/material';
import SmartToyTwoToneIcon from '@mui/icons-material/SmartToyTwoTone';
import styled from 'styled-components'

import Chatbot from 'react-chatbot-kit';
import 'react-chatbot-kit/build/main.css';
import config from '../bot/config'
import ActionProvider from '../bot/ActionProvider';
import MessageParser from '../bot/MessageParser';
import ChatbotStyle from '../bot/ChatbotStyle.css'


import axios from 'axios';
import MoreVertTwoToneIcon from '@mui/icons-material/MoreVertTwoTone';

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

    const [showChatbot, setShowChatbot] = useState(false);
    const toggleChatbot = () => {
        setShowChatbot(!showChatbot);
    };


    const handleLogout = async () => {
        handleCloseUserMenu(); // Close menu first
        try {
            const res = await axios.post('http://localhost:5050/api/logout', {}, {
                withCredentials: true
            });
            if (res.status === 200) {
                localStorage.clear()
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

    const ChatButton = styled.button`
    background: #E3E3E3FF;
    border: none;
    border-radius: 100%;
    width: 60px;
    height: 60px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    transition: transform 0.2s ease, background 0.2s ease;

    &:hover {
        transform: scale(1.2);
        background: #c0c0c0;
    }
`;

    const saveMessages = (messages) => {
        localStorage.setItem('chat_messages', JSON.stringify(messages));
    };

    const loadMessages = () => {
        const messages = localStorage.getItem('chat_messages');
        return messages ? JSON.parse(messages) : [];
    };
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
                <Tooltip title="Actions">
                    <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                        <MoreVertTwoToneIcon fontSize={"medium"} />
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
            <div style={{
                position: 'fixed',
                bottom: '20px',
                right: '65px',
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: '15px'
            }}>
                {showChatbot && (
                    <>
                        <Chatbot
                            config={config}
                            messageParser={MessageParser}
                            actionProvider={ActionProvider}
                            placeholderText='Ask Daleel !'
                            // runInitialMessagesWithHistory
                            saveMessages={saveMessages}
                            messageHistory={loadMessages()}
                        />
                    </>
                )}

                {/* Custom chat button */}
                <ChatButton onClick={toggleChatbot}>
                    <SmartToyTwoToneIcon style={{ color: 'black', fontSize: '28px' }} />
                </ChatButton>
            </div>
            <Outlet />
        </ReactRouterAppProvider>
    );
}