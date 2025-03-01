/*
Auto-generated by: https://github.com/pmndrs/gltfjsx
Command: npx gltfjsx@6.5.3 public/models/Space/Planet.glb 
*/

import { useGLTF } from '@react-three/drei'
import { useFrame } from "@react-three/fiber";
import React, { useRef } from "react";

const HELIX_SPEED = 0.7;

export function Planet(props) {
  const { nodes, materials } = useGLTF('./models/Space/Planet.glb')

  const helix = useRef();
  const helix2 = useRef();

  useFrame((_state, delta) => {
    helix.current.rotation.x += delta * HELIX_SPEED;
    helix2.current.rotation.x -= delta * HELIX_SPEED;
  });

  return (
    <group {...props} dispose={null}>
      <mesh ref={helix2} geometry={nodes.Lo_poly_Planet_02_by_Liz_Reddington_RING_1.geometry} material={materials.lambert10SG} />
      <mesh ref={helix} geometry={nodes.Lo_poly_Planet_02_by_Liz_Reddington_RING_1_1.geometry} material={materials.lambert6SG} />
      <mesh geometry={nodes.Lo_poly_Planet_02_by_Liz_Reddington_RING_1_2.geometry} material={materials.lambert9SG} />
      <mesh geometry={nodes.Lo_poly_Planet_02_by_Liz_Reddington_RING_1_3.geometry} material={materials.lambert8SG} />
    </group>
  )
}

useGLTF.preload('./models/Space/Planet.glb')
