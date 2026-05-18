export const mapUserRow = (row: any) => {
  const legacyRole = (row['role'] || '').toLowerCase();
  let newRole = 'user';
  let accountType = 'masyarakat_umum';

  if (legacyRole === 'admin') {
    newRole = 'admin';
    accountType = 'lembaga';
  } else if (legacyRole === 'pesantren') {
    newRole = 'user';
    accountType = 'pesantren';
  }

  const legacyStatus = (row['status'] || '').toLowerCase();
  let status = 'active';
  if (legacyStatus === 'banned' || legacyStatus === 'suspended') {
    status = 'banned';
  } else if (legacyStatus === 'inactive') {
    status = 'inactive';
  }

  return {
    legacy_user_id: row['id']?.toString(), // Wajib unik
    email: row['email']?.toLowerCase(), // Wajib ada
    name: row['name'] || 'User Tanpa Nama',
    phone: null, // Diisi jika ada di file
    role: newRole,
    account_type: accountType,
    status: status,
    old_avatar_path: row['avatar_path'] || null,
    legacy_pesantren_id_ref: row['pesantren_id']?.toString() || null,
  };
};

export const mapPesantrenRow = (row: any) => ({
  legacy_pesantren_id: row['id']?.toString(), // Wajib unik
  legacy_owner_id: row['created_by']?.toString(), // Relasi ke tabel user lama (created_by)
  name: row['nama'] || 'Pesantren Tanpa Nama',
  nspp: null, 
  pendiri: row['pendiri'] || null,
  pengasuh: row['pengasuh'] || null,
  hp: row['hp'] || null,
  address: row['alamat_desa'] || null,
  alamat_desa: row['alamat_desa'] || null,
  kecamatan: row['kecamatan'] || null,
  city: row['kecamatan'] || null,
  tahun_berdiri: row['tahun_berdiri'] ? parseInt(row['tahun_berdiri'], 10) : null,
  lembaga_formal: (row['lembaga_formal'] || '').toUpperCase() === 'YA',
  santri_sd: row['santri_sd'] ? parseInt(row['santri_sd'], 10) : 0,
  santri_smp: row['santri_smp'] ? parseInt(row['santri_smp'], 10) : 0,
  santri_sma: row['santri_sma'] ? parseInt(row['santri_sma'], 10) : 0,
  guru_ustadz: row['guru_ustadz'] ? parseInt(row['guru_ustadz'], 10) : 0,
  jenis_pesantren: row['jenis_pesantren'] || null,
  program_unggulan: row['program_unggulan'] || null,
  media_sosial: row['media_sosial'] || null,
  potensi_ekonomi: row['potensi_ekonomi'] || null,
  kebutuhan_utama: row['kebutuhan_utama'] || null,
  koperasi_bmt_usaha: row['koperasi_bmt_usaha'] || null,
  minat_digital_ai: row['minat_digital_ai'] || null,
  saran_pemda: row['saran_pemda'] || null,
  harapan_pemda_forum: row['harapan_pemda_forum'] || null,
  logo_url: row['logo'] || null,
  foto_url: row['foto'] || null,
  status: row['status'] === 'verified' ? 'verified' : (row['status'] === 'rejected' ? 'rejected' : 'pending'),
});
