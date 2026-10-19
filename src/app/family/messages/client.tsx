"use client"

import { PageHeading } from "@/components/layout/page-heading"
import { LiveInbox } from "@/components/messages/live-inbox"
import { Inbox } from "@/components/shared/inbox"
import { ButtonLink } from "@/components/ui/button-link"
import { FAMILY } from "@/data/family-copy"
import { useFamilyInbox } from "@/features/family/hooks"
import { isLive } from "@/lib/data-source"
import { routes } from "@/routes"

/* Family messages (account/messages.html): one conversation per application */
export function FamilyMessagesClient({ thread }: { thread: string | null }) {
  return isLive("messages") ? (
    <LiveMessages thread={thread} />
  ) : (
    <DemoMessages thread={thread} />
  )
}

function DemoMessages({ thread }: { thread: string | null }) {
  const { rows, author } = useFamilyInbox()
  const t = FAMILY.messages
  return (
    <>
      <PageHeading title={t.title} subtitle={t.subtitle} />
      <Inbox
        rows={rows}
        me="family"
        meName={author}
        hrefApp={routes.family.application}
        initialThread={thread}
        emptyCta={
          <ButtonLink href={routes.family.applications}>
            {t.goToApplications}
          </ButtonLink>
        }
      />
    </>
  )
}

/* api mode: week 2 part 2, section 14 (the family's conversations) */
function LiveMessages({ thread }: { thread: string | null }) {
  const t = FAMILY.messages
  return (
    <>
      <PageHeading title={t.title} subtitle={t.subtitle} />
      <LiveInbox
        side="me"
        hrefApp={routes.family.application}
        initialThread={thread}
        emptyCta={
          <ButtonLink href={routes.family.applications}>
            {t.goToApplications}
          </ButtonLink>
        }
      />
    </>
  )
}
