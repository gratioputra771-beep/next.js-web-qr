// app/api/export/csv/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { id } from 'date-fns/locale'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'GURU' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const bulan = parseInt(searchParams.get('bulan') || String(new Date().getMonth() + 1))
    const tahun = parseInt(searchParams.get('tahun') || String(new Date().getFullYear()))
    const kelasId = searchParams.get('kelasId')

    const startDate = startOfMonth(new Date(tahun, bulan - 1, 1))
    const endDate = endOfMonth(new Date(tahun, bulan - 1, 1))

    const absensiData = await prisma.absensi.findMany({
      where: {
        tanggal: { gte: startDate, lte: endDate },
        mataPelajaranId: null,
        ...(kelasId ? { siswa: { kelasId } } : {}),
      },
      include: {
        siswa: {
          include: {
            user: { select: { nama: true } },
            kelas: { select: { namaKelas: true } },
          },
        },
      },
      orderBy: [{ tanggal: 'asc' }, { siswa: { user: { nama: 'asc' } } }],
    })

    const rows = absensiData.map(a => [
      format(new Date(a.tanggal), 'dd/MM/yyyy'),
      a.siswa.nis,
      a.siswa.user.nama,
      a.siswa.kelas.namaKelas,
      a.status,
      a.metode,
      a.keterangan || '',
      a.waktuScan ? format(new Date(a.waktuScan), 'HH:mm:ss') : '',
    ])

    const headers = ['Tanggal', 'NIS', 'Nama Siswa', 'Kelas', 'Status', 'Metode', 'Keterangan', 'Waktu Scan']
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')

    const namaBulan = format(new Date(tahun, bulan - 1), 'MMMM_yyyy', { locale: id })
    const filename = `rekap_absensi_${namaBulan}.csv`

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
