import React, { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Avatar } from "@readyplayerme/visage";
import { Sparkles } from '@react-three/drei';
import axios from 'axios';
import styled from 'styled-components';

export default function Home() {
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [username, setUsername] = useState(null)
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
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError(err.message);

                // Redirect to login if unauthorized
                if (err.response?.status === 401) {
                    navigate('/');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    const StyledNavLink = styled(NavLink)`
    position: relative;
    padding: 10px 20px;
    color: white;
    text-decoration: none;
    font-size: 1.2rem;
    font-weight: 600;
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
    }
  
    &.active {
      color: white;
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
      
      &::before {
        opacity: 0.8;
        box-shadow: 0 0 20px rgba(0, 163, 255, 0.5),
                    0 0 30px rgba(255, 105, 180, 0.3);
      }
    }
  `;
    return (
        <>
            <div style={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(5deg, #1D1C1CFF 0%, #6E16ADFF 100%)',
                position: 'relative'
            }}>
                <div style={{
                    zIndex: 1, textAlign: 'center'
                }}>
                    <h2 style={{
                        // marginBottom: '20px',
                        color: 'white', zIndex: 1, fontFamily: "DM Serif Display"
                    }}>
                        Welcome {username} !
                    </h2>
                    <p style={{ color: 'whitesmoke', fontFamily: 'serif' }}>This is your Customized digital-twin🌟</p>
                </div>
                <div style={{
                    position: 'absolute',
                    left: '30px', // Adjust the left position as needed
                    top: '50%', // Center vertically
                    transform: 'translateY(-50%)', // Adjust for exact centering
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px', // Space between links
                    zIndex: 1
                }}>
                    <StyledNavLink to={"/avatar-creation"}>
                        Customize your digital twin🦹
                    </StyledNavLink>
                    <StyledNavLink to={""}>
                        Join Event🚀
                    </StyledNavLink>
                    <StyledNavLink to={"/logout"}>
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
                    <Avatar
                        modelSrc={avatarUrl + "?morphTargets=ARKit,Eyes Extra"}
                        headMovement={true}
                        animationSrc={"/animations/M_Standing_Idle_001.fbx"}
                        environment={"soft"}
                        shadows={true}
                        emotion={"idle"}
                        cameraInitialDistance={0.7}
                        idleRotation
                        cameraZoomTarget={[-0.11, 0, 3.2]}
                        poseSrc={"/animations/M_Standing_Idle_Variations_003.fbx"}
                    >
                        <Sparkles
                            color={"white"}
                            count={80}
                            opacity={0.5}
                            position={[0, 0.7, 0]}
                            scale={2}
                            size={4}
                            speed={0.25}
                        />
                    </Avatar>
                </div>
            </div>

        </>
    )
}