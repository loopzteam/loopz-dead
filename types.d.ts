declare module '@supabase/ssr' {
  export const createServerClient: any;
  export const createMiddlewareClient: any;
}

declare module 'next/headers' {
  export function cookies(): any;
  export function headers(): any;
}

declare module 'next/server' {
  export class NextRequest {
    headers: any;
    cookies: { getAll(): any[]; set(name: string, value: string): void };
    nextUrl: any;
    url: string;
  }
  export class NextResponse {
    cookies: { set(name: string, value: string, options?: any): void };
    static next(init?: any): NextResponse;
    static redirect(url: string | URL): NextResponse;
    static json(data: any, init?: any): NextResponse;
  }
}

declare module 'next/navigation' {
  export function useRouter(): any;
  export function redirect(url: string): void;
}
