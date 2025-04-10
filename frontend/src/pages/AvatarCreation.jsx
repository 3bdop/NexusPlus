import React, { useState, useEffect } from 'react';
import { AvatarCreator } from '@readyplayerme/react-avatar-creator';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';



export default function AvatarCreation() {
    const style = { width: '100%', height: '90vh', border: 'none' };
    const [existingAvatarUrl, setExistingAvatarUrl] = useState(null)


    const navigate = useNavigate();
    // // Fetch existing avatar URL when component mounts
    // useEffect(() => {
    //     const fetchExistingAvatar = async () => {
    //         try {
    //             const sessionResponse = await apiClient.get(
    //                 '/api/get-session',
    //                 { withCredentials: true }
    //             );

    //             if (sessionResponse.data.avatarUrl) {
    //                 // setExistingAvatarUrl(`${sessionResponse.data.avatarUrl}?morphTargets=ARKit&textureAtlas=102`);
    //                 setExistingAvatarUrl(`${sessionResponse.data.avatarUrl}`);
    //             }
    //         } catch (error) {
    //             console.error('Error fetching avatar:', error);
    //         }
    //     };

    //     fetchExistingAvatar();
    // }, []);
    // console.log(`config:${config.avatarId}`)

    // const handleOnAvatarExported = async (event) => {
    //     try {
    //         const avatarUrl = event.data.url;

    //         const updateResponse = await apiClient.patch(
    //             '/api/add-avatar',
    //             { avatarUrl },
    //             {
    //                 withCredentials: true,
    //                 headers: {
    //                     'Content-Type': 'application/json',
    //                 },
    //             }
    //         );

    //         if (updateResponse.status === 200) {
    //             navigate('/dashboard');
    //         }
    //     } catch (error) {
    //         console.error('Error saving avatar:', error);
    //         alert('Failed to save avatar. Please try again.');
    //     }
    // };

    const config = {
        // avatarId: existingAvatarUrl,
        clearCache: false,
        bodyType: 'fullbody',
        quickStart: false,
        language: 'en',
    };
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

// import React, { useEffect, useRef, useState } from 'react';

// const AvatarCreator = () => {
//     const iframeRef = useRef(null);
//     const [avatarUrl, setAvatarUrl] = useState(null);
//     const [isLoading, setIsLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const subdomain = 'oneuni'; // Your custom subdomain
//     const [rpmToken, setRpmToken] = useState(null);

//     useEffect(() => {
//         const handleMessage = (event) => {
//             try {
//                 const json = JSON.parse(event.data);

//                 if (json?.source !== 'readyplayerme') return;

//                 switch (json.eventName) {
//                     case 'v1.frame.ready':
//                         setAvatarUrl(json.data.url);
//                         // Example: Send to your backend
//                         fetch('/api/save-avatar', {
//                             method: 'POST',
//                             headers: { 'Content-Type': 'application/json' },
//                             body: JSON.stringify({ avatarUrl: json.data.url })
//                         })
//                             .then(response => {
//                                 if (!response.ok) throw new Error('Save failed');
//                                 console.log('Avatar saved successfully');
//                             })
//                             .catch(error => {
//                                 setError('Failed to save avatar: ' + error.message);
//                             });
//                         break;

//                     case 'v1.avatar.exported':
//                         setAvatarUrl(json.data.url);
//                         // Here you would typically send the avatar URL to your backend
//                         console.log('Avatar created:', json.data.url);
//                         break;

//                     case 'v1.error':
//                         setError(json.data.message);
//                         break;

//                     default:
//                         break;
//                 }
//             } catch (error) {
//                 console.error('Error parsing message:', error);
//             }
//         };

//         window.addEventListener('message', handleMessage);

//         return () => {
//             window.removeEventListener('message', handleMessage);
//         };
//     }, []);

//     return (
//         <div style={{ position: 'relative', width: '100%', height: '90vh' }}>
//             {isLoading && (
//                 <div style={{
//                     position: 'absolute',
//                     top: '50%',
//                     left: '50%',
//                     transform: 'translate(-50%, -50%)'
//                 }}>
//                     Loading avatar editor...
//                 </div>
//             )}

//             {error && (
//                 <div style={{ color: 'red', padding: '20px' }}>
//                     Error: {error}
//                     <button
//                         style={{ marginLeft: '10px' }}
//                         onClick={() => window.location.reload()}
//                     >
//                         Retry
//                     </button>
//                 </div>
//             )}

//             {!avatarUrl && (
//                 <iframe
//                     ref={iframeRef}
//                     title="Avatar Creator"
//                     allow="camera *; microphone *; clipboard-write"
//                     src={`https://${subdomain}.readyplayer.me/avatar?frameApi`}
//                     style={{
//                         width: '100%',
//                         height: '100%',
//                         border: 'none',
//                         visibility: isLoading ? 'hidden' : 'visible'
//                     }}
//                 />
//             )}

//             {avatarUrl && (
//                 <div style={{ padding: '20px' }}>
//                     <h3>Avatar Created Successfully!</h3>
//                     <p>Avatar URL: {avatarUrl}</p>
//                     <button onClick={() => setAvatarUrl(null)}>
//                         Create New Avatar
//                     </button>
//                 </div>
//             )}
//         </div>
//     );
// };

// export default AvatarCreator;