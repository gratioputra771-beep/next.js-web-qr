// app/api/qrcode/regenerate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createId } from '@paralleldrive/cuid2'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'GURU' && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { siswaId } = await req.json()
    if (!siswaId) return NextResponse.json({ error: 'siswaId wajib diisi' }, { status: 400 })

    const newToken = createId()

    const updated = await prisma.siswa.update({
      where: { id: siswaId },
      data: { qrToken: newToken },
    })

    return NextResponse.json({
      success: true,
      message: 'QR Code berhasil direset. Token lama sudah tidak berlaku.',
      data: { qrToken: updated.qrToken },
    })
  } catch (error) {
    console.error('Regenerate QR error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
