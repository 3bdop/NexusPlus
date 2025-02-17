import React, { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Avatar } from "@readyplayerme/visage";
import { Sparkles } from '@react-three/drei';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';

export default function Home() {
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [username, setUsername] = useState(null)
    const [isLoading, setLoading] = useState(true)
    const [isAvatarLoaded, setIsAvatarLoaded] = useState(false)
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Step 1: Fetch session data to get userId
                const sessionResponse = await axios.get(
                    'http://localhost:5050/api/get-session',
                    { withCredentials: true } // Include cookies in the request
                );
                setUsername(sessionResponse.data.username)
                const userId = sessionResponse.data.userId;
                if (!userId) {
                    throw new Error('No user ID found in session data.');
                }

                // Step 2: Fetch avatar URL using userId
                const avatarResponse = await axios.get(
                    `http://localhost:5050/api/get-avatarUrl/${userId}`,
                    { withCredentials: true }
                );

                setAvatarUrl(avatarResponse.data.avatarUrl);
                setLoading(false)
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError(err.message);

                // Redirect to login if unauthorized
                if (err.response?.status === 401) {
                    navigate('/');
                }
            }
        };

        fetchUserData();
    }, [navigate]);

    const logout = async () => {
        try {
            await axios.post('http://localhost:5050/api/logout', {}, { withCredentials: true });
            navigate('/'); // Redirect to the login page or home page after logout
        } catch (err) {
            console.error('Error during logout:', err);
        }
    };

    const StyledNavLink = styled(NavLink)`
    position: relative;
    padding: 10px 20px;
    color: white;
    text-decoration: none;
    font-size: 1.2rem;
    font-weight: 600;
    font-family: system-ui;
    transition: all 0.3s ease;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(45deg, #00a3ff, #ff69b4);
      opacity: 0;
      border-radius: 5px;
      transition: opacity 0.3s ease;
      z-index: -1;
    }
    &:hover {
            transform: translateY(-2px);
            color: white;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
            
            &::before {
                opacity: 0.8;
                box-shadow: 0 0 20px rgba(0, 163, 255, 0.5),
                            0 0 30px rgba(255, 105, 180, 0.3);
            }
        }
     `;

    // Keyframes for the loading animation
    const spin = keyframes`
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    `;

    const LoadingSpinner = styled.div`
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top: 4px solid #00a3ff;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: ${spin} 1s linear infinite;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    `;

    // Keyframes for the fade-in animation
    const fadeIn = keyframes`
        0% { opacity: 0; }
        100% { opacity: 1; }
    `;

    const AvatarContainer = styled.div`
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        opacity: ${({ isAvatarLoaded }) => (isAvatarLoaded ? 1 : 0)};
        animation: ${fadeIn} 10s ease-in-out;
    `;

    function capitalizeFirstLetter(val) {
        return String(val).charAt(0).toUpperCase() + String(val).slice(1);
    }
    return (
        <>
            <div style={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(0deg, #080808FF , #5016ADFF 100%)',
                position: 'relative'
            }}>
                <div style={{
                    zIndex: 1, textAlign: 'center'
                }}>
                    <h2 style={{
                        color: 'white', zIndex: 1, fontFamily: "cursive"
                    }}>
                        Welcome {capitalizeFirstLetter(username)} !
                    </h2>
                    <p style={{ color: 'whitesmoke', fontFamily: 'cursive' }}>This is your main digital-twin🤩</p>
                </div>
                <div style={{
                    position: 'absolute',
                    left: '30px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    zIndex: 1
                }}>
                    <StyledNavLink to={""}>
                        Dashboard🌟
                    </StyledNavLink>
                    <StyledNavLink to={"/career-fair"}>
                        Join Event🚀
                    </StyledNavLink>
                    <StyledNavLink to={"/avatar-creation"}>
                        Customize your digital twin🦹
                    </StyledNavLink>
                    <StyledNavLink to={"/recommended-jobs"}>
                        View your recommended jobs📝
                    </StyledNavLink>
                    <StyledNavLink onClick={logout}>
                        Logout 👋
                    </StyledNavLink>
                </div>
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    {isLoading ? (
                        <LoadingSpinner />
                    ) : (
                        <AvatarContainer isAvatarLoaded={isAvatarLoaded}>
                            <Avatar
                                modelSrc={avatarUrl + "?morphTargets=ARKit,Eyes Extra"}
                                headMovement={true}
                                animationSrc={"/animations/M_Standing_Idle_001.fbx"}
                                environment={"soft"}
                                shadows={true}
                                emotion={"happy"}
                                cameraInitialDistance={0.7}
                                cameraZoomTarget={[-0.11, 0, 3.2]}
                                idleRotation
                                onLoaded={() => setIsAvatarLoaded(true)}
                            >
                                <Sparkles
                                    color={"white"}
                                    count={80}
                                    opacity={0.5}
                                    position={[0, 0.61, 0]}
                                    scale={2}
                                    size={3.5}
                                    speed={0.25}
                                />
                            </Avatar>
                        </AvatarContainer>
                    )}
                </div>
            </div>

        </>
    )
}