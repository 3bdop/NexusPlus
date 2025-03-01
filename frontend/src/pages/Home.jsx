// import React, { useEffect, useState } from 'react'
// import { Link, NavLink, useNavigate } from 'react-router-dom'
// import { Avatar } from "@readyplayerme/visage";
// import { Sparkles } from '@react-three/drei';
// import axios from 'axios';
// import styled, { keyframes } from 'styled-components';

// export default function Home() {
//     const [avatarUrl, setAvatarUrl] = useState(null);
//     const [username, setUsername] = useState(null)
//     const [isLoading, setLoading] = useState(true)
//     const [isAvatarLoaded, setIsAvatarLoaded] = useState(false)
//     const navigate = useNavigate();

//     useEffect(() => {
//         const fetchUserData = async () => {
//             try {
//                 // Step 1: Fetch session data to get userId
//                 const sessionResponse = await axios.get(
//                     'http://localhost:5050/api/get-session',
//                     { withCredentials: true } // Include cookies in the request
//                 );
//                 setUsername(sessionResponse.data.username)
//                 const userId = sessionResponse.data.userId;
//                 if (!userId) {
//                     throw new Error('No user ID found in session data.');
//                 }

//                 // Step 2: Fetch avatar URL using userId
//                 const avatarResponse = await axios.get(
//                     `http://localhost:5050/api/get-avatarUrl/${userId}`,
//                     { withCredentials: true }
//                 );

//                 setAvatarUrl(avatarResponse.data.avatarUrl);
//                 setLoading(false)
//             } catch (err) {
//                 console.error('Error fetching user data:', err);
//                 setError(err.message);

//                 // Redirect to login if unauthorized
//                 if (err.response?.status === 401) {
//                     navigate('/');
//                 }
//             }
//         };

//         fetchUserData();
//     }, [navigate]);

//     const logout = async () => {
//         try {
//             await axios.post('http://localhost:5050/api/logout', {}, { withCredentials: true });
//             navigate('/'); // Redirect to the login page or home page after logout
//         } catch (err) {
//             console.error('Error during logout:', err);
//         }
//     };

//     const StyledNavLink = styled(NavLink)`
//     position: relative;
//     padding: 10px 20px;
//     color: white;
//     text-decoration: none;
//     font-size: 1.2rem;
//     font-weight: 600;
//     font-family: system-ui;
//     transition: all 0.3s ease;

//     &::before {
//       content: '';
//       position: absolute;
//       top: 0;
//       left: 0;
//       width: 100%;
//       height: 100%;
//       background: linear-gradient(45deg, #00a3ff, #ff69b4);
//       opacity: 0;
//       border-radius: 5px;
//       transition: opacity 0.3s ease;
//       z-index: -1;
//     }
//     &:hover {
//             transform: translateY(-2px);
//             color: white;
//             text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);

//             &::before {
//                 opacity: 0.8;
//                 box-shadow: 0 0 20px rgba(0, 163, 255, 0.5),
//                             0 0 30px rgba(255, 105, 180, 0.3);
//             }
//         }
//      `;

//     // Keyframes for the loading animation
//     const spin = keyframes`
//         0% { transform: rotate(0deg); }
//         100% { transform: rotate(360deg); }
//     `;

//     const LoadingSpinner = styled.div`
//         border: 4px solid rgba(255, 255, 255, 0.3);
//         border-top: 4px solid #00a3ff;
//         border-radius: 50%;
//         width: 40px;
//         height: 40px;
//         animation: ${spin} 1s linear infinite;
//         position: absolute;
//         top: 50%;
//         left: 50%;
//         transform: translate(-50%, -50%);
//     `;

//     // Keyframes for the fade-in animation
//     const fadeIn = keyframes`
//         0% { opacity: 0; }
//         100% { opacity: 1; }
//     `;

//     const AvatarContainer = styled.div`
//         width: 100%;
//         height: 100%;
//         display: flex;
//         justify-content: center;
//         align-items: center;
//         opacity: ${({ isAvatarLoaded }) => (isAvatarLoaded ? 1 : 0)};
//         animation: ${fadeIn} 10s ease-in-out;
//     `;

//     function capitalizeFirstLetter(val) {
//         return String(val).charAt(0).toUpperCase() + String(val).slice(1);
//     }
//     return (
//         <>
//             <div style={{
//                 height: '100vh',
//                 width: '100vw',
//                 display: 'flex',
//                 flexDirection: 'column',
//                 alignItems: 'center',
//                 justifyContent: 'center',
//                 background: 'linear-gradient(0deg, #080808FF , #5016ADFF 100%)',
//                 position: 'relative'
//             }}>
//                 <div style={{
//                     zIndex: 1, textAlign: 'center'
//                 }}>
//                     <h2 style={{
//                         color: 'white', zIndex: 1, fontFamily: "cursive"
//                     }}>
//                         Welcome {capitalizeFirstLetter(username)} !
//                     </h2>
//                     <p style={{ color: 'whitesmoke', fontFamily: 'cursive' }}>This is your main digital-twin🤩</p>
//                 </div>
//                 <div style={{
//                     position: 'absolute',
//                     left: '30px',
//                     top: '50%',
//                     transform: 'translateY(-50%)',
//                     display: 'flex',
//                     flexDirection: 'column',
//                     gap: '10px',
//                     zIndex: 1
//                 }}>
//                     <StyledNavLink to={""}>
//                         Dashboard🌟
//                     </StyledNavLink>
//                     <StyledNavLink to={"/career-fair"}>
//                         Join Event🚀
//                     </StyledNavLink>
//                     <StyledNavLink to={"/avatar-creation"}>
//                         Customize your digital twin🦹
//                     </StyledNavLink>
//                     <StyledNavLink to={"/recommended-jobs"}>
//                         View your recommended jobs📝
//                     </StyledNavLink>
//                     <StyledNavLink onClick={logout}>
//                         Logout 👋
//                     </StyledNavLink>
//                 </div>
//                 <div style={{
//                     width: '100%',
//                     height: '100%',
//                     display: 'flex',
//                     justifyContent: 'center',
//                     alignItems: 'center',
//                 }}>
//                     {isLoading ? (
//                         <LoadingSpinner />
//                     ) : (
//                         <>

//                             {/* <AvatarContainer isAvatarLoaded={isAvatarLoaded}> */}
//                             <Avatar
//                                 modelSrc={avatarUrl + "?morphTargets=ARKit,Eyes Extra"}
//                                 headMovement={true}
//                                 animationSrc={"/animations/M_Standing_Idle_001.fbx"}
//                                 environment={"soft"}
//                                 shadows={true}
//                                 emotion={"happy"}
//                                 cameraInitialDistance={0.7}
//                                 cameraZoomTarget={[-0.11, 0, 3.2]}
//                                 idleRotation
//                             >
//                                 <Sparkles
//                                     color={"white"}
//                                     count={80}
//                                     opacity={0.5}
//                                     position={[0, 0.61, 0]}
//                                     scale={2}
//                                     size={3.5}
//                                     speed={0.25}
//                                 />
//                             </Avatar>
//                             {/* </AvatarContainer> */}
//                         </>
//                     )}
//                 </div>
//             </div>

//         </>
//     )
// }

// import React, { useEffect, useState } from 'react';
// import { useOutletContext } from 'react-router-dom';
// import { Avatar } from "@readyplayerme/visage";
// import { Sparkles } from '@react-three/drei';
// import { Box, CircularProgress, useTheme } from '@mui/material';

// export default function Home() {
//     const [avatarUrl, setAvatarUrl] = useState(null);
//     const [username, setUsername] = useState(null);
//     const [isLoading, setLoading] = useState(true);
//     const theme = useTheme();

//     // Get the outlet context if needed
//     const context = useOutletContext();

//     useEffect(() => {
//         const fetchUserData = async () => {
//             try {
//                 const sessionResponse = await axios.get(
//                     'http://localhost:5050/api/get-session',
//                     { withCredentials: true }
//                 );
//                 setUsername(sessionResponse.data.username);
//                 const userId = sessionResponse.data.userId;

//                 const avatarResponse = await axios.get(
//                     `http://localhost:5050/api/get-avatarUrl/${userId}`,
//                     { withCredentials: true }
//                 );
//                 setAvatarUrl(avatarResponse.data.avatarUrl);
//                 setLoading(false);
//             } catch (err) {
//                 console.error('Error fetching user data:', err);
//             }
//         };

//         fetchUserData();
//     }, []);

//     if (isLoading) {
//         return (
//             <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
//                 <CircularProgress size={60} />
//             </Box>
//         );
//     }

//     return (
//         <Box sx={{
//             position: 'absolute',
//             top: 0,
//             left: 0,
//             right: 0,
//             bottom: 0,
//             display: 'flex',
//             justifyContent: 'center',
//             alignItems: 'center',
//             backgroundColor: 'rgba(0, 0, 0, 0.8)'
//         }}>
//             <Avatar
//                 modelSrc={`${avatarUrl}?morphTargets=ARKit,Eyes Extra`}
//                 headMovement={true}
//                 animationSrc="/animations/M_Standing_Idle_001.fbx"
//                 environment="soft"
//                 shadows={true}
//                 emotion="happy"
//                 cameraInitialDistance={0.7}
//                 cameraZoomTarget={[-0.11, 0, 3.2]}
//                 idleRotation
//                 style={{ width: '100%', height: '100%' }}
//             >
//                 <Sparkles
//                     color="white"
//                     count={80}
//                     opacity={0.5}
//                     position={[0, 0.61, 0]}
//                     scale={2}
//                     size={3.5}
//                     speed={0.25}
//                 />
//             </Avatar>
//         </Box>
//     );
// }

import * as React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import WorkTwoToneIcon from '@mui/icons-material/WorkTwoTone';
import StadiumTwoToneIcon from '@mui/icons-material/StadiumTwoTone';
import { ReactRouterAppProvider } from '@toolpad/core/react-router';
import AutoAwesomeTwoToneIcon from '@mui/icons-material/AutoAwesomeTwoTone';
import { Outlet } from 'react-router';
import { createTheme } from '@mui/material/styles';
// import { Navigation } from '@toolpad/core';

const NAVIGATION = [
    {
        kind: 'header',
        title: 'Main items',
    },
    {
        segment: 'home',
        title: 'Dashboard',
        icon: <DashboardIcon />,
    },
    {
        segment: 'career-fair',
        title: 'Join Event',
        icon: <StadiumTwoToneIcon />,
    },
    {
        segment: 'home/avatar-creation',
        title: 'Avatar Customization',
        icon: <AutoAwesomeTwoToneIcon />,
    },
    {
        segment: 'home/recommended-jobs',
        title: 'Recommended Jobs',
        icon: <WorkTwoToneIcon />,
    },
];

const BRANDING = {
    title: 'PLUS',
    logo: <img src='/ln3.png' />,
    homeUrl: '/home'
};

const Theme = createTheme({
    cssVariables: {
        colorSchemeSelector: 'data-toolpad-color-scheme',
    },
    // Remove light scheme and keep only dark
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
        mode: 'dark', // Force dark mode
        primary: {
            main: '#6745FCFF', // Color for top bar and menu
        },
        background: {
            default: '#080808', // Main background color
            paper: '#1A1A1A', // Color for cards and menus
        },
        text: {
            primary: '#FFFFFF', // Default text color
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
                    overflow: 'hidden'
                },
                html: {
                    overflow: 'hidden'
                }
            },
        },
        // Change top bar (AppBar) styling
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#1A1A1AD5', // Dark gray background
                    borderBottom: '1px solidrgb(147, 102, 219)', // Purple accent border

                },
            },
        },
        // Change left menu (Drawer) styling
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: '#1A1A1A', // Dark gray background
                    borderRight: '1px solidrgb(147, 102, 219)', // Purple accent border
                },
            },
        },
    },
});


export default function App() {
    return (
        <ReactRouterAppProvider navigation={NAVIGATION}
            branding={BRANDING}
            theme={Theme}
            defaultColorScheme="dark" // Force dark mode
            colorSchemeStorageKey={null} // Disable scheme persistence 
        >
            <Outlet />
        </ReactRouterAppProvider>
    );
}