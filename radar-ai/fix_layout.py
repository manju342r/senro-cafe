import re

with open('src/layouts/DashboardLayout.tsx', 'r') as f:
    content = f.read()

# Fix 1: Nav Indicator & Active Text Color
# The Link needs relative positioning, and text-white should be text-content
old_link = """className={`text-xs font-medium tracking-wide transition-all hover:text-content ${location.pathname === link.to ? 'text-white' : 'text-muted'}`}"""
new_link = """className={`relative py-1 text-xs font-medium tracking-wide transition-all hover:text-content ${location.pathname === link.to ? 'text-content' : 'text-muted'}`}"""
content = content.replace(old_link, new_link)

# Fix the indicator line
old_indicator = """<motion.div layoutId="nav-indicator" className="h-[2px] w-full bg-content mt-1 absolute rounded-full" />"""
new_indicator = """<motion.div layoutId="nav-indicator" className="absolute -bottom-1 left-0 right-0 h-[2px] bg-content rounded-full" />"""
content = content.replace(old_indicator, new_indicator)

# Fix 2: Profile Icon text color
old_profile = """<Link to="/dashboard/profile" className="w-8 h-8 rounded-full border border-line bg-surface flex items-center justify-center text-white text-xs font-medium hover:bg-line-hover transition-colors">"""
new_profile = """<Link to="/dashboard/profile" className="w-8 h-8 rounded-full border border-line bg-surface flex items-center justify-center text-content text-xs font-medium hover:bg-line-hover transition-colors">"""
content = content.replace(old_profile, new_profile)

with open('src/layouts/DashboardLayout.tsx', 'w') as f:
    f.write(content)

