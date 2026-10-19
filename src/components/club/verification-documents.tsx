"use client"

import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"

import { Icon } from "@/components/icons/icon"
import { DocItem, DocList } from "@/components/shared/doc-list"
import { FormField } from "@/components/shared/form-field"
import { NativeSelect } from "@/components/shared/native-select"
import { notify, notifyError } from "@/components/shared/notify"
import { StatusPill } from "@/components/shared/status-pill"
import { Button } from "@/components/ui/button"
import { LIVE } from "@/data/live-copy"
import {
  getOptions,
  getVerification,
  uploadVerificationDocuments,
  verificationDocumentPath,
  type ApiVerificationDocument,
} from "@/features/club/api"
import { clubKeys } from "@/features/club/query-keys"
import { downloadPrivateFile } from "@/features/family/api"

const t = LIVE.verificationDocs
const FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"]
const MAX_BYTES = 10 * 1024 * 1024

const typeLabel = (type: string) =>
  t.types[type] ?? type.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase())

const tone = (d: ApiVerificationDocument) =>
  d.status === "accepted"
    ? "success"
    : d.status === "rejected"
      ? "warning"
      : "ghost"

/*
 * Verification documents (week 1 part 2, section 11). Golafly verifies
 * academies offline in the MVP, so this card renders NOTHING until
 * GET /academy/portal/options returns verification_documents_enabled: true.
 * Then it appears by itself, with no frontend release: the documents already
 * sent (status, the admin's note, download with the token) and an upload
 * (POST …/verification, multipart documents[i][type|file]).
 */
export function VerificationDocuments({
  academyId,
  status,
}: {
  academyId: number
  status: string
}) {
  const queryClient = useQueryClient()
  const options = useQuery({
    queryKey: clubKeys.options(),
    queryFn: getOptions,
    staleTime: Infinity,
  })
  const enabled = options.data?.verification_documents_enabled === true
  const verification = useQuery({
    queryKey: clubKeys.verification(academyId),
    queryFn: () => getVerification(academyId),
    enabled,
  })
  const [type, setType] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)

  if (!enabled) return null
  const docs = verification.data?.documents ?? []
  const types = options.data?.verification_document_types ?? []
  // an approved academy cannot upload (the backend refuses with 422)
  const canUpload = status === "pending" || status === "rejected"

  const send = async () => {
    const e: Record<string, string> = {}
    if (!type) e["vdoc-type"] = t.chooseType
    if (!file) e["vdoc-file"] = t.chooseFile
    setErrors(e)
    if (Object.keys(e).length || !file) return
    setBusy(true)
    try {
      const saved = await uploadVerificationDocuments(academyId, [
        { type, file },
      ])
      queryClient.setQueryData(clubKeys.verification(academyId), saved)
      setType("")
      setFile(null)
      notify(t.uploaded)
    } catch {
      // the backend's message is shown by the error toast
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-4 grid gap-3 border-t border-border-1 pt-4">
      <p className="text-fs-14 font-semibold text-fg-1">{t.title}</p>
      {docs.length ? (
        <DocList>
          {docs.map((d) => (
            <DocItem
              key={d.id}
              icon="doc"
              title={typeLabel(d.type)}
              sub={[d.original_name, d.note].filter(Boolean).join(" · ")}
              trailing={
                <span className="flex flex-wrap items-center gap-1.5">
                  <StatusPill tone={tone(d)}>
                    {t.status[d.status] ?? d.status}
                  </StatusPill>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      downloadPrivateFile(
                        verificationDocumentPath(academyId, d.id),
                        d.original_name
                      ).catch(() => undefined)
                    }
                  >
                    <Icon name="download" size={14} />{" "}
                    {LIVE.application.download}
                  </Button>
                </span>
              }
            />
          ))}
        </DocList>
      ) : (
        <p className="text-fs-13 text-fg-3">{t.none}</p>
      )}
      {canUpload ? (
        <form
          noValidate
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            void send()
          }}
        >
          <p className="text-fs-13 text-fg-3">{t.lead}</p>
          <FormField
            id="vdoc-type"
            label={t.type}
            required
            error={errors["vdoc-type"]}
          >
            {(p) => (
              <NativeSelect
                {...p}
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="">{t.chooseType}</option>
                {types.map((x) => (
                  <option key={x} value={x}>
                    {typeLabel(x)}
                  </option>
                ))}
              </NativeSelect>
            )}
          </FormField>
          <FormField
            id="vdoc-file"
            label={t.file}
            required
            error={errors["vdoc-file"]}
          >
            {(p) => (
              <input
                {...p}
                type="file"
                accept={FILE_TYPES.join(",")}
                className="text-fs-13 text-fg-2"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null
                  if (
                    f &&
                    (!FILE_TYPES.includes(f.type) || f.size > MAX_BYTES)
                  ) {
                    notifyError(t.lead)
                    e.target.value = ""
                    setFile(null)
                    return
                  }
                  setFile(f)
                }}
              />
            )}
          </FormField>
          <Button
            type="submit"
            size="sm"
            className="justify-self-start"
            aria-busy={busy}
          >
            <Icon name="upload" size={14} /> {t.upload}
          </Button>
        </form>
      ) : null}
    </div>
  )
}
