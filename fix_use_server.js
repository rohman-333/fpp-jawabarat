const fs = require('fs');
const path = require('path');

const files = [
  'app/(admin)/admin/users/page.tsx',
  'app/(admin)/admin/program/page.tsx',
  'app/(admin)/admin/page.tsx',
  'app/(admin)/admin/pesantren/page.tsx',
  'app/(admin)/admin/pesantren/actions.ts',
  'app/(admin)/admin/pesantren/[id]/page.tsx',
  'app/(admin)/admin/marketplace/actions.ts',
  'app/(admin)/admin/marketplace/page.tsx',
  'app/(admin)/admin/forum/page.tsx'
];

files.forEach(file => {
  const p = path.join(__dirname, file);
  if (fs.existsSync(p)) {
    let content = fs.readFileSync(p, 'utf8');
    
    // Check if the file starts with the import
    if (content.startsWith("import { canAccessAdmin } from '@/lib/auth/roles';")) {
        // Find if there is a 'use server' in the first 500 chars
        if (content.includes("'use server'") || content.includes('"use server"')) {
            content = content.replace("import { canAccessAdmin } from '@/lib/auth/roles';\n'use server'", "'use server'\nimport { canAccessAdmin } from '@/lib/auth/roles';");
            content = content.replace("import { canAccessAdmin } from '@/lib/auth/roles';\n\"use server\"", "\"use server\"\nimport { canAccessAdmin } from '@/lib/auth/roles';");
            
            // Just in case it's on different lines
            const lines = content.split('\n');
            if (lines[0].includes('import { canAccessAdmin') && lines[1] && lines[1].includes('use server')) {
                const temp = lines[0];
                lines[0] = lines[1];
                lines[1] = temp;
                content = lines.join('\n');
            }
        }
        
        fs.writeFileSync(p, content);
        console.log('Fixed use server in ' + file);
    }
  }
});
