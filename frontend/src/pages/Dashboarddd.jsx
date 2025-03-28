
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Avatar } from "@readyplayerme/visage";
import { Sparkles } from '@react-three/drei';
import { apiClient } from '../api/client';
import styled, { keyframes } from 'styled-components';
import { TextGenerateEffect } from '../components/ui/text-generate-effect';
import { TextHoverEffect } from '../components/ui/text-hover-effect';
import { FlipWords } from '../components/ui/flip-words';

export default function Dashboarddd() {
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [username, setUsername] = useState(null)
    const [usernameCap, setUsernameCap] = useState(null)
    const [isLoading, setLoading] = useState(true)
    const [isAvatarLoaded, setIsAvatarLoaded] = useState(false)
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Step 1: Fetch session data to get userId
                const sessionResponse = await apiClient.get(
                    '/api/get-session',
                    { withCredentials: true } // Include cookies in the request
                );
                capitalizeFirstLetter(sessionResponse.data.username)
                const userId = sessionResponse.data.userId;
                if (!userId) {
                    throw new Error('No user ID found in session data.');
                }

                // Step 2: Fetch avatar URL using userId
                const avatarResponse = await apiClient.get(
                    `/api/get-avatarUrl/${userId}`,
                    { withCredentials: true }
                );
                localStorage.setItem("avatar_url", avatarResponse.data.avatarUrl)
                // setAvatarUrl(avatarResponse.data.avatarUrl);
                setLoading(false)
            } catch (error) {
                console.error('Error fetching user data:', err);
                setError(err.message);

                // Redirect to login if unauthorized
                if (error.response?.status === 401) {
                    navigate('/');
                }
            }
        };

        fetchUserData();
    }, [navigate]);

    function capitalizeFirstLetter(val) {
        // return String(val).charAt(0).toUpperCase() + String(val).slice(1);
        setUsername(String(val).charAt(0).toUpperCase() + String(val).slice(1));
    }
    const words = ['Hello', 'مرحباً ', 'Hola', 'Bonjour', 'Hallo', 'Ciao', 'こんにちは', '你好', '안녕하세요', 'Привет']

    return (
        <>
            <span style={{
                zIndex: 1, textAlign: 'center'
            }}>
                <h1 style={{
                    color: 'white', zIndex: 1, fontFamily: "sans-serif", fontSize: 60
                }} >
                    <TextGenerateEffect elements={[
                        <FlipWords words={words} />,
                        username || '', // Ensure username exists
                        <img
                            key="wave-emoji"
                            src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f44b/512.gif"
                            alt="👋"
                            width="50"
                            height="50"
                            style={{
                                verticalAlign: 'middle',
                                display: 'inline-block'
                            }}
                        />
                    ]} duration={1.5} />
                </h1>
                <span variant="body1" style={{ color: 'whitesmoke', fontFamily: 'system-ui' }}>
                    <TextGenerateEffect elements={[`This`, ` is your`, ` main`, ` digital-twin`]} duration={2} />
                </span>

            </span>
            <Avatar
                modelSrc={localStorage.getItem("avatar_url") + "?morphTargets=ARKit,Eyes Extra"}
                headMovement={true}
                animationSrc={"/animations/M_Standing_Idle_001.fbx"}
                environment={"soft"}
                shadows={true}
                emotion={"happy"}
                cameraInitialDistance={0.2}
                cameraZoomTarget={[-0.11, 0, 3.2]}
                idleRotation
            >
                {/* <Sparkles
                    color={"white"}
                    count={30}
                    opacity={0.5}
                    position={[0, 1, -0.02]}
                    scale={1.2}
                    size={2}
                    speed={0.20}
                /> */}
            </Avatar>
        </>

    );
}
