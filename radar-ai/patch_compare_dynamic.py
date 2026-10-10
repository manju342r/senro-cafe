with open('api/analyze-competitor.js', 'r') as f:
    content = f.read()

import re

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
- "category": (string) e.g. "Technology", "SaaS", "Retail"
- "sentiment_score": (integer 0-100)
DO NOT return any other text outside the JSON.`;"""

content = re.sub(r'const systemPrompt = `You are an expert.*?DO NOT return any other text outside the JSON\.`;', new_prompt, content, flags=re.DOTALL)

with open('api/analyze-competitor.js', 'w') as f:
    f.write(content)

with open('src/components/CompareHub.tsx', 'r') as f:
    compare_content = f.read()

compare_content = compare_content.replace('<td className="p-4 text-muted">Technology</td>', '<td className="p-4 text-muted">{data?.category || "Unknown"}</td>')
compare_content = compare_content.replace('w-[75%]', 'w-[${data?.sentiment_score || 50}%]')

with open('src/components/CompareHub.tsx', 'w') as f:
    f.write(compare_content)

