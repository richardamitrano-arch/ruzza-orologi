import { mediaPath } from '../lib/routing'
import AutoVideo from './AutoVideo'

export default function LuxuryBagsFilm() {
  return (
    <section id="luxury-bags-film" className="relative h-[100svh] w-full overflow-hidden bg-ink">
      <AutoVideo
        src={mediaPath('/media/lorenzo_birkin_higgsfield.mp4')}
        mobileSrc={mediaPath('/media/lorenzo_birkin_higgsfield_mobile.mp4')}
        firstFrame={mediaPath('/media/lorenzo_birkin_higgsfield_poster.jpg')}
        ariaLabel="Video Ruzza Luxury Bags"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/5 to-ink/90" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/82 via-ink/22 to-transparent" />
    </section>
  )
}
