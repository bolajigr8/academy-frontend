import type { Metadata } from "next"

import { HOME } from "@/data/home-copy"

import { HomeClient } from "./client"

export const metadata: Metadata = {
  title: HOME.title,
  description: HOME.description,
}

export default function HomePage() {
  return <HomeClient />
}
