import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(45) ? res.status(405).json({ message: 'Method not allowed' }) : res.status(405).end();
  }

  const { password } = req.body || {};
  if (password === "898989") {
    return res.status(200).json({ success: true, message: "Mật khẩu chính xác." });
  } else {
    return res.status(401).json({ success: false, message: "Mật khẩu không chính xác." });
  }
}
