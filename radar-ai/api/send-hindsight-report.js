import OpenAI from "openai";
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { email, competitorUrl } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // 1. Simulate fetching Hindsight data (in real app, call client.recall)
    console.log(`[Hindsight] Recalling memory for ${competitorUrl} to generate report...`);
    const hindsightMemory = `
      - 24h ago: Competitor increased pricing page frequency.
      - 12h ago: Competitor launched a new "Enterprise" feature tier.
      - 2h ago: Competitor changed checkout flow to require work email.
    `;

    // 2. Call Groq LLM to generate email HTML
    const groqKey = process.env.GROQ_API_KEY || process.env.LLM_KEY;
    if (!groqKey) {
      return res.status(400).json({ error: 'LLM API key not configured on server' });
    }

        const openai = new OpenAI({
      apiKey: groqKey || process.env.LLM_KEY,
      baseURL: "https://api.groq.com/openai/v1",
    });

    const systemPrompt = "You are a competitive intelligence AI. Summarize these recent competitor signals retrieved from our memory bank and suggest 2 strategic counter-moves. Format exactly as a clean HTML snippet for an email body (no markdown block markers like ```html, just the raw HTML). Use sleek, modern styling with inline CSS (dark mode preferred).";
    const userPrompt = `Target Competitor: ${competitorUrl}\nRecent Hindsight Memory Signals:\n${hindsightMemory}`;

    const completion = await openai.chat.completions.create({
      model: process.env.LLM_MODEL || "openai/gpt-oss-120b", // Use a faster model for email generation if 120b is not strictly needed, but let's stick to user request
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    let emailHtml = completion.choices[0].message.content;
    emailHtml = emailHtml.replace(/```html/g, '').replace(/```/g, '').trim();

    // 3. Send email via Nodemailer
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    
    if (!emailUser || !emailPass) {
      console.warn('No EMAIL_USER or EMAIL_PASS found, simulating email send.');
      return res.status(200).json({ success: true, simulated: true, html: emailHtml });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    try {
      const info = await transporter.sendMail({
        from: `"Senro.AI" <${emailUser}>`,
        to: email, // Use dynamic email
        subject: `🚨 Hindsight Intelligence Report: ${competitorUrl}`,
        html: emailHtml
      });
      return res.status(200).json({ success: true, data: info });
    } catch (error) {
      console.error('Nodemailer error:', error);
      return res.status(400).json({ error: error.message });
    }
  } catch (error) {
    console.error('Email report error:', error);
    return res.status(500).json({ error: error.message });
  }
}
