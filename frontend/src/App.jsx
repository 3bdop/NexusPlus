import { ScrollControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Noise } from "@react-three/postprocessing";
import { useMemo, useState, useEffect } from "react";
import { Experience } from "./components/Experience";
import { Overlay } from "./components/Overlay";
import { usePlay } from "./contexts/Play";
import Web3Auth from "./Web3Auth"; // ✅ Import authentication component
import { useNavigate } from "react-router-dom";

function App() {
  const { play, end } = usePlay();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // ✅ Function to handle login success
  const handleLogin = (wallet, user) => {
    console.log(`Logged in as ${wallet}`, user);
    setIsAuthenticated(true);
    navigate("/"); // ✅ Redirect to home after login
  };

  // ✅ Check if user is already authenticated
  useEffect(() => {
    const wallet = localStorage.getItem("wallet");
    if (wallet) {
      setIsAuthenticated(true);
    }
  }, []);

  const effects = useMemo(
    () => (
      <EffectComposer>
        <Noise opacity={0.04} />
      </EffectComposer>
    ),
    []
  );

  return (
    <>
      {/* ✅ Show login page if not authenticated */}
      {!isAuthenticated ? (
        <Web3Auth onLogin={handleLogin} />
      ) : (
        <>
          <Canvas>
            <color attach="background" args={["#ececec"]} />
            <ScrollControls
              pages={play && !end ? 20 : 0}
              damping={0.5}
              style={{
                top: "10px",
                left: "0px",
                bottom: "10px",
                right: "10px",
                width: "auto",
                height: "auto",
                animation: "fadeIn 2.4s ease-in-out 1.2s forwards",
                opacity: 0,
              }}
            >
              <Experience />
            </ScrollControls>
            {effects}
          </Canvas>
          <Overlay />
        </>
      )}
    </>
  );
}

export default App;
