"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { SlidingNumber } from "@/components/motion-primitives/sliding-number";
import { InView } from "./motion-primitives/in-view";

export function NumberEffect({
  numberFrom = 0,
  numberSteps = 1,
  numberTo = 100,
  duration = 1.5,
  delay = 0.3,
}: {
  numberFrom?: number;
  numberSteps?: number;
  numberTo: number;
  delay?: number;
  duration?: number;
}) {
  const [value, setValue] = useState(numberFrom);

  useEffect(() => {
    if (value === numberTo) return;

    const interval = setInterval(() => {
      setValue(value + numberSteps);
    }, 10);
    return () => clearInterval(interval);
  }, [value, numberTo, numberSteps]);

  return (
    <motion.div
      initial={{ y: 0, fontSize: `${24}px` }}
      animate={{ y: 0, fontSize: `${24}px` }}
      transition={{
        ease: [1, 0, 0.35, 0.95],
        duration: duration,
        delay: delay,
      }}
      className=" inline"
    >
      <div className="inline-flex items-center gap-1">
        <SlidingNumber value={value} />
      </div>
    </motion.div>
  );
}
