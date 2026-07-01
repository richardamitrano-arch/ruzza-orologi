import { mediaPath } from '../lib/routing'
import AutoVideo from './AutoVideo'

export default function LorenzoHero() {
  return (
    <section id="intro" className="relative h-[100svh] w-full overflow-hidden bg-ink">
      {/* Video hero: resta e parte anche su smartphone, senza mai il tasto play (vedi AutoVideo). */}
      <AutoVideo
        src={mediaPath('/media/lorenzo.mp4')}
        mobileSrc={mediaPath('/media/lorenzo_mobile.mp4')}
        firstFrame={mediaPath('/media/lorenzo_poster.jpg')}
        eager
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-ink/55 via-transparent to-ink/90" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/70 via-transparent to-transparent" />

      <div className="absolute inset-x-0 bottom-0">
        <div className="mx-auto max-w-editorial px-6 pb-[15vh] md:px-10 md:pb-[12vh]">
          <p className="display text-bone text-[clamp(2.8rem,7.5vw,6.5rem)] leading-[0.96]">
            Cavalca il tuo <span className="italic text-malachite-bright">tempo.</span>
          </p>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-7 flex justify-center">
        <span className="h-14 w-px overflow-hidden bg-bone/20">
          <span className="block h-1/2 w-full animate-scrollLine bg-malachite-bright" />
        </span>
      </div>
    </section>
  )
}
