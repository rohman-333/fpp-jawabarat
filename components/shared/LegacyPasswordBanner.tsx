import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface Props {
  legacyUserId?: string | null;
  passwordChangedAt?: string | null;
}

export function LegacyPasswordBanner({ legacyUserId, passwordChangedAt }: Props) {
  if (!legacyUserId || passwordChangedAt) return null;

  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 rounded-r-lg shadow-sm w-full max-w-6xl mx-auto">
      <div className="flex items-start md:items-center justify-between gap-4 flex-col md:flex-row">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 md:mt-0" />
          <div>
            <h3 className="text-sm font-bold text-amber-800">Perhatian Keamanan</h3>
            <p className="text-sm text-amber-700 mt-1">
              Anda menggunakan akun hasil migrasi. Demi keamanan, segera ganti password sementara Anda.
            </p>
          </div>
        </div>
        <Link 
          href="/dashboard/security" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
        >
          Ganti Password <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
