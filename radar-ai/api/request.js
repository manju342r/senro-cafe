import FirecrawlApp from '@mendable/firecrawl-js';

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Firecrawl-Key');

  if (req.method === 'OPTIONS') { return res.status(200).end(); }
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed' }); }

  const { targetUrl } = req.body;
  
  // Read from headers (passed by UI) or fallback to server environment variables
  const headerJina = (req.headers.authorization || '').replace('Bearer ', '').trim();
  const jinaKey = headerJina || process.env.JINA_API_KEY || '';
  
  const headerFirecrawl = req.headers['x-firecrawl-key'] || '';
  const firecrawlKey = headerFirecrawl || process.env.FIRECRAWL_API_KEY || '';

  if (!targetUrl) { return res.status(400).json({ error: 'targetUrl is required' }); }

  try {
    // 1. PRIMARY ENGINE: JINA READER
    console.log(`[Scraper] Attempting Jina Reader for ${targetUrl}`);
    const jinaUrl = `https://r.jina.ai/${targetUrl}`;
    const jinaHeaders = { 'Accept': 'text/plain' };
    
    if (jinaKey && jinaKey !== 'skip') {
      jinaHeaders['Authorization'] = `Bearer ${jinaKey}`;
    }

    try {
      const jinaResponse = await fetch(jinaUrl, {
        method: 'GET',
        headers: jinaHeaders,
        signal: AbortSignal.timeout(12000) // 12-second explicit timeout
      });
      
      if (jinaResponse.ok) {
        const jinaMarkdown = await jinaResponse.text();
        if (jinaMarkdown && jinaMarkdown.length >= 100) {
          console.log(`[Scraper] Jina Reader succeeded for ${targetUrl}`);
          return res.status(200).send(jinaMarkdown);
        } else {
          console.warn(`[Scraper] Jina Reader returned empty or very short payload (<100 chars) for ${targetUrl}. Triggering fallback...`);
        }
      } else {
        console.warn(`[Scraper] Jina Reader failed with status ${jinaResponse.status} for ${targetUrl}. Triggering fallback...`);
      }
    } catch (jinaError) {
      console.warn(`[Scraper] Jina Reader exception for ${targetUrl}: ${jinaError.message}. Triggering fallback...`);
    }

    // 2. SECONDARY ENGINE (FALLBACK): FIRECRAWL
    console.log(`[Scraper] Attempting Firecrawl fallback for ${targetUrl}`);
    if (!firecrawlKey || firecrawlKey === 'skip') {
      throw new Error("Both Primary (Jina) and Fallback (Firecrawl) extractors failed, and no Firecrawl key was provided for the fallback attempt.");
    }

    const firecrawlApp = new FirecrawlApp({ apiKey: firecrawlKey });
    const scrapeResult = await firecrawlApp.scrapeUrl(targetUrl, {
      formats: ['markdown']
    });

    if (!scrapeResult.success) {
      throw new Error(`Firecrawl failed: ${scrapeResult.error}`);
    }

    const firecrawlMarkdown = scrapeResult.markdown;
    if (firecrawlMarkdown && firecrawlMarkdown.length >= 100) {
      console.log(`[Scraper] Firecrawl succeeded for ${targetUrl}`);
      return res.status(200).send(firecrawlMarkdown);
    } else {
      throw new Error("Both Primary (Jina) and Fallback (Firecrawl) extractors failed to return valid Markdown payload for the given URL.");
    }

  } catch (error) {
    console.error('[Scraper Fatal Error]:', error.message);
    return res.status(500).json({ 
      error: 'Extraction Failed', 
      details: error.message || 'Both Primary (Jina) and Fallback (Firecrawl) extractors failed for the given URL.' 
    });
  }
}
