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
import RecommendedJobs from "./pages/RecommendedJobs.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import Dashboarddd from "./pages/Dashboarddd.jsx";
import Layout from "./layout/Dashboard.jsx";
import JobApplications from "./pages/JobApplications.jsx";

import { pdfjs } from 'react-pdf';


const preloadWebGLAssets = () => {
  if (typeof window !== 'undefined') {
    // Preload critical WebGL assets
    const preloadAssets = async () => {
      try {
        await Promise.all([
          fetch('/build/webGL.loader.js'),
          fetch('/build/webGL.framework.js'),
          fetch('/build/webGL.data'),
          fetch('/build/webGL.wasm')
        ]);
        console.log('WebGL assets preloaded');
      } catch (error) {
        console.error('Preloading failed:', error);
      }
    };

    // Start preloading immediately
    preloadAssets();

    // Additional optimization: Preconnect to origins
    const preconnect = (url) => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      document.head.appendChild(link);
    };

    preconnect('https://nexusplus-api.vercel.app');
    preconnect('https://*.readyplayer.me');
  }
};

// Execute before ReactDOM render
preloadWebGLAssets();


// Set the worker source using a CDN (recommended for simplicity)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;


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
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Home />
      </ProtectedRoute>
    ),
    children: [
      {
        element: <Layout />,
        children: [
          {
            index: true,
            element: (
              <Dashboarddd />
            )
          },
          {
            path: 'recommended-jobs',
            element: (
              <ProtectedRoute requiredRole="attendee">
                <RecommendedJobs />
              </ProtectedRoute>
            )
          },
          {
            path: 'job-applications',
            element: (
              <ProtectedRoute requiredRole="employer">
                <JobApplications />
              </ProtectedRoute>
            )
          },
          {
            path: 'avatar-creation',
            element: (
              <ProtectedRoute>
                <AvatarCreation />
              </ProtectedRoute>
            )
          }
        ]
      }
    ]
  },
  {
    path: '/career-fair',
    element: <ProtectedRoute><CareerFair /></ProtectedRoute>,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);