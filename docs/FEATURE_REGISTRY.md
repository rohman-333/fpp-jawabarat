# FEATURE REGISTRY: FPP JAWABARAT

## Public Routes
| Legacy Feature | Next.js Route | Status | Role Access | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Landing Page | `/` | Done | Public | Modern UI, responsive |
| Login / Auth | `/login`, `/register` | Done | Public | Supabase Auth |
| Social Feed | `/feed`, `/feed/saved`, `/feed/following`, `/post/[id]` | Done | Public, Authenticated | Infinite scroll, comments |
| Public Profile | `/u/[username]`, `/[username]` | Done | Public | RLS view bypass |
| Pesantren Directory | `/pesantren`, `/pesantren/[id]` | Done | Public | Modern layout |
| Marketplace | `/marketplace`, `/marketplace/[slug]` | Done | Public | Real-time search, filters |
| Forum | `/forum` | Placeholder | Public | To be implemented |
| Program | `/program` | Placeholder | Public | To be implemented |
| Articles | `/articles` | Placeholder | Public | To be implemented |
| News | `/news` | Placeholder | Public | To be implemented |
| Documents | `/documents` | Placeholder | Public | To be implemented |
| Library | `/library` | Placeholder | Public | To be implemented |
| Donations | `/donations` | Placeholder | Public | To be implemented |
| AI Chat | `/ai` | Placeholder | Public | To be implemented |
| Cart & Checkout | `/cart`, `/checkout`, `/orders` | Done | Authenticated | Split orders, real-time |
| Notifications | `/notifications` | Placeholder | Authenticated | Notification system pending |

## Dashboard (User) Routes
| Feature | Next.js Route | Status | Role Access | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Dashboard Home | `/dashboard` | Done | User | Overview stats |
| Edit Profile | `/dashboard/profile`, `/dashboard/security` | Done | User | Password & metadata update |
| Pesantren Apply/Edit | `/dashboard/pesantren/apply`, `/dashboard/pesantren/edit` | Done | User | Full 6-step form implemented |
| Seller Center | `/dashboard/seller`, `/dashboard/seller/apply` | Done | User | Marketplace apply flow |
| Product Management | `/dashboard/products`, `/dashboard/products/new` | Done | User (is_seller) | CRUD Products |
| Seller Orders | `/dashboard/orders` | Done | User (is_seller) | Manage incoming orders |
| Courier Center | `/dashboard/courier`, `/dashboard/courier/apply` | Done | User | Courier apply flow |

## Admin Routes
| Feature | Next.js Route | Status | Role Access | Notes |
| :--- | :--- | :--- | :--- | :--- |
| Admin Home | `/admin` | Done | Admin, Superadmin | Stats overview |
| User Management | `/admin/users` | Done | Admin, Superadmin | Manage platform users |
| Team Management | `/admin/team`, `/admin/team/invite` | Done | Superadmin | Team invite flow |
| Pesantren Verification | `/admin/pesantren`, `/admin/pesantren/[id]` | Done | Admin, Superadmin | Verify new pesantren |
| Marketplace Admin | `/admin/marketplace`, `/admin/seller-applications` | Done | Admin, Superadmin | Seller verification |
| Courier Verification | `/admin/courier-applications` | Done | Admin, Superadmin | Courier verification |
| Content Moderation | `/admin/moderation` | Done | Admin, Superadmin | Post reports & moderation |
| Other Admin Modules | `/admin/forum`, `/admin/program`, `/admin/donations`, `/admin/documents`, `/admin/reports` | Placeholders | Admin, Superadmin | Feature scaling pending |
