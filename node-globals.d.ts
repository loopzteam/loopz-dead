declare var process: {
  env: Record<string, string | undefined>;
  cwd(): string;
};
declare function require(path: string): any;
