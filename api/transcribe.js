// api/transcribe.js - Vercel Serverless Function adapter for Voixt
const { handler: netlifyHandler } = require('../netlify/functions/transcribe');

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Convert Vercel req/res to Netlify event structure for shared logic
  const event = {
    httpMethod: req.method,
    headers: req.headers,
    body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})
  };

  try {
    const result = await netlifyHandler(event, {});
    
    // Set headers
    if (result.headers) {
      for (const [key, value] of Object.entries(result.headers)) {
        res.setHeader(key, value);
      }
    }

    res.status(result.statusCode || 200);
    return res.send(result.body);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

