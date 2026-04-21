// app/api/guru/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const guruList = await prisma.guru.findMany({
      include: {
        user: {
          select: { nama: true, aktif: true },
        },
      },
      where: {
        user: { aktif: true },
      },
      orderBy: {
        user: { nama: 'asc' },
      },
    })

    return NextResponse.json({ success: true, data: guruList })
  } catch (error) {
    console.error('Guru fetch error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
