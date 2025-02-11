import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AvatarCreator } from '@readyplayerme/react-avatar-creator';
import '../index.css';

const AvatarCreation = () => {
    const navigate = useNavigate();

    const handleOnAvatarExported = (event) => {
        // The avatar URL will be available in event.data
        const avatarUrl = event.data;

        // Save the avatar URL to localStorage or your backend
        localStorage.setItem('avatarUrl', avatarUrl);

        // Navigate to home page
        navigate('/home');
    };

    return (
        <div className="avatar-creator-container">
            <AvatarCreator
                subdomain="your-subdomain" // Replace with your subdomain
                config={{
                    clearCache: true,
                    bodyType: 'fullbody',
                    language: 'en',
                    quickStart: false,
                }}
                onAvatarExported={handleOnAvatarExported}
                style={{ width: '100%', height: '100vh' }}
            />
        </div>
    );
};

export default AvatarCreation;