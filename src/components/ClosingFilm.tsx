import { mediaPath } from '../lib/routing'
import AutoVideo from './AutoVideo'

export default function ClosingFilm() {
  return (
    <section id="prestigious-video" className="relative h-[100svh] w-full overflow-hidden bg-ink">
      <AutoVideo
        src={mediaPath('/media/lorenzo_prestigious_higgsfield_v4.mp4')}
        mobileSrc={mediaPath('/media/lorenzo_prestigious_higgsfield_v4_mobile.mp4')}
        firstFrame={mediaPath('/media/lorenzo_prestigious_higgsfield_v4_poster.jpg')}
        ariaLabel="Video Lorenzo Ruzza Prestigious"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/45 via-transparent to-ink/90" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/78 via-ink/20 to-transparent" />
    </section>
  )
}
