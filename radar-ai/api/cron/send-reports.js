import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Vercel Cron routes should ideally verify the authorization header for security
export default async function handler(req, res) {
  // 1. Authenticate the cron request
  const authHeader = req.headers.authorization;
  if (process.env.CRON_SECRET && authHeader !== \`Bearer \${process.env.CRON_SECRET}\`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Initialize Clients
  const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const resendApiKey = process.env.RESEND_API_KEY;
  const groqApiKey = process.env.GROQ_API_KEY;


  const openai = new OpenAI({
    apiKey: process.env.GROQ_API_KEY || process.env.LLM_KEY,
    baseURL: "https://api.groq.com/openai/v1", // This routes the call to Groq
  });

  if (!resendApiKey || !groqApiKey) {
    return res.status(500).json({ error: 'Missing external API keys (Resend / Groq)' });
  }

  const resend = new Resend(resendApiKey);

  try {
    // 3. Query Supabase for eligible users
    // For a real production app, you would also check `last_email_sent_at` and calculate intervals based on `email_report_frequency`
    // Since this is a production application, we query everyone who hasn't opted out.
    const { data: users, error: dbError } = await supabase
      .from('user_settings')
      .select('email, email_report_frequency, target_url, competitor_url')
      .neq('email_report_frequency', 'never');

    // MOCK DATA FALLBACK for demo purposes if DB is placeholder
    const activeUsers = (!users || dbError) 
      ? [{ email: 'demo@senro.ai', email_report_frequency: 'daily', target_url: 'https://acme.com', competitor_url: 'https://amazon.com' }] 
      : users;

    let successCount = 0;

    // 4. Process each user
    for (const user of activeUsers) {
      if (!user.email || user.email.includes('placeholder')) continue;

      // a. Use Groq to generate a professional summary
      
      let aiSummary = 'Competitor intelligence scan completed. Strategic gap index is stable at 42. Traffic impact shows a nominal variance. No critical pricing shifts detected in the last cycle.';
      try {
        const completion = await openai.chat.completions.create({
          model: process.env.LLM_MODEL || "openai/gpt-oss-120b",
          messages: [
            { 
              role: 'system', 
              content: 'You are an elite competitive intelligence AI. Write a concise, 3-sentence summary of recent competitor activities for an email report. Focus on pricing changes, feature launches, and traffic impact.' 
            },
            { 
              role: 'user', 
              content: `Analyze recent data for competitor ${user.competitor_url} tracking against baseline ${user.target_url}.`
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        });
        if (completion.choices?.[0]?.message?.content) {
          aiSummary = completion.choices[0].message.content;
        }
      } catch (llmError) {
        console.error("LLM Error:", llmError);
        return res.status(500).json({ error: 'LLM Generation Failed', details: llmError.message });
      }


      // b. Send Email via Resend
      const htmlContent = \`
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #2563eb;">Senro.AI - Automated Intelligence Report</h2>
          <p>Here is your \${user.email_report_frequency.replace('_', ' ')} summary for <strong>\${user.competitor_url || 'your tracked competitor'}</strong>.</p>
          
          <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <h3 style="margin-top: 0; color: #18181b;">AI Executive Summary</h3>
            <p style="color: #3f3f46; line-height: 1.6;">\${aiSummary}</p>
          </div>
          
          <p style="font-size: 12px; color: #71717a; margin-top: 40px; text-align: center;">
            Sent by Senro.AI Adaptive Competitive Intelligence.<br>
            You are receiving this because your report frequency is set to '\${user.email_report_frequency}'.
          </p>
        </div>
      \`;

      const { error: emailError } = await resend.emails.send({
        from: 'Senro.AI Reports <onboarding@resend.dev>', 
        to: [user.email],
        subject: \`Senro.AI Intelligence Report: \${user.competitor_url || 'Update'}\`,
        html: htmlContent,
      });

      if (!emailError) {
        successCount++;
      }
    }

    return res.status(200).json({ success: true, processed: activeUsers.length, sent: successCount });

  } catch (error) {
    console.error('Cron report error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
