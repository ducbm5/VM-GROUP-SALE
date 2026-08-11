import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clientSearch } from '../src/lib/tsvParser';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const query = (req.query.q as string || '').trim();
    const exactMatch = req.query.exact === 'true';

    const result = await clientSearch(query, exactMatch);
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=15');
    return res.status(200).json(result);
  } catch (err: any) {
    return res.status(500).json({ status: "error", message: err.message });
  }
}
