import type { Metadata } from "next"

import { ClubApplicantClient } from "./client"

export const metadata: Metadata = { title: "Applicant · Academy" }

export default async function ClubApplicantPage({
  params,
}: PageProps<"/club/applicants/[id]">) {
  const { id } = await params
  return <ClubApplicantClient key={id} id={id} />
}
