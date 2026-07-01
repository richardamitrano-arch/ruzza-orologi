import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const targets = process.argv.slice(2)
const buildDirs = targets.length ? targets : ['dist']
const staticSpaRoutes = ['app-orologi', 'dashboard-segretaria', 'orologi', 'borse', 'gioielli', 'novita']

function productRoutes() {
  try {
    const commerce = JSON.parse(readFileSync('src/data/commerce.json', 'utf8'))
    const buckets = Object.values(commerce.products || {})
    const handles = new Set()
    for (const bucket of buckets) {
      if (!Array.isArray(bucket)) continue
      for (const product of bucket) {
        if (product?.handle) handles.add(String(product.handle))
      }
    }
    return Array.from(handles).map((handle) => `products/${handle}`)
  } catch {
    return []
  }
}

function copyIndexToRoute(indexPath, dir, route) {
  const cleanRoute = String(route || '').replace(/^\/+|\/+$/g, '')
  if (!cleanRoute || cleanRoute.includes('..')) return

  const routeDir = join(dir, ...cleanRoute.split('/'))
  mkdirSync(routeDir, { recursive: true })
  copyFileSync(indexPath, join(routeDir, 'index.html'))
}

for (const dir of buildDirs) {
  if (!existsSync(dir)) continue

  for (const blocked of ['.git', '.github', '.DS_Store']) {
    rmSync(join(dir, blocked), { force: true, recursive: true })
  }

  const indexPath = join(dir, 'index.html')
  const fallbackPath = join(dir, '404.html')
  if (existsSync(indexPath)) {
    copyFileSync(indexPath, fallbackPath)
    for (const route of [...staticSpaRoutes, ...productRoutes()]) {
      copyIndexToRoute(indexPath, dir, route)
    }
  }
}
