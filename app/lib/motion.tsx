'use client';

import { motion, HTMLMotionProps } from 'framer-motion';

// Properly type the motion components
export const MotionDiv = motion.div as React.ComponentType<HTMLMotionProps<'div'>>;
export const MotionButton = motion.button as React.ComponentType<HTMLMotionProps<'button'>>;
export const MotionForm = motion.form as React.ComponentType<HTMLMotionProps<'form'>>;
export const MotionInput = motion.input as React.ComponentType<HTMLMotionProps<'input'>>;
export const MotionUl = motion.ul as React.ComponentType<HTMLMotionProps<'ul'>>;
export const MotionLi = motion.li as React.ComponentType<HTMLMotionProps<'li'>>;
export const MotionSpan = motion.span as React.ComponentType<HTMLMotionProps<'span'>>;
export const MotionP = motion.p as React.ComponentType<HTMLMotionProps<'p'>>;
export const MotionH1 = motion.h1 as React.ComponentType<HTMLMotionProps<'h1'>>;
export const MotionH2 = motion.h2 as React.ComponentType<HTMLMotionProps<'h2'>>;
export const MotionH3 = motion.h3 as React.ComponentType<HTMLMotionProps<'h3'>>;
export const MotionA = motion.a as React.ComponentType<HTMLMotionProps<'a'>>;

export const variants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slideInFromLeft: {
    hidden: { x: '-100%' },
    visible: { x: 0 },
  },
  slideInFromRight: {
    hidden: { x: '100%' },
    visible: { x: 0 },
  },
  slideInFromTop: {
    hidden: { y: '-100%' },
    visible: { y: 0 },
  },
  slideInFromBottom: {
    hidden: { y: '100%' },
    visible: { y: 0 },
  },
};
