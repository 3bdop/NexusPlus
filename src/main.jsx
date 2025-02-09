import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { PlayProvider } from "./contexts/Play";
import "./index.css";
import AnimatedCursor from "react-animated-cursor"


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PlayProvider>
      <App />
      <AnimatedCursor
        innerSize={20}
        outerSize={20}
        color='72, 232, 157'
        // color='136, 52, 235'
        outerAlpha={0.2}
        innerScale={0.7}
        outerScale={5}
      // showSystemCursor
      // outerScale={2}
      // outerAlpha={0}
      // hasBlendMode={true}
      // innerStyle={{
      //   backgroundColor: 'var(--cursor-color)'
      // }}
      // outerStyle={{
      //   border: '3px solid var(--cursor-color)'
      // }}
      />
    </PlayProvider>
  </React.StrictMode>
);
