import React, { useEffect, useState } from "react";
import { Unity, useUnityContext } from "react-unity-webgl";
import axios from 'axios';

function App() {
    // Initialize the Unity context using the hook
    const { unityProvider, sendMessage } = useUnityContext({
        loaderUrl: "build/webGL.loader.js",
        dataUrl: "build/webGL.data",
        frameworkUrl: "build/webGL.framework.js",
        codeUrl: "build/webGL.wasm",
    });

    // const [avatarUrl, setAvatarUrl] = useState("")
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
        // <div className="unity-container">

        <Unity unityProvider={unityProvider} style={{ width: "100%", height: "100%" }} />
        // </div>
    );
}

export default App;