// app/(dashboard)/guru/pengaturan/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PengaturanClient from './PengaturanClient'

export default async function PengaturanPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return (
    <PengaturanClient
      nama={session.user.nama}
      email={session.user.email}
      role={session.user.role}
    />
  )
}
