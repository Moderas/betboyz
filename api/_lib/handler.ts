import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Wraps a Vercel handler so any unhandled exception returns a JSON 500
 * instead of an HTML error page from the Vercel runtime.
 */
export function handle(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fn: (req: VercelRequest, res: VercelResponse) => Promise<any> | void,
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      await fn(req, res);
    } catch (err) {
      console.error(err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  };
}
