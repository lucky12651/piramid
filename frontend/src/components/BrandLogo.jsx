import { cn } from '../lib/utils'

/** Piramid mark — isometric lime pyramid. */
export function PiramidMark({ size = 34, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <path d="M18 4 L32 30 H18 Z" fill="#d7f24c" />
      <path d="M18 4 L4 30 H18 Z" fill="#9aaf28" />
      <path d="M18 4 L18 30" stroke="#12160f" strokeWidth="1.2" opacity="0.28" />
      <path d="M6.5 26.5 H29.5" stroke="#12160f" strokeWidth="1" opacity="0.18" />
    </svg>
  )
}

export function VortexMark(props) {
  return <PiramidMark {...props} />
}

export default function BrandLogo({
  size = 32,
  className = '',
  rounded = 'rounded-lg',
  withBg = false,
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        rounded,
        withBg && 'bg-white/10 ring-1 ring-black/10',
        className
      )}
      style={{ width: size, height: size }}
    >
      <PiramidMark size={size} />
    </span>
  )
}
