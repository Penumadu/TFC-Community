import { clsx } from 'clsx'
import { Star } from 'lucide-react'

// ─── StarRating ───────────────────────────────────────────────────────────────
interface StarRatingProps {
  rating: number       // 0–5, supports decimals
  maxStars?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  reviewCount?: number
  interactive?: boolean
  onRate?: (rating: number) => void
  className?: string
}

const starSizes = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
}

export function StarRating({
  rating,
  maxStars = 5,
  size = 'md',
  showValue = true,
  reviewCount,
  interactive = false,
  onRate,
  className,
}: StarRatingProps) {
  const stars = Array.from({ length: maxStars }, (_, i) => {
    const filled = i < Math.floor(rating)
    const partial = !filled && i < rating
    return { filled, partial, index: i + 1 }
  })

  return (
    <div
      className={clsx('flex items-center gap-1', className)}
      role={interactive ? 'radiogroup' : undefined}
      aria-label={`Rating: ${rating.toFixed(1)} out of ${maxStars} stars`}
    >
      {stars.map(({ filled, partial, index }) => (
        <button
          key={index}
          type="button"
          role={interactive ? 'radio' : undefined}
          aria-checked={interactive ? index === Math.round(rating) : undefined}
          aria-label={interactive ? `${index} star${index !== 1 ? 's' : ''}` : undefined}
          onClick={interactive && onRate ? () => onRate(index) : undefined}
          className={clsx(
            interactive
              ? 'cursor-pointer hover:scale-110 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded'
              : 'cursor-default pointer-events-none'
          )}
        >
          <Star
            className={clsx(
              starSizes[size],
              'transition-colors',
              filled
                ? 'fill-primary text-primary'
                : partial
                ? 'fill-primary/50 text-primary'
                : 'fill-transparent text-gray-300'
            )}
          />
        </button>
      ))}
      {showValue && (
        <span className="text-sm font-semibold text-text ml-0.5">
          {rating.toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span className="text-sm text-text-muted">
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </div>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────
type BadgeVariant = 'gold' | 'teal' | 'green' | 'orange' | 'gray' | 'red'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  icon?: React.ReactNode
  className?: string
}

const badgeVariants: Record<BadgeVariant, string> = {
  gold:   'bg-yellow-100 text-yellow-800 border border-yellow-300',
  teal:   'bg-secondary/10 text-secondary border border-secondary/20',
  green:  'bg-success/10 text-success border border-success/20',
  orange: 'bg-primary-50 text-primary-dark border border-primary-200',
  gray:   'bg-gray-100 text-gray-700 border border-gray-200',
  red:    'bg-danger/10 text-danger border border-danger/20',
}

export function Badge({ children, variant = 'gray', icon, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold',
        badgeVariants[variant],
        className
      )}
    >
      {icon && <span aria-hidden="true" className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode
  className?: string
  elevated?: boolean
  hover?: boolean
  onClick?: () => void
  as?: 'div' | 'article' | 'section' | 'li'
}

export function Card({
  children,
  className,
  elevated = false,
  hover = false,
  onClick,
  as: Tag = 'div',
}: CardProps) {
  return (
    <Tag
      onClick={onClick}
      className={clsx(
        'bg-surface rounded-card border border-gray-100 overflow-hidden',
        elevated ? 'shadow-elevated' : 'shadow-card',
        hover && 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </Tag>
  )
}

// ─── Skeleton Loader ───────────────────────────────────────────────────────────
interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  if (lines === 1) {
    return (
      <div
        className={clsx(
          'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-md animate-pulse',
          className
        )}
      />
    )
  }
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={clsx(
            'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-md h-4 animate-pulse',
            i === lines - 1 && 'w-2/3',
            className
          )}
        />
      ))}
    </div>
  )
}

// ─── Status Dot ───────────────────────────────────────────────────────────────
type StatusType = 'available' | 'emergency_available' | 'busy' | 'offline'

const statusConfig: Record<StatusType, { color: string; label: string }> = {
  available:           { color: 'bg-success',  label: 'Available' },
  emergency_available: { color: 'bg-primary animate-pulse', label: 'Emergency Available' },
  busy:                { color: 'bg-warning',  label: 'Busy' },
  offline:             { color: 'bg-gray-400', label: 'Offline' },
}

export function StatusDot({ status }: { status: StatusType }) {
  const { color, label } = statusConfig[status]
  return (
    <span
      className={clsx('inline-block w-2.5 h-2.5 rounded-full', color)}
      role="img"
      aria-label={label}
      title={label}
    />
  )
}

// ─── VSC Verified Badge ────────────────────────────────────────────────────────
export function VscBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="gold"
      icon={
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
        </svg>
      }
      className={clsx('font-bold tracking-wide', className)}
    >
      VSC Verified
    </Badge>
  )
}

// ─── Community Vouched Badge ───────────────────────────────────────────────────
export function VouchedBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="green"
      icon={
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
        </svg>
      }
      className={className}
    >
      Community Vouched
    </Badge>
  )
}
