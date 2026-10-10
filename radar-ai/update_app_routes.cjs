const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Imports
content = content.replace(
  `import { Profile } from './components/Profile';`,
  `import { Profile } from './components/Profile';\nimport { ScheduledReports } from './components/ScheduledReports';`
);

content = content.replace(
  `Activity, FileText, LogOut\n} from 'lucide-react';`,
  `Activity, FileText, LogOut, Calendar\n} from 'lucide-react';`
);

// Sidebar
content = content.replace(
  `<SidebarItem to="/dashboard/battlecards" icon={FileText} label="Battlecards" />`,
  `<SidebarItem to="/dashboard/battlecards" icon={FileText} label="Battlecards" />\n          <SidebarItem to="/dashboard/reports" icon={Calendar} label="Scheduled Reports" />`
);

// Route
content = content.replace(
  `<Route path="/dashboard/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />`,
  `<Route path="/dashboard/profile" element={<DashboardLayout><Profile /></DashboardLayout>} />\n          <Route path="/dashboard/reports" element={<DashboardLayout><ScheduledReports /></DashboardLayout>} />`
);

fs.writeFileSync('src/App.tsx', content);
