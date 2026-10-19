"use client"

import {
  HostBand,
  HowItWorks,
  TravelBand,
  VerifyBand,
  Voice,
} from "@/components/home/home-bands"
import { FeaturedPrograms } from "@/components/home/featured-programs"
import { HomeHero } from "@/components/home/home-hero"
import { TypeTiles } from "@/components/home/type-tiles"
import { UpcomingIntakes } from "@/components/home/upcoming-intakes"

/* Home (index.html): one job, "Find your football academy". */
export function HomeClient() {
  return (
    <>
      <HomeHero />
      <TypeTiles />
      <FeaturedPrograms />
      <UpcomingIntakes />
      <HowItWorks />
      <VerifyBand />
      <HostBand />
      <TravelBand />
      <Voice />
    </>
  )
}
