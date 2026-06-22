import WatchCatalog from './WatchCatalog'

type DedicatedWatchPageProps = {
  initialBrand: string
}

export default function DedicatedWatchPage({ initialBrand }: DedicatedWatchPageProps) {
  return (
    <main>
      <h1 className="sr-only">Catalogo orologi Ruzza</h1>
      <WatchCatalog mode="full" initialBrand={initialBrand} />
    </main>
  )
}
