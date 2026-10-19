/*
 * Image uploads (week 1 part 1, section 1: JPEG, PNG or WebP). A server
 * refuses a request above its upload size without telling Laravel: the file
 * is dropped silently and the backend keeps its default image. So every image
 * is checked here, before anything is sent, against the limit the team set
 * (600 KB), and uploaded in a request of its own.
 */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
export const MAX_IMAGE_BYTES = 600 * 1024

export function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/** Splits picked files into the ones that can be sent and the ones refused (and why) */
export function screenImages(files: File[]): {
  ok: File[]
  wrongType: File[]
  tooBig: File[]
} {
  const wrongType = files.filter((f) => !IMAGE_TYPES.includes(f.type))
  const typed = files.filter((f) => IMAGE_TYPES.includes(f.type))
  const tooBig = typed.filter((f) => f.size > MAX_IMAGE_BYTES)
  const ok = typed.filter((f) => f.size <= MAX_IMAGE_BYTES)
  return { ok, wrongType, tooBig }
}
