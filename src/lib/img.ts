// Responsive image helpers for Shopify CDN images.
//
// Shopify's image CDN honours a `width` query parameter and returns a resized
// (and format-negotiated) image — so a 2.5 MB full-res photo becomes ~40 KB at
// width=400. We rewrite ONLY Shopify CDN URLs; any other src (local bundled
// asset, data URI, etc.) is returned untouched so the helper is always safe to
// apply everywhere.

const isShopify = (url: string): boolean =>
  /cdn\.shopify\.com|\.myshopify\.com|shopifycdn/.test(url)

type ImageOptions = {
  format?: 'pjpg'
}

/** Append a pixel width to a Shopify CDN image URL (no-op for non-Shopify URLs). */
export function sizedImage(url: string | null | undefined, width: number, options: ImageOptions = {}): string {
  if (!url) return ''
  if (!isShopify(url)) return url
  const sep = url.includes('?') ? '&' : '?'
  const params = [`width=${width}`]
  if (options.format) params.push(`format=${options.format}`)
  return `${url}${sep}${params.join('&')}`
}

/** Build a srcSet string across the given widths (undefined for non-Shopify URLs). */
export function imageSrcSet(
  url: string | null | undefined,
  widths: number[],
  options: ImageOptions = {},
): string | undefined {
  if (!url || !isShopify(url)) return undefined
  return widths.map((w) => `${sizedImage(url, w, options)} ${w}w`).join(', ')
}
