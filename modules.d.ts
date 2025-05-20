// Minimal module declarations to satisfy TypeScript without node_modules

declare module 'next/link';
declare module 'next/router';
declare module 'next/navigation';
declare module 'next/server';
declare module 'next/headers';
declare module 'next';

declare module '@supabase/ssr';
declare module '@supabase/auth-helpers-nextjs';
declare module 'react' {
  export const forwardRef: any;
  export type ReactNode = any;
  export type ComponentPropsWithoutRef<T> = any;
  export type ElementRef<T> = any;
  export interface HTMLAttributes<T> extends Record<string, any> {}
  export interface InputHTMLAttributes<T> extends HTMLAttributes<T> {}
}
declare module '@radix-ui/react-label';
declare module 'class-variance-authority' {
  export function cva(...args: any[]): any;
  export type VariantProps<T> = any;
}

declare module 'clsx' {
  export function clsx(...args: any[]): string;
  export type ClassValue = any;
  export default clsx;
}

declare module 'tailwind-merge' {
  export function twMerge(...args: any[]): string;
}

declare module 'tailwindcss';

type NextConfig = any;
type Config = any;

declare var process: any;
declare function require(module: string): any;
declare const React: any;

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}



type NextRequest = any;
declare module 'lucide-react';
declare module 'uuid';
declare module 'openai';
declare module '@supabase/supabase-js';
declare module 'fs';
declare module 'path';
