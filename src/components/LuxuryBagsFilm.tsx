import { mediaPath } from '../lib/routing'

export default function LuxuryBagsFilm() {
  return (
    <section id="luxury-bags-film" className="relative h-[100svh] w-full overflow-hidden bg-ink">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={mediaPath('/media/lorenzo_birkin_higgsfield.mp4')}
        poster={mediaPath('/media/lorenzo_birkin_higgsfield_poster.png')}
        ref={(el) => { if (el) el.muted = true }}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Video Ruzza Luxury Bags"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/5 to-ink/90" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/82 via-ink/22 to-transparent" />
    </section>
  )
}
