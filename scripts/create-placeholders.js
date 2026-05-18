const fs = require('fs');
const path = require('path');

const publicRoutes = [
  '/feed/saved',
  '/feed/following',
  '/program',
  '/articles',
  '/news',
  '/documents',
  '/library',
  '/donations',
  '/ai',
  '/assistance',
  '/cart',
  '/checkout',
  '/orders',
  '/notifications',
];

const dashboardRoutes = [
  '/dashboard/pesantren/edit',
  '/dashboard/products/new',
  '/dashboard/orders',
  '/dashboard/settings'
];

const adminRoutes = [
  '/admin/pesantren-applications',
  '/admin/donations',
  '/admin/documents',
  '/admin/settings'
];

const allRoutes = {
  public: publicRoutes,
  dashboard: dashboardRoutes,
  admin: adminRoutes
};

const appDir = path.join(__dirname, '..', 'app');

function createMissingRoutes(groupName, routes) {
  routes.forEach(route => {
    let groupFolder = '';
    if (groupName === 'public') groupFolder = '(public)';
    else if (groupName === 'dashboard') groupFolder = '(dashboard)';
    else if (groupName === 'admin') groupFolder = '(admin)';

    const routeParts = route.split('/').filter(Boolean);
    const targetDir = path.join(appDir, groupFolder, ...routeParts);
    
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const pagePath = path.join(targetDir, 'page.tsx');
    if (!fs.existsSync(pagePath)) {
      const content = `import { FeaturePlaceholder } from '@/components/shared/FeaturePlaceholder';

export default function PlaceholderPage() {
  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <FeaturePlaceholder />
    </div>
  );
}
`;
      fs.writeFileSync(pagePath, content);
      console.log(`Created placeholder for ${route}`);
    }
  });
}

createMissingRoutes('public', publicRoutes);
createMissingRoutes('dashboard', dashboardRoutes);
createMissingRoutes('admin', adminRoutes);

console.log('Done checking routes.');
