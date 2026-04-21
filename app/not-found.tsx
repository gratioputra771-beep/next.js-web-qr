// app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-black text-slate-200 mb-4">404</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Halaman Tidak Ditemukan</h1>
        <p className="text-slate-500 mb-6">Halaman yang kamu cari tidak ada atau sudah dipindahkan.</p>
        <Link href="/" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}
