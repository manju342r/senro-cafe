with open('api/analyze-competitor.js', 'r') as f:
    content = f.read()

import re

old_prompt = """const systemPrompt = `You are an expert competitive intelligence AI. Analyze the provided competitor websites vs the user's website.
Return a strict JSON object with EXACTLY these keys:
- "strategic_gap_index": (integer 0-100) How well the user's site competes (higher is better).
- "net_traffic_impact": (string) Estimated traffic/conversion impact, e.g., "+5.4%" or "-2.1%".
- "risk_level": (string) "High", "Medium", or "Low" based on the threat level.
- "signals_24h": (integer) Number of competitor changes detected in last 24h.
- "signals_total": (integer) Total number of competitor changes detected overall.
- "analysis_summary": (string) A detailed 2-3 sentence executive summary explaining the score and the competitor's main advantages.
DO NOT return any other text outside the JSON.`;"""

new_prompt = """const systemPrompt = `You are an expert competitive intelligence AI. Analyze the provided competitor websites vs the user's website.
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
DO NOT return any other text outside the JSON.`;"""

content = content.replace(old_prompt, new_prompt)

with open('api/analyze-competitor.js', 'w') as f:
    f.write(content)

