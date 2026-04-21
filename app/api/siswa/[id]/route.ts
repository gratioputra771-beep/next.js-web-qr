// app/api/siswa/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const siswa = await prisma.siswa.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { nama: true, email: true, foto: true, aktif: true } },
        kelas: { select: { namaKelas: true, tingkat: true, tahunAjaran: true } },
        absensi: {
          orderBy: { tanggal: 'desc' },
          take: 30,
        },
      },
    })

    if (!siswa) return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })

    return NextResponse.json({ success: true, data: siswa })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'GURU' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const { nama, kelasId, jenisKelamin, tanggalLahir, noHpOrtu, emailOrtu, alamat } = body

    const siswa = await prisma.siswa.findUnique({ where: { id: params.id } })
    if (!siswa) return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })

    await prisma.user.update({
      where: { id: siswa.userId },
      data: { nama },
    })

    const updated = await prisma.siswa.update({
      where: { id: params.id },
      data: {
        kelasId,
        jenisKelamin: jenisKelamin || null,
        tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
        noHpOrtu: noHpOrtu || null,
        emailOrtu: emailOrtu || null,
        alamat: alamat || null,
      },
      include: { user: { select: { nama: true, email: true } } },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'GURU' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const siswa = await prisma.siswa.findUnique({ where: { id: params.id } })
    if (!siswa) return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 })

    // Soft delete — deactivate
    await prisma.user.update({
      where: { id: siswa.userId },
      data: { aktif: false },
    })

    return NextResponse.json({ success: true, message: 'Siswa berhasil dinonaktifkan' })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
