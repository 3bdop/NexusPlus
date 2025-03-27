"use client";

import { Carousel } from "../components/ui/carousel";
import { useNavigate } from "react-router-dom";

export default function Events() {
    const navigate = useNavigate()
    const slideData = [
        {
            title: "UDST Career Fair",
            button: "Join Event",
            src: "/images/events/career-fair.png",
            path: '/career-fair'
        },
        {
            title: "Qatar Museum",
            button: "Experience",
            src: "/images/events/q-museum.jpg",
        },
        {
            title: "Web Summit",
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
