const rawBase = import.meta.env.BASE_URL || '/'

export const BASE_PATH = rawBase === '/' ? '' : rawBase.replace(/\/+$/, '')

export function appPath(pathname = window.location.pathname) {
  const clean = pathname.replace(/\/+$/, '') || '/'
  if (BASE_PATH && (clean === BASE_PATH || clean.startsWith(`${BASE_PATH}/`))) {
    return clean.slice(BASE_PATH.length).replace(/\/+$/, '') || '/'
  }
  return clean
}

export function appHref(href: string) {
  if (!href.startsWith('/')) return href
  return `${BASE_PATH}${href}` || '/'
}

export function productHref(handle: string) {
  return appHref(`/products/${encodeURIComponent(handle)}`)
}

export function mediaPath(path: string) {
  return appHref(path.startsWith('/') ? path : `/${path}`)
}

export function isInternalHref(href: string) {
  return href.startsWith('/') || href.startsWith('#')
}
