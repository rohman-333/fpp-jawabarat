/**
 * WIBAWA NUSANTARA — Brand Configuration
 * Sentralisasi semua konstanta brand di sini.
 */

export const BRAND = {
  name: 'WIBAWA NUSANTARA',
  shortName: 'WIBAWA',
  tagline: 'Platform Sosial & Komunitas Nusantara',
  description:
    'Platform digital terpadu untuk komunitas, marketplace, forum musyawarah, dan pemberdayaan masyarakat Nusantara.',
  year: 2025,

  // Logo paths (relative to /public)
  logoFull: '/branding/logo.png',       // logo dengan teks (hitam, untuk bg terang)
  logoSquare: '/branding/logo-square.png', // ikon persegi biru (untuk sidebar gelap / PWA)
  favicon: '/branding/favicon.png',

  // Color palette — Sapphire Blue
  colors: {
    primary: '#0F52BA',
    primaryDark: '#0B3D91',
    primaryDarker: '#082D6E',
    primarySoft: '#EAF2FF',
    accent: '#6EA8FE',
    accentLight: '#93C5FD',
    surface: '#F8FAFC',
    border: '#D6E4FF',
    textMain: '#0F172A',
  },

  // Social / SEO
  url: 'https://wibawanusantara.id',
  siteUrl: process.env.NEXT_PUBLIC_APP_URL || "https://wibawa-nusantara.com",
  twitterHandle: '@wibawanusantara',
} as const;

export type BrandType = typeof BRAND;
