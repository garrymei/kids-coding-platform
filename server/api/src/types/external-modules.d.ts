/* eslint-disable no-dupe-class-members, @typescript-eslint/no-explicit-any */
declare module '@prisma/client' {
  export namespace Prisma {
    interface LogEvent {
      target: string;
      message: string;
      timestamp?: Date;
    }
  }

  export interface PrismaClientOptions {
    datasources?: Record<string, { url?: string }>;
    log?: Array<{ level: 'query' | 'info' | 'warn' | 'error'; emit: 'stdout' | 'event' }>;
  }

  export class PrismaClient {
    constructor(options?: PrismaClientOptions);
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    $on(event: string, callback: (...args: any[]) => void): void;
    $queryRaw<T = unknown>(...args: any[]): Promise<T>;
  }
}

declare module 'prom-client' {
  export interface CounterConfiguration<T extends string = string> {
    name: string;
    help: string;
    labelNames?: T[];
    registers?: any[];
  }

  export interface HistogramConfiguration<T extends string = string> {
    name: string;
    help: string;
    labelNames?: T[];
    buckets?: number[];
    registers?: any[];
  }

  export interface GaugeConfiguration<T extends string = string> {
    name: string;
    help: string;
    labelNames?: T[];
    registers?: any[];
  }

  export class Counter<T extends string = string> {
    constructor(configuration: CounterConfiguration<T>);
    inc(value?: number): void;
    inc(labels: Record<T, string>, value?: number): void;
    labels(...values: string[]): Counter<T>;
  }

  export class Histogram<T extends string = string> {
    constructor(configuration: HistogramConfiguration<T>);
    observe(value: number): void;
    observe(labels: Record<T, string>, value: number): void;
    startTimer(labels?: Record<T, string>): () => void;
  }

  export class Gauge<T extends string = string> {
    constructor(configuration: GaugeConfiguration<T>);
    set(value: number): void;
    set(labels: Record<T, string>, value: number): void;
    inc(value?: number): void;
    dec(value?: number): void;
  }

  export const register: {
    metrics(): Promise<string>;
    clear(): void;
  };

  export function collectDefaultMetrics(options?: { register?: typeof register }): void;
}

declare module 'jsonwebtoken' {
  export interface SignOptions {
    algorithm?:
      | 'RS256'
      | 'RS384'
      | 'RS512'
      | 'ES256'
      | 'ES384'
      | 'ES512'
      | 'HS256'
      | 'HS384'
      | 'HS512'
      | 'PS256'
      | 'PS384'
      | 'PS512';
    expiresIn?: string | number;
    audience?: string | string[];
    issuer?: string;
    subject?: string;
  }

  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: string | Buffer,
    options?: SignOptions,
  ): string;

  export function verify(
    token: string,
    secretOrPublicKey: string | Buffer,
    options?: { algorithms?: SignOptions['algorithm'][] },
  ): unknown;

  export function decode(token: string, options?: { complete?: boolean; json?: boolean }): any;

  export class JsonWebTokenError extends Error {}
  export class TokenExpiredError extends JsonWebTokenError {
    expiredAt: Date;
  }
}
