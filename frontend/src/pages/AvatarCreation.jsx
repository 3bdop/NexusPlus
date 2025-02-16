import React from 'react';
import { AvatarCreator } from '@readyplayerme/react-avatar-creator';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const config = {
    clearCache: true,
    bodyType: 'fullbody',
    quickStart: false,
    language: 'en',
};

const style = { width: '100%', height: '100vh', border: 'none' };

export default function AvatarCreation() {
    const navigate = useNavigate();

    const handleOnAvatarExported = async (event) => {
        try {
            const avatarUrl = event.data.url;
            console.log(`Avatar URL is: ${avatarUrl}`);

            // Step 1: Fetch the user's session data to get the userId
            const sessionResponse = await axios.get(
                'http://localhost:5050/api/get-session',
                { withCredentials: true } // Include cookies for session authentication
            );

            const userId = sessionResponse.data.userId;
            if (!userId) {
                throw new Error('User ID not found in session data.');
            }

            // Step 2: Update the avatar URL for the user
            const updateResponse = await axios.patch(
                'http://localhost:5050/api/add-avatarId',
                { userId, avatarUrl }, // Send userId and avatarUrl in the request body
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (updateResponse.status === 200) {
                console.log('Avatar updated successfully:', updateResponse.data);
                navigate('/home'); // Redirect to the home page
            }
        } catch (error) {
            console.error('Error saving avatar:', error);
            alert('Failed to save avatar. Please try again.'); // Show error message to the user
        }
    };

    return (
        <div className="avatar-creator-container" style={{ position: 'relative' }}>
            <AvatarCreator
                subdomain="oneuni"
                config={config}
                style={style}
                onAvatarExported={handleOnAvatarExported}
            />
            <div style={{
                background: '#15161F',
                zIndex: 2,
                width: '6%',
                height: '1vh',
                position: 'absolute',
                top: 8,
                left: 25,
                borderRadius: '15px',
                animationDelay: 'inherit'
            }} >
                <button style={{
                    background: '#00E8DA',
                    paddingBottom: '11px',
                    paddingTop: '11px',
                    borderRadius: '15px', width: '111.43px', height: '70px'
                }}
                    onClick={() => navigate('/home')}>
                    <span style={{
                        fontFamily: 'Poppins, sans-serif',
                        fontSize: '13.7px',
                        color: '#1d221c', fontWeight: 'bold'
                    }}>BACK</span>
                </button>
            </div>
        </div>
    );
}