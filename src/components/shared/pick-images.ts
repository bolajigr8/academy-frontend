import { notifyError } from "@/components/shared/notify"
import { LIVE } from "@/data/live-copy"
import { formatSize, screenImages } from "@/lib/images"

/**
 * The files from an image picker that can be sent. Refused ones are named in
 * an error toast: the wrong type, or larger than 600 KB (with the file's size).
 */
export function pickImages(files: FileList | File[] | null): File[] {
  const { ok, wrongType, tooBig } = screenImages(Array.from(files ?? []))
  if (tooBig.length === 1)
    notifyError(
      LIVE.editor.imageTooBig(tooBig[0].name, formatSize(tooBig[0].size))
    )
  else if (tooBig.length > 1)
    notifyError(LIVE.editor.imagesTooBig(tooBig.length))
  else if (wrongType.length) notifyError(LIVE.editor.imageType)
  return ok
}
