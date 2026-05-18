import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'csv-parse/sync';
import { mapUserRow, mapPesantrenRow } from './mapping';

const isDryRun = process.argv.includes('--dry-run');

// Parse --only-email argument
let onlyEmail: string | null = null;
const emailArgIndex = process.argv.indexOf('--only-email');
if (emailArgIndex !== -1 && process.argv.length > emailArgIndex + 1) {
  onlyEmail = process.argv[emailArgIndex + 1];
}

function loadEnv() {
  try {
    const envPath = path.join(process.cwd(), '.env.migration');
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
      }
    });
  } catch (error) {
    console.error('⚠️ File .env.migration tidak ditemukan. Buat dari .env.migration.example terlebih dahulu.');
    process.exit(1);
  }
}

// Custom function to find table blocks from raw csv dump if needed,
// but since we use csv-parse, we assume users have cleaned the CSVs or we manually split it.
// To handle the phpMyAdmin multi-table dump safely, we parse line by line and group them.
function parseMultiTableCSV(content: string, requiredColumns: string[]) {
  const lines = content.trim().split('\n');
  let startIndex = 0;
  let headers = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hasAll = requiredColumns.every(col => line.includes(col));
    if (hasAll) {
      headers = line;
      startIndex = i + 1;
      break;
    }
  }

  if (!headers) return [];

  const blockLines = [headers];
  for (let i = startIndex; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    if (lines[i].startsWith('"id"') || lines[i].startsWith('id,')) break;
    blockLines.push(lines[i]);
  }

  return parse(blockLines.join('\n'), { columns: true, skip_empty_lines: true, relax_quotes: true });
}

async function run() {
  loadEnv();

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const DEFAULT_TEMP_PASSWORD = process.env.DEFAULT_TEMP_PASSWORD || 'FppJabar2026!';

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('⚠️ SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY tidak ditemukan di .env.migration');
    process.exit(1);
  }

  if (isDryRun) {
    console.log('====================================');
    console.log('🧪 DRY RUN MODE AKTIF');
    console.log('Tidak ada data yang akan ditulis ke database.');
    console.log('====================================\n');
  }

  if (onlyEmail) {
    console.log(`🎯 FILTER AKTIF: Hanya memproses email: ${onlyEmail}`);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const usersPath = path.join(process.cwd(), 'migration', 'data', 'users.csv');
  const pesantrenPath = path.join(process.cwd(), 'migration', 'data', 'pesantren.csv');

  let usersData: any[] = [];
  let pesantrenData: any[] = [];

  if (fs.existsSync(usersPath)) {
    const content = fs.readFileSync(usersPath, 'utf8');
    usersData = parseMultiTableCSV(content, ['email', 'password']);
  }

  if (fs.existsSync(pesantrenPath)) {
    const content = fs.readFileSync(pesantrenPath, 'utf8');
    pesantrenData = parseMultiTableCSV(content, ['nama', 'pendiri', 'pengasuh']);
  }

  const stats = {
    usersRead: usersData.length,
    usersCreated: 0,
    usersSkipped: 0,
    profilesUpdated: 0,
    pesantrenRead: pesantrenData.length,
    pesantrenCreated: 0,
    pesantrenSkipped: 0,
    errors: [] as string[]
  };

  const legacyIdToUuid = new Map<string, string>();
  // Store legacy user id -> legacy pesantren id reference to update profiles later
  const legacyUserToPesantrenRef = new Map<string, string>();

  // 1. MIGRASI USERS
  console.log(`🚀 Memproses ${stats.usersRead} users...`);
  
  for (const row of usersData) {
    try {
      const mapped = mapUserRow(row);
      if (!mapped.email || !mapped.legacy_user_id) {
        stats.errors.push(`[USER] Baris hilang email/ID: ${JSON.stringify(row)}`);
        continue;
      }

      if (onlyEmail && mapped.email !== onlyEmail) {
        continue;
      }

      if (mapped.legacy_pesantren_id_ref) {
        legacyUserToPesantrenRef.set(mapped.legacy_user_id, mapped.legacy_pesantren_id_ref);
      }

      if (isDryRun) {
        console.log(`[DRY-RUN] Akan import user: ${mapped.email} (${mapped.account_type})`);
        legacyIdToUuid.set(mapped.legacy_user_id, `mock-uuid-${mapped.legacy_user_id}`);
        stats.usersCreated++;
        stats.profilesUpdated++;
        continue;
      }

      const { data: existingProfile } = await supabase.from('profiles').select('id, legacy_user_id').eq('legacy_user_id', mapped.legacy_user_id).single();
      
      let authUserId = null;
      if (existingProfile) {
        authUserId = existingProfile.id;
        stats.usersSkipped++;
      } else {
        const { data: existingUsers, error: searchError } = await supabase.auth.admin.listUsers();
        const found = !searchError ? existingUsers.users.find(u => u.email === mapped.email) : null;
        
        if (found) {
          authUserId = found.id;
          stats.usersSkipped++;
        } else {
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: mapped.email,
            password: DEFAULT_TEMP_PASSWORD,
            email_confirm: true,
            user_metadata: { name: mapped.name, role: mapped.role, account_type: mapped.account_type }
          });
          if (authError) {
            const errorObj = authError as any;
            const detailedError = `[USER] Gagal buat auth ${mapped.email}
  - Message: ${errorObj.message}
  - Code: ${errorObj.code}
  - Status: ${errorObj.status}
  - Name: ${errorObj.name}
  - Raw JSON: ${JSON.stringify(errorObj)}
  - Details: 
      Email: ${mapped.email}
      Legacy Role: ${row.role}
      Mapped Role: ${mapped.role}
      Account Type: ${mapped.account_type}`;
            stats.errors.push(detailedError);
            if (onlyEmail) {
              console.log('\n❌ ERROR DETAIL UNTUK', onlyEmail);
              console.log(detailedError);
            }
            continue;
          }
          authUserId = authData.user.id;
          stats.usersCreated++;
        }
      }

      legacyIdToUuid.set(mapped.legacy_user_id, authUserId);

      // Upsert profile
      const { data: pCheck } = await supabase.from('profiles').select('id').eq('id', authUserId).single();
      if (pCheck) {
        await supabase.from('profiles').update({
          legacy_user_id: mapped.legacy_user_id,
          name: mapped.name,
          role: mapped.role,
          account_type: mapped.account_type,
          status: mapped.status,
          old_avatar_path: mapped.old_avatar_path
        }).eq('id', authUserId);
      } else {
        await supabase.from('profiles').insert([{
          id: authUserId,
          legacy_user_id: mapped.legacy_user_id,
          name: mapped.name,
          role: mapped.role,
          account_type: mapped.account_type,
          status: mapped.status,
          old_avatar_path: mapped.old_avatar_path
        }]);
      }
      stats.profilesUpdated++;
      console.log(`✅ User diproses: ${mapped.email}`);
    } catch (err: any) {
      stats.errors.push(`[USER] Error pada baris: ${err.message}`);
    }
  }

  // 2. MIGRASI PESANTREN
  console.log(`\n🚀 Memproses ${stats.pesantrenRead} pesantren...`);
  
  const legacyPesantrenToUuid = new Map<string, string>();

  for (const row of pesantrenData) {
    try {
      const mapped = mapPesantrenRow(row);
      if (!mapped.legacy_pesantren_id) {
        stats.errors.push(`[PESANTREN] Hilang ID: ${JSON.stringify(row)}`);
        continue;
      }

      if (isDryRun) {
        console.log(`[DRY-RUN] Akan import pesantren: ${mapped.name}`);
        legacyPesantrenToUuid.set(mapped.legacy_pesantren_id, `mock-pesantren-${mapped.legacy_pesantren_id}`);
        stats.pesantrenCreated++;
        continue;
      }

      const { data: existingPesantren } = await supabase.from('pesantren').select('id').eq('legacy_pesantren_id', mapped.legacy_pesantren_id).single();

      if (existingPesantren) {
        stats.pesantrenSkipped++;
        legacyPesantrenToUuid.set(mapped.legacy_pesantren_id, existingPesantren.id);
        continue;
      }

      let profileId = null;
      if (mapped.legacy_owner_id && legacyIdToUuid.has(mapped.legacy_owner_id)) {
        profileId = legacyIdToUuid.get(mapped.legacy_owner_id);
      }

      const { data: newP, error: pError } = await supabase.from('pesantren').insert([{
        profile_id: profileId,
        name: mapped.name,
        nspp: mapped.nspp,
        pendiri: mapped.pendiri,
        pengasuh: mapped.pengasuh,
        address: mapped.address,
        city: mapped.city,
        legacy_pesantren_id: mapped.legacy_pesantren_id,
        is_verified: true,
        status: 'verified'
      }]).select('id').single();

      if (pError) {
        stats.errors.push(`[PESANTREN] Gagal import ${mapped.name}: ${pError.message}`);
      } else {
        stats.pesantrenCreated++;
        if (newP) {
          legacyPesantrenToUuid.set(mapped.legacy_pesantren_id, newP.id);
        }
        console.log(`✅ Pesantren diproses: ${mapped.name}`);
      }
    } catch (err: any) {
      stats.errors.push(`[PESANTREN] Error: ${err.message}`);
    }
  }

  // 3. LINK PROFILES TO PESANTREN
  console.log(`\n🔗 Menghubungkan User ke Pesantren...`);
  if (isDryRun) {
    console.log(`[DRY-RUN] Akan menghubungkan user ke pesantren.`);
  } else {
    for (const [legacyUserId, legacyPesantrenId] of legacyUserToPesantrenRef.entries()) {
      const userUuid = legacyIdToUuid.get(legacyUserId);
      const pesantrenUuid = legacyPesantrenToUuid.get(legacyPesantrenId);
      
      if (userUuid && pesantrenUuid) {
        await supabase.from('profiles').update({ pesantren_id: pesantrenUuid }).eq('id', userUuid);
      }
    }
  }

  console.log('\n=======================================');
  console.log('✅ LAPORAN MIGRASI');
  console.log(`- Total User Dibaca: ${stats.usersRead}`);
  console.log(`- User Baru Auth (Created): ${stats.usersCreated}`);
  console.log(`- User Sudah Ada (Skipped/Updated): ${stats.usersSkipped}`);
  console.log(`- Total Profile Dibuat/Update: ${stats.profilesUpdated}`);
  console.log(`- Total Pesantren Dibaca: ${stats.pesantrenRead}`);
  console.log(`- Pesantren Baru Dibuat: ${stats.pesantrenCreated}`);
  console.log(`- Pesantren Sudah Ada (Skipped): ${stats.pesantrenSkipped}`);
  
  if (stats.errors.length > 0) {
    console.log('\n⚠️ BEBERAPA ERROR TERJADI:');
    stats.errors.forEach((e, i) => console.log(`${i+1}. ${e}`));
  }
}

run();
