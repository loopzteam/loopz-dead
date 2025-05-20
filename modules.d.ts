// Minimal module declarations to satisfy TypeScript without node_modules
declare module '@radix-ui/react-checkbox';
declare module '@radix-ui/react-dropdown-menu';
declare module '@radix-ui/react-label';
declare module '@radix-ui/react-slot';
declare module '@supabase/auth-helpers-nextjs';
declare module '@supabase/auth-helpers-react';
declare module '@supabase/supabase-js';
declare module '@supabase/ssr';
declare module 'class-variance-authority' {
  export function cva(...args: any[]): any;
  export const cva: any;
  export type VariantProps<T> = any;
}
declare module 'clsx' {
  export function clsx(...args: any[]): string;
  export type ClassValue = any;
  export default function clsx(...inputs: any[]): string;
}
declare module 'framer-motion' {
  export const motion: any;
  export type HTMLMotionProps<T> = any;
}
declare module 'lucide-react';
declare module 'next';
declare module 'next-themes';
declare module 'next/font/google';
declare module 'next/image';
declare module 'next/link';
declare module 'next/router';
declare module 'next/navigation';
declare module 'next/server';
declare module 'next/headers';
declare module 'openai';
declare module 'tailwind-merge' {
  export function twMerge(...args: any[]): string;
}
declare module 'tailwindcss';
declare module 'uuid';
declare module 'zustand';
declare module 'zustand/shallow';
declare module 'react-dom';
declare module 'fs';
declare module 'path';

// React module with combined declarations
declare module 'react' {
  export const useState: any;
  export const useEffect: any;
  export const useRef: any;
  export const forwardRef: any;
  export type ReactNode = any;
  export interface FC<P = any> {}
  export interface FormEvent<T = any> {}
  export interface KeyboardEvent<T = any> {}
  export type ComponentType<P = any> = (props: P) => any;
  export type ComponentPropsWithoutRef<T> = any;
  export type ComponentPropsWithRef<T> = any;
  export type ElementRef<T> = any;
  export interface HTMLAttributes<T> extends Record<string, any> {}
  export interface InputHTMLAttributes<T> extends HTMLAttributes<T> {}
  export interface ReactElement {}
  export const createElement: any;
  export default React;
}

// Global declarations
declare var React: any;
declare var process: any;
declare function require(module: string): any;
type NextConfig = any;
type Config = any;
type NextRequest = any;

// JSX namespace
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}