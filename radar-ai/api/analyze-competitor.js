import fetch from 'node-fetch';
import FirecrawlApp from '@mendable/firecrawl-js';

// Helper to scrape a single URL using Jina with Firecrawl fallback
async function scrapeUrl(targetUrl) {
  const jinaKey = process.env.JINA_API_KEY || '';
  const firecrawlKey = process.env.FIRECRAWL_API_KEY || '';

  try {
    const jinaUrl = `https://r.jina.ai/${targetUrl}`;
    const jinaHeaders = { 'Accept': 'text/plain' };
    if (jinaKey && jinaKey !== 'skip') jinaHeaders['Authorization'] = `Bearer ${jinaKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const jinaResponse = await fetch(jinaUrl, { method: 'GET', headers: jinaHeaders, signal: controller.signal });
      clearTimeout(timeout);
      if (jinaResponse.ok) {
        const jinaMarkdown = await jinaResponse.text();
        if (jinaMarkdown && jinaMarkdown.length >= 100) return jinaMarkdown;
      }
    } catch (e) {
      clearTimeout(timeout);
    }

    if (firecrawlKey && firecrawlKey !== 'skip') {
      const firecrawlApp = new FirecrawlApp({ apiKey: firecrawlKey });
      const scrapeResult = await firecrawlApp.scrapeUrl(targetUrl, { formats: ['markdown'] });
      if (scrapeResult.success && scrapeResult.markdown && scrapeResult.markdown.length >= 100) {
        return scrapeResult.markdown;
      }
    }
    
    return `[Failed to scrape ${targetUrl}]`;
  } catch (error) {
    return `[Error scraping ${targetUrl}: ${error.message}]`;
  }
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { ownUrl, competitorUrls } = req.body;
  if (!ownUrl || !competitorUrls || !Array.isArray(competitorUrls)) {
    return res.status(400).json({ error: 'ownUrl and competitorUrls array are required' });
  }

  try {
    // 1. Scrape all URLs concurrently
    const urlsToScrape = [ownUrl, ...competitorUrls];
    const scrapePromises = urlsToScrape.map(url => scrapeUrl(url));
    const scrapedResults = await Promise.all(scrapePromises);

    const ownText = scrapedResults[0];
    const compTexts = scrapedResults.slice(1);

    // 2. Retain in Hindsight (Mock/Conceptual implementation for server-side)
    const hindsightKey = process.env.HINDSIGHT_API_KEY;
    if (hindsightKey && hindsightKey !== 'skip') {
      try {
        await fetch('https://api.vectorize.io/v1/hindsight/retain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${hindsightKey}` },
          body: JSON.stringify({ network: 'observation', content: `Competitor context: ${compTexts.join('\\n').substring(0, 500)}` })
        }).catch(e => console.error("Hindsight API not available yet:", e.message));
      } catch (e) {}
    }

    // 3. Groq LLM Analysis
    const groqKey = process.env.GROQ_API_KEY || process.env.LLM_API_KEY;
    if (!groqKey) {
      return res.status(400).json({ error: 'GROQ_API_KEY or LLM_API_KEY is not set on the server.' });
    }

    const { OpenAI } = await import("openai");
    const openai = new OpenAI({
      apiKey: groqKey,
      baseURL: "https://api.groq.com/openai/v1", // Route specifically to Groq
    });

    const systemPrompt = `You are an expert competitive intelligence AI. Analyze the provided competitor websites vs the user's website.
Return a strict JSON object with EXACTLY these keys:
- "strategic_gap_index": (integer 0-100)
- "net_traffic_impact": (string) e.g., "+5.4%"
- "risk_level": (string) "High", "Medium", or "Low"
- "signals_24h": (integer)
- "signals_total": (integer)
- "analysis_summary": (string)
- "timeline_data": Array of 7 objects for a weekly chart: [{"name":"Mon","threat":20,"signals":1,"annotation":"optional text"},...]
- "raw_signals": Array of 3 objects representing recent changes: [{"urgency":"high|medium|low", "text":"...", "time":"2h ago"}]
- "recommended_actions": Array of 2 actionable recommendations: [{"tag":"Sales Enablement", "text":"..."}]
- "category": (string) e.g. "Technology", "SaaS", "Retail"
- "sentiment_score": (integer 0-100)
DO NOT return any other text outside the JSON.`;

    const userPrompt = `User Website (${ownUrl}):\n${ownText.substring(0, 4000)}\n\nCompetitor Websites:\n${compTexts.map((t, i) => `Comp ${i+1}:\n${t.substring(0, 4000)}`).join('\n\n')}`;

    try {
      const completion = await openai.chat.completions.create({
        model: process.env.LLM_MODEL || "openai/gpt-oss-120b", // Production required model ID
        response_format: { type: "json_object" },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      });

      const resultObj = JSON.parse(completion.choices[0].message.content);
      // Ensure tracked_competitors matches the input array if the LLM hallucinated
      resultObj.tracked_competitors = competitorUrls.length;

      return res.status(200).json(resultObj);
    } catch (llmError) {
      return res.status(500).json({ error: `LLM failed: ${llmError.message}`, details: llmError.stack });
    }

  } catch (error) {
    console.error('Analyze error:', error);
    return res.status(500).json({ error: 'Analysis failed', details: error.message });
  }
}
