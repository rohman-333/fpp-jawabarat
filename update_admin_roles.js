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
    content = content.replace(/profile\.role !== 'admin' && profile\.role !== 'operator' && profile\.role !== 'superadmin'/g, "!canAccessAdmin(profile)");
    content = content.replace(/profile\.role !== 'admin' && profile\.role !== 'operator'/g, "!canAccessAdmin(profile)");
    
    // Also we need to make sure canAccessAdmin is imported
    if (!content.includes('canAccessAdmin')) {
        content = content.replace(
            "import { createClient } from '@/lib/supabase/server';", 
            "import { createClient } from '@/lib/supabase/server';\nimport { canAccessAdmin } from '@/lib/auth/roles';"
        );
    }

    fs.writeFileSync(p, content);
    console.log('Updated ' + file);
  }
});
