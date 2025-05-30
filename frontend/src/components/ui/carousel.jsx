"use client";;
import { IconArrowNarrowRight } from "@tabler/icons-react";
import { useState, useRef, useId, useEffect } from "react";

const Slide = ({
    slide,
    index,
    current,
    handleSlideClick,
    onButtonClick
}) => {
    const slideRef = useRef(null);

    const xRef = useRef(0);
    const yRef = useRef(0);
    const frameRef = useRef();

    useEffect(() => {
        const animate = () => {
            if (!slideRef.current) return;

            const x = xRef.current;
            const y = yRef.current;

            slideRef.current.style.setProperty("--x", `${x}px`);
            slideRef.current.style.setProperty("--y", `${y}px`);

            frameRef.current = requestAnimationFrame(animate);
        };

        frameRef.current = requestAnimationFrame(animate);

        return () => {
            if (frameRef.current) {
                cancelAnimationFrame(frameRef.current);
            }
        };
    }, []);

    const handleMouseMove = (event) => {
        const el = slideRef.current;
        if (!el) return;

        const r = el.getBoundingClientRect();
        xRef.current = event.clientX - (r.left + Math.floor(r.width / 2));
        yRef.current = event.clientY - (r.top + Math.floor(r.height / 2));
    };

    const handleMouseLeave = () => {
        xRef.current = 0;
        yRef.current = 0;
    };

    const imageLoaded = (event) => {
        event.currentTarget.style.opacity = "1";
    };

    const { src, button, title, status } = slide;

    return (
        <div className="[perspective:tw-1200px] [transform-style:tw-preserve-3d]">
            <li
                ref={slideRef}
                className="tw-flex tw-flex-1 tw-flex-col tw-items-center tw-justify-center tw-relative tw-text-center tw-text-white tw-opacity-100 tw-transition-all tw-duration-300 tw-ease-in-out tw-w-[70vmin] tw-h-[70vmin] tw-mx-[4vmin] tw-z-10 "
                onClick={() => handleSlideClick(index)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                    transform:
                        current !== index
                            ? "scale(0.98) rotateX(8deg)"
                            : "scale(1) rotateX(0deg)",
                    transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                    transformOrigin: "bottom",
                }}>
                <div
                    className="tw-absolute tw-top-0 tw-left-0 tw-w-full tw-h-full tw-bg-[#1D1F2F] tw-rounded-[3%] tw-overflow-hidden tw-transition-all tw-duration-150 tw-ease-out"
                    style={{
                        transform:
                            current === index
                                ? "translate3d(calc(var(--x) / 30), calc(var(--y) / 30), 0)"
                                : "none",
                    }}>
                    <img
                        className="tw-absolute tw-inset-0 tw-w-[120%] tw-h-[120%] tw-object-cover tw-opacity-100 tw-transition-opacity tw-duration-600 tw-ease-in-out"
                        style={{
                            opacity: current === index ? 1 : 0.5,
                        }}
                        alt={title}
                        src={src}
                        onLoad={imageLoaded}
                        loading="eager"
                        decoding="sync" />
                    {current === index && (
                        <div className="tw-absolute tw-inset-0 tw-bg-black/30 tw-transition-all tw-duration-1000" />
                    )}
                </div>

                <article
                    className={`tw-relative tw-p-[4vmin] tw-transition-opacity tw-duration-1000 tw-ease-in-out ${current === index ? "tw-opacity-100 tw-visible" : "tw-opacity-0 tw-invisible"
                        }`}>
                    <h2 className="tw-text-lg md:tw-text-2xl lg:tw-text-4xl tw-font-semibold  tw-relative">
                        {title}
                        <br />
                        {status}
                    </h2>
                    {/* <h4 className="tw-text-lg md:tw-text-2xl lg:tw-text-4xl tw-font-semibold  tw-relative">
                    </h4> */}
                    <div className="tw-flex tw-justify-center">
                        <button
                            className="tw-mt-6  tw-px-4 tw-py-2 tw-w-fit tw-mx-auto sm:tw-text-sm tw-text-black tw-bg-white tw-h-12 tw-border tw-border-transparent tw-text-xs tw-flex tw-justify-center tw-items-center tw-rounded-2xl hover:tw-shadow-lg tw-transition tw-duration-200 tw-shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)]"
                            onClick={() => onButtonClick(slide.path)}
                        >
                            {/* {button} */}
                            {slide.button}
                        </button>
                    </div>
                </article>
            </li>
        </div>
    );
};

const CarouselControl = ({
    type,
    title,
    handleClick
}) => {
    return (
        <button
            className={`tw-w-10 tw-h-10 tw-flex tw-items-center tw-mx-2 tw-justify-center tw-bg-neutral-200 dark:tw-bg-neutral-800 tw-border-3 tw-border-transparent tw-rounded-full focus:tw-border-[#6D64F7] focus:tw-outline-none hover:tw--translate-y-0.5 active:tw-translate-y-0.5 tw-transition tw-duration-200 ${type === "previous" ? "rotate-180" : ""
                }`}
            title={title}
            onClick={handleClick}>
            <IconArrowNarrowRight className="tw-text-neutral-600 dark:tw-text-neutral-200" />
        </button>
    );
};

export function Carousel({
    slides,
    onButtonClick
}) {
    const [current, setCurrent] = useState(0);

    const handlePreviousClick = () => {
        const previous = current - 1;
        setCurrent(previous < 0 ? slides.length - 1 : previous);
    };

    const handleNextClick = () => {
        const next = current + 1;
        setCurrent(next === slides.length ? 0 : next);
    };

    const handleSlideClick = (index) => {
        if (current !== index) {
            setCurrent(index);
        }
    };

    const id = useId();

    return (
        <div
            className="tw-vrelative tw-w-[70vmin] tw-h-[70vmin] tw-mx-auto"
            aria-labelledby={`carousel-heading-${id}`}>
            <ul
                className="tw-absolute tw-flex tw-mx-[-4vmin] tw-transition-transform tw-duration-1000 tw-ease-in-out"
                style={{
                    transform: `translateX(-${current * (100 / slides.length)}%)`,
                }}>
                {slides.map((slide, index) => (
                    <Slide
                        key={index}
                        slide={slide}
                        index={index}
                        current={current}
                        handleSlideClick={handleSlideClick}
                        onButtonClick={onButtonClick}
                    />
                ))}
            </ul>
            <div className="tw-absolute tw-flex tw-justify-center tw-w-full tw-top-[calc(100%+1rem)]">
                <CarouselControl
                    type="previous"
                    title="Go to previous slide"
                    handleClick={handlePreviousClick} />

                <CarouselControl type="next" title="Go to next slide" handleClick={handleNextClick} />
            </div>
        </div>
    );
}
