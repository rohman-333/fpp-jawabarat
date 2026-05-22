import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { PublicNavbar } from '@/components/shared/PublicNavbar';
import { PublicFooter } from '@/components/shared/PublicFooter';
import { 
  Shield, Cpu, Store, Truck, 
  CheckCircle2, ArrowRight, Target, Sparkles, Users, Award,
  BookOpen, Compass, Briefcase, HelpCircle, ChevronRight
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
  materiPengajaran: string[];
  roadmap: { phase: string; title: string; desc: string }[];
  arahBisnis: string;
  alurPendaftaran: string[];
  siapaBisaIkut: string[];
  kegiatan: { title: string; desc: string }[];
  ctaText: string;
  ctaTextLoggedIn?: string;
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
    about: 'Program Pemberdayaan Komunitas hadir sebagai platform kolaboratif untuk mempertemukan ide, bakat, dan semangat gotong royong antar elemen masyarakat Nusantara. Kami memfasilitasi pertukaran informasi, dukungan sosial, dan penguatan jejaring komunitas melalui media interaktif dan forum kemitraan terverifikasi.',
    tujuan: [
      'Membangun wadah komunikasi interaktif yang sehat, positif, dan suportif.',
      'Memfasilitasi kolaborasi sosial dan penyebaran kegiatan pemberdayaan daerah.',
      'Mendorong pengembangan potensi kearifan lokal agar berdaya saing global.'
    ],
    manfaat: [
      'Akses ke forum diskusi eksklusif antar penggerak komunitas.',
      'Kesempatan berjejaring dengan tokoh inspiratif dan lembaga sosial tingkat nasional.',
      'Dukungan promosi, media, serta publikasi digital untuk kegiatan komunitas Anda.'
    ],
    materiPengajaran: [
      'Pengenalan Advokasi Sosial & Penggerak Massa',
      'Manajemen Organisasi, Relawan, & Program Kerja',
      'Kepemimpinan Komunitas & Teknik Resolusi Konflik',
      'Literasi Media, Kampanye Digital, & Keamanan Informasi',
      'Penyusunan Proposal Aksi & Evaluasi Dampak Sosial'
    ],
    roadmap: [
      { phase: 'Fase 1 (Bulan 1-2)', title: 'Rekrutmen & Pelatihan Dasar', desc: 'Pemetaan penggerak lokal serta pelatihan dasar kepemimpinan dan manajemen organisasi.' },
      { phase: 'Fase 2 (Bulan 3-4)', title: 'Pembentukan Forum Wilayah', desc: 'Konsolidasi komunitas ke dalam forum komunikasi wilayah dan perancangan agenda aksi.' },
      { phase: 'Fase 3 (Bulan 5-6)', title: 'Peluncuran Aksi & Evaluasi', desc: 'Eksekusi proyek kolaboratif terpadu secara serentak disertai pelaporan dampak sosial.' }
    ],
    arahBisnis: 'Keberlanjutan finansial program didukung melalui kemitraan strategis Corporate Social Responsibility (CSR) dengan BUMN dan sektor swasta, dana hibah pembangunan sosial dari pemerintah daerah, serta model crowdfunding terverifikasi untuk proyek sosial kemasyarakatan.',
    alurPendaftaran: [
      'Lakukan registrasi akun di platform WIBAWA NUSANTARA.',
      'Buka formulir pengajuan komunitas dan isi detail visi-misi organisasi.',
      'Ikuti sesi verifikasi singkat dan bimbingan awal bersama tim pendamping.',
      'Terima pengesahan resmi dan mulai berkolaborasi di ruang forum publik.'
    ],
    siapaBisaIkut: [
      'Anggota masyarakat umum yang ingin berkontribusi aktif.',
      'Komunitas kepemudaan, relawan kemanusiaan, dan organisasi lokal.',
      'Penggiat kebudayaan, seni, dan pengembangan pariwisata daerah.'
    ],
    kegiatan: [
      { title: 'Forum Diskusi Publik', desc: 'Saling berbagi cerita inspiratif, informasi pembangunan daerah, dan advokasi sosial.' },
      { title: 'Kemitraan Sosial Terpadu', desc: 'Penyaluran dukungan nyata untuk berbagai program pembangunan fisik dan non-fisik.' },
      { title: 'Kampanye Literasi Digital', desc: 'Pelatihan teknologi informasi agar komunitas melek media dan mampu mandiri secara digital.' }
    ],
    ctaText: 'Gabung Komunitas',
    getLink: (isLoggedIn) => isLoggedIn ? '/feed/community' : '/auth/login?redirect=/feed/community'
  },
  'digitalisasi-pesantren': {
    title: 'Digitalisasi Pesantren',
    category: 'Teknologi & Pendidikan',
    tagline: 'Modernisasi ekosistem pondok pesantren demi efisiensi dan kemandirian.',
    gradient: 'from-indigo-600 via-indigo-700 to-purple-900',
    accentColor: 'text-indigo-600',
    icon: Cpu,
    about: 'Program ini didedikasikan untuk membawa pondok pesantren masuk ke era digital secara terintegrasi. Melalui penyediaan infrastruktur teknologi cloud, pesantren dapat mengelola database akademik, administrasi perkantoran, sistem e-learning santri, hingga transparansi keuangan dengan sangat praktis.',
    tujuan: [
      'Mendigitalisasikan tata kelola administrasi pesantren agar lebih efisien dan rapi.',
      'Menyediakan fasilitas belajar mengajar (e-learning) santri yang modern dan terpadu.',
      'Mempermudah akses informasi perkembangan santri kepada wali santri secara real-time.'
    ],
    manfaat: [
      'Sistem manajemen database santri dan rekam akademik terintegrasi.',
      'Akses modul e-learning interaktif untuk kitab kuning dan kurikulum umum.',
      'Transparansi pelaporan keuangan pesantren dan kemudahan administrasi.'
    ],
    materiPengajaran: [
      'Manajemen Administrasi Pesantren Berbasis Cloud',
      'Penerapan & Pengelolaan E-Learning (Learning Management System)',
      'Literasi Teknologi & Manajemen Informasi Bagi Pengurus',
      'Tata Kelola Keuangan Digital Syariah & Akuntansi Pesantren'
    ],
    roadmap: [
      { phase: 'Fase 1 (Bulan 1)', title: 'Pendaftaran & Audit IT', desc: 'Pendaftaran pesantren mitra dan audit kesiapan infrastruktur serta jaringan internet.' },
      { phase: 'Fase 2 (Bulan 2-3)', title: 'Migrasi & Training Pengurus', desc: 'Migrasi data santri ke sistem digital dan pelatihan teknis bagi pengurus dan guru pengajar.' },
      { phase: 'Fase 3 (Bulan 4-6)', title: 'Aktivasi Layanan Publik', desc: 'Peluncuran aplikasi pemantauan wali santri dan sistem pembayaran SPP digital terintegrasi.' }
    ],
    arahBisnis: 'Pilar ini menerapkan skema Software-as-a-Service (SaaS) premium untuk fitur-fitur keuangan mutakhir, kemitraan strategis dengan institusi perbankan syariah untuk integrasi payment gateway SPP santri, serta kerja sama pengadaan infrastruktur hardware sekolah.',
    alurPendaftaran: [
      'Pengurus resmi mengajukan pembukaan profil pesantren di direktori.',
      'Unggah dokumen legalitas pondok pesantren untuk diverifikasi admin.',
      'Dapatkan akses penuh ke Dashboard Admin Pesantren setelah disetujui.',
      'Ikuti bimbingan teknis migrasi data dan bagikan akses aplikasi ke wali santri.'
    ],
    siapaBisaIkut: [
      'Pondok Pesantren resmi yang terdaftar di Kementerian Agama.',
      'Pengurus, ustadz, santri, dan wali santri pesantren mitra.',
      'Pengembang kurikulum dan praktisi teknologi pendidikan syariah.'
    ],
    kegiatan: [
      { title: 'Direktori Pesantren Terpadu', desc: 'Basis data profil pesantren terlengkap untuk memudahkan masyarakat mencari info pendaftaran.' },
      { title: 'Manajemen Data Santri Digital', desc: 'Pelacakan kehadiran, kedisiplinan, hafalan Quran, dan nilai akademik santri secara online.' },
      { title: 'E-Learning Kitab Kuning', desc: 'Penyediaan materi ajar digital yang dapat diakses santri kapan saja lewat perangkat seluler.' },
      { title: 'Administrasi Keuangan Digital', desc: 'Otomatisasi tagihan syahriyah (SPP) santri dengan notifikasi WhatsApp langsung ke wali santri.' }
    ],
    ctaText: 'Ajukan Pesantren',
    getLink: (isLoggedIn) => isLoggedIn ? '/dashboard/pesantren/apply' : '/auth/login?redirect=/dashboard/pesantren/apply'
  },
  'marketplace-lokal': {
    title: 'Marketplace Lokal',
    category: 'Ekonomi Mikro',
    tagline: 'Hilirisasi produk santri dan UMKM lokal langsung ke tangan konsumen.',
    gradient: 'from-emerald-600 via-emerald-700 to-teal-900',
    accentColor: 'text-emerald-600',
    icon: Store,
    about: 'Marketplace Lokal adalah pilar ekonomi utama dalam ekosistem WIBAWA NUSANTARA. Kami memotong rantai distribusi yang panjang agar produk unggulan hasil karya santri (santripreneur), koperasi pondok pesantren (kopontren), dan UMKM sekitar dapat dipasarkan langsung ke publik secara adil dan menguntungkan.',
    tujuan: [
      'Mendorong kemandirian ekonomi pondok pesantren dan koperasi santri.',
      'Memperluas jangkauan pemasaran produk lokal ke tingkat regional dan nasional.',
      'Menyediakan platform jual-beli digital yang aman, bersahabat, dan bebas potongan besar.'
    ],
    manfaat: [
      'Halaman toko online resmi mandiri secara gratis tanpa biaya bulanan.',
      'Fitur manajemen katalog produk, inventori stok, dan pemantauan order otomatis.',
      'Integrasi logistik lokal untuk kemudahan kalkulasi ongkos kirim real-time.'
    ],
    materiPengajaran: [
      'Dasar-dasar E-Commerce & Mindset Kewirausahaan Digital',
      'Teknik Fotografi Produk & Penulisan Deskripsi yang Memikat',
      'Manajemen Inventori, Stok, & Penentuan Harga Jual (Pricing)',
      'Strategi Pemasaran Digital & Optimasi Penjualan Lokal (Local SEO)'
    ],
    roadmap: [
      { phase: 'Fase 1 (Bulan 1)', title: 'Kurasi UMKM & Setup Toko', desc: 'Pendaftaran toko seller baru serta kurasi awal produk yang layak dipasarkan secara luas.' },
      { phase: 'Fase 2 (Bulan 2)', title: 'Pelatihan Kemasan & Mutu', desc: 'Pendampingan pembuatan kemasan produk yang higienis, menarik, dan berstandar PIRT/Halal.' },
      { phase: 'Fase 3 (Bulan 3-6)', title: 'Kampanye Promosi Massal', desc: 'Peluncuran festival belanja pesantren terpadu dan kerja sama distribusi dengan agen logistik.' }
    ],
    arahBisnis: 'Pendapatan diperoleh melalui komisi penjualan (platform fee) yang sangat bersahabat bagi UMKM (1-2%), penyediaan opsi promosi bersponsor (sponsored listings) bagi produk seller, serta pengemasan paket hampers/oleh-oleh korporat berkala.',
    alurPendaftaran: [
      'Ajukan pendaftaran toko melalui menu "Ajukan Buka Toko" di Dashboard.',
      'Lengkapi data identitas KTP/legalitas usaha beserta titik koordinat pengiriman.',
      'Tunggu tim admin memverifikasi dan menyetujui toko Anda.',
      'Mulai unggah foto produk unggulan Anda dan langsung terima pesanan pertama.'
    ],
    siapaBisaIkut: [
      'Unit Usaha Koperasi Pondok Pesantren (Kopontren).',
      'Santripreneur aktif maupun alumni pondok pesantren.',
      'Pelaku UMKM lokal di wilayah kabupaten/kota Jawa Barat.'
    ],
    kegiatan: [
      { title: 'Etalase Toko Digital Mandiri', desc: 'Kelola promosi, harga coret, dan voucher belanja toko Anda sendiri dengan mudah.' },
      { title: 'Katalog Produk Unggulan', desc: 'Tampilkan produk mulai dari kuliner khas, busana muslim, kerajinan tangan, hingga kitab.' },
      { title: 'Checkout & Pembayaran Aman', desc: 'Sistem transaksi escrow terpercaya menjamin uang aman hingga barang sampai di tangan pembeli.' },
      { title: 'Integrasi Kurir Lokal & Nasional', desc: 'Pilihan pengiriman paket yang beragam guna menghemat biaya ongkos kirim konsumen.' }
    ],
    ctaText: 'Buka Toko',
    ctaTextLoggedIn: 'Kelola Produk',
    getLink: (isLoggedIn, isSeller) => {
      if (!isLoggedIn) return '/auth/login?redirect=/dashboard/products';
      return isSeller ? '/dashboard/products' : '/dashboard/seller/apply';
    }
  },
  'kurir-layanan-lokal': {
    title: 'Kurir & Layanan Lokal',
    category: 'Logistik & Transportasi',
    tagline: 'Armada mandiri untuk efisiensi biaya kirim dan lapangan kerja daerah.',
    gradient: 'from-amber-600 via-amber-700 to-orange-950',
    accentColor: 'text-amber-600',
    icon: Truck,
    about: 'Program Logistik Mandiri dirancang untuk mengatasi kendala tingginya biaya logistik antarwilayah pelosok. Dengan memberdayakan jaringan kurir motor lokal berbasis santri dan pemuda daerah, kami menghadirkan layanan kirim barang yang cepat, murah, sekaligus membuka peluang kerja yang berkelanjutan.',
    tujuan: [
      'Menekan biaya pengiriman logistik untuk mempermudah transaksi dagang lokal.',
      'Membuka lapangan kerja dan pendapatan tambahan bagi pemuda/santri daerah.',
      'Menghubungkan rantai pasok antardesa dan antarkecamatan secara mandiri.'
    ],
    manfaat: [
      'Bagi hasil pendapatan kurir yang sangat adil dan kompetitif.',
      'Fleksibilitas wilayah kerja pengantaran yang disesuaikan domisili kurir.',
      'Kemudahan pengelolaan tugas pengiriman melalui aplikasi pendukung real-time.'
    ],
    materiPengajaran: [
      'Standar Prosedur Pengantaran Barang & Keselamatan Berkendara',
      'Teknis Penggunaan Aplikasi Navigator & Sistem Dispatcher',
      'Layanan Prima, Etika Pengantaran, & Komunikasi Pelanggan',
      'Manajemen Waktu, Pemetaan Wilayah, & Optimasi Rute Pengantaran'
    ],
    roadmap: [
      { phase: 'Fase 1 (Bulan 1)', title: 'Rekrutmen & Verifikasi SIM', desc: 'Penerimaan calon kurir lokal, pemeriksaan fisik kendaraan, SIM, serta kelengkapan dokumen.' },
      { phase: 'Fase 2 (Bulan 2)', title: 'Training SOP & Atribut', desc: 'Pelatihan etika layanan prima, pembagian atribut resmi (jaket, helm, tas), dan simulasi rute.' },
      { phase: 'Fase 3 (Bulan 3-6)', title: 'Aktivasi & Integrasi API', desc: 'Operasional pengantaran penuh dan integrasi order pengiriman otomatis dari produk Marketplace.' }
    ],
    arahBisnis: 'Model pendapatan ditunjang lewat pembagian jasa pengiriman (delivery fee split) dengan rasio 85% untuk mitra kurir dan 15% untuk biaya operasional platform, ditambah kerja sama pengiriman rutin B2B dengan bisnis ritel lokal.',
    alurPendaftaran: [
      'Daftarkan diri Anda melalui Dashboard Kurir di platform.',
      'Unggah foto KTP, SIM C aktif, STNK motor, serta SKCK terupdate.',
      'Hadir di kantor perwakilan wilayah terdekat untuk pemeriksaan fisik kendaraan.',
      'Terima atribut pelindung dan aktivasi status On-Duty untuk mulai mengantar paket.'
    ],
    siapaBisaIkut: [
      'Pemuda daerah usia produktif yang memiliki kendaraan motor pribadi layak jalan.',
      'Santri senior atau alumni yang ingin merintis usaha logistik lokal.',
      'Pemilik agen logistik desa/koperasi daerah yang ingin menjadi drop-point.'
    ],
    kegiatan: [
      { title: 'Layanan Pengiriman Instan', desc: 'Layanan kirim kilat hitungan jam khusus produk segar, sayur, lauk, dan dokumen mendesak.' },
      { title: 'Zonasi Tarif Hemat Desa', desc: 'Penetapan tarif yang sangat bersahabat yang dihitung berdasarkan klaster jarak kecamatan terdekat.' },
      { title: 'Sistem Dispatcher Terpusat', desc: 'Pembagian order pengiriman secara otomatis yang mendahulukan kurir terdekat dari titik ambil paket.' }
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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <PublicNavbar />

      <main className="flex-1">
        {/* Premium Hero Section */}
        <section className={`relative overflow-hidden text-white bg-gradient-to-br ${program.gradient} py-20 md:py-28`}>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20"></div>
          <div className="absolute -top-1/4 -right-1/4 w-[500px] h-[500px] bg-white/10 rounded-full blur-[120px] pointer-events-none"></div>
          
          <div className="max-w-6xl mx-auto px-6 md:px-12 relative z-10">
            <span className="bg-white/10 text-white/90 text-[10px] font-extrabold uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/20 inline-flex items-center gap-1.5 mb-6">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" /> Pilar Program: {program.category}
            </span>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-3xl">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-5 tracking-tight leading-tight">
                  {program.title}
                </h1>
                <p className="text-base md:text-lg text-white/80 leading-relaxed max-w-2xl font-medium">
                  {program.tagline}
                </p>
              </div>
              <div className="hidden lg:flex shrink-0 w-28 h-28 bg-white/10 rounded-3xl border border-white/20 items-center justify-center shadow-lg backdrop-blur-md">
                <Icon className="w-14 h-14 text-white" />
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 md:py-20 max-w-6xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            
            {/* Left/Main Column */}
            <div className="lg:col-span-2 space-y-10">
              
              {/* About */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs">
                <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2.5">
                  <Target className={`w-5.5 h-5.5 ${program.accentColor}`} /> Tentang Program
                </h2>
                <p className="text-slate-600 leading-relaxed text-sm md:text-base font-medium">
                  {program.about}
                </p>
              </div>

              {/* Fitur Utama */}
              <div className="space-y-4">
                <h2 className="text-xl font-black text-slate-800 flex items-center gap-2.5">
                  <Users className={`w-5.5 h-5.5 ${program.accentColor}`} /> Layanan & Fitur Ekosistem
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {program.kegiatan.map((k, index) => (
                    <div key={index} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
                      <h3 className="font-extrabold text-slate-800 text-sm mb-1.5 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full bg-slate-400 ${program.accentColor.replace('text-', 'bg-')}`}></span>
                        {k.title}
                      </h3>
                      <p className="text-slate-500 text-xs leading-relaxed font-medium">{k.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Materi Pengajaran */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs">
                <h2 className="text-xl font-black text-slate-800 mb-4 flex items-center gap-2.5">
                  <BookOpen className={`w-5.5 h-5.5 ${program.accentColor}`} /> Materi Pengajaran & Edukasi
                </h2>
                <p className="text-slate-500 text-xs md:text-sm mb-4 font-medium leading-relaxed">
                  Kami mengintegrasikan edukasi berkelanjutan ke dalam modul program agar setiap peserta memiliki keahlian yang relevan.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {program.materiPengajaran.map((materi, idx) => (
                    <div key={idx} className="flex items-start gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-slate-700 text-xs font-semibold leading-snug">{materi}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roadmap Kegiatan */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs">
                <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2.5">
                  <Compass className={`w-5.5 h-5.5 ${program.accentColor}`} /> Roadmap & Tahapan Aksi
                </h2>
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-6">
                  {program.roadmap.map((step, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-white ${program.accentColor.replace('text-', 'bg-')} shadow-xs`}></div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-0.5">{step.phase}</span>
                      <h4 className="font-extrabold text-slate-800 text-sm mb-1">{step.title}</h4>
                      <p className="text-slate-500 text-xs leading-relaxed font-medium">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arah Bisnis & Keberlanjutan */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
                <div className={`absolute -right-8 -bottom-8 w-24 h-24 rounded-full opacity-10 ${program.accentColor.replace('text-', 'bg-')}`}></div>
                <h2 className="text-xl font-black text-slate-800 mb-3 flex items-center gap-2.5">
                  <Briefcase className={`w-5.5 h-5.5 ${program.accentColor}`} /> Arah Bisnis & Keberlanjutan
                </h2>
                <p className="text-slate-600 text-xs md:text-sm font-medium leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {program.arahBisnis}
                </p>
              </div>

              {/* Alur Pendaftaran */}
              <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs">
                <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2.5">
                  <HelpCircle className={`w-5.5 h-5.5 ${program.accentColor}`} /> Alur Pendaftaran
                </h2>
                <div className="space-y-4">
                  {program.alurPendaftaran.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white shrink-0 ${program.accentColor.replace('text-', 'bg-')}`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-slate-700 text-xs md:text-sm font-bold leading-relaxed">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Sidebar Column */}
            <div className="space-y-6">
              
              {/* Box Aksi Utama (CTA) */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 md:p-8 rounded-2xl shadow-lg relative overflow-hidden border border-slate-800">
                <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
                <h3 className="text-base md:text-lg font-black tracking-tight mb-2">Ingin berpartisipasi?</h3>
                <p className="text-slate-400 text-xs mb-6 leading-relaxed font-medium">
                  Gabunglah ke dalam ekosistem WIBAWA NUSANTARA sekarang untuk memulai akselerasi transformasi.
                </p>
                <Link href={destinationLink} className="block">
                  <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-3 px-5 rounded-xl transition-all shadow-md shadow-blue-600/30 hover:-translate-y-0.5 flex items-center justify-center gap-2 text-xs">
                    {activeCtaText} <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </Link>
              </div>

              {/* Sasaran Peserta */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <h3 className="font-extrabold text-slate-800 text-xs mb-3.5 flex items-center gap-1.5">
                  <Award className={`w-4 h-4 ${program.accentColor}`} /> Sasaran Peserta
                </h3>
                <ul className="space-y-2.5">
                  {program.siapaBisaIkut.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 font-medium leading-snug">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Manfaat */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <h3 className="font-extrabold text-slate-800 text-xs mb-3.5 flex items-center gap-1.5">
                  <CheckCircle2 className={`w-4 h-4 ${program.accentColor}`} /> Manfaat Program
                </h3>
                <ul className="space-y-2.5">
                  {program.manfaat.map((m, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-600 font-medium leading-snug">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Quick Links */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <h3 className="font-extrabold text-slate-800 text-xs mb-3.5">Program Lainnya</h3>
                <div className="space-y-2">
                  {Object.keys(PROGRAM_DATA).filter(k => k !== slug).map((key) => {
                    const p = PROGRAM_DATA[key];
                    return (
                      <Link href={`/programs/${key}`} key={key} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors group">
                        <span className="text-slate-600 text-xs font-bold group-hover:text-slate-900">{p.title}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-800 transition-colors" />
                      </Link>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

