import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Avatar } from "@readyplayerme/visage";
import { Sparkles } from '@react-three/drei';

export default function Home() {
    return (
        <>
            <h1>Home pages</h1>
            <NavLink to={"/avatar-creation"}>
                Create your avatar
            </NavLink>
            <div className="avatar-preview">
                <Avatar
                    modelSrc={"https://models.readyplayer.me/67a8834e0de6c0bbaba7f2e3.glb"}
                    headMovement={true}
                    animationSrc={"/animations/M_Standing_Idle_001.fbx"}
                    environment={"night"}
                    shadows={true}
                    emotion={"idle"}
                    cameraInitialDistance={1}
                >
                    <Sparkles
                        color={"white"}
                        count={100}
                        opacity={0.5}
                        position={[0, 3, 1]}
                        scale={4}
                        size={7}
                        speed={0.25}
                    />
                </Avatar>
            </div>

        </>
    )
}
