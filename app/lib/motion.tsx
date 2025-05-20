'use client';

import { motion, type MotionProps } from 'framer-motion';
import type {
  HTMLAttributes,
  ButtonHTMLAttributes,
  FormHTMLAttributes,
  InputHTMLAttributes,
  AnchorHTMLAttributes,
  LiHTMLAttributes,
  UlHTMLAttributes,
  DetailedHTMLProps,
} from 'react';

// Helper generic type that merges MotionProps with standard element props
type Merge<T> = T & MotionProps;

// Properly type the motion components so that HTML props like className or
// onClick can be used without TypeScript errors.
export const MotionDiv = motion.div as React.ComponentType<
  Merge<DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>>
>;
export const MotionButton = motion.button as React.ComponentType<
  Merge<DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>>
>;
export const MotionForm = motion.form as React.ComponentType<
  Merge<DetailedHTMLProps<FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>>
>;
export const MotionInput = motion.input as React.ComponentType<
  Merge<DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>>
>;
export const MotionUl = motion.ul as React.ComponentType<
  Merge<DetailedHTMLProps<UlHTMLAttributes<HTMLUListElement>, HTMLUListElement>>
>;
export const MotionLi = motion.li as React.ComponentType<
  Merge<DetailedHTMLProps<LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>>
>;
export const MotionSpan = motion.span as React.ComponentType<
  Merge<DetailedHTMLProps<HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>>
>;
export const MotionP = motion.p as React.ComponentType<
  Merge<DetailedHTMLProps<HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>>
>;
export const MotionH1 = motion.h1 as React.ComponentType<
  Merge<DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>>
>;
export const MotionH2 = motion.h2 as React.ComponentType<
  Merge<DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>>
>;
export const MotionH3 = motion.h3 as React.ComponentType<
  Merge<DetailedHTMLProps<HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>>
>;
export const MotionA = motion.a as React.ComponentType<
  Merge<DetailedHTMLProps<AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>>
>;

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
