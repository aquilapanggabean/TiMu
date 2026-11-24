import type { VercelRequest, VercelResponse } from '@vercel/node';
import { findCertificate } from '../../_store';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });

  const { code } = req.query as { code: string };
  const cert = findCertificate(code);
  if (!cert) return res.status(404).json({ error: 'Certificate verification code not found.' });
  return res.json({ certificate: cert });
}
