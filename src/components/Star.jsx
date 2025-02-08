import React from "react";
import { Stars } from "@react-three/drei";
import "../index.css"
export const Star = () => {
    return (
        <Stars
            radius={100} // Radius of the sphere
            depth={50} // Depth of area where stars should be
            count={5000} // Number of stars
            factor={7} // Size factor
            saturation={0} // Saturation of stars
            fade // Faded edges
            speed={1}

        />
    );
};