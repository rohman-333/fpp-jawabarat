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
  address: row['alamat_desa'] || null,
  city: row['kecamatan'] || null,
});
