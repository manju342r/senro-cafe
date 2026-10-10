with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add a single `const location = useLocation();` right after `const DashboardLayout = ...`
idx = content.find("const DashboardLayout = ({ children }: { children: React.ReactNode }) => {")
if idx != -1:
    idx += len("const DashboardLayout = ({ children }: { children: React.ReactNode }) => {")
    content = content[:idx] + "\n  const location = useLocation();" + content[idx:]

with open('src/App.tsx', 'w') as f:
    f.write(content)
