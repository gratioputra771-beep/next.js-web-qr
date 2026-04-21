'use client'
// components/QRScanner.tsx

import { useEffect, useRef, useState, useCallback } from 'react'
import { Camera, CameraOff } from 'lucide-react'

interface QRScannerProps {
  onScan: (token: string) => void
  isProcessing?: boolean
}

export default function QRScanner({ onScan, isProcessing = false }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const lastScanRef = useRef<number>(0)
  const [active, setActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const stopScanner = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) videoRef.current.srcObject = null
    setActive(false)
  }, [])

  const scanFrame = useCallback((jsQR: any) => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animFrameRef.current = requestAnimationFrame(() => scanFrame(jsQR))
      return
    }

    const now = Date.now()
    if (now - lastScanRef.current < 300) {
      animFrameRef.current = requestAnimationFrame(() => scanFrame(jsQR))
      return
    }
    lastScanRef.current = now

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) { animFrameRef.current = requestAnimationFrame(() => scanFrame(jsQR)); return }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })

    if (code) {
      const raw = code.data as string
      let token = raw
      try {
        const url = new URL(raw)
        const t = url.searchParams.get('token')
        if (t) token = t
      } catch { }
      onScan(token)
      lastScanRef.current = now + 2000
    }

    animFrameRef.current = requestAnimationFrame(() => scanFrame(jsQR))
  }, [onScan])

  const startScanner = useCallback(async () => {
    setError(null)
    try {
      const jsQRModule = await import('jsqr')
      const jsQR = jsQRModule.default

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.setAttribute('playsinline', 'true')
        await videoRef.current.play()
      }

      setActive(true)
      animFrameRef.current = requestAnimationFrame(() => scanFrame(jsQR))
    } catch (e: any) {
      if (e.name === 'NotAllowedError') {
        setError('Izin kamera ditolak. Klik ikon kamera di address bar → Allow → Reload halaman.')
      } else if (e.name === 'NotFoundError') {
        setError('Kamera tidak ditemukan di perangkat ini.')
      } else if (e.name === 'NotSupportedError') {
        setError('Kamera tidak didukung. Pastikan menggunakan HTTPS atau localhost.')
      } else {
        setError('Gagal mengakses kamera: ' + (e.message || e.name))
      }
    }
  }, [scanFrame])

  useEffect(() => { return () => { stopScanner() } }, [stopScanner])

  if (!mounted) return null

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-sm">
        <video
          ref={videoRef}
          className="w-full rounded-2xl border-2 border-blue-300 object-cover bg-black"
          style={{ minHeight: 280, display: active ? 'block' : 'none' }}
          playsInline muted autoPlay
        />
        <canvas ref={canvasRef} className="hidden" />

        {!active && (
          <div className="w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3 py-16">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Camera size={28} className="text-slate-400" />
            </div>
            <p className="text-sm text-slate-500 text-center px-4">
              Klik tombol di bawah untuk mengaktifkan kamera
            </p>
          </div>
        )}

        {active && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-52 h-52 relative">
              <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />
              <div className="scan-line" />
            </div>
          </div>
        )}

        {active && isProcessing && (
          <div className="absolute inset-0 bg-blue-900/70 flex items-center justify-center rounded-2xl">
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

      <button
        onClick={active ? stopScanner : startScanner}
        disabled={isProcessing}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition shadow-lg
          ${active ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'}
          disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {active ? <><CameraOff size={18} /> Matikan Kamera</> : <><Camera size={18} /> Aktifkan Kamera</>}
      </button>

      {active && <p className="text-xs text-slate-400 text-center">Arahkan QR Code ke dalam kotak — scan otomatis</p>}
    </div>
  )
}
