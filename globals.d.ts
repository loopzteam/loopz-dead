declare module '*';

declare namespace React {
  type ReactNode = any;
  interface FormEvent<T = any> extends Event {}
  interface KeyboardEvent<T = any> extends Event {}
  type FC<P = any> = any;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elem: string]: any;
  }
}

declare var process: any;

declare class NextRequest {
  [key: string]: any;
}

declare class NextResponse {
  [key: string]: any;
  static json: any;
}
