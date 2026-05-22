import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { 
  Shield, Cpu, Store, Truck, 
  CheckCircle2, ArrowRight, Target, Sparkles, Users, Award 
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface ProgramDetail {
  title: string;
  category: string;
  tagline: string;
  gradient: string;
  accentColor: string;
  icon: any;
  about: string;
  tujuan: string[];
  manfaat: string[];
  siapaBisaIkut: string[];
  kegiatan: { title: string; desc: string }[];
  fitur?: string[];
  ctaText: string;
  ctaTextLoggedIn?: string; // Optional custom text when logged in
  getLink: (isLoggedIn: boolean, isSeller?: boolean) => string;
}

const PROGRAM_DATA: Record<string, ProgramDetail> = {
  'pemberdayaan-komunitas': {
    title: 'Pemberdayaan Komunitas',
    category: 'Sosial & Budaya',
    tagline: 'Sinergi sosial terpadu untuk kemajuan dan kemaslahatan bersama.',
    gradient: 'from-blue-600 via-blue-700 to-indigo-900',
    accentColor: 'text-blue-600',
    icon: Shield,
    about: 'Program Pemberdayaan Komunitas hadir sebagai platform kolaboratif untuk mempertemukan ide, bakat, dan semangat gotong royong antar elemen masyarakat Nusantara. Kami memfasilitasi pertukaran informasi, dukungan sosial, dan penguatan jejaring komunitas.',
    tujuan: [
      'Membangun wadah komunikasi interaktif yang sehat dan suportif.',
      'Memfasilitasi kolaborasi sosial dan penyebaran kegiatan positif.',
      'Mendorong kearifan lokal agar berdaya saing global.'
    ],
    manfaat: [
      'Akses ke forum diskusi eksklusif komunitas.',
      'Kesempatan berjejaring dengan tokoh inspiratif dan lembaga sosial.',
      'Dukungan promosi dan publikasi untuk kegiatan komunitas.'
    ],
    siapaBisaIkut: [
      'Anggota masyarakat umum yang ingin berkontribusi.',
      'Komunitas pemuda, relawan, dan organisasi kemasyarakatan.',
      'Penggiat sosial dan kebudayaan lokal.'
    ],
    kegiatan: [
      { title: 'Forum Diskusi Publik', desc: 'Saling berbagi cerita inspiratif, informasi penting, dan saran pembangunan daerah.' },
      { title: 'Kemitraan Sosial', desc: 'Penyaluran dukungan nyata untuk program-program sosial kemasyarakatan.' },
      { title: 'Kampanye Edukasi', desc: 'Program pelatihan dan literasi digital untuk meningkatkan kapasitas masyarakat.' }
    ],
    ctaText: 'Gabung Komunitas',
    getLink: (isLoggedIn) => isLoggedIn ? '/feed/community' : '/auth/login?redirect=/feed/community'
  },
  'digitalisasi-pesantren': {
    title: 'Digitalisasi Pesantren',
    category: 'Teknologi',
    tagline: 'Modernisasi ekosistem pondok pesantren demi efisiensi dan kemandirian.',
    gradient: 'from-indigo-600 via-indigo-700 to-purple-900',
    accentColor: 'text-indigo-600',
    icon: Cpu,
    about: 'Program ini didedikasikan untuk membawa pondok pesantren masuk ke era digital secara menyeluruh. Melalui penyediaan infrastruktur teknologi cloud terintegrasi, pesantren dapat mengelola administrasi, kegiatan e-learning, serta komunikasi dengan wali santri secara lebih efisien.',
    tujuan: [
      'Mendigitalisasikan tata kelola administrasi pesantren agar lebih transparan.',
      'Menyediakan fasilitas belajar mengajar (e-learning) santri yang adaptif.',
      'Mempermudah akses informasi pesantren kepada publik dan wali santri.'
    ],
    manfaat: [
      'Sistem manajemen santri dan database akademik terpadu.',
      'Akses modul pembelajaran digital (e-learning).',
      'Efisiensi operasional dan administrasi pembayaran/keuangan.'
    ],
    siapaBisaIkut: [
      'Pengurus/Pengelola Pondok Pesantren di Jawa Barat.',
      'Santri dan Wali Santri yang terdaftar di pesantren mitra.',
      'Akademisi dan praktisi teknologi pendidikan.'
    ],
    kegiatan: [
      { title: 'Direktori & Profil Pesantren', desc: 'Pembuatan basis data profil pesantren terverifikasi untuk memudahkan pencarian publik.' },
      { title: 'Manajemen Data Santri', desc: 'Sistem administrasi digital untuk pelacakan perkembangan akademik dan kedisiplinan santri.' },
      { title: 'Platform E-Learning', desc: 'Akses pembelajaran kitab kuning dan materi formal secara daring yang mudah diakses.' },
      { title: 'Sistem Administrasi Pesantren', desc: 'Integrasi tata kelola perkantoran pesantren berbasis digital.' }
    ],
    ctaText: 'Ajukan Pesantren',
    getLink: (isLoggedIn) => isLoggedIn ? '/dashboard/pesantren/apply' : '/auth/login?redirect=/dashboard/pesantren/apply'
  },
  'marketplace-lokal': {
    title: 'Marketplace Lokal',
    category: 'Ekonomi Mikro',
    tagline: 'Hilirisasi produk santri dan UMKM langsung ke tangan konsumen.',
    gradient: 'from-emerald-600 via-emerald-700 to-teal-900',
    accentColor: 'text-emerald-600',
    icon: Store,
    about: 'Marketplace Lokal adalah pilar ekonomi digital WIBAWA NUSANTARA. Kami memotong rantai distribusi panjang agar produk unggulan pesantren, santri, dan UMKM sekitar dapat dipasarkan secara langsung dan adil, memperkuat ekonomi arus bawah.',
    tujuan: [
      'Meningkatkan taraf ekonomi kemandirian pondok pesantren.',
      'Memperluas jangkauan pasar produk lokal santri dan UMKM.',
      'Menyediakan sistem transaksi jual-beli yang aman, mudah, dan transparan.'
    ],
    manfaat: [
      'Halaman toko digital mandiri tanpa biaya registrasi awal.',
      'Fitur upload produk, pengelolaan stok, dan pemantauan order otomatis.',
      'Dukungan sistem logistik terintegrasi dengan tarif bersaing.'
    ],
    siapaBisaIkut: [
      'Unit Usaha Pondok Pesantren (Kopontren).',
      'Santripreneur dan alumni pesantren.',
      'Pelaku UMKM lokal di wilayah Jawa Barat.'
    ],
    kegiatan: [
      { title: 'Katalog Produk Premium', desc: 'Eksplorasi berbagai kategori produk unggulan seperti makanan, pakaian, kerajinan, hingga herbal.' },
      { title: 'Toko Santri & UMKM Mandiri', desc: 'Manajemen mandiri oleh penjual untuk mengatur promosi dan melayani pembeli.' },
      { title: 'Sistem Order Cepat', desc: 'Pemesanan real-time dilengkapi opsi pembayaran fleksibel dan transparan.' },
      { title: 'Pengiriman Logistik Lokal', desc: 'Otomasi cek tarif dan integrasi kurir lokal untuk kenyamanan transaksi.' }
    ],
    ctaText: 'Buka Toko',
    ctaTextLoggedIn: 'Kelola Produk',
    getLink: (isLoggedIn, isSeller) => {
      if (!isLoggedIn) return '/auth/login?redirect=/dashboard/products';
      return isSeller ? '/dashboard/products' : '/dashboard/seller/apply';
    }
  },
  'kurir-layanan-lokal': {
    title: 'Kurir dan Layanan Lokal',
    category: 'Logistik',
    tagline: 'Armada mandiri untuk efisiensi biaya kirim dan lapangan kerja baru.',
    gradient: 'from-amber-600 via-amber-700 to-orange-950',
    accentColor: 'text-amber-600',
    icon: Truck,
    about: 'Program Logistik Mandiri dirancang untuk mengatasi mahalnya biaya distribusi produk lokal. Dengan memberdayakan jaringan kurir lokal berbasis pemuda dan santri, kami menjamin pengiriman yang cepat, aman, sekaligus menciptakan lapangan kerja produktif.',
    tujuan: [
      'Menekan biaya pengiriman logistik produk lokal.',
      'Membuka lapangan kerja dan penghasilan tambahan bagi masyarakat/santri.',
      'Memperkuat keterhubungan distribusi antardesa dan antarkecamatan.'
    ],
    manfaat: [
      'Pendapatan komisi bersaing dari setiap paket yang diantarkan.',
      'Zonasi wilayah kerja yang fleksibel sesuai domisili kurir.',
      'Aplikasi manajemen tugas kurir untuk pelacakan pengiriman secara langsung.'
    ],
    siapaBisaIkut: [
      'Pemuda daerah yang memiliki kendaraan bermotor pribadi dan SIM aktif.',
      'Santri tingkat akhir/alumni yang ingin berwirausaha logistik.',
      'Agen logistik lokal yang ingin bermitra.'
    ],
    kegiatan: [
      { title: 'Layanan Kurir Instan & Same-day', desc: 'Pengiriman cepat untuk produk segar, makanan olahan, dan dokumen penting.' },
      { title: 'Zonasi Tarif Fleksibel', desc: 'Penentuan ongkir yang transparan berdasarkan klaster zona kecamatan terdekat.' },
      { title: 'Pencairan Komisi Cepat', desc: 'Sistem bagi hasil kemitraan yang adil dan transparan dengan pencairan terjadwal.' }
    ],
    ctaText: 'Daftar Jadi Kurir',
    getLink: (isLoggedIn) => isLoggedIn ? '/dashboard/courier/apply' : '/auth/login?redirect=/dashboard/courier/apply'
  }
};

export default async function ProgramDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const program = PROGRAM_DATA[slug];

  if (!program) {
    notFound();
  }

  // Ambil data user dari Supabase server client
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isLoggedIn = !!user;

  let isSeller = false;
  if (isLoggedIn && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_seller, seller_status')
      .eq('id', user.id)
      .single();
    
    if (profile?.is_seller && profile?.seller_status === 'approved') {
      isSeller = true;
    }
  }

  const destinationLink = program.getLink(isLoggedIn, isSeller);
  const Icon = program.icon;

  // Teks tombol CTA dinamis untuk pilar marketplace
  let activeCtaText = program.ctaText;
  if (slug === 'marketplace-lokal' && isLoggedIn) {
    activeCtaText = isSeller ? (program.ctaTextLoggedIn || 'Kelola Produk') : program.ctaText;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <PublicNavbar />

      <main className="flex-1">
        {/* Premium Hero Section */}
        <section className={`relative overflow-hidden text-white bg-gradient-to-br ${program.gradient} py-24 md:py-32`}>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30"></div>
          <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-white/10 rounded-full blur-[140px] pointer-events-none"></div>
          
          <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
            <span className="bg-white/10 text-white/90 text-[10px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/20 inline-flex items-center gap-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Pilar Program: {program.category}
            </span>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
              <div className="max-w-3xl">
                <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
                  {program.title}
                </h1>
                <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl font-medium">
                  {program.tagline}
                </p>
              </div>
              <div className="hidden lg:flex shrink-0 w-32 h-32 bg-white/10 rounded-3xl border border-white/20 items-center justify-center shadow-lg backdrop-blur-md">
                <Icon className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 md:py-24 max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Left/Main Column */}
            <div className="lg:col-span-2 space-y-12">
              {/* About */}
              <div className="bg-white p-8 md:p-10 rounded-3xl border border-slate-200 shadow-2xs">
                <h2 className="text-2xl font-black text-slate-800 mb-4 flex items-center gap-2">
                  <Target className={`w-6 h-6 ${program.accentColor}`} /> Tentang Program
                </h2>
                <p className="text-slate-600 leading-relaxed text-base font-medium">
                  {program.about}
                </p>
              </div>

              {/* Kegiatan */}
              <div className="space-y-6">
                <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                  <Users className={`w-6 h-6 ${program.accentColor}`} /> Bentuk Kegiatan & Fitur Utama
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {program.kegiatan.map((k, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-colors">
                      <h3 className="font-extrabold text-slate-800 text-base mb-2">{k.title}</h3>
                      <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">{k.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Sidebar Column */}
            <div className="space-y-8">
              {/* Box Aksi Utama */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden border border-slate-800">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
                <h3 className="text-lg font-black tracking-tight mb-2">Ingin berpartisipasi?</h3>
                <p className="text-slate-400 text-xs md:text-sm mb-6 leading-relaxed">
                  Bergabunglah sekarang ke dalam ekosistem WIBAWA NUSANTARA untuk memulai akselerasi transformasi.
                </p>
                <Link href={destinationLink} className="block">
                  <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3.5 px-6 rounded-2xl transition-all shadow-lg shadow-blue-600/35 hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm">
                    {activeCtaText} <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
              </div>

              {/* Siapa yang bisa ikut */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h3 className="font-extrabold text-slate-800 text-sm mb-4 flex items-center gap-1.5">
                  <Award className={`w-4 h-4 ${program.accentColor}`} /> Sasaran Peserta
                </h3>
                <ul className="space-y-3">
                  {program.siapaBisaIkut.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-600 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Manfaat */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h3 className="font-extrabold text-slate-800 text-sm mb-4 flex items-center gap-1.5">
                  <CheckCircle2 className={`w-4 h-4 ${program.accentColor}`} /> Manfaat Program
                </h3>
                <ul className="space-y-3">
                  {program.manfaat.map((m, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs md:text-sm text-slate-600 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
