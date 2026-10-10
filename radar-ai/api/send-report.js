import { Resend } from 'resend';

export default async function handler(req, res) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { userId, competitorName, gapScore, recommendations, trafficDelta, emailRecipient } = req.body;
  const authHeader = req.headers.authorization || ''; 
  const resendApiKey = authHeader.replace('Bearer ', '').trim() || process.env.RESEND_API_KEY;

  if (!emailRecipient || !resendApiKey) {
    return res.status(400).json({ error: 'Missing email recipient or Resend API key' });
  }

  try {
    const resend = new Resend(resendApiKey);

    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #1a1a1a;">Competitor Movement & Visibility Alert</h2>
        <p>Senro.AI has detected significant changes from <strong>${competitorName}</strong>.</p>
        
        <div style="background-color: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Scorecard</h3>
          <p><strong>Strategic Gap Score:</strong> ${gapScore}/100</p>
          <p><strong>Traffic Impact:</strong> ${trafficDelta}</p>
        </div>

        <h3>Strategic Directives (AI Hindsight Recommendations)</h3>
        <ul>
          ${recommendations.map(rec => `
            <li style="margin-bottom: 15px;">
              <strong>${rec.title}</strong> (${rec.category})<br/>
              ${rec.recommendation}<br/>
              <em>Potential Impact: ${rec.impact_potential}</em>
            </li>
          `).join('')}
        </ul>
        
        <p style="font-size: 12px; color: #71717a; margin-top: 40px;">
          Sent by Senro.AI Adaptive Competitive Intelligence.
        </p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: 'Senro.AI <onboarding@resend.dev>', // onboarding@resend.dev works on the free tier without verifying a domain!
      to: [emailRecipient],
      subject: `🚨 Competitive Alert: ${competitorName} - Gap Score ${gapScore}`,
      html: htmlContent,
    });

    if (error) {
      return res.status(400).json({ error });
    }

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Email error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
