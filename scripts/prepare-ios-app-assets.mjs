import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const copies = [
  ['resources/ios/ruzza-watch-icon-1024.png', 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png'],
  ['resources/ios/ruzza-watch-splash-2732.png', 'ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png'],
  ['resources/ios/ruzza-watch-splash-2732.png', 'ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png'],
  ['resources/ios/ruzza-watch-splash-2732.png', 'ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png'],
]

for (const [source, destination] of copies) {
  if (!existsSync(source)) {
    throw new Error(`Missing iOS app asset: ${source}`)
  }
  mkdirSync(dirname(destination), { recursive: true })
  copyFileSync(source, destination)
}
