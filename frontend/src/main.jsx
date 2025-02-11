import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { PlayProvider } from "./contexts/Play";
import "./index.css";
import AnimatedCursor from "react-animated-cursor"
import LoginForm from "./pages/LoginForm";
import AvatarCreation from "./pages/AvatarCreation";
import Home from "./pages/Home";
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <PlayProvider>
        <App />
      </PlayProvider>),
  },
  {
    path: '/avatar-creation',
    element: <AvatarCreation />,

  },
  {
    path: '/home',
    element: <Home />
  }
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    {/* <AnimatedCursor
        innerSize={20}
        outerSize={20}
        color='72, 232, 157'
        outerAlpha={0.2}
        innerScale={0.7}
        outerScale={5}
      /> */}
  </React.StrictMode>
);
