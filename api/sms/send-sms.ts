import type { VercelRequest, VercelResponse } from '@vercel/node';
import smsService from '../../services/smsService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const smsRequest = req.body;
    const result = await smsService.sendSMS(smsRequest);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}