"use client"

import { PageHeading } from "@/components/layout/page-heading"
import { LiveInbox } from "@/components/messages/live-inbox"
import { Inbox } from "@/components/shared/inbox"
import { ButtonLink } from "@/components/ui/button-link"
import { CLUB } from "@/data/club-copy"
import { useClubInbox } from "@/features/club/hooks"
import { isLive } from "@/lib/data-source"
import { routes } from "@/routes"

/* Academy messages (host/messages.html?thread=): one conversation per application */
export function ClubMessagesClient({ thread }: { thread: string | null }) {
  return isLive("messages") ? (
    <LiveMessages thread={thread} />
  ) : (
    <DemoMessages thread={thread} />
  )
}

function DemoMessages({ thread }: { thread: string | null }) {
  const { rows, author } = useClubInbox()
  const t = CLUB.messages
  return (
    <>
      <PageHeading title={t.title} subtitle={t.subtitle} />
      <Inbox
        rows={rows}
        me="academy"
        meName={author}
        hrefApp={routes.club.applicant}
        initialThread={thread}
        emptyCta={
          <ButtonLink href={routes.club.applications} variant="primary">
            {t.openApplications}
          </ButtonLink>
        }
      />
    </>
  )
}

/* api mode: week 2 part 2, section 14 (the academy's conversations) */
function LiveMessages({ thread }: { thread: string | null }) {
  const t = CLUB.messages
  return (
    <>
      <PageHeading title={t.title} subtitle={t.subtitle} />
      <LiveInbox
        side="portal"
        hrefApp={routes.club.applicant}
        initialThread={thread}
        emptyCta={
          <ButtonLink href={routes.club.applications} variant="primary">
            {t.openApplications}
          </ButtonLink>
        }
      />
    </>
  )
}
