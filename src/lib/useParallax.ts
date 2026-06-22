import { useRef } from 'react'
import { useScroll, useTransform, type MotionValue } from 'framer-motion'

/**
 * Scroll-driven parallax. Attach `ref` to the element (or a wrapper) and bind
 * the returned `y` to its `style`. Layers with different distances drift at
 * different rates → depth. Distance is in pixels of total travel.
 */
export function useParallax(distance = 80): {
  ref: React.RefObject<HTMLDivElement>
  y: MotionValue<number>
} {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [distance, -distance])
  return { ref, y }
}
