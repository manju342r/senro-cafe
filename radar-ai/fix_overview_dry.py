import re

with open('src/components/Overview.tsx', 'r') as f:
    content = f.read()

# Add a MetricCard component definition right before `export const Overview = () => {`
metric_card = """
const MetricCard = ({ title, value, icon: Icon, iconColor, subtext }: { title: string, value: string | number, icon?: any, iconColor?: string, subtext?: string }) => (
  <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="bg-surface/80 backdrop-blur-xl/90 border border-line/80 hover:border-line-hover p-6 rounded-2xl flex flex-col justify-between shadow-lg transition-colors group">
    <div className="text-xs font-bold text-muted tracking-widest uppercase">{title}</div>
    <div className="mt-5 flex items-end justify-between">
      <div className="text-4xl font-black text-content tracking-tight">{value}</div>
      {Icon && <Icon size={24} className={`${iconColor} mb-1 opacity-80 group-hover:opacity-100 transition-opacity`} />}
      {subtext && <div className="text-xs uppercase tracking-widest text-muted font-medium mb-1">{subtext}</div>}
    </div>
  </motion.div>
);

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};
"""

content = content.replace("export const Overview = () => {", metric_card + "\nexport const Overview = () => {")

# Remove itemVariants from inside Overview if it's there
content = re.sub(r'const itemVariants = \{.*?\n  \};\n', '', content, flags=re.DOTALL)

# Replace the 4 duplicated cards with the new component
cards_block = re.search(r'\{/\* Top Metrics Row \*/\}.*?</motion\.div>\n      </motion\.div>', content, re.DOTALL)
if cards_block:
    new_cards = """{/* Top Metrics Row */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard title="Strategic Gap Index" value={loading ? '--' : (data ? data.strategic_gap_index : '--')} icon={TrendingUp} iconColor="text-emerald-500" />
        <MetricCard title="Traffic Impact" value={loading ? '--' : (data ? data.net_traffic_impact : '--')} icon={Activity} iconColor="text-violet-500" />
        <MetricCard title="Threat Level" value={loading ? '--' : (data ? data.threat_level : '--')} icon={AlertTriangle} iconColor="text-amber-500" />
        <MetricCard title="Recent Signals" value={loading ? '--' : (data ? data.signals_24h : '--')} subtext={`${loading ? '--' : (data ? data.signals_total : '--')} total`} />
      </motion.div>"""
    
    content = content.replace(cards_block.group(0), new_cards)

with open('src/components/Overview.tsx', 'w') as f:
    f.write(content)
