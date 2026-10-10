with open('src/components/CompareHub.tsx', 'r') as f:
    content = f.read()

content = content.replace(
    'className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 w-[${data?.sentiment_score || 50}%]"',
    'className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${data?.sentiment_score || 50}%` }}'
)

with open('src/components/CompareHub.tsx', 'w') as f:
    f.write(content)
