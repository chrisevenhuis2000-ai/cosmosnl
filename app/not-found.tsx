import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
         style={{ background: 'radial-gradient(ellipse at 50% 20%, #1a1c4a 0%, #0a0b1a 70%)' }}>

      {/* Star field decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        {[...Array(40)].map((_, i) => (
          <div key={i} className="absolute rounded-full bg-white"
               style={{
                 width:  `${1 + Math.random() * 2}px`,
                 height: `${1 + Math.random() * 2}px`,
                 top:    `${Math.random() * 100}%`,
                 left:   `${Math.random() * 100}%`,
                 opacity: 0.15 + Math.random() * 0.4,
               }} />
        ))}
      </div>

      <div className="relative z-10 max-w-md">
        <p className="font-mono text-xs tracking-widest uppercase text-[#4A5A8A] mb-4">
          Fout 404
        </p>

        <h1 className="font-display text-5xl font-bold mb-4"
            style={{ fontFamily: 'Playfair Display, serif' }}>
          Verloren in de ruimte
        </h1>

        <p className="text-[#8A9CC0] mb-8 leading-relaxed">
          Deze pagina lijkt niet te bestaan — misschien is hij opgeslokt door een zwart gat.
          Ga terug naar de homepage of bekijk het laatste nieuws.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/"
                className="px-6 py-3 rounded-lg font-medium text-sm transition-colors"
                style={{ background: '#252858', border: '1px solid #3a3f7a', color: '#c8d4f0' }}>
            Naar de homepage
          </Link>
          <Link href="/nieuws"
                className="px-6 py-3 rounded-lg font-medium text-sm transition-colors"
                style={{ background: 'transparent', border: '1px solid #252858', color: '#8A9CC0' }}>
            Laatste nieuws
          </Link>
        </div>
      </div>
    </div>
  )
}
