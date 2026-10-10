const fs = require('fs');
let content = fs.readFileSync('src/components/SettingsUI.tsx', 'utf8');

// Add reportFreq state
content = content.replace(
  `const [alertSens, setAlertSens] = useState(() => localStorage.getItem('alertSens') || 'Balanced');`,
  `const [alertSens, setAlertSens] = useState(() => localStorage.getItem('alertSens') || 'Balanced');\n  const [reportFreq, setReportFreq] = useState(() => localStorage.getItem('reportFreq') || 'never');`
);

// Add the setting field
const newSettingField = `
          <div className="flex justify-between items-center text-sm">
            <span className="text-zinc-500 w-1/3">Email report frequency</span>
            <select 
              value={reportFreq}
              onChange={async (e) => { 
                const val = e.target.value;
                setReportFreq(val); 
                localStorage.setItem('reportFreq', val);
                try {
                  await supabase.from('user_settings').update({ email_report_frequency: val }).eq('email', email);
                } catch(e) { console.error(e) }
              }}
              className="w-2/3 bg-transparent hover:bg-zinc-800/50 focus:bg-zinc-800/50 focus:ring-1 focus:ring-blue-500 rounded px-2 py-1 outline-none text-zinc-200 text-right transition-all cursor-pointer"
            >
              <option value="never">Never</option>
              <option value="daily">Daily</option>
              <option value="twice_a_day">Twice a Day</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
        </div>
      </div>
`;

content = content.replace(
  `        </div>\n      </div>\n\n      <div className="bg-[#121212] border border-zinc-800 rounded-xl overflow-hidden">`,
  newSettingField + '\n\n      <div className="bg-[#121212] border border-zinc-800 rounded-xl overflow-hidden">'
);

fs.writeFileSync('src/components/SettingsUI.tsx', content);
