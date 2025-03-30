// "use client";
// import { useEffect } from "react";
// import { motion, stagger, useAnimate } from "motion/react";
// import { cn } from "../../lib/utils";

// export const TextGenerateEffect = ({
//     words,
//     className,
//     filter = true,
//     duration = 0.5
// }) => {
//     const [scope, animate] = useAnimate();
//     let wordsArray = words.split(" ");
//     useEffect(() => {
//         animate("span", {
//             opacity: 1,
//             filter: filter ? "blur(0px)" : "none",
//         }, {
//             duration: duration ? duration : 1,
//             delay: stagger(0.2),
//         });
//     }, [scope.current]);

//     const renderWords = () => {
//         return (
//             <motion.div ref={scope}>
//                 {wordsArray.map((word, idx) => {
//                     return (
//                         <motion.span
//                             key={word + idx}
//                             className="dark:text-white text-black opacity-0"
//                             style={{
//                                 filter: filter ? "blur(10px)" : "none",
//                             }}>
//                             {word}{" "}
//                         </motion.span>
//                     );
//                 })}
//             </motion.div>
//         );
//     };

//     return (
//         <div className={cn("font-bold", className)}>
//             <div className="mt-4">
//                 <div
//                     className=" dark:text-white text-black text-2xl leading-snug tracking-wide">
//                     {renderWords()}
//                 </div>
//             </div>
//         </div>
//     );
// };

"use client";
import { useEffect } from "react";
import { motion, stagger, useAnimate } from "framer-motion";
import { cn } from "../../lib/utils";

export const TextGenerateEffect = ({
    elements = [],
    className,
    filter = true,
    duration = 0.5
}) => {
    const [scope, animate] = useAnimate();

    // Validate elements before rendering
    if (!Array.isArray(elements)) {
        throw new Error("TextGenerateEffect requires an array of elements");
    }

    useEffect(() => {
        if (elements.length > 0) {
            animate(
                "span",
                {
                    opacity: 1,
                    filter: filter ? "blur(0px)" : "none",
                },
                {
                    duration: duration,
                    delay: stagger(0.2),
                }
            );
        }
    }, [scope.current, elements]);

    const renderElements = () => {
        if (elements.length === 0) return null;

        return (
            <motion.div ref={scope}>
                {elements
                    .filter(element => !!element) // Remove falsy values
                    .map((element, idx) => (
                        <motion.span
                            key={`${typeof element === 'string' ? element : element?.key || idx}`}
                            className="dark:text-white text-black opacity-0 inline-block"
                            style={{ filter: filter ? "blur(10px)" : "none" }}
                        >
                            {element}
                        </motion.span>
                    ))}
            </motion.div>
        );
    };

    return (
        <div className={cn("font-bold", className)}>
            <div className="mt-4">
                <div className="dark:text-white text-black text-2xl leading-snug tracking-wide">
                    {elements.length ? renderElements() : <span>No content provided</span>}
                </div>
            </div>
        </div>
    );
};