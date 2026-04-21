// app/api/kelas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { kelasSchema } from '@/lib/validations'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

    const kelasList = await prisma.kelas.findMany({
      include: {
        guru: { include: { user: { select: { nama: true } } } },
        _count: { select: { siswa: true } },
      },
      orderBy: [{ tingkat: 'asc' }, { namaKelas: 'asc' }],
    })

    return NextResponse.json({ success: true, data: kelasList })
  } catch {
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
    const parsed = kelasSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 })

    const kelas = await prisma.kelas.create({ data: parsed.data })
    return NextResponse.json({ success: true, data: kelas }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
