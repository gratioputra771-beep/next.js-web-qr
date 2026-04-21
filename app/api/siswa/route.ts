// app/api/siswa/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { tambahSiswaSchema } from '@/lib/validations'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'GURU' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const kelasId = searchParams.get('kelasId')
    const search = searchParams.get('search')

    const siswaList = await prisma.siswa.findMany({
      where: {
        ...(kelasId ? { kelasId } : {}),
        ...(search ? {
          OR: [
            { user: { nama: { contains: search, mode: 'insensitive' } } },
            { nis: { contains: search, mode: 'insensitive' } },
          ],
        } : {}),
        user: { aktif: true },
      },
      include: {
        user: { select: { nama: true, email: true, foto: true, aktif: true } },
        kelas: { select: { namaKelas: true, tingkat: true } },
      },
      orderBy: { user: { nama: 'asc' } },
    })

    return NextResponse.json({ success: true, data: siswaList })
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'GURU' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = tambahSiswaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })
    }

    const { nama, email, password, nis, nisn, kelasId, jenisKelamin, tanggalLahir, noHpOrtu, emailOrtu, alamat } = parsed.data

    // Check email & NIS uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) return NextResponse.json({ error: 'Email sudah digunakan' }, { status: 400 })

    const existingNis = await prisma.siswa.findUnique({ where: { nis } })
    if (existingNis) return NextResponse.json({ error: 'NIS sudah digunakan' }, { status: 400 })

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        nama,
        email,
        password: hashedPassword,
        role: 'SISWA',
        siswa: {
          create: {
            nis,
            nisn: nisn || null,
            kelasId,
            jenisKelamin: jenisKelamin as any || null,
            tanggalLahir: tanggalLahir ? new Date(tanggalLahir) : null,
            noHpOrtu: noHpOrtu || null,
            emailOrtu: emailOrtu || null,
            alamat: alamat || null,
          },
        },
      },
      include: { siswa: true },
    })

    return NextResponse.json({ success: true, data: user }, { status: 201 })
  } catch (error) {
    console.error('Tambah siswa error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
