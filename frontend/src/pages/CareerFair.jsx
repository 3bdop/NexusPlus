import React, { useEffect, useState } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";
import axios from 'axios';
import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Box } from "@mui/system";
import Typography from '@mui/material/Typography';

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

const BackButton = styled.button`
  position: absolute;
  ${'' /* top: 20px;
   */}
  left: 20px;
  padding: 10px 20px;
  background-color: #00a3ff;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #007acc;
  }
`;
function CareerFair() {
    // Initialize the Unity context using the hook
    const { unityProvider, sendMessage, loadingProgression, isLoaded, } = useUnityContext({
        loaderUrl: "build2/webGL.loader.js",
        dataUrl: "build2/webGL.data",
        frameworkUrl: "build2/webGL.framework.js",
        codeUrl: "build2/webGL.wasm",
    });
    const navigate = useNavigate();    // const [avatarUrl, setAvatarUrl] = useState("")
    useEffect(() => {
        async function fetchSession() {
            try {
                const sessionResponse = await axios.get(
                    'http://localhost:5050/api/get-session',
                    { withCredentials: true } // Include cookies in the request
                );
                const fetchedAvatarUrl = sessionResponse.data.avatarUrl;
                console.log("Avatar URL fetched from API:", fetchedAvatarUrl);
                if (fetchedAvatarUrl) {
                    sendMessage("Photon Setup", "SetAvatarUrl", fetchedAvatarUrl);
                }
            } catch (error) {
                console.error("Error fetching session data:", error);
            }
        }
        fetchSession();
    }, [sendMessage]);

    return (
        // <Box sx={{ p: 3 }}>
        // <Typography>

        <FullScreenContainer>
            {/* <BackButton onClick={() => navigate('/home')}>Back to Home</BackButton> */}

            <Unity
                unityProvider={unityProvider}
                style={{ width: "100%", height: "100%" }}
            />
        </FullScreenContainer>
        //</Typography>
        //</Box> 
    );
}

export default CareerFair;