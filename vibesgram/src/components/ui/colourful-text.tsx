"use client";
import { motion } from "motion/react";

export default function ColourfulText({ text }: { text: string }) {
  // Using only primary purple color
  const color = "hsl(var(--primary))";

  return text.split("").map((char, index) => (
    <motion.span
      key={`${char}-${index}`}
      initial={{
        y: 0,
        color: "inherit",
      }}
      animate={{
        color: color,
        y: [0, -3, 0],
        scale: [1, 1.01, 1],
        filter: ["blur(0px)", `blur(5px)`, "blur(0px)"],
        opacity: [1, 0.8, 1],
      }}
      transition={{
        duration: 0.5,
        delay: index * 0.05,
      }}
      className="inline-block whitespace-pre font-sans tracking-tight"
    >
      {char}
    </motion.span>
  ));
}
