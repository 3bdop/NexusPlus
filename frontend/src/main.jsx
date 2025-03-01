// import React from "react";
// import ReactDOM from "react-dom/client";
// import { createBrowserRouter, RouterProvider } from 'react-router-dom';
// import App from "./App";
// import { PlayProvider } from "./contexts/Play";
// import "./index.css";
// import AnimatedCursor from "react-animated-cursor"

// import NotFoundPage from "./pages/NotFoundPage.jsx"
// import Home from "./pages/Home.jsx";
// import Login from "./pages/Login.jsx";
// import ProtectedRoute from "./elements/ProtectedRoute.jsx";
// import AvatarCreation from "./pages/AvatarCreation.jsx";
// import CareerFair from "./pages/CareerFair.jsx";
// import DashboardLayoutBasic from "./pages/DashboardLayoutBasic.jsx"

// const router = createBrowserRouter([
//   {
//     path: '/',
//     element: (
//       <PlayProvider>
//         <App />
//       </PlayProvider>
//     ),
//     errorElement: <NotFoundPage />,
//   },
//   {
//     path: '/home',
//     element: (
//       <ProtectedRoute>
//         <Home />
//       </ProtectedRoute>
//     ),
//     errorElement: <NotFoundPage />
//   },
//   {
//     path: '/avatar-creation',
//     element: (
//       <ProtectedRoute>
//         <AvatarCreation />
//       </ProtectedRoute>
//     ),
//     errorElement: <NotFoundPage />
//   },
//   {
//     path: '/career-fair',
//     element: (
//       <ProtectedRoute>
//         <CareerFair />
//       </ProtectedRoute>
//     ),
//     errorElement: <NotFoundPage />
//   },
//   {
//     path: '/test',
//     element: <DashboardLayoutBasic />
//   }
// ]);

// ReactDOM.createRoot(document.getElementById("root")).render(
//   <React.StrictMode>
//     <RouterProvider router={router} />
//   </React.StrictMode>
// );

import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from "./App";
import { PlayProvider } from "./contexts/Play";
import "./index.css";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import AvatarCreation from "./pages/AvatarCreation.jsx";
import CareerFair from "./pages/CareerFair.jsx";
// import RecommendedJobs from "./pages/RecommendedJobs.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import Dashboarddd from "./pages/Dashboarddd.jsx";

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <PlayProvider>
        <App />
      </PlayProvider>
    ),
    errorElement: <NotFoundPage />,
  },
  {
    path: '/home',
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
    children: [
      {
        path: '',
        element: <Dashboarddd />,
        children: [
          // {
          //   path: 'career-fair',
          //   element: <CareerFair />,
          // },
          {
            path: 'avatar-creation',
            element: <AvatarCreation />,
          },
        ]
      }
    ],
  },
  {
    path: '/career-fair',
    element: (
      <ProtectedRoute>
        <CareerFair />
      </ProtectedRoute>
    ),
    errorElement: <NotFoundPage />
  }
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);