
import Typography from '@mui/material/Typography';
import React, { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Avatar } from "@readyplayerme/visage";
import { Sparkles } from '@react-three/drei';
import axios from 'axios';
import styled, { keyframes } from 'styled-components';

export default function Dashboarddd() {
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
                setAvatarUrl(sessionResponse.data.avatarUrl)
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

    function capitalizeFirstLetter(val) {
        return String(val).charAt(0).toUpperCase() + String(val).slice(1);
    }
    return (
        <>
            <div style={{
                zIndex: 1, textAlign: 'center'
            }}>
                <Typography variant="h2" style={{
                    color: 'white', zIndex: 1, fontFamily: "cursive"
                }}>
                    Welcome {capitalizeFirstLetter(username)} !
                </Typography>
                <Typography variant="body1" style={{ color: 'whitesmoke', fontFamily: 'cursive' }}>
                    This is your main digital-twin🤩
                </Typography>
            </div>
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
        </>

    );
}
