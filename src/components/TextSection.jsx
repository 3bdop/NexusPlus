import { Text } from "@react-three/drei";
import { fadeOnBeforeCompileFlat } from "../utils/fadeMaterial";
import { useState, useEffect, useRef } from "react";


const getRandomColor = () => {
  const colors = ['lightgreen', '#6F8AFFFF', '#87FFEBFF', 'orange'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const TextSection = ({ title, subtitle, ...props }) => {
  const [titleColor, setTitleColor] = useState(getRandomColor());
  const [subtitleColor, setSubtitleColor] = useState(getRandomColor());
  const prevTitleRef = useRef();

  useEffect(() => {
    if (prevTitleRef.current !== title) {
      setTitleColor(getRandomColor());
      setSubtitleColor(getRandomColor());
    }
    prevTitleRef.current = title;
  }, [title]);
  return (
    <group {...props}>
      {!!title && (
        <Text
          color={titleColor}
          // color="lightgreen"
          anchorX={"left"}
          anchorY="bottom"
          fontSize={0.52}
          maxWidth={2.5}
          lineHeight={1}
          font={"./fonts/DMSerifDisplay-Regular.ttf"}
        >
          {title}
          <meshStandardMaterial
            color={"white"}
            onBeforeCompile={fadeOnBeforeCompileFlat}
          />
        </Text>
      )}

      <Text
        color="white"
        anchorX={"left"}
        anchorY="top"
        fontSize={0.2}
        maxWidth={2.5}
        font={"./fonts/Inter-Regular.ttf"}
      >
        {subtitle}
        <meshStandardMaterial
          color={"white"}
          onBeforeCompile={fadeOnBeforeCompileFlat}
        />
      </Text>
    </group>
  );
};
