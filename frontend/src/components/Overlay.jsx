import { useProgress } from "@react-three/drei";
import { usePlay } from "../contexts/Play";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import Login from "../pages/Login";
export const Overlay = () => {
  const { progress } = useProgress();
  const { play, end, setPlay, hasScroll, setEnd } = usePlay();
  return (
    <div
      className={`overlay ${play ? "overlay--disable" : ""}
    ${hasScroll ? "overlay--scrolled" : ""}`}
    >
      <div
        className={`loader ${progress === 100 ? "loader--disappear" : ""}`}
      />
      {progress === 100 && (
        <div className={`intro ${play ? "intro--disappear" : ""} ${end ? "intro--disappear" : ""}`}>
          <h1 className="logo">
            NEXUSPLUS
            <div className="spinner">
              <div className="spinner__image" />
            </div>
          </h1>
          {!end && (
            <p className="intro__scroll">Scroll to begin the journey</p>
          )}
          <button
            className="explore"
            onClick={() => {
              setPlay(true);
            }}
            disabled={end}
          >
            Explore
          </button>
          <button className="cta" onClick={() => { setEnd(true) }} disabled={end}>
            <span className="hover-underline-animation"> Skip </span>
            <svg id="arrow-horizontal" xmlns="http://www.w3.org/2000/svg" width={30} height={10} viewBox="0 0 46 16">
              <path id="Path_10" data-name="Path 10" d="M8,0,6.545,1.455l5.506,5.506H-30V9.039H12.052L6.545,14.545,8,16l8-8Z" transform="translate(30)" />
            </svg>
          </button>
        </div>
      )}
      <div className={`outro ${end ? "outro--appear" : ""}`}>
        <div className="outro__content">
          <p className="outro__text">To have the maximum experience, join us !</p>
          <div className="outro__buttons">
            <Login />
          </div>
        </div>
      </div>
    </div>
  );
};