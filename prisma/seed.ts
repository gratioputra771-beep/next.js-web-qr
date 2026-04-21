// prisma/seed.ts
import { PrismaClient, Role, StatusAbsen, MetodeAbsen, JenisKelamin } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database SMP Kristen Permata...')

  const hashAdmin = await bcrypt.hash('admin123', 10)
  const hashGuru = await bcrypt.hash('guru123', 10)
  const hashSiswa = await bcrypt.hash('siswa123', 10)

  // ─────────────────────────────────────────────
  // ADMIN
  // ─────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@smpkristenpermata.sch.id' },
    update: {},
    create: {
      nama: 'Super Admin',
      email: 'admin@smpkristenpermata.sch.id',
      password: hashAdmin,
      role: Role.ADMIN,
      admin: { create: {} },
    },
  })
  console.log('✅ Admin created:', adminUser.email)

  // ─────────────────────────────────────────────
  // GURU
  // ─────────────────────────────────────────────
  const guruData = [
    {
      nama: 'Frengki Salukh, S.Sos',
      email: 'frengki@smpkristenpermata.sch.id',
      nip: '197801012005011001',
      mapel: 'Kepala Sekolah',
      noHp: '08114501001',
    },
    {
      nama: 'Kris',
      email: 'kris@smpkristenpermata.sch.id',
      nip: '198203052008011002',
      mapel: 'Matematika',
      noHp: '08114501002',
    },
    {
      nama: 'Ruth',
      email: 'ruth@smpkristenpermata.sch.id',
      nip: '198507102010012003',
      mapel: 'Bahasa Indonesia',
      noHp: '08114501003',
    },
    {
      nama: 'Beny',
      email: 'beny@smpkristenpermata.sch.id',
      nip: '197912202006011004',
      mapel: 'IPA',
      noHp: '08114501004',
    },
    {
      nama: 'Wiwik',
      email: 'wiwik@smpkristenpermata.sch.id',
      nip: '198901152012012005',
      mapel: 'IPS',
      noHp: '08114501005',
    },
    {
      nama: 'Nathan',
      email: 'nathan@smpkristenpermata.sch.id',
      nip: '199005202015011006',
      mapel: 'Pendidikan Agama Kristen',
      noHp: '08114501006',
    },
  ]

  const guruMap: Record<string, any> = {}
  for (const g of guruData) {
    const user = await prisma.user.upsert({
      where: { email: g.email },
      update: {},
      create: {
        nama: g.nama,
        email: g.email,
        password: hashGuru,
        role: Role.GURU,
        guru: {
          create: {
            nip: g.nip,
            mapel: g.mapel,
          },
        },
      },
      include: { guru: true },
    })
    guruMap[g.nama] = user.guru
    console.log('✅ Guru created:', g.nama)
  }

  // ─────────────────────────────────────────────
  // KELAS
  // ─────────────────────────────────────────────
  const kelas7 = await prisma.kelas.upsert({
    where: { namaKelas_tahunAjaran: { namaKelas: 'VII', tahunAjaran: '2024/2025' } },
    update: {},
    create: {
      namaKelas: 'VII',
      tingkat: 7,
      tahunAjaran: '2024/2025',
      guruId: guruMap['Kris'].id,
    },
  })

  const kelas8 = await prisma.kelas.upsert({
    where: { namaKelas_tahunAjaran: { namaKelas: 'VIII', tahunAjaran: '2024/2025' } },
    update: {},
    create: {
      namaKelas: 'VIII',
      tingkat: 8,
      tahunAjaran: '2024/2025',
      guruId: guruMap['Ruth'].id,
    },
  })
  console.log('✅ Kelas VII dan VIII created')

  // ─────────────────────────────────────────────
  // SISWA KELAS 7
  // ─────────────────────────────────────────────
  const siswaKelas7 = [
    {
      nama: 'Salomo',
      email: 'salomo@siswa.smpkristenpermata.sch.id',
      nis: '2024701',
      nisn: '0024700001',
      jenisKelamin: JenisKelamin.LAKI_LAKI,
      tanggalLahir: new Date('2012-03-14'),
      noHpOrtu: '08234567001',
      alamat: 'Jl. Permata No. 1, Jayapura',
    },
    {
      nama: 'Oswald',
      email: 'oswald@siswa.smpkristenpermata.sch.id',
      nis: '2024702',
      nisn: '0024700002',
      jenisKelamin: JenisKelamin.LAKI_LAKI,
      tanggalLahir: new Date('2012-06-22'),
      noHpOrtu: '08234567002',
      alamat: 'Jl. Permata No. 2, Jayapura',
    },
    {
      nama: 'Ferbriano',
      email: 'ferbriano@siswa.smpkristenpermata.sch.id',
      nis: '2024703',
      nisn: '0024700003',
      jenisKelamin: JenisKelamin.LAKI_LAKI,
      tanggalLahir: new Date('2012-02-05'),
      noHpOrtu: '08234567003',
      alamat: 'Jl. Permata No. 3, Jayapura',
    },
    {
      nama: 'Elia',
      email: 'elia@siswa.smpkristenpermata.sch.id',
      nis: '2024704',
      nisn: '0024700004',
      jenisKelamin: JenisKelamin.LAKI_LAKI,
      tanggalLahir: new Date('2012-09-18'),
      noHpOrtu: '08234567004',
      alamat: 'Jl. Permata No. 4, Jayapura',
    },
  ]

  for (const s of siswaKelas7) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        nama: s.nama,
        email: s.email,
        password: hashSiswa,
        role: Role.SISWA,
        siswa: {
          create: {
            nis: s.nis,
            nisn: s.nisn,
            kelasId: kelas7.id,
            jenisKelamin: s.jenisKelamin,
            tanggalLahir: s.tanggalLahir,
            noHpOrtu: s.noHpOrtu,
            alamat: s.alamat,
          },
        },
      },
    })
    console.log('✅ Siswa Kelas VII created:', s.nama)
  }

  // ─────────────────────────────────────────────
  // SISWA KELAS 8
  // ─────────────────────────────────────────────
  const siswaKelas8 = [
    {
      nama: 'Anugrah Wea',
      email: 'anugrahwea@siswa.smpkristenpermata.sch.id',
      nis: '2024801',
      nisn: '0024800001',
      jenisKelamin: JenisKelamin.LAKI_LAKI,
      tanggalLahir: new Date('2011-04-10'),
      noHpOrtu: '08234568001',
      alamat: 'Jl. Kristen No. 1, Jayapura',
    },
    {
      nama: 'Benaya',
      email: 'benaya@siswa.smpkristenpermata.sch.id',
      nis: '2024802',
      nisn: '0024800002',
      jenisKelamin: JenisKelamin.LAKI_LAKI,
      tanggalLahir: new Date('2011-07-25'),
      noHpOrtu: '08234568002',
      alamat: 'Jl. Kristen No. 2, Jayapura',
    },
    {
      nama: 'Bina',
      email: 'bina@siswa.smpkristenpermata.sch.id',
      nis: '2024803',
      nisn: '0024800003',
      jenisKelamin: JenisKelamin.PEREMPUAN,
      tanggalLahir: new Date('2011-01-30'),
      noHpOrtu: '08234568003',
      alamat: 'Jl. Kristen No. 3, Jayapura',
    },
    {
      nama: 'Celsi',
      email: 'celsi@siswa.smpkristenpermata.sch.id',
      nis: '2024804',
      nisn: '0024800004',
      jenisKelamin: JenisKelamin.PEREMPUAN,
      tanggalLahir: new Date('2011-11-08'),
      noHpOrtu: '08234568004',
      alamat: 'Jl. Kristen No. 4, Jayapura',
    },
    {
      nama: 'Imannuel Jikwa',
      email: 'imanueljikwa@siswa.smpkristenpermata.sch.id',
      nis: '2024805',
      nisn: '0024800005',
      jenisKelamin: JenisKelamin.LAKI_LAKI,
      tanggalLahir: new Date('2011-05-17'),
      noHpOrtu: '08234568005',
      alamat: 'Jl. Kristen No. 5, Jayapura',
    },
    {
      nama: 'Samuel Monim',
      email: 'samuelmonim@siswa.smpkristenpermata.sch.id',
      nis: '2024806',
      nisn: '0024800006',
      jenisKelamin: JenisKelamin.LAKI_LAKI,
      tanggalLahir: new Date('2011-08-03'),
      noHpOrtu: '08234568006',
      alamat: 'Jl. Kristen No. 6, Jayapura',
    },
    {
      nama: 'Maikel Kipka',
      email: 'maikelkipka@siswa.smpkristenpermata.sch.id',
      nis: '2024807',
      nisn: '0024800007',
      jenisKelamin: JenisKelamin.LAKI_LAKI,
      tanggalLahir: new Date('2011-12-20'),
      noHpOrtu: '08234568007',
      alamat: 'Jl. Kristen No. 7, Jayapura',
    },
    {
      nama: 'Gratio',
      email: 'gratio@siswa.smpkristenpermata.sch.id',
      nis: '2024808',
      nisn: '0024800008',
      jenisKelamin: JenisKelamin.LAKI_LAKI,
      tanggalLahir: new Date('2011-03-12'),
      noHpOrtu: '08234568008',
      alamat: 'Jl. Kristen No. 8, Jayapura',
    },
  ]

  for (const s of siswaKelas8) {
    await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        nama: s.nama,
        email: s.email,
        password: hashSiswa,
        role: Role.SISWA,
        siswa: {
          create: {
            nis: s.nis,
            nisn: s.nisn,
            kelasId: kelas8.id,
            jenisKelamin: s.jenisKelamin,
            tanggalLahir: s.tanggalLahir,
            noHpOrtu: s.noHpOrtu,
            alamat: s.alamat,
          },
        },
      },
    })
    console.log('✅ Siswa Kelas VIII created:', s.nama)
  }

  // ─────────────────────────────────────────────
  // MATA PELAJARAN
  // ─────────────────────────────────────────────
  const mapelList = [
    { nama: 'Matematika', kode: 'MTK' },
    { nama: 'Bahasa Indonesia', kode: 'B.IND' },
    { nama: 'Bahasa Inggris', kode: 'B.ING' },
    { nama: 'IPA', kode: 'IPA' },
    { nama: 'IPS', kode: 'IPS' },
    { nama: 'Pendidikan Agama Kristen', kode: 'PAK' },
    { nama: 'Seni Budaya', kode: 'SBD' },
    { nama: 'Pendidikan Jasmani', kode: 'PJOK' },
  ]

  for (const m of mapelList) {
    await prisma.mataPelajaran.upsert({
      where: { kode: m.kode },
      update: {},
      create: m,
    })
  }
  console.log('✅ Mata pelajaran created')

  // ─────────────────────────────────────────────
  // SELESAI
  // ─────────────────────────────────────────────
  console.log('\n🎉 Seeding SMP Kristen Permata selesai!')
  console.log('\n📋 Akun Default:')
  console.log('  Admin        : admin@smpkristenpermata.sch.id   | admin123')
  console.log('  Kepala Sek.  : frengki@smpkristenpermata.sch.id | guru123')
  console.log('  Guru Kris    : kris@smpkristenpermata.sch.id    | guru123')
  console.log('  Guru Ruth    : ruth@smpkristenpermata.sch.id    | guru123')
  console.log('  Guru Beny    : beny@smpkristenpermata.sch.id    | guru123')
  console.log('  Guru Wiwik   : wiwik@smpkristenpermata.sch.id   | guru123')
  console.log('  Guru Nathan  : nathan@smpkristenpermata.sch.id  | guru123')
  console.log('\n  Siswa Kelas VII  : salomo / oswald / ferbriano / elia')
  console.log('  Siswa Kelas VIII : anugrahwea / benaya / bina / celsi /')
  console.log('                     imanueljikwa / samuelmonim / maikelkipka / gratio')
  console.log('  (semua siswa pakai password: siswa123)')
  console.log('  (email siswa: nama@siswa.smpkristenpermata.sch.id)')
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })