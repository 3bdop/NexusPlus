import { useProgress } from "@react-three/drei";
import { usePlay } from "../contexts/Play";
import styled from "styled-components";
import Button from "../styles/Button";
const handleLoginClick = () => {
  console.log("Login button clicked");
  // Add your login logic here
};

const handleSignupClick = () => {
  console.log("Signup button clicked");
  // Add your signup logic here
};
export const Overlay = () => {
  const { progress } = useProgress();
  const { play, end, setPlay, hasScroll } = usePlay();
  return (
    <div
      className={`overlay ${play ? "overlay--disable" : ""}
    ${hasScroll ? "overlay--scrolled" : ""}`}
    >
      <div
        className={`loader ${progress === 100 ? "loader--disappear" : ""}`}
      />
      {progress === 100 && (
        <div className={`intro ${play ? "intro--disappear" : ""}`}>
          <h1 className="logo">
            NEXUSPLUS
            <div className="spinner">
              <div className="spinner__image" />
            </div>
          </h1>
          <p className="intro__scroll">Scroll to begin the journey</p>
          <button
            className="explore"
            onClick={() => {
              setPlay(true);
            }}
          >
            Explore
          </button>
          {/* <Button onClick={true} >

          </Button> */}
        </div>
      )}
      <div className={`outro ${end ? "outro--appear" : ""}`}>
        {/* <p className="outro__text">Wish you had a great flight with us...</p> */}
        {/* <Form /> */}
        {/* <Button name="Login" onClick={"login"} className="outro__text" />
       
        <Button name="Signup" onClick={"signup"} className="outro__text" /> */}
        <button onClick={() => handleLoginClick()} className="outro_button">
          Login
        </button>
        <button onClick={() => handleSignupClick()} className="outro_button">
          Signup
        </button>
      </div>
    </div>
  );
};