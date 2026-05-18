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
    if (!content.includes('import { canAccessAdmin } from')) {
        content = "import { canAccessAdmin } from '@/lib/auth/roles';\n" + content;
        fs.writeFileSync(p, content);
        console.log('Added import to ' + file);
    }
  }
});
