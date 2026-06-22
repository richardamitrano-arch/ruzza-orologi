import { mediaPath } from '../lib/routing'

export default function ClosingFilm() {
  return (
    <section id="prestigious-video" className="relative h-[100svh] w-full overflow-hidden bg-ink">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        src={mediaPath('/media/lorenzo_prestigious_higgsfield_v4.mp4')}
        poster={mediaPath('/media/lorenzo_prestigious_higgsfield_v4_poster.png')}
        ref={(el) => { if (el) el.muted = true }}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Video Lorenzo Ruzza Prestigious"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/45 via-transparent to-ink/90" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/78 via-ink/20 to-transparent" />
    </section>
  )
}
