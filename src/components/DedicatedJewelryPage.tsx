import JewelryCatalog from './JewelryCatalog'

type DedicatedJewelryPageProps = {
  initialBrand: string
}

export default function DedicatedJewelryPage({ initialBrand }: DedicatedJewelryPageProps) {
  return (
    <main>
      <h1 className="sr-only">Catalogo Gioielli Ruzza</h1>
      <JewelryCatalog mode="full" initialBrand={initialBrand} />
    </main>
  )
}
