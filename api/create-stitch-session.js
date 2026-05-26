// Serverless endpoint to create a Stitch payment/session.
// Expects environment variables:
// - STITCH_SECRET : the API secret for Stitch (or other payments provider)
// - STITCH_API_URL : optional override of the provider's create-payment endpoint

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const STITCH_SECRET = process.env.STITCH_SECRET;
  const STITCH_API_URL = process.env.STITCH_API_URL || 'https://api.stitch.money/v1/payment-requests';

  if (!STITCH_SECRET) return res.status(500).json({ error: 'STITCH_SECRET not configured' });

  const payload = req.body;

  try {
    const r = await fetch(STITCH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${STITCH_SECRET}`
      },
      body: JSON.stringify(payload)
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data });

    // Return whatever the provider responded with. Typically this includes a redirect URL or session id.
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
