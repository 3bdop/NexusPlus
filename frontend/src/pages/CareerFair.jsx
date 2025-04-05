import React, { useCallback, useEffect, useState } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";
import { apiClient } from "../api/client";
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

function CareerFair() {

    // Initialize the Unity context using the hook
    const { unityProvider, sendMessage,
        loadingProgression, isLoaded,
        addEventListener, removeEventListener } = useUnityContext({
            loaderUrl: "build/webGL.loader.js",
            dataUrl: "build/webGL.data.unityweb",
            frameworkUrl: "build/webGL.framework.js.unityweb",
            codeUrl: "build/webGL.wasm.unityweb",
            webglContextAttributes: {
                preserveDrawingBuffer: true
            },
            companyName: "NexusPlus",
            productName: "NexusPlus",
            productVersion: "1.0",
        });
    const navigate = useNavigate();
    useEffect(() => {
        async function fetchSession() {
            try {
                const sessionResponse = await apiClient.get(
                    '/api/get-session',
                    { withCredentials: true } // Include cookies in the request
                );

                const fetchedUsername = sessionResponse.data.username;
                const userId = sessionResponse.data.userId

                // Step 2: Fetch avatar URL using userId
                const avatarResponse = await apiClient.get(
                    `/api/get-avatarUrl/${userId}`,
                    { withCredentials: true }
                );
                const fetchedAvatarUrl = avatarResponse.data.avatarUrl;
                console.log("Avatar URL fetched from API:", fetchedAvatarUrl);
                if (fetchedAvatarUrl) {
                    sendMessage("Photon Setup", "SetAvatarUrl", fetchedAvatarUrl);
                    sendMessage("Photon Setup", "SetUsername", fetchedUsername);
                }
            } catch (error) {
                console.error("Error fetching session data:", error);
            }
        }
        fetchSession();
    }, [sendMessage]);


    const handleDisconnect = useCallback((flag) => {
        if (flag) {
            //? A workaround for now to solve the duplicate avatar when leaving and joining again
            window.location.href = '/dashboard'
        }
    }, [navigate]);

    useEffect(() => {
        addEventListener("BackToDash", handleDisconnect)
        return () => {
            removeEventListener("BackToDash", handleDisconnect)
        }
    }, [addEventListener, removeEventListener, handleDisconnect])

    const handlePlayerCountUpdate = useCallback((count) => {
        // Send update to backend
        apiClient.post('/api/addNewPlayer', { count })
            .catch(error => console.error('Error updating player count:', error));
    }, []);

    useEffect(() => {
        // Add event listener for player count updates
        addEventListener("PlayerCountUpdated", handlePlayerCountUpdate);

        return () => {
            removeEventListener("PlayerCountUpdated", handlePlayerCountUpdate);
        };
    }, [addEventListener, removeEventListener, handlePlayerCountUpdate]);

    return (
        <FullScreenContainer>
            {!isLoaded && (
                <LoadingScreen>
                    <SkeletonContainer>
                        <Skeleton height={20} width={`${loadingProgression * 100}%`} />
                        <LoadingText>Loading {Math.round(loadingProgression * 100)}%</LoadingText>
                    </SkeletonContainer>
                </LoadingScreen>
            )}
            <Unity
                unityProvider={unityProvider}
                style={{ width: "100%", height: "100%", display: isLoaded ? "block" : "none" }}
            />
        </FullScreenContainer>
        // <FullScreenContainer>

        //     <Unity
        //         unityProvider={unityProvider}
        //         style={{ width: "100%", height: "100%" }}
        //     />
        // </FullScreenContainer>
    );
}

export default CareerFair;

const FullScreenContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;
const LoadingScreen = styled.div`
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: linear-gradient(5deg, #1D1C1CFF 0%, #2516ADFF 100%);
`;

const SkeletonContainer = styled.div`
    width: 80%;
    max-width: 400px;
`;

const LoadingText = styled.p`
    color: white;
    font-size: 18px;
    text-align: center;
    margin-top: 10px;
`;