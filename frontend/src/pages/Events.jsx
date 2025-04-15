"use client";

import { Carousel } from "../components/ui/carousel";
import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";

export default function Events() {
    const navigate = useNavigate()
    const [playerCount, setPlayerCount] = useState(0);

    useEffect(() => {
        const fetchPlayerCount = async () => {
            try {
                const response = await apiClient.get('/api/getCurrentPlayers');
                setPlayerCount(response.data.currentPlayers);
            } catch (error) {
                console.error('Error fetching player count:', error);
            }
        };

        // Initial fetch
        fetchPlayerCount();

        // Set up polling every 5 seconds
        const interval = setInterval(fetchPlayerCount, 5000);

        return () => clearInterval(interval);
    }, []);
    const slideData = [
        {
            title: "UDST Career Fair",
            button: "Join Event",
            src: "/images/events/CF.png",
            path: playerCount >= 20 ? '' : '/career-fair'
        },
        {
            title: "Festival of Cultures",
            status: "(coming soon)",
            button: "Join Event",
            src: "/images/events/fest-udst.jpg",
        },
        {
            title: "Qatar Museum ",
            button: "Experience",
            status: "(coming soon)",
            src: "/images/events/q-museum.jpg",
        },
        {
            title: "Web Summit",
            status: "(coming soon)",
            button: "Join Event",
            src: "/images/events/web-summit.jpg",
        },

    ];

    const handleButtonClick = (path) => {
        // window.location.href = `${path}`
        navigate(path)
    };
    return (
        <div className="tw-relative tw-overflow-hidden tw-w-full tw-h-full tw-py-30">
            <Carousel slides={slideData}
                onButtonClick={handleButtonClick}
            />
        </div>
    );
}
