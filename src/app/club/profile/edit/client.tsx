"use client"

import { AcademyForm, OrganizationForm } from "@/components/club/profile-forms"
import { PageHeading } from "@/components/layout/page-heading"
import { Grid2 } from "@/components/shared/page-grid"
import { QueryState } from "@/components/shared/query-state"
import { LIVE } from "@/data/live-copy"
import { useCountries } from "@/features/auth/hooks"
import { useProfileFormData } from "@/features/club/hooks"

/*
 * Edit profile (api mode). GET /organization and /academies, countries from
 * GET /countries; saves with POST /organization and POST /academies[/{id}].
 */
export function EditProfileClient() {
  const query = useProfileFormData()
  const countries = useCountries()
  const t = LIVE.profileForm
  return (
    <>
      <PageHeading title={t.pageTitle} subtitle={t.pageSubtitle} />
      <QueryState
        query={query}
        errorFallback={LIVE.requestFailed}
        // never empty: an organization with no academy gets the create form
        empty={null}
        skeleton={
          <div className="grid grid-cols-2 gap-[clamp(20px,2.4vw,28px)] le-1024:grid-cols-1">
            <div className="h-[560px] animate-pulse rounded-lg bg-bg-2" />
            <div className="h-[560px] animate-pulse rounded-lg bg-bg-2" />
          </div>
        }
      >
        {({ org, academy }) =>
          countries ? (
            <Grid2>
              <AcademyForm
                academy={academy}
                defaultCountry={org.country_code}
                countries={countries}
              />
              <OrganizationForm org={org} countries={countries} />
            </Grid2>
          ) : (
            <div className="h-[560px] animate-pulse rounded-lg bg-bg-2" />
          )
        }
      </QueryState>
    </>
  )
}
