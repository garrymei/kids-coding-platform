import type { Logger } from 'pino';

declare module 'express-serve-static-core' {
  interface Request {
    traceId?: string;
    userId?: string | null;
    log?: Logger;
  }
  interface Response {
    locals: {
      logger?: Logger;
    } & Record<string, unknown>;
  }
}
