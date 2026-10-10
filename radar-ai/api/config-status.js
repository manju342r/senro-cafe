export default function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Check if essential server-side keys exist
  // We consider it "configured" if at least one of the primary AI/Scraping engines is set via env variables
  const isConfigured = Boolean(
    process.env.JINA_API_KEY ||
    process.env.FIRECRAWL_API_KEY ||
    process.env.RESEND_API_KEY ||
    process.env.GROQ_API_KEY || 
    process.env.LLM_API_KEY ||
    process.env.HINDSIGHT_API_KEY
  );

  return res.status(200).json({ configured: isConfigured });
}
