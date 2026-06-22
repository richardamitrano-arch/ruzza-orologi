import {
  availabilityLabel,
  cleanProductTitle,
  formatCommercePrice,
  shortDescription,
  type CommerceProduct,
} from '../data/commerce'

type ProductCardProps = {
  product: CommerceProduct
  dense?: boolean
  showDescription?: boolean
  priority?: boolean
}

export default function ProductCard({ product, dense = false, showDescription = true, priority = false }: ProductCardProps) {
  return (
    <a
      href={product.url}
      target="_blank"
      rel="noreferrer"
      className="group block min-w-0"
      data-product-handle={product.handle}
      data-product-category={product.category}
      data-product-brand={product.brand}
    >
      <div className={`relative overflow-hidden bg-ink-800 ${dense ? 'aspect-[4/5]' : 'aspect-[4/5]'}`}>
        {product.featuredImage ? (
          <img
            src={product.featuredImage}
            alt={product.altText || cleanProductTitle(product.title)}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-expo group-hover:scale-[1.055]"
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(47,176,137,0.2),transparent_55%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/15 to-transparent" />
        <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-ink/65 px-3 py-1.5 backdrop-blur-sm">
          <p className="data text-[0.62rem] uppercase tracking-[0.14em] text-bone/75">
            {availabilityLabel(product)}
          </p>
        </div>
        <p className="data absolute bottom-4 left-4 rounded-full border border-champagne/35 bg-ink/75 px-3 py-1.5 text-sm text-champagne backdrop-blur-sm">
          {formatCommercePrice(product)}
        </p>
      </div>

      <div className={dense ? 'pt-4' : 'pt-5'}>
        <p className="label text-malachite-bright">{product.brand}</p>
        <p className={`${dense ? 'text-base' : 'text-lg'} mt-2 font-display leading-snug text-bone`}>
          {cleanProductTitle(product.title)}
        </p>
        {showDescription && (
          <p className="mt-3 line-clamp-3 font-sans text-sm font-light leading-relaxed text-bone-muted">
            {shortDescription(product, dense ? 110 : 155)}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {product.sku && (
            <span className="data rounded-full border border-white/10 px-2.5 py-1 text-[0.58rem] uppercase text-bone-faint">
              SKU {product.sku}
            </span>
          )}
          <span className="data rounded-full border border-white/10 px-2.5 py-1 text-[0.58rem] uppercase text-bone-faint">
            {product.variants.length} var.
          </span>
        </div>
      </div>
    </a>
  )
}
