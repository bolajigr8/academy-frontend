import { academyPhoto } from "@/data/assets"
import type {
  Academy,
  Catalog,
  CountryCode,
  DocTypeId,
  DurationId,
  FeeUnit,
  GenderId,
  IncludeId,
  Intake,
  LevelId,
  Listing,
  Organization,
  Provision,
  Question,
  Review,
  ScheduleDay,
  TypeId,
  Verification,
} from "@/data/types"
import {
  MON,
  MONTHS,
  addDays,
  addYears,
  ageOn,
  diffDays,
  firstMonday,
  formatDate,
  formatDateShort,
  monthKey,
  monthLabel,
  monthStart,
  parseDate,
  todayISO,
  toISODate,
} from "@/lib/date"

/* Dates (local, never UTC-parsed): the DATES helper of js/amk-catalog.js, backed by lib/date.ts */
export const DATES = {
  MONTHS,
  MON,
  parse: parseDate,
  iso: toISODate,
  today: todayISO,
  addDays,
  addYears,
  monthStart,
  firstMonday,
  diffDays,
  ageOn,
  fmt: formatDate,
  fmtShort: formatDateShort,
  monthLabel,
  monthKey,
}

/* ---------------- Taxonomies (PRD §6.2 / §7.1) ---------------- */
export const COUNTRIES: { code: CountryCode; name: string }[] = [
  { code: "ES", name: "Spain" },
  { code: "PT", name: "Portugal" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "IT", name: "Italy" },
  { code: "FR", name: "France" },
]

export const TYPES: {
  id: TypeId
  label: string
  short: string
  icon: string
  blurb: string
}[] = [
  {
    id: "residential",
    label: "Residential academy",
    short: "Residential",
    icon: "home",
    blurb: "Train, live and eat on site with full-time staff.",
  },
  {
    id: "day",
    label: "Day academy",
    short: "Day academy",
    icon: "sun",
    blurb: "After-school and weekend sessions close to home.",
  },
  {
    id: "school",
    label: "Football & education",
    short: "Football & school",
    icon: "book",
    blurb: "Daily training combined with accredited schooling.",
  },
  {
    id: "specialist",
    label: "Goalkeeper & specialist",
    short: "Specialist",
    icon: "glove",
    blurb: "Position-specific coaching in small groups.",
  },
  {
    id: "development",
    label: "Development year (18+)",
    short: "Development year",
    icon: "trend",
    blurb: "A full season of structured training after school.",
  },
]

export const LEVELS: { id: LevelId; label: string; blurb: string }[] = [
  {
    id: "foundation",
    label: "Foundation",
    blurb: "New to structured training",
  },
  {
    id: "intermediate",
    label: "Intermediate",
    blurb: "Plays regularly for a club",
  },
  {
    id: "advanced",
    label: "Advanced",
    blurb: "Competitive club or regional level",
  },
  { id: "elite", label: "Elite", blurb: "Academy or national-team pathway" },
]

export const GENDERS: { id: GenderId; label: string }[] = [
  { id: "boys", label: "Boys" },
  { id: "girls", label: "Girls" },
  { id: "mixed", label: "Mixed" },
]

/* Duration buckets used by search. `rolling` = monthly enrollment, no fixed end. */
export const DURATIONS: {
  id: DurationId
  label: string
  min: number | null
  max: number | null
}[] = [
  { id: "short", label: "Up to 3 months", min: 1, max: 13 },
  { id: "half", label: "3 to 6 months", min: 14, max: 26 },
  { id: "season", label: "Full season", min: 27, max: 60 },
  { id: "rolling", label: "Rolling monthly", min: null, max: null },
]

export const PROVISION: Record<Provision, string> = {
  included: "Included",
  optional: "Available at extra cost",
  none: "Not offered",
}

export const VERIFICATION: Record<
  Verification,
  { label: string; short: string; text: string }
> = {
  pending: {
    label: "Verification pending",
    short: "Pending",
    text: "Golafly is still checking this academy’s documents.",
  },
  verified: {
    label: "Golafly Verified",
    short: "Verified",
    text: "Legal entity, safeguarding lead, facilities and insurance checked by Golafly.",
  },
  club: {
    label: "Club Academy",
    short: "Club Academy",
    text: "Verified, plus an official affiliation with the club documented by Golafly.",
  },
}

export const VERIFY_CHECKS: {
  id: string
  label: string
  clubOnly?: boolean
}[] = [
  { id: "entity", label: "Registered legal entity" },
  { id: "director", label: "Identity of the academy director" },
  { id: "safeguarding", label: "Named safeguarding lead and policy" },
  { id: "facilities", label: "Facility and insurance documents" },
  {
    id: "affiliation",
    label: "Official club affiliation document",
    clubOnly: true,
  },
]

/* How a fee is quoted. weeks = length of one unit (season = 40 weeks). */
export const FEE_UNITS: Record<
  FeeUnit,
  { label: string; weeks: number | null }
> = {
  season: { label: "season", weeks: 40 },
  term: { label: "term", weeks: 12 },
  program: { label: "program", weeks: null },
  week: { label: "week", weeks: 1 },
  month: { label: "month", weeks: 52 / 12 },
}

export const INCLUDES: Record<IncludeId, { label: string; icon: string }> = {
  coaching: { label: "UEFA-licensed coaching", icon: "whistle" },
  accommodation: { label: "Accommodation", icon: "bed" },
  meals: { label: "Full board meals", icon: "meal" },
  education: { label: "Schooling or classes", icon: "book" },
  kit: { label: "Training kit", icon: "shirt" },
  medical: { label: "Physio and medical cover", icon: "medical" },
  analysis: { label: "Video and performance analysis", icon: "video" },
  matches: { label: "Competitive fixtures", icon: "ball" },
  insurance: { label: "Sports insurance", icon: "shield" },
  transfers: { label: "Airport transfers", icon: "car" },
  language: { label: "Language classes", icon: "chat" },
}

export const DOC_TYPES: Record<DocTypeId, { label: string; hint: string }> = {
  passport: { label: "Passport or national ID", hint: "Photo page, in date" },
  birth: { label: "Birth certificate", hint: "Required for players under 18" },
  medical: {
    label: "Medical certificate",
    hint: "Signed by a doctor in the last 6 months",
  },
  consent: {
    label: "Parental consent form",
    hint: "Signed by a parent or guardian",
  },
  school: {
    label: "Latest school report",
    hint: "For programs that include schooling",
  },
  cv: { label: "Football CV", hint: "Clubs, seasons and achievements" },
  photo: { label: "Passport-style photo", hint: "Plain background" },
}

/* ---------------- Supply: organizations ---------------- */
const ORGS: Organization[] = [
  {
    id: "org-med",
    name: "Mediterráneo Sports Group",
    type: "operator",
    countryCode: "ES",
    verification: "verified",
    since: 2014,
  },
  {
    id: "org-efe",
    name: "Elite Football Education SL",
    type: "operator",
    countryCode: "ES",
    verification: "verified",
    since: 2011,
  },
  {
    id: "org-cas",
    name: "Castilla Football Group",
    type: "operator",
    countryCode: "ES",
    verification: "verified",
    since: 2016,
  },
  {
    id: "org-atl",
    name: "Atlântico Sports Lda",
    type: "operator",
    countryCode: "PT",
    verification: "verified",
    since: 2015,
  },
  {
    id: "org-paf",
    name: "Porto Atlântico FC",
    type: "club",
    countryCode: "PT",
    verification: "club",
    since: 1952,
    affiliation: { clubName: "Porto Atlântico FC", docRef: "AFF-PT-0192" },
  },
  {
    id: "org-isar",
    name: "Isar Performance GmbH",
    type: "operator",
    countryCode: "DE",
    verification: "verified",
    since: 2017,
  },
  {
    id: "org-nav",
    name: "Navigli Sport Srl",
    type: "operator",
    countryCode: "IT",
    verification: "verified",
    since: 2013,
  },
  {
    id: "org-lrg",
    name: "Lyon Rive Gauche FC",
    type: "club",
    countryCode: "FR",
    verification: "club",
    since: 1968,
    affiliation: { clubName: "Lyon Rive Gauche FC", docRef: "AFF-FR-0417" },
  },
  {
    id: "org-npl",
    name: "Northern Pathways Ltd",
    type: "operator",
    countryCode: "GB",
    verification: "verified",
    since: 2012,
  },
  {
    id: "org-ckp",
    name: "Capital Keepers Ltd",
    type: "operator",
    countryCode: "GB",
    verification: "verified",
    since: 2018,
  },
  {
    id: "org-csf",
    name: "Costa Sol Football SL",
    type: "operator",
    countryCode: "ES",
    verification: "pending",
    since: 2023,
  },
]

/* ---------------- Supply: academies ---------------- */
const ACADEMIES: Academy[] = [
  {
    id: "valencia",
    orgId: "org-med",
    name: "Valencia International Football Academy",
    clubName: null,
    city: "Valencia",
    countryCode: "ES",
    lat: 39.47,
    lng: -0.38,
    address: "Camí de Vera, 46022 Valencia",
    founded: 2014,
    responseRate: 97,
    responseHours: 6,
    languages: ["English", "Spanish"],
    facilities: [
      "2 full-size grass pitches",
      "1 artificial 4G pitch",
      "Gym and recovery pool",
      "On-site residence (64 beds)",
      "Video analysis room",
    ],
    description:
      "A residential academy on the edge of Valencia with its own pitches and residence. Squads train twice a day and play in the regional youth league.",
  },
  {
    id: "barcelona",
    orgId: "org-efe",
    name: "Barcelona Elite Academy",
    clubName: null,
    city: "Barcelona",
    countryCode: "ES",
    lat: 41.39,
    lng: 2.17,
    address: "Carrer de Pallars 220, 08005 Barcelona",
    founded: 2011,
    responseRate: 94,
    responseHours: 10,
    languages: ["English", "Spanish", "Catalan"],
    facilities: [
      "3 grass pitches",
      "Indoor futsal hall",
      "Partner international school",
      "Residence with 24-hour supervision",
    ],
    description:
      "Football and full-time schooling on one timetable. Players attend an international school each morning and train every afternoon.",
  },
  {
    id: "madrid",
    orgId: "org-cas",
    name: "Madrid Pro Academy",
    clubName: null,
    city: "Madrid",
    countryCode: "ES",
    lat: 40.42,
    lng: -3.7,
    address: "Av. de Manzanares 190, 28026 Madrid",
    founded: 2016,
    responseRate: 91,
    responseHours: 12,
    languages: ["English", "Spanish"],
    facilities: [
      "2 artificial pitches",
      "Strength and conditioning centre",
      "Shared residence",
    ],
    description:
      "Intensive half-season blocks built around small-group technical work and weekly friendly matches against local academies.",
  },
  {
    id: "lisbon",
    orgId: "org-atl",
    name: "Lisbon Development Centre",
    clubName: null,
    city: "Lisbon",
    countryCode: "PT",
    lat: 38.72,
    lng: -9.14,
    address: "Rua do Estádio 12, 1500-313 Lisbon",
    founded: 2015,
    responseRate: 98,
    responseHours: 4,
    languages: ["English", "Portuguese"],
    facilities: [
      "Grass and artificial pitches",
      "Performance lab",
      "Residence apartments",
      "Girls’ changing block",
    ],
    description:
      "Runs a development year for 18–23 year olds and a girls’ day program. Known for detailed individual development plans.",
  },
  {
    id: "porto",
    orgId: "org-paf",
    name: "Porto Atlântico FC Academy",
    clubName: "Porto Atlântico FC",
    city: "Porto",
    countryCode: "PT",
    lat: 41.15,
    lng: -8.61,
    address: "Estrada da Circunvalação 800, 4200-163 Porto",
    founded: 1952,
    responseRate: 99,
    responseHours: 3,
    languages: ["Portuguese", "English"],
    facilities: [
      "Club training ground",
      "5 small-sided pitches",
      "Clubhouse and parents’ area",
    ],
    description:
      "The youth academy of Porto Atlântico FC. Day sessions for 8–14 year olds follow the club’s coaching curriculum.",
  },
  {
    id: "munich",
    orgId: "org-isar",
    name: "Munich Performance Academy",
    clubName: null,
    city: "Munich",
    countryCode: "DE",
    lat: 48.14,
    lng: 11.58,
    address: "Ingolstädter Str. 72, 80807 Munich",
    founded: 2017,
    responseRate: 93,
    responseHours: 8,
    languages: ["English", "German"],
    facilities: [
      "Heated grass pitch",
      "Sports science lab",
      "Cryotherapy and recovery suite",
      "Residence rooms",
    ],
    description:
      "A small elite term for high-level players, built on daily sports-science testing and individual load management.",
  },
  {
    id: "milan",
    orgId: "org-nav",
    name: "Milan Youth Football School",
    clubName: null,
    city: "Milan",
    countryCode: "IT",
    lat: 45.46,
    lng: 9.19,
    address: "Via dei Missaglia 97, 20142 Milan",
    founded: 2013,
    responseRate: 90,
    responseHours: 14,
    languages: ["Italian", "English"],
    facilities: ["2 artificial pitches", "Indoor hall", "Parents’ café"],
    description:
      "After-school and weekend training for younger players, focused on ball mastery and small-sided games.",
  },
  {
    id: "lyon",
    orgId: "org-lrg",
    name: "Lyon Rive Gauche FC Girls Academy",
    clubName: "Lyon Rive Gauche FC",
    city: "Lyon",
    countryCode: "FR",
    lat: 45.76,
    lng: 4.84,
    address: "Avenue Jean Jaurès 350, 69007 Lyon",
    founded: 1968,
    responseRate: 96,
    responseHours: 5,
    languages: ["French", "English"],
    facilities: [
      "Club training centre",
      "Partner lycée",
      "Host-family network",
      "Physio room",
    ],
    description:
      "The girls’ academy of Lyon Rive Gauche FC. Players combine a full school timetable with daily club training.",
  },
  {
    id: "manchester",
    orgId: "org-npl",
    name: "Manchester Football & College",
    clubName: null,
    city: "Manchester",
    countryCode: "GB",
    lat: 53.48,
    lng: -2.24,
    address: "Stretford Road 41, M15 5GQ Manchester",
    founded: 2012,
    responseRate: 95,
    responseHours: 7,
    languages: ["English"],
    facilities: [
      "Grass and 3G pitches",
      "College campus",
      "Student residence",
      "Strength room",
    ],
    description:
      "A two-year football and college program. Players study for a recognised sports qualification while training every weekday.",
  },
  {
    id: "london",
    orgId: "org-ckp",
    name: "London Goalkeeper Academy",
    clubName: null,
    city: "London",
    countryCode: "GB",
    lat: 51.51,
    lng: -0.13,
    address: "Hackney Marshes Centre, E9 5PF London",
    founded: 2018,
    responseRate: 92,
    responseHours: 9,
    languages: ["English"],
    facilities: [
      "Goalkeeper-specific 3G area",
      "Rebound walls",
      "Video review booth",
    ],
    description:
      "Specialist coaching for goalkeepers only, in groups of six. Every session is filmed and reviewed.",
  },
  {
    id: "malaga",
    orgId: "org-csf",
    name: "Málaga Coastal Academy",
    clubName: null,
    city: "Málaga",
    countryCode: "ES",
    lat: 36.72,
    lng: -4.42,
    address: "Calle Pacífico 50, 29004 Málaga",
    founded: 2023,
    responseRate: 80,
    responseHours: 24,
    languages: ["Spanish", "English"],
    facilities: [
      "Artificial pitch",
      "Beach conditioning area",
      "Partner residence",
    ],
    description:
      "A new residential academy by the coast, running term-long programs for 11–17 year olds.",
  },
]

/* ---------------- Weekly schedule templates ---------------- */
export const SCHEDULES: Record<TypeId, ScheduleDay[]> = {
  residential: [
    { day: "Mon", items: ["Technical session 09:30–11:00", "Gym 17:00–18:00"] },
    {
      day: "Tue",
      items: ["Tactical session 09:30–11:00", "Small-sided games 17:00–18:30"],
    },
    {
      day: "Wed",
      items: [
        "Individual development 09:30–11:00",
        "Recovery and video review",
      ],
    },
    {
      day: "Thu",
      items: ["Technical session 09:30–11:00", "Finishing 17:00–18:00"],
    },
    { day: "Fri", items: ["Match preparation 09:30–11:00"] },
    { day: "Sat", items: ["League or friendly match"] },
    { day: "Sun", items: ["Rest day"] },
  ],
  school: [
    { day: "Mon", items: ["School 08:30–14:00", "Training 16:30–18:30"] },
    { day: "Tue", items: ["School 08:30–14:00", "Gym 16:30–17:30"] },
    { day: "Wed", items: ["School 08:30–14:00", "Training 16:30–18:30"] },
    { day: "Thu", items: ["School 08:30–14:00", "Training 16:30–18:30"] },
    {
      day: "Fri",
      items: ["School 08:30–13:00", "Match preparation 16:00–17:30"],
    },
    { day: "Sat", items: ["League match"] },
    { day: "Sun", items: ["Rest day"] },
  ],
  day: [
    { day: "Tue", items: ["Training 17:30–19:00"] },
    { day: "Thu", items: ["Training 17:30–19:00"] },
    { day: "Sat", items: ["Games morning 10:00–12:00"] },
  ],
  specialist: [
    { day: "Mon", items: ["Handling and footwork 16:00–17:30"] },
    { day: "Wed", items: ["Diving and shot-stopping 16:00–17:30"] },
    { day: "Fri", items: ["Distribution and video review 16:00–17:30"] },
    { day: "Sat", items: ["Match-scenario session 10:00–11:30"] },
  ],
  development: [
    { day: "Mon", items: ["Technical session 09:00–10:30", "Gym 15:00–16:00"] },
    {
      day: "Tue",
      items: ["Tactical session 09:00–10:30", "Coaching course 14:00–16:00"],
    },
    {
      day: "Wed",
      items: ["Individual plan review", "Small-sided games 16:00–17:30"],
    },
    { day: "Thu", items: ["Technical session 09:00–10:30", "Gym 15:00–16:00"] },
    { day: "Fri", items: ["Match preparation 09:00–10:30"] },
    { day: "Sat", items: ["Friendly match"] },
    { day: "Sun", items: ["Rest day"] },
  ],
}

export const BASE_QUESTIONS: Question[] = [
  {
    id: "club",
    label: "Current club and team level",
    type: "text",
    required: true,
  },
  {
    id: "why",
    label: "Why does this program suit the player?",
    type: "textarea",
    required: true,
  },
]

export const POLICIES: Record<string, string> = {
  cancellation:
    "Free cancellation until the application is accepted. After enrollment, the deposit is non-refundable unless the academy cancels.",
  refund:
    "If the academy cancels or cannot deliver the program, every payment is refunded in full within 14 days.",
  safeguarding:
    "A named safeguarding lead is on site. Players under 18 have a 22:00 curfew and supervised residence floors.",
}

const G = function (
  a: string,
  b: string,
  c: string,
  d: string,
  e: string
): string[] {
  return [a, b, c, d, e]
}

/* ---------------- Listings (the marketplace product) ----------------
   spec.intakes: [monthsAhead, capacity, seededTaken]. Rolling programs
   get three monthly intakes automatically. */
type Spec = Omit<
  Listing,
  | "rolling"
  | "image"
  | "schedule"
  | "questions"
  | "policies"
  | "status"
  | "intakes"
> & {
  extraQuestions?: Question[]
  intakes?: number[][]
  rolling?: { capacity: number; taken: number[] }
}

const SPECS: Spec[] = [
  {
    id: "valencia-u16-season",
    academyId: "valencia",
    title: "U14–16 Residential Season",
    type: "residential",
    level: "advanced",
    gender: "boys",
    ageMin: 14,
    ageMax: 16,
    durationWeeks: 40,
    sessionsPerWeek: 10,
    hoursPerWeek: 16,
    summary:
      "Full season on site: two sessions a day, residence, meals and a league fixture every weekend.",
    methodology:
      "Positional play in small groups, one individual development review every month, weekly video sessions.",
    competition:
      "Regional U16 league (Liga Valenciana) plus 6 international friendlies.",
    fees: {
      amount: 8500,
      per: "season",
      registrationFee: 300,
      deposit: { kind: "fixed", value: 1500 },
      schedule: "deposit_balance",
      balanceDueDays: 30,
    },
    includes: [
      "coaching",
      "accommodation",
      "meals",
      "kit",
      "medical",
      "analysis",
      "matches",
      "insurance",
    ],
    optional: [
      {
        id: "school",
        label: "Partner school place",
        price: 2400,
        per: "season",
      },
      { id: "transfers", label: "Airport transfers", price: 120, per: "once" },
    ],
    accommodation: "included",
    accommodationNote:
      "Shared rooms (2 players) in the on-site residence, supervised floors.",
    education: "optional",
    educationNote: "Places at a partner international school can be added.",
    requirements: [
      "Aged 14–16 on the start date",
      "Registered with a club for at least one season",
      "Valid passport for the full season",
    ],
    documents: ["passport", "birth", "medical", "consent", "cv"],
    extraQuestions: [
      {
        id: "position",
        label: "Preferred position",
        type: "select",
        required: true,
        options: ["Goalkeeper", "Defender", "Midfielder", "Forward"],
      },
    ],
    gallery: G(
      academyPhoto("card-duel.jpg"),
      academyPhoto("field-goal.jpg"),
      academyPhoto("deck-coach.jpg"),
      academyPhoto("deck-hotel.jpg"),
      academyPhoto("deck-meal.jpg")
    ),
    alt: "Two players challenging for the ball on a Valencia training pitch",
    sponsored: false,
    views30d: 1840,
    reviewSummary: {
      count: 143,
      avg: 4.8,
      areas: {
        training: 4.9,
        communication: 4.8,
        facilities: 4.7,
        organization: 4.8,
      },
    },
    intakes: [
      [3, 32, 21],
      [11, 32, 4],
    ],
  },

  {
    id: "valencia-u19-term",
    academyId: "valencia",
    title: "U17–19 Development Term",
    type: "residential",
    level: "advanced",
    gender: "boys",
    ageMin: 17,
    ageMax: 19,
    durationWeeks: 12,
    sessionsPerWeek: 9,
    hoursPerWeek: 15,
    summary:
      "A 12-week term for older players who want a structured block of full-time training.",
    methodology:
      "Game-model training with a physical block in weeks 1–4 and a match block in weeks 9–12.",
    competition: "Weekly friendlies against regional U19 sides.",
    fees: {
      amount: 3200,
      per: "term",
      registrationFee: 200,
      deposit: { kind: "percent", value: 25 },
      schedule: "deposit_balance",
      balanceDueDays: 21,
    },
    includes: [
      "coaching",
      "accommodation",
      "meals",
      "kit",
      "medical",
      "matches",
      "insurance",
    ],
    optional: [
      { id: "transfers", label: "Airport transfers", price: 120, per: "once" },
      { id: "spanish", label: "Spanish classes", price: 240, per: "program" },
    ],
    accommodation: "included",
    accommodationNote: "Shared rooms in the on-site residence.",
    education: "none",
    educationNote: "",
    requirements: [
      "Aged 17–19 on the start date",
      "At least two seasons of club football",
    ],
    documents: ["passport", "medical", "cv"],
    extraQuestions: [],
    gallery: G(
      academyPhoto("match-duel.jpg"),
      academyPhoto("field-cones.jpg"),
      academyPhoto("deck-camp2.jpg"),
      academyPhoto("deck-hotel.jpg"),
      academyPhoto("deck-meal.jpg")
    ),
    alt: "An U19 player shielding the ball in a match",
    sponsored: false,
    views30d: 960,
    reviewSummary: {
      count: 58,
      avg: 4.7,
      areas: {
        training: 4.8,
        communication: 4.6,
        facilities: 4.7,
        organization: 4.6,
      },
    },
    intakes: [
      [2, 24, 17, 1],
      [5, 24, 2],
    ],
  },

  {
    id: "barcelona-school-season",
    academyId: "barcelona",
    title: "Football & International School Season",
    type: "school",
    level: "advanced",
    gender: "mixed",
    ageMin: 12,
    ageMax: 17,
    durationWeeks: 40,
    sessionsPerWeek: 5,
    hoursPerWeek: 10,
    summary:
      "School every morning, training every afternoon, supervised residence in between.",
    methodology:
      "Possession-based methodology with a technical focus for under-14s and tactical periodization from U15.",
    competition: "Catalan youth league (boys and girls divisions).",
    fees: {
      amount: 14900,
      per: "season",
      registrationFee: 250,
      deposit: { kind: "fixed", value: 3000 },
      schedule: "deposit_balance",
      balanceDueDays: 45,
    },
    includes: [
      "coaching",
      "accommodation",
      "meals",
      "education",
      "kit",
      "medical",
      "matches",
      "insurance",
    ],
    optional: [
      { id: "transfers", label: "Airport transfers", price: 90, per: "once" },
      { id: "tutoring", label: "Evening tutoring", price: 180, per: "month" },
    ],
    accommodation: "included",
    accommodationNote:
      "Residence with 24-hour supervision, rooms for 2–3 players.",
    education: "included",
    educationNote:
      "International school, taught in English with Spanish classes.",
    requirements: [
      "Aged 12–17 on the start date",
      "Latest school report",
      "Club reference from a coach",
    ],
    documents: ["passport", "birth", "medical", "consent", "school"],
    extraQuestions: [
      {
        id: "grade",
        label: "School year the player will enter",
        type: "select",
        required: true,
        options: [
          "Year 7",
          "Year 8",
          "Year 9",
          "Year 10",
          "Year 11",
          "Year 12",
        ],
      },
    ],
    gallery: G(
      academyPhoto("card-stadium.jpg"),
      academyPhoto("match-stadium.jpg"),
      academyPhoto("deck-why.jpg"),
      academyPhoto("deck-hotel.jpg"),
      academyPhoto("deck-squad.jpg")
    ),
    alt: "Players lined up on the main pitch at Barcelona Elite Academy",
    sponsored: false,
    views30d: 2410,
    reviewSummary: {
      count: 214,
      avg: 4.9,
      areas: {
        training: 4.9,
        communication: 4.8,
        facilities: 4.9,
        organization: 4.9,
      },
    },
    intakes: [
      [4, 40, 31],
      [12, 40, 6],
    ],
  },

  {
    id: "madrid-half-season",
    academyId: "madrid",
    title: "Residential Half-Season",
    type: "residential",
    level: "intermediate",
    gender: "boys",
    ageMin: 13,
    ageMax: 18,
    durationWeeks: 20,
    sessionsPerWeek: 8,
    hoursPerWeek: 13,
    summary:
      "A 20-week residential block with small-group technical work and weekly friendly matches.",
    methodology:
      "Technical repetition in groups of eight, with a monthly progress report for families.",
    competition: "Weekly friendly matches against Madrid academies.",
    fees: {
      amount: 6900,
      per: "program",
      registrationFee: 200,
      deposit: { kind: "percent", value: 30 },
      schedule: "deposit_balance",
      balanceDueDays: 30,
    },
    includes: [
      "coaching",
      "accommodation",
      "meals",
      "kit",
      "matches",
      "insurance",
    ],
    optional: [
      { id: "transfers", label: "Airport transfers", price: 80, per: "once" },
      { id: "spanish", label: "Spanish classes", price: 300, per: "program" },
    ],
    accommodation: "included",
    accommodationNote: "Shared residence, rooms for 3 players.",
    education: "optional",
    educationNote: "Online school support can be arranged.",
    requirements: ["Aged 13–18 on the start date"],
    documents: ["passport", "birth", "medical", "consent"],
    extraQuestions: [],
    gallery: G(
      academyPhoto("card-dribble.jpg"),
      academyPhoto("field-cones.jpg"),
      academyPhoto("deck-camp1.jpg"),
      academyPhoto("deck-hotel.jpg"),
      academyPhoto("deck-bus.jpg")
    ),
    alt: "A player dribbling through cones at Madrid Pro Academy",
    sponsored: true,
    views30d: 3120,
    reviewSummary: {
      count: 186,
      avg: 4.6,
      areas: {
        training: 4.7,
        communication: 4.5,
        facilities: 4.5,
        organization: 4.6,
      },
    },
    intakes: [
      [2, 36, 22],
      [6, 36, 3],
    ],
  },

  {
    id: "lisbon-development-year",
    academyId: "lisbon",
    title: "Development Year 18–23",
    type: "development",
    level: "advanced",
    gender: "mixed",
    ageMin: 18,
    ageMax: 23,
    durationWeeks: 36,
    sessionsPerWeek: 9,
    hoursPerWeek: 15,
    summary:
      "A full season after school with an individual development plan and a coaching qualification.",
    methodology:
      "Monthly individual development plans, GPS load monitoring, weekly one-to-one video reviews.",
    competition: "Friendlies against Portuguese reserve and U23 sides.",
    fees: {
      amount: 9800,
      per: "season",
      registrationFee: 250,
      deposit: { kind: "fixed", value: 2000 },
      schedule: "deposit_balance",
      balanceDueDays: 30,
    },
    includes: [
      "coaching",
      "accommodation",
      "meals",
      "kit",
      "medical",
      "analysis",
      "matches",
      "insurance",
    ],
    optional: [
      {
        id: "coachcert",
        label: "Grassroots coaching certificate",
        price: 450,
        per: "program",
      },
      {
        id: "portuguese",
        label: "Portuguese classes",
        price: 280,
        per: "program",
      },
    ],
    accommodation: "included",
    accommodationNote: "Residence apartments shared by 3 players.",
    education: "optional",
    educationNote: "Coaching certificate and language classes can be added.",
    requirements: ["Aged 18–23 on the start date", "Two recent match videos"],
    documents: ["passport", "medical", "cv"],
    extraQuestions: [
      {
        id: "video",
        label: "Link to a recent match video",
        type: "text",
        required: true,
      },
    ],
    gallery: G(
      academyPhoto("card-dusk.jpg"),
      academyPhoto("match-duel.jpg"),
      academyPhoto("deck-coach.jpg"),
      academyPhoto("deck-hotel.jpg"),
      academyPhoto("deck-camp3.jpg")
    ),
    alt: "Evening session on the floodlit pitch at Lisbon Development Centre",
    sponsored: false,
    views30d: 1270,
    reviewSummary: {
      count: 97,
      avg: 4.9,
      areas: {
        training: 4.9,
        communication: 5.0,
        facilities: 4.7,
        organization: 4.9,
      },
    },
    intakes: [
      [3, 28, 19],
      [9, 28, 1],
    ],
  },

  {
    id: "lisbon-girls-day",
    academyId: "lisbon",
    title: "Girls Day Program",
    type: "day",
    level: "intermediate",
    gender: "girls",
    ageMin: 10,
    ageMax: 16,
    durationWeeks: null,
    sessionsPerWeek: 3,
    hoursPerWeek: 5,
    summary:
      "Three sessions a week for girls who want more touches and better coaching than their club offers.",
    methodology:
      "Ball mastery, 1v1 and small-sided games, with a skills passport updated every month.",
    competition: "Monthly girls’ festival with other Lisbon academies.",
    fees: {
      amount: 200,
      per: "month",
      registrationFee: 60,
      deposit: null,
      schedule: "monthly",
      balanceDueDays: 0,
    },
    includes: ["coaching", "kit", "insurance"],
    optional: [
      { id: "extra", label: "Extra Saturday session", price: 40, per: "month" },
    ],
    accommodation: "none",
    accommodationNote: "",
    education: "none",
    educationNote: "",
    requirements: ["Aged 10–16 on the start date"],
    documents: ["birth", "medical", "consent"],
    extraQuestions: [],
    gallery: G(
      academyPhoto("card-group.jpg"),
      academyPhoto("field-cones.jpg"),
      academyPhoto("deck-camp2.jpg"),
      academyPhoto("field-goal.jpg"),
      academyPhoto("deck-squad.jpg")
    ),
    alt: "A group of players listening to their coach",
    sponsored: false,
    views30d: 640,
    reviewSummary: {
      count: 41,
      avg: 4.8,
      areas: {
        training: 4.9,
        communication: 4.8,
        facilities: 4.6,
        organization: 4.8,
      },
    },
    rolling: { capacity: 18, taken: [11, 5, 2] },
  },

  {
    id: "porto-club-academy",
    academyId: "porto",
    title: "Club Academy U8–14",
    type: "day",
    level: "foundation",
    gender: "mixed",
    ageMin: 8,
    ageMax: 14,
    durationWeeks: null,
    sessionsPerWeek: 2,
    hoursPerWeek: 3.5,
    summary:
      "Twice-weekly training on the Porto Atlântico FC curriculum, open to new players.",
    methodology:
      "The club’s own coaching curriculum, the same one used by its youth teams.",
    competition: "Club tournaments each term.",
    fees: {
      amount: 180,
      per: "month",
      registrationFee: 90,
      deposit: null,
      schedule: "monthly",
      balanceDueDays: 0,
    },
    includes: ["coaching", "kit", "insurance"],
    optional: [
      {
        id: "goalkeeper",
        label: "Goalkeeper add-on session",
        price: 35,
        per: "month",
      },
    ],
    accommodation: "none",
    accommodationNote: "",
    education: "none",
    educationNote: "",
    requirements: ["Aged 8–14 on the start date"],
    documents: ["birth", "medical", "consent", "photo"],
    extraQuestions: [],
    gallery: G(
      academyPhoto("card-night.jpg"),
      academyPhoto("field-goal.jpg"),
      academyPhoto("deck-stadium-night.jpg"),
      academyPhoto("deck-camp1.jpg"),
      academyPhoto("deck-squad.jpg")
    ),
    alt: "Evening training under lights at the Porto Atlântico FC ground",
    sponsored: false,
    views30d: 880,
    reviewSummary: {
      count: 98,
      avg: 4.8,
      areas: {
        training: 4.8,
        communication: 4.9,
        facilities: 4.6,
        organization: 4.8,
      },
    },
    rolling: { capacity: 30, taken: [18, 7, 3] },
  },

  {
    id: "munich-performance-term",
    academyId: "munich",
    title: "Elite Performance Term",
    type: "residential",
    level: "elite",
    gender: "boys",
    ageMin: 15,
    ageMax: 19,
    durationWeeks: 12,
    sessionsPerWeek: 11,
    hoursPerWeek: 18,
    summary:
      "Twelve weeks of elite training with daily sports-science testing, for a group of 16.",
    methodology:
      "Individual load management, daily wellness tracking and position-specific sessions.",
    competition: "Friendlies against Bavarian U17 and U19 sides.",
    fees: {
      amount: 520,
      per: "week",
      registrationFee: 300,
      deposit: { kind: "percent", value: 20 },
      schedule: "deposit_balance",
      balanceDueDays: 21,
    },
    includes: [
      "coaching",
      "accommodation",
      "meals",
      "kit",
      "medical",
      "analysis",
      "matches",
      "insurance",
    ],
    optional: [
      { id: "transfers", label: "Airport transfers", price: 110, per: "once" },
    ],
    accommodation: "included",
    accommodationNote: "Single rooms in a sports hotel.",
    education: "none",
    educationNote: "",
    requirements: [
      "Aged 15–19 on the start date",
      "Elite level: academy or national-team experience",
      "Coach reference",
    ],
    documents: ["passport", "birth", "medical", "consent", "cv"],
    extraQuestions: [
      {
        id: "video",
        label: "Link to a recent match video",
        type: "text",
        required: true,
      },
    ],
    gallery: G(
      academyPhoto("card-pose.jpg"),
      academyPhoto("match-stadium.jpg"),
      academyPhoto("deck-coach.jpg"),
      academyPhoto("deck-hotel.jpg"),
      academyPhoto("deck-stadium.jpg")
    ),
    alt: "A player during a performance assessment at Munich Performance Academy",
    sponsored: false,
    views30d: 1530,
    reviewSummary: {
      count: 67,
      avg: 4.9,
      areas: {
        training: 5.0,
        communication: 4.8,
        facilities: 4.9,
        organization: 4.9,
      },
    },
    intakes: [
      [2, 16, 11, 2],
      [5, 16, 2, 1],
    ],
  },

  {
    id: "milan-youth-day",
    academyId: "milan",
    title: "Youth Day Program U9–13",
    type: "day",
    level: "foundation",
    gender: "mixed",
    ageMin: 9,
    ageMax: 13,
    durationWeeks: null,
    sessionsPerWeek: 2,
    hoursPerWeek: 3,
    summary:
      "After-school and weekend training built on ball mastery and small-sided games.",
    methodology:
      "Coerver-style ball mastery and 4v4 games, with a termly report for parents.",
    competition: "Weekend festivals with local schools.",
    fees: {
      amount: 160,
      per: "month",
      registrationFee: 50,
      deposit: null,
      schedule: "monthly",
      balanceDueDays: 0,
    },
    includes: ["coaching", "kit", "insurance"],
    optional: [
      {
        id: "holiday",
        label: "Holiday intensive week",
        price: 190,
        per: "once",
      },
    ],
    accommodation: "none",
    accommodationNote: "",
    education: "none",
    educationNote: "",
    requirements: ["Aged 9–13 on the start date"],
    documents: ["birth", "medical", "consent"],
    extraQuestions: [],
    gallery: G(
      academyPhoto("card-lead.jpg"),
      academyPhoto("field-cones.jpg"),
      academyPhoto("deck-camp3.jpg"),
      academyPhoto("field-goal.jpg"),
      academyPhoto("deck-squad.jpg")
    ),
    alt: "A small-sided game at Milan Youth Football School",
    sponsored: false,
    views30d: 510,
    reviewSummary: {
      count: 121,
      avg: 4.7,
      areas: {
        training: 4.8,
        communication: 4.6,
        facilities: 4.5,
        organization: 4.7,
      },
    },
    rolling: { capacity: 24, taken: [15, 6, 1] },
  },

  {
    id: "lyon-girls-academy",
    academyId: "lyon",
    title: "Girls Academy & Lycée Season",
    type: "school",
    level: "advanced",
    gender: "girls",
    ageMin: 13,
    ageMax: 18,
    durationWeeks: 40,
    sessionsPerWeek: 6,
    hoursPerWeek: 11,
    summary:
      "Daily club training with a full school timetable at the partner lycée.",
    methodology:
      "The club’s girls’ curriculum, with strength work adapted by age and a monthly review.",
    competition: "French regional girls’ league.",
    fees: {
      amount: 7200,
      per: "season",
      registrationFee: 150,
      deposit: { kind: "fixed", value: 1200 },
      schedule: "deposit_balance",
      balanceDueDays: 30,
    },
    includes: [
      "coaching",
      "education",
      "kit",
      "medical",
      "matches",
      "insurance",
      "language",
    ],
    optional: [
      {
        id: "hostfamily",
        label: "Host-family accommodation",
        price: 650,
        per: "month",
      },
    ],
    accommodation: "optional",
    accommodationNote:
      "Host families near the training centre, arranged by the club.",
    education: "included",
    educationNote:
      "Partner lycée with French classes for international players.",
    requirements: [
      "Aged 13–18 on the start date",
      "Latest school report",
      "Basic French or willingness to learn",
    ],
    documents: ["passport", "birth", "medical", "consent", "school"],
    extraQuestions: [
      {
        id: "french",
        label: "Current level of French",
        type: "select",
        required: true,
        options: ["None", "Beginner", "Intermediate", "Fluent"],
      },
    ],
    gallery: G(
      academyPhoto("card-studio.jpg"),
      academyPhoto("match-duel.jpg"),
      academyPhoto("deck-why.jpg"),
      academyPhoto("deck-meal.jpg"),
      academyPhoto("deck-squad.jpg")
    ),
    alt: "A player in Golafly training kit at the Lyon training centre",
    sponsored: false,
    views30d: 990,
    reviewSummary: {
      count: 89,
      avg: 4.8,
      areas: {
        training: 4.8,
        communication: 4.9,
        facilities: 4.7,
        organization: 4.8,
      },
    },
    intakes: [
      [4, 26, 17],
      [12, 26, 3],
    ],
  },

  {
    id: "manchester-football-college",
    academyId: "manchester",
    title: "Football & College Season",
    type: "school",
    level: "intermediate",
    gender: "mixed",
    ageMin: 16,
    ageMax: 19,
    durationWeeks: 40,
    sessionsPerWeek: 5,
    hoursPerWeek: 10,
    summary:
      "Study for a recognised sports qualification while training every weekday.",
    methodology:
      "Training built around the college timetable with a strength block twice a week.",
    competition: "National college football league.",
    fees: {
      amount: 11500,
      per: "season",
      registrationFee: 250,
      deposit: { kind: "fixed", value: 2500 },
      schedule: "deposit_balance",
      balanceDueDays: 30,
    },
    includes: [
      "coaching",
      "accommodation",
      "meals",
      "education",
      "kit",
      "matches",
      "insurance",
    ],
    optional: [
      { id: "transfers", label: "Airport transfers", price: 95, per: "once" },
      { id: "english", label: "English classes", price: 520, per: "season" },
    ],
    accommodation: "included",
    accommodationNote: "Student residence with a pastoral warden.",
    education: "included",
    educationNote: "Level 3 sports qualification at the partner college.",
    requirements: [
      "Aged 16–19 on the start date",
      "Latest school report",
      "English level B1 or above",
    ],
    documents: ["passport", "medical", "consent", "school"],
    extraQuestions: [],
    gallery: G(
      academyPhoto("field-cones.jpg"),
      academyPhoto("match-stadium.jpg"),
      academyPhoto("deck-coach.jpg"),
      academyPhoto("deck-hotel.jpg"),
      academyPhoto("deck-bus.jpg")
    ),
    alt: "Training cones set out on a Manchester pitch",
    sponsored: false,
    views30d: 760,
    reviewSummary: {
      count: 76,
      avg: 4.7,
      areas: {
        training: 4.7,
        communication: 4.8,
        facilities: 4.6,
        organization: 4.7,
      },
    },
    intakes: [
      [3, 30, 18, 0],
      [11, 30, 2, 1],
    ],
  },

  {
    id: "london-goalkeeper",
    academyId: "london",
    title: "Goalkeeper Development Block",
    type: "specialist",
    level: "intermediate",
    gender: "mixed",
    ageMin: 12,
    ageMax: 21,
    durationWeeks: 10,
    sessionsPerWeek: 4,
    hoursPerWeek: 6,
    summary:
      "Ten weeks of goalkeeper-only coaching in groups of six, every session filmed.",
    methodology:
      "Handling, footwork, diving and distribution, with a video review after every session.",
    competition: "Match-scenario sessions every Saturday.",
    fees: {
      amount: 290,
      per: "week",
      registrationFee: 80,
      deposit: { kind: "percent", value: 20 },
      schedule: "deposit_balance",
      balanceDueDays: 14,
    },
    includes: ["coaching", "analysis", "insurance"],
    optional: [
      { id: "gloves", label: "Match gloves pack", price: 85, per: "once" },
    ],
    accommodation: "none",
    accommodationNote: "",
    education: "none",
    educationNote: "",
    requirements: ["Aged 12–21 on the start date", "Plays in goal for a club"],
    documents: ["birth", "medical", "consent"],
    extraQuestions: [],
    gallery: G(
      academyPhoto("field-goal.jpg"),
      academyPhoto("card-night.jpg"),
      academyPhoto("deck-stadium.jpg"),
      academyPhoto("match-duel.jpg"),
      academyPhoto("deck-camp1.jpg")
    ),
    alt: "An empty goal at dusk on the London training ground",
    sponsored: false,
    views30d: 430,
    reviewSummary: {
      count: 52,
      avg: 4.8,
      areas: {
        training: 4.9,
        communication: 4.7,
        facilities: 4.6,
        organization: 4.8,
      },
    },
    intakes: [
      [2, 18, 12, 1],
      [5, 18, 1],
    ],
  },

  {
    id: "malaga-coastal-term",
    academyId: "malaga",
    title: "Coastal Residential Term",
    type: "residential",
    level: "intermediate",
    gender: "mixed",
    ageMin: 11,
    ageMax: 17,
    durationWeeks: 12,
    sessionsPerWeek: 8,
    hoursPerWeek: 12,
    summary: "A 12-week residential term by the coast, run by a new academy.",
    methodology:
      "Technical sessions each morning and beach conditioning twice a week.",
    competition: "Friendlies against Andalusian clubs.",
    fees: {
      amount: 2900,
      per: "term",
      registrationFee: 150,
      deposit: { kind: "percent", value: 25 },
      schedule: "deposit_balance",
      balanceDueDays: 21,
    },
    includes: ["coaching", "accommodation", "meals", "kit", "insurance"],
    optional: [
      { id: "transfers", label: "Airport transfers", price: 70, per: "once" },
    ],
    accommodation: "included",
    accommodationNote: "Partner residence, rooms for 3 players.",
    education: "none",
    educationNote: "",
    requirements: ["Aged 11–17 on the start date"],
    documents: ["passport", "birth", "medical", "consent"],
    extraQuestions: [],
    gallery: G(
      academyPhoto("deck-camp1.jpg"),
      academyPhoto("field-cones.jpg"),
      academyPhoto("deck-camp3.jpg"),
      academyPhoto("deck-hotel.jpg"),
      academyPhoto("deck-meal.jpg")
    ),
    alt: "Young players training on the coastal pitch in Málaga",
    sponsored: false,
    views30d: 210,
    reviewSummary: {
      count: 0,
      avg: 0,
      areas: { training: 0, communication: 0, facilities: 0, organization: 0 },
    },
    intakes: [
      [3, 24, 6, 2],
      [6, 24, 0, 1],
    ],
  },
]

/* ---------------- Verified reviews (PRD §12.2) ----------------
   Only people with a verified enrollment can review. */
const REVIEW_POOL: { text: string; areas: number[] }[] = [
  {
    text: "Coaching was organised and honest. We got a written review every month and could see exactly what he was working on.",
    areas: [5, 5, 4, 5],
  },
  {
    text: "Communication with the staff was quick, even at weekends. The residence was clean and well supervised.",
    areas: [5, 5, 5, 4],
  },
  {
    text: "Very demanding sessions. Facilities are good, the gym could be bigger, but the coaches clearly care.",
    areas: [5, 4, 4, 5],
  },
  {
    text: "She came back more confident on the ball and with a clear plan for her club season.",
    areas: [5, 5, 4, 5],
  },
  {
    text: "The video reviews made a big difference. Scheduling changed a couple of times, but we were always told early.",
    areas: [5, 4, 5, 4],
  },
  {
    text: "Good balance between school and training. The school team and the coaches actually talk to each other.",
    areas: [5, 5, 5, 5],
  },
]
const AUTHORS = [
  "Parent of a U15 player",
  "Parent of a U13 player",
  "Player, 18",
  "Parent of a U16 player",
  "Player, 20",
  "Parent of a U12 player",
]

function buildReviews(listings: Listing[], today: string): Review[] {
  const out: Review[] = []
  const lastYear = (DATES.parse(today) ?? new Date()).getFullYear() - 1
  listings.forEach(function (l: Listing, li: number) {
    if (!l.reviewSummary.count) return
    for (let k = 0; k < 3; k++) {
      const r = REVIEW_POOL[(li + k) % REVIEW_POOL.length]
      out.push({
        id: "rev-" + l.id + "-" + k,
        listingId: l.id,
        enrollmentRef: "GFE-" + String(lastYear) + "-" + (1000 + li * 10 + k),
        verified: true,
        authorLabel: AUTHORS[(li + k) % AUTHORS.length],
        date: DATES.addDays(today, -(40 + li * 9 + k * 23)),
        ratings: {
          training: r.areas[0],
          communication: r.areas[1],
          facilities: r.areas[2],
          organization: r.areas[3],
        },
        text: r.text,
      })
    }
  })
  return out
}

/* ---------------- build(today) ---------------- */
function buildIntakes(spec: Spec, today: string): Intake[] {
  const rolling = spec.rolling
  if (rolling) {
    return [1, 2, 3].map(function (k, i) {
      const start = DATES.monthStart(today, k)
      return {
        id: spec.id + "-i" + (i + 1),
        label: "Starts " + DATES.fmtShort(start),
        start: start,
        end: null,
        deadline: DATES.addDays(start, -7),
        capacity: rolling.capacity,
        seededTaken: rolling.taken[i],
      }
    })
  }
  return (spec.intakes ?? []).map(function (t: number[], i: number) {
    const start = DATES.firstMonday(DATES.monthStart(today, t[0]), t[3] || 0)
    return {
      id: spec.id + "-i" + (i + 1),
      label: DATES.monthLabel(start) + " intake",
      start: start,
      end: DATES.addDays(start, (spec.durationWeeks ?? 0) * 7 - 1),
      deadline: DATES.addDays(start, -21),
      capacity: t[1],
      seededTaken: t[2],
    }
  })
}

export function build(todayISO?: string): Catalog {
  const today = todayISO || DATES.today()
  const listings: Listing[] = SPECS.map(function (s): Listing {
    const kept = Object.fromEntries(
      Object.entries(s).filter(
        ([k]) => k !== "intakes" && k !== "rolling" && k !== "extraQuestions"
      )
    ) as Omit<Spec, "intakes" | "rolling" | "extraQuestions">
    return {
      ...kept,
      rolling: !!s.rolling,
      image: s.gallery[0],
      schedule: SCHEDULES[s.type],
      questions: BASE_QUESTIONS.concat(s.extraQuestions || []),
      policies: POLICIES,
      status: "published",
      intakes: buildIntakes(s, today),
    }
  })
  return {
    today: today,
    orgs: ORGS,
    academies: ACADEMIES,
    listings: listings,
    reviews: buildReviews(listings, today),
  }
}
