import { EmptyState } from "@/components/shared/empty-state"
import { ButtonLink } from "@/components/ui/button-link"
import { INFRA } from "@/data/copy"
import { routes } from "@/routes"

/* Infrastructure, not in the prototype. Built from AmEmpty, with the prototype's own button label. */
export default function NotFound() {
  return (
    <main id="main" className="am-container py-16">
      <EmptyState
        icon="search"
        title={INFRA.notFound.title}
        text={INFRA.notFound.text}
        cta={
          <ButtonLink href={routes.home} variant="primary">
            {INFRA.notFound.cta}
          </ButtonLink>
        }
      />
    </main>
  )
}
