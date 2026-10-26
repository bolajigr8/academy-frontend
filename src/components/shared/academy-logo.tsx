import { ClubCrest } from "@/components/shared/club-crest"
import { SafeImage } from "@/components/shared/safe-image"
import { crestFor } from "@/features/academies/search"

/**
 * An academy's own logo (logo_url from the backend) when it has one; the
 * initials badge only when it has none (or the image fails to load).
 */
export function AcademyLogo({
  id,
  name,
  logoUrl,
  size = 40,
}: {
  id: string | number
  name: string
  logoUrl?: string | null
  size?: number
}) {
  const badge = (
    <ClubCrest crest={crestFor({ id: String(id), name })} size={size} />
  )
  if (!logoUrl) return badge
  return (
    <span
      className="relative flex-none overflow-hidden rounded-md bg-bg-3"
      style={{ width: size, height: size }}
    >
      <SafeImage
        src={logoUrl}
        alt=""
        fill
        sizes={`${size}px`}
        className="object-contain"
      />
    </span>
  )
}
