/*
 * Home page strings that the prototype writes inline in js/amk-ui.jsx (AmSearchBar,
 * AmHero, AmTypeTiles, AmFeatured, AmIntakes, AmHostBand). Verbatim. The rest of the
 * home copy is in copy.ts (amk-copy.js).
 */
export const HOME = {
  title: "Find your football academy",
  description:
    "Golafly Academy — compare verified football academy programs across Europe by age, start date and fees, then apply to join and track the decision in one place.",
  search: {
    label: "Find academy programs",
    location: "Location",
    locationPlaceholder: "City, country or academy",
    age: "Player age",
    anyAge: "Any age",
    years: "years",
    type: "Program type",
    allTypes: "All types",
    start: "Start",
    duration: "Duration",
    anyLength: "Any length",
    submit: "Search",
  },
  stats: {
    academies: "academies",
    countries: "countries",
    intakes: "open start dates",
  },
  glimpseStatus: "Accepted",
  popularGroup: "Popular countries",
  trustLabel: "Why families use Golafly Academy",
  types: {
    eyebrow: "Browse by program",
    title: "What kind of academy?",
    all: "See every program",
    program: "program",
    programs: "programs",
  },
  featured: {
    eyebrow: "Top rated · Verified",
    title: "Programs families are comparing",
    browseA: "Browse all",
    browseB: "programs",
  },
  intakes: {
    eyebrow: "Enrollment windows",
    title: "Upcoming start dates",
    lead: "Academies enroll in intakes, not nights. Each start date has its own application deadline and a fixed number of places.",
    cta: "Starting in the next 3 months",
    applyBy: "Apply by",
  },
  hostKpis: [
    { label: "Applications", value: "+12", sub: "this week" },
    { label: "Conversion", value: "4.1%", sub: "views to applications" },
  ],
} as const
