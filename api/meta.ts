import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clientGetMeta } from '../src/lib/tsvParser';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const data = await clientGetMeta();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ status: "error", message: err.message });
  }
}
