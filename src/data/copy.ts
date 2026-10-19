import { assets } from "@/data/assets"
import { routes } from "@/routes"

/*
 * Marketing and UX copy in one place, ported byte-for-byte from js/amk-copy.js.
 * Product rules: never promise professional outcomes, always label paid
 * placement "Sponsored", apply (never "book"). Components import from here;
 * strings are never repeated inline in JSX.
 */

export const BRAND = {
  name: "Golafly Academy",
  tagline: "Find. Compare. Apply. Join.",
  oneLiner:
    "The marketplace for football academy programs. Clubs and academies list their programs; families compare them and apply in one place.",
}

export const NAV = {
  links: [
    { href: routes.academies(), label: "Find academies" },
    {
      href: routes.homeSection("how-it-works"),
      label: "How it works",
    },
    {
      href: routes.homeSection("verification"),
      label: "Trust & verification",
    },
    {
      href: routes.homeSection("for-academies"),
      label: "For academies",
    },
  ],
  listCta: "List your academy",
}

export const HERO = {
  eyebrow: "Golafly Academy · Football academy marketplace",
  titleA: "Find your",
  titleB: "football academy.",
  lead: "Compare verified academy programs across Europe by age, start date and fees — then apply to join and track the decision in one place.",
  searchHint:
    "Pick an age and start date for programs the player can actually join.",
  popularLabel: "Popular",
  popular: [
    { label: "Spain", country: "ES" },
    { label: "Portugal", country: "PT" },
    { label: "United Kingdom", country: "GB" },
    { label: "Germany", country: "DE" },
    { label: "Italy", country: "IT" },
    { label: "France", country: "FR" },
  ],
  photo: assets.home.heroStadium,
  photoAlt: "A player in Golafly kit on a floodlit stadium pitch",
}

export const TRUST = [
  {
    icon: "shieldcheck",
    title: "Verified academies",
    sub: "Documents checked before a program goes live",
  },
  {
    icon: "receipt",
    title: "Transparent fees",
    sub: "Registration, deposit and balance shown up front",
  },
  {
    icon: "track",
    title: "Apply and track in one place",
    sub: "One player profile, every application",
  },
  {
    icon: "star",
    title: "Reviews from enrolled families",
    sub: "Only verified enrollments can review",
  },
] as const

export const HOW = {
  eyebrow: "How it works",
  title: "From first search to first session.",
  steps: [
    {
      n: "01",
      title: "Search",
      text: "Filter by location, the player’s age, program type, start date and fees.",
    },
    {
      n: "02",
      title: "Compare",
      text: "See schedules, what’s included, requirements and verified reviews side by side.",
    },
    {
      n: "03",
      title: "Apply to Join",
      text: "Send one reusable player profile, answer the academy’s questions and upload documents.",
    },
    {
      n: "04",
      title: "Enroll",
      text: "The academy decides. You only pay the deposit after a place is offered.",
    },
  ],
}

export const VERIFY = {
  eyebrow: "Trust & verification",
  title: "What the Golafly badge means.",
  lead: "Verification is based on documents we check, not on a judgment of sporting quality.",
  badges: [
    {
      key: "verified",
      title: "Golafly Verified",
      points: [
        "Registered legal entity",
        "Identity of the academy director",
        "Named safeguarding lead and policy",
        "Facility and insurance documents",
      ],
    },
    {
      key: "club",
      title: "Club Academy",
      points: [
        "Everything in Golafly Verified",
        "An official affiliation with the club, documented by Golafly",
      ],
    },
    {
      key: "pending",
      title: "Verification pending",
      points: [
        "New academies can list while checks finish",
        "Clearly marked until verification is complete",
      ],
    },
  ],
  disclaimer:
    "Admission decisions belong to each academy. Golafly doesn’t operate academies and can’t promise selection, contracts or transfers.",
}

export const HOST_BAND = {
  eyebrow: "For clubs & academies",
  title: "List your academy. Reach families who are ready to apply.",
  lead: "Publish programs with start dates, fees and requirements. Review applications, request information, accept players and collect enrollment payments from one dashboard.",
  bullets: [
    "Create a listing in 10 guided steps, with a live preview",
    "Review applicants with their full player profile and documents",
    "Collect deposits and balances with a configurable schedule",
  ],
  cta: "List your academy",
  ctaHref: routes.register("academy"),
  secondary: "See the academy dashboard",
  secondaryHref: routes.club.dashboard,
  image: assets.academies.fieldGoal,
  imageAlt: "An empty goal on a training pitch at dusk",
}

export const TRAVEL = {
  titleA: "Accepted? Get there with",
  titleBrand: "Golafly Travel",
  lead: "After a place is confirmed, plan the trip in one handoff.",
  items: [
    { icon: "plane", label: "Flights", href: routes.site.travelFlights },
    { icon: "bed", label: "Hotels", href: routes.site.travelStays },
    { icon: "sim", label: "eSIM", href: routes.site.travelEsim },
    { icon: "car", label: "Transfers", href: routes.site.travel },
    { icon: "umbrella", label: "Travel insurance", href: routes.site.travel },
  ],
  cta: "Explore Golafly Travel",
  href: routes.site.travel,
  image: assets.home.travelPlane,
  imageAlt: "Aircraft wing above the clouds",
}

export const VOICE = {
  quote:
    "We compared four academies in one evening, applied to two, and knew exactly what we’d pay before anyone asked for a deposit.",
  name: "Amara O.",
  role: "Parent of a U16 player · Manchester",
  tag: "Verified enrollment",
  image: assets.academies.cardStudio,
  imageAlt: "A young player in Golafly training kit",
  nextTitle: "Build one player profile. Use it for every application.",
  nextSub:
    "Save academies, apply in minutes and follow every decision from your dashboard.",
  primary: {
    label: "Create a family account",
    href: routes.register("family"),
  },
  secondary: {
    label: "List your academy",
    href: routes.register("academy"),
  },
}

export const FOOTER = {
  blurb:
    "Find, compare and apply to football academy programs. A Golafly product.",
  cols: [
    {
      title: "Families",
      links: [
        { label: "Find academies", href: routes.academies() },
        {
          label: "Residential academies",
          href: routes.academies({ type: "residential" }),
        },
        {
          label: "Football & education",
          href: routes.academies({ type: "school" }),
        },
        {
          label: "Saved academies",
          href: routes.family.saved,
        },
      ],
    },
    {
      title: "Academies",
      links: [
        {
          label: "List your academy",
          href: routes.register("academy"),
        },
        {
          label: "Academy dashboard",
          href: routes.club.dashboard,
        },
        {
          label: "Verification criteria",
          href: routes.homeSection("verification"),
        },
      ],
    },
    {
      title: "Golafly",
      links: [
        { label: "Golafly.com", href: routes.site.golafly },
        { label: "Golafly Travel", href: routes.site.travel },
        { label: "Help centre", href: routes.site.helpCentre },
        { label: "Terms", href: routes.site.terms },
        { label: "Privacy", href: routes.site.privacy },
      ],
    },
  ],
  bottomLeft: "© Golafly · Academy marketplace prototype",
  bottomRight: "Prices in EUR · Sample data · No real applications",
}

export const EMPTY = {
  search: {
    title: "No programs match these filters",
    text: "Try another start date, widen the price range or clear a filter to see more academies.",
    cta: "Clear all filters",
  },
  saved: {
    title: "No saved academies yet",
    text: "Tap the heart on any program to keep it here while you compare.",
    cta: "Find academies",
  },
  applications: {
    title: "No applications here",
    text: "Applications you start or send will appear in this list.",
    cta: "Find academies",
  },
  messages: {
    title: "No conversations yet",
    text: "Each application has its own thread with the academy.",
    cta: "Go to applications",
  },
  payments: {
    title: "No payments yet",
    text: "You only pay after an academy offers a place.",
    cta: "Go to applications",
  },
  hostApps: {
    title: "No applications in this stage",
    text: "New applications appear here as soon as a family submits.",
    cta: "View all applications",
  },
  notifications: {
    title: "You’re all caught up",
    text: "Decisions, requests and messages will show up here.",
  },
}

export const DEMO_NOTE =
  "This is a live prototype with sample data. Nothing is sent and no payment is taken."

/*
 * Infrastructure copy: NOT in the prototype. The prototype has no page-not-found,
 * crash or retry states, so these few strings are new. Everything else in this
 * file comes from js/amk-copy.js. "Back to the marketplace" is the prototype's
 * own button label (Gate in js/amk-shell.jsx).
 */
export const INFRA = {
  notFound: {
    title: "Page not found",
    text: "The link may be incomplete, or the page may have moved.",
    cta: "Back to the marketplace",
  },
  error: {
    title: "Something went wrong",
    text: "Please try again. If it keeps happening, come back in a little while.",
    cta: "Try again",
  },
  loading: "Loading",
} as const
