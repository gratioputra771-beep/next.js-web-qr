'use client'
// components/QRScanner.tsx

import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, CameraOff } from 'lucide-react'

interface QRScannerProps {
  onScan: (token: string) => void
  isProcessing?: boolean
}

export default function QRScanner({ onScan, isProcessing = false }: QRScannerProps) {
  const scannerRef = useRef<any>(null)
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const startScanner = useCallback(async () => {
    setError(null)

    // Pastikan elemen #qr-reader sudah ada di DOM
    const el = document.getElementById('qr-reader')
    if (!el) {
      setError('Elemen scanner tidak ditemukan, coba refresh halaman')
      return
    }

    try {
      // Dynamic import agar tidak di-load saat SSR
      const { Html5QrcodeScanner, Html5QrcodeScanType } = await import('html5-qrcode')

      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
          aspectRatio: 1.0,
          rememberLastUsedCamera: true,
        },
        false
      )

      scanner.render(
        (decodedText: string) => {
          let token = decodedText
          try {
            const url = new URL(decodedText)
            const t = url.searchParams.get('token')
            if (t) token = t
          } catch {
            // bukan URL, pakai raw value
          }
          onScan(token)
        },
        (err: string) => {
          // Abaikan error "No QR code found" — itu normal saat kamera aktif tapi belum ada QR
          if (err && !err.includes('No QR code found') && !err.includes('No barcode')) {
            console.warn('QR Scanner warn:', err)
          }
        }
      )

      scannerRef.current = scanner
      setActive(true)
    } catch (e) {
      console.error('Failed to start scanner:', e)
      setError('Gagal mengaktifkan kamera. Pastikan izin kamera sudah diberikan.')
    }
  }, [onScan])

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear()
      } catch (e) {
        console.warn('Stop scanner error:', e)
      }
      scannerRef.current = null
    }
    setActive(false)
    setError(null)
  }, [])

  // Cleanup saat komponen di-unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [])

  if (!mounted) return null

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Viewport scanner */}
      <div className="relative w-full max-w-sm">
        {/* Container untuk html5-qrcode — HARUS selalu ada di DOM */}
        <div
          id="qr-reader"
          className={`w-full rounded-2xl overflow-hidden border-2 ${
            active ? 'border-blue-300 bg-black' : 'border-dashed border-slate-200 bg-slate-50 min-h-[280px]'
          }`}
        />

        {/* Placeholder saat kamera belum aktif */}
        {!active && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Camera size={28} className="text-slate-400" />
            </div>
            <p className="text-sm text-slate-500 text-center px-4">
              Klik tombol di bawah untuk mengaktifkan kamera
            </p>
          </div>
        )}

        {/* Overlay saat memproses */}
        {active && isProcessing && (
          <div className="absolute inset-0 bg-blue-900/70 flex items-center justify-center rounded-2xl pointer-events-none">
            <div className="text-center text-white">
              <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2" />
              <p className="text-sm font-medium">Memproses...</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="w-full max-w-sm bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Tombol aktifkan/matikan */}
      <button
        onClick={active ? stopScanner : startScanner}
        disabled={isProcessing}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition shadow-lg
          ${active
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200'
            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
          }
          disabled:opacity-60 disabled:cursor-not-allowed
        `}
      >
        {active
          ? <><CameraOff size={18} /> Matikan Kamera</>
          : <><Camera size={18} /> Aktifkan Kamera</>
        }
      </button>

      {active && (
        <p className="text-xs text-slate-400 text-center">
          Arahkan QR Code ke dalam kotak — scan otomatis
        </p>
      )}
    </div>
  )
}
