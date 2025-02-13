import React, { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Avatar } from "@readyplayerme/visage";
import { Sparkles } from '@react-three/drei';
import axios from 'axios';


export default function Home() {
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Step 1: Fetch session data to get userId
                const sessionResponse = await axios.get(
                    'http://localhost:5050/api/get-session',
                    { withCredentials: true } // Include cookies in the request
                );

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


    return (
        <>
            <div style={{
                height: '100vh',
                width: '100vw',
                display: 'flex',
                flexDirection: 'column',
                // alignItems: 'start',
            }}>
                <div>
                    <h1>Home page</h1>
                    <NavLink to={"/avatar-creation"}>
                        Create your avatar
                    </NavLink>
                </div>
                <div className="avatar-preview">
                    <Avatar
                        modelSrc={avatarUrl + "?morphTargets=ARKit,Eyes Extra"}
                        headMovement={true}
                        animationSrc={"/animations/M_Standing_Idle_001.fbx"}
                        environment={"night"}
                        shadows={true}
                        emotion={"idle"}
                        cameraInitialDistance={0.7}
                        idleRotation
                    >
                        <Sparkles
                            color={"white"}
                            count={100}
                            opacity={0.5}
                            position={[0, 3, -0.5]}
                            scale={4}
                            size={5}
                            speed={0.25}
                        />
                    </Avatar>
                </div>
            </div>

        </>
    )
}

// import React from 'react';
// import { Canvas } from '@react-three/fiber';
// import { NavLink } from 'react-router-dom';
// import { OrbitControls, Sparkles, useGLTF, Environment } from '@react-three/drei';

// function AvatarModel({ modelSrc, position }) {
//     const { scene } = useGLTF(modelSrc);
//     return <primitive object={scene} position={position} />;
// }

// export default function Home() {
//     return (
//         <>
//             <h1>Home page</h1>
//             <NavLink to="/avatar-creation">Create your avatar</NavLink>

//             <div className="avatar-preview" style={{ width: '60%', height: '100%' }}>
//                 <Canvas camera={{ position: [0, 2.5, 2.5], fov: 15 }}>
//                     {/* Disable OrbitControls to prevent zooming and panning */}
//                     <OrbitControls enableZoom={false} enablePan={false} />

//                     {/* Add lighting */}
//                     <ambientLight intensity={0.5} />
//                     <pointLight position={[10, 10, 10]} intensity={0.5} />

//                     {/* Add the avatar model */}
//                     <AvatarModel
//                         modelSrc="https://models.readyplayer.me/67a8834e0de6c0bbaba7f2e3.glb"
//                         position={[-0.3, -1.5, 0]}
//                         headMovement={true}
//                         animationSrc={"/animations/M_Standing"}
//                     />

//                     {/* Add Sparkles effect */}
//                     < Sparkles
//                         color="white"
//                         count={100}
//                         opacity={0.5}
//                         position={[0, 2, 0]}
//                         scale={4}
//                         size={7}
//                         speed={0.25}
//                     />

//                     {/* Add environment lighting */}
//                     <Environment preset="city" />
//                 </Canvas>
//             </div>
//         </>
//     );
// }