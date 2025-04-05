// "use client";
// import React, { useCallback, useEffect, useState } from "react";
// import { AnimatePresence, motion } from "motion/react";
// import { cn } from "../../lib/utils";

// export const FlipWords = ({
//   words,
//   duration = 3000,
//   className
// }) => {
//   const [currentWord, setCurrentWord] = useState(words[0]);
//   const [isAnimating, setIsAnimating] = useState(false);

//   const isRTL = (word) => {
//     const arabicRegex = /[\u0600-\u06FF\u0750-\u077F]/;
//     return arabicRegex.test(word);
//   };

//   // thanks for the fix Julian - https://github.com/Julian-AT
//   const startAnimation = useCallback(() => {
//     const word = words[words.indexOf(currentWord) + 1] || words[0];
//     setCurrentWord(word);
//     setIsAnimating(true);
//   }, [currentWord, words]);

//   useEffect(() => {
//     if (!isAnimating)
//       setTimeout(() => {
//         startAnimation();
//       }, duration);
//   }, [isAnimating, duration, startAnimation]);

//   return (
//     <AnimatePresence
//       onExitComplete={() => {
//         setIsAnimating(false);
//       }}>
//       <motion.div
//         initial={{
//           opacity: 0,
//           y: 10,
//         }}
//         animate={{
//           opacity: 1,
//           y: 0,
//         }}
//         transition={{
//           type: "spring",
//           stiffness: 100,
//           damping: 10,
//         }}
//         exit={{
//           opacity: 0,
//           y: -40,
//           x: 40,
//           filter: "blur(8px)",
//           scale: 2,
//           position: "absolute",
//         }}
//         className={cn(
//           "tw-z-10 tw-inline-block tw-relative tw-text-left tw-text-neutral-900 dark:tw-text-neutral-100 tw-px-2",
//           className
//         )}
//         key={currentWord}
//         dir={isRTL(currentWord) ? "rtl" : "ltr"} // Apply text direction
//         style={{ textAlign: isRTL(currentWord) ? "right" : "left" }} // Ensure proper alignment
//         >
//         {/* edit suggested by Sajal: https://x.com/DewanganSajal */}
//         {currentWord.split(" ").map((word, wordIndex) => (
//           <motion.span
//             key={word + wordIndex}
//             initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
//             animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
//             transition={{
//               delay: wordIndex * 0.3,
//               duration: 0.3,
//             }}
//             className="tw-inline-block tw-whitespace-nowrap">
//             {word.split("").map((letter, letterIndex) => (
//               <motion.span
//                 key={word + letterIndex}
//                 initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
//                 animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
//                 transition={{
//                   delay: wordIndex * 0.3 + letterIndex * 0.05,
//                   duration: 0.2,
//                 }}
//                 className="tw-inline-block">
//                 {letter}
//               </motion.span>
//             ))}
//             <span className="tw-inline-block">&nbsp;</span>
//           </motion.span>
//         ))}
//       </motion.div>
//     </AnimatePresence>
//   );
// };

"use client";
import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "../../lib/utils";

export const FlipWords = ({ words, duration = 3000, className }) => {
  const [currentWord, setCurrentWord] = useState(words[0]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Function to check if a word is in Arabic (or another RTL language)
  const isRTL = (word) => {
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F]/;
    return arabicRegex.test(word);
  };

  const startAnimation = useCallback(() => {
    const word = words[words.indexOf(currentWord) + 1] || words[0];
    setCurrentWord(word);
    setIsAnimating(true);
  }, [currentWord, words]);

  useEffect(() => {
    if (!isAnimating)
      setTimeout(() => {
        startAnimation();
      }, duration);
  }, [isAnimating, duration, startAnimation]);

  return (
    <AnimatePresence
      onExitComplete={() => {
        setIsAnimating(false);
      }}>
      <motion.div
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 10,
        }}
        exit={{
          opacity: 0,
          y: -40,
          x: 40,
          filter: "blur(8px)",
          scale: 2,
          position: "absolute",
        }}
        className={cn(
          "tw-z-10 tw-inline-block tw-relative tw-text-left tw-text-neutral-900 dark:tw-text-neutral-100 tw-px-2",
          className
        )}
        key={currentWord}
        dir={isRTL(currentWord) ? "rtl" : "ltr"}
        style={{ textAlign: isRTL(currentWord) ? "right" : "left" }}
      >
        {isRTL(currentWord) ? (
          // Render Arabic words as a single unit (without splitting)
          <motion.span
            initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.3 }}
            className="tw-inline-block tw-whitespace-nowrap">
            {currentWord}
          </motion.span>
        ) : (
          // Render other words letter-by-letter
          currentWord.split(" ").map((word, wordIndex) => (
            <motion.span
              key={word + wordIndex}
              initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{
                delay: wordIndex * 0.3,
                duration: 0.3,
              }}
              className="tw-inline-block tw-whitespace-nowrap">
              {word.split("").map((letter, letterIndex) => (
                <motion.span
                  key={word + letterIndex}
                  initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{
                    delay: wordIndex * 0.3 + letterIndex * 0.05,
                    duration: 0.2,
                  }}
                  className="tw-inline-block">
                  {letter}
                </motion.span>
              ))}
              <span className="tw-inline-block">&nbsp;</span>
            </motion.span>
          ))
        )}
      </motion.div>
    </AnimatePresence>
  );
};
