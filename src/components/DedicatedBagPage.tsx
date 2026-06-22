import LuxuryBags from './LuxuryBags'

type DedicatedBagPageProps = {
  initialBrand: string
}

export default function DedicatedBagPage({ initialBrand }: DedicatedBagPageProps) {
  return (
    <main>
      <h1 className="sr-only">Catalogo Luxury Bags Ruzza</h1>
      <LuxuryBags mode="full" initialBrand={initialBrand} />
    </main>
  )
}
