"use client"

import { useState } from "react"

import { FormField } from "@/components/shared/form-field"
import { FormRow } from "@/components/shared/form-row"
import { Modal } from "@/components/shared/modal"
import { NativeSelect } from "@/components/shared/native-select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { LEVELS } from "@/data/catalog"
import { FAMILY } from "@/data/family-copy"
import type { LevelId } from "@/data/types"
import { updatePlayer } from "@/features/applications/actions"
import type { Player } from "@/features/applications/types"

type Props = {
  open: boolean
  onClose: () => void
  player: Player
  onSaved: () => void
}

/* EditModal (account/players.html): the player's football profile */
export function PlayerEditDialog(props: Props) {
  return props.open ? <PlayerEditForm key={props.player.id} {...props} /> : null
}

/* Mounted on each open, so the fields start from the saved profile. */
function PlayerEditForm({ onClose, player, onSaved }: Props) {
  const t = FAMILY.editPlayer
  const [v, setV] = useState({
    position: player.position,
    foot: player.foot,
    heightCm: player.heightCm ? String(player.heightCm) : "",
    currentClub: player.currentClub,
    level: player.level,
    bio: player.bio || "",
  })
  const [err, setErr] = useState<{ club?: string; height?: string }>({})
  const up = (k: keyof typeof v) => (e: { target: { value: string } }) =>
    setV({ ...v, [k]: e.target.value })
  const save = () => {
    const e: { club?: string; height?: string } = {}
    if (!v.currentClub.trim()) e.club = t.clubError
    if (v.heightCm && (+v.heightCm < 120 || +v.heightCm > 215))
      e.height = t.heightError
    setErr(e)
    if (Object.keys(e).length) return
    updatePlayer(player.id, {
      position: v.position,
      foot: v.foot,
      heightCm: v.heightCm ? +v.heightCm : 0,
      currentClub: v.currentClub,
      level: v.level as LevelId,
      bio: v.bio,
    })
    onClose()
    onSaved()
  }
  return (
    <Modal
      open
      onClose={onClose}
      title={t.title(player.firstName)}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button onClick={save}>{t.save}</Button>
        </>
      }
    >
      <FormRow>
        <FormField id="amk-e-pos" label={t.position} required>
          {(a) => (
            <Input
              {...a}
              value={v.position}
              onChange={up("position")}
              data-autofocus
            />
          )}
        </FormField>
        <FormField id="amk-e-foot" label={t.foot} required>
          {(a) => (
            <NativeSelect {...a} value={v.foot} onChange={up("foot")}>
              {t.feet.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </NativeSelect>
          )}
        </FormField>
      </FormRow>
      <FormRow>
        <FormField id="amk-e-club" label={t.club} required error={err.club}>
          {(a) => (
            <Input {...a} value={v.currentClub} onChange={up("currentClub")} />
          )}
        </FormField>
        <FormField id="amk-e-height" label={t.height} error={err.height}>
          {(a) => (
            <Input
              {...a}
              inputMode="numeric"
              value={v.heightCm}
              onChange={up("heightCm")}
            />
          )}
        </FormField>
      </FormRow>
      <FormField id="amk-e-level" label={t.level}>
        {(a) => (
          <NativeSelect {...a} value={v.level} onChange={up("level")}>
            {LEVELS.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
          </NativeSelect>
        )}
      </FormField>
      <FormField id="amk-e-bio" label={t.bio}>
        {(a) => (
          <Textarea {...a} value={v.bio} onChange={up("bio")} maxLength={600} />
        )}
      </FormField>
    </Modal>
  )
}
