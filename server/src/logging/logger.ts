import pino from 'pino';
import pretty from 'pino-pretty';
import chalk from 'chalk';

const isDev = process.env.NODE_ENV !== 'production';

// pino-pretty as a sync stream so logs flush immediately under concurrently
const prettyStream = isDev
  ? pretty({
      colorize: true,
      translateTime: 'HH:MM:ss.l',
      ignore: 'pid,hostname',
      levelFirst: true,
      sync: true,
    })
  : null;

export const logger = pino(
  { level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info') },
  prettyStream ?? undefined
);

// Scoped child loggers for each subsystem
export const httpLogger = logger.child({ subsystem: 'http' });
export const workerLogger = logger.child({ subsystem: 'worker' });
export const deliveryLogger = logger.child({ subsystem: 'delivery' });
export const dbLogger = logger.child({ subsystem: 'db' });

// Chalk helpers for inline terminal highlights (dev only, stripped in prod)
export const c = {
  method: (m: string) => {
    const colors: Record<string, chalk.Chalk> = {
      GET: chalk.green,
      POST: chalk.blue,
      PUT: chalk.yellow,
      PATCH: chalk.cyan,
      DELETE: chalk.red,
    };
    return (colors[m] ?? chalk.white)(m.padEnd(6));
  },
  status: (s: number) =>
    s >= 500
      ? chalk.red.bold(s)
      : s >= 400
      ? chalk.yellow.bold(s)
      : s >= 300
      ? chalk.cyan(s)
      : chalk.green.bold(s),
  path: (p: string) => chalk.white(p),
  ms: (ms: number) => (ms > 1000 ? chalk.red(`${ms}ms`) : ms > 200 ? chalk.yellow(`${ms}ms`) : chalk.green(`${ms}ms`)),
  id: (id: string) => chalk.gray(id.slice(0, 8)),
  url: (u: string) => chalk.magenta(u),
};
