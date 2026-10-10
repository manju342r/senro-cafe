type BrandLogoProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'hero'
  showWordmark?: boolean
}

const SIZES = {
  sm: 'h-11 w-auto',
  md: 'h-12 w-auto sm:h-14',
  lg: 'h-16 w-auto',
  hero: 'h-32 w-auto sm:h-40',
} as const

export function BrandLogo({ className = '', size = 'md', showWordmark = false }: BrandLogoProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src="/logo.png"
        alt="Maña Katha Café"
        width={225}
        height={225}
        decoding="async"
        className={`${SIZES[size]} object-contain`}
      />
      {showWordmark ? (
        <span className="hidden min-w-0 sm:block">
          <span className="block font-display text-[1.45rem] font-semibold leading-none tracking-tight text-leaf sm:text-[1.7rem]">
            Maña Katha
          </span>
          <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.24em] text-steam sm:text-[11px]">
            Rooftop café · Hyd
          </span>
        </span>
      ) : null}
    </span>
  )
}
