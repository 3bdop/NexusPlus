import React, { useState } from 'react';
import { AvatarCreator } from '@readyplayerme/react-avatar-creator';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';



export default function AvatarCreation() {
    const style = { width: '100%', height: '90vh', border: 'none' };
    const [existingAvatarUrl, setExistingAvatarUrl] = useState(null)

    const config = {
        clearCache: true,
        bodyType: 'fullbody',
        quickStart: false,
        language: 'en',
        avatar: existingAvatarUrl
    };

    const navigate = useNavigate();

    const handleOnAvatarExported = async (event) => {
        try {
            const avatarUrl = event.data.url;
            console.log(`Avatar URL is: ${avatarUrl}`);

            // Step 1: Fetch the user's session data to get the userId
            const sessionResponse = await apiClient.get(
                '/api/get-session',
                { withCredentials: true } // Include cookies for session authentication
            );

            if (sessionResponse.data.avatarUrl) {
                setExistingAvatarUrl(sessionResponse.data.avatarUrl);
            }

            const userId = sessionResponse.data.userId;
            if (!userId) {
                throw new Error('User ID not found in session data.');
            }

            // Step 2: Update the avatar URL for the user
            const updateResponse = await apiClient.patch(
                '/api/add-avatarId',
                { avatarUrl }, //? Sending the new avatar Id only, and getting the userId from session
                {
                    withCredentials: true,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (updateResponse.status === 200) {
                console.log('Avatar updated successfully:', updateResponse.data);
                navigate('/dashboard'); // Redirect to the home page
            }
        } catch (error) {
            console.error('Error saving avatar:', error);
            alert('Failed to save avatar. Please try again.');
        }
    };

    return (
        <>
            <AvatarCreator
                subdomain="oneuni"
                config={config}
                style={style}
                onAvatarExported={handleOnAvatarExported}
            />

        </>
    );
}