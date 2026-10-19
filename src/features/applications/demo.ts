import * as CAT from "@/data/catalog"
import { academyPhoto } from "@/data/assets"
import type { Catalog, DocTypeId, Listing } from "@/data/types"
import * as FLOW from "@/features/applications/flow"
import type {
  Actor,
  AppDoc,
  AppDocStatus,
  AppEvent,
  AppStatus,
  Applicant,
  Application,
  Demo,
  HostListing,
  PlanItem,
  Player,
  ThreadMessage,
  VaultDoc,
} from "@/features/applications/types"

const D = CAT.DATES

type PlanSeed = { from: string; paid?: string[]; paidDays?: number }
type AppSeed = {
  id: string
  status: AppStatus
  listingId: string
  familyId?: string
  playerId?: string
  applicant?: Applicant
  intake?: number
  events?: AppEvent[]
  createdAt?: string
  answers?: Record<string, string>
  documents?: AppDoc[]
  optional?: string[]
  plan?: PlanSeed
  lastStep?: number
}
type OtherSeed = {
  id: string
  listingId: string
  status: AppStatus
  events: AppEvent[]
  applicant: Applicant
  answers: Record<string, string>
  plan?: PlanSeed
  docStatus?: AppDocStatus[]
}

export function build(catalog: Catalog): Demo {
  const today = catalog.today
  const rel = function (days: number) {
    return D.addDays(today, days)
  }
  const at = function (days: number, hhmm?: string) {
    return FLOW.stamp(rel(days), hhmm)
  }
  const year = (D.parse(today) ?? new Date()).getFullYear()
  const listing = function (id: string): Listing {
    return catalog.listings.filter(function (l) {
      return l.id === id
    })[0]
  }

  /* ---------------- People ---------------- */
  const parent: Demo["parent"] = {
    id: "parent-amara",
    role: "family",
    firstName: "Amara",
    lastName: "Okafor",
    initials: "AO",
    email: "amara.okafor@example.com",
    phone: "+44 7700 900418",
    city: "Manchester",
    country: "United Kingdom",
    relation: "Mother",
  }

  const players: Player[] = [
    {
      id: "player-tobi",
      firstName: "Tobi",
      lastName: "Okafor",
      initials: "TO",
      dob: D.addDays(D.addYears(today, -15), -60),
      gender: "male",
      nationality: "British, Nigerian",
      location: "Manchester, United Kingdom",
      position: "Central midfielder",
      positions: ["CM", "CAM"],
      foot: "Right",
      heightCm: 172,
      weightKg: 61,
      level: "advanced",
      currentClub: "Trafford Rovers U16",
      previousClubs: [
        "Stretford Juniors (2018–2022)",
        "Salford Athletic U13 (2022–2024)",
      ],
      bio: "Box-to-box midfielder who likes to play forward passes and press high. Captains his club side and wants a full-time training environment.",
      seasons: [
        {
          season: String(year - 1) + "/" + String(year).slice(2),
          club: "Trafford Rovers U16",
          apps: 24,
          goals: 6,
          assists: 9,
          note: "Captain for the second half of the season",
        },
        {
          season: String(year - 2) + "/" + String(year - 1).slice(2),
          club: "Trafford Rovers U15",
          apps: 22,
          goals: 4,
          assists: 7,
          note: "County cup winner",
        },
        {
          season: String(year - 3) + "/" + String(year - 2).slice(2),
          club: "Salford Athletic U13",
          apps: 18,
          goals: 5,
          assists: 3,
          note: "",
        },
      ],
      achievements: [
        "County U15 cup winner",
        "Club player of the season",
        "Regional development squad",
      ],
      videos: [
        {
          id: "v1",
          title: "Match highlights vs. Oldham Park",
          url: "https://video.example.com/tobi-highlights",
          duration: "4:12",
        },
        {
          id: "v2",
          title: "Passing and pressing clips",
          url: "https://video.example.com/tobi-pressing",
          duration: "2:47",
        },
      ],
    },
    {
      id: "player-zara",
      firstName: "Zara",
      lastName: "Okafor",
      initials: "ZO",
      dob: D.addDays(D.addYears(today, -13), -100),
      gender: "female",
      nationality: "British, Nigerian",
      location: "Manchester, United Kingdom",
      position: "Left winger",
      positions: ["LW", "LM"],
      foot: "Left",
      heightCm: 156,
      weightKg: 44,
      level: "intermediate",
      currentClub: "Manchester Belles U14",
      previousClubs: ["Chorlton Girls FC (2021–2024)"],
      bio: "Quick left-footed winger who loves 1v1s. Looking for more coaching hours alongside school.",
      seasons: [
        {
          season: String(year - 1) + "/" + String(year).slice(2),
          club: "Manchester Belles U14",
          apps: 19,
          goals: 11,
          assists: 6,
          note: "Top scorer",
        },
        {
          season: String(year - 2) + "/" + String(year - 1).slice(2),
          club: "Chorlton Girls U12",
          apps: 16,
          goals: 8,
          assists: 4,
          note: "",
        },
      ],
      achievements: ["League top scorer (U14)"],
      videos: [
        {
          id: "v1",
          title: "Season goals and assists",
          url: "https://video.example.com/zara-goals",
          duration: "3:05",
        },
      ],
    },
  ]

  const host: Demo["host"] = {
    id: "host-marta",
    role: "host",
    firstName: "Marta",
    lastName: "Ruiz",
    initials: "MR",
    title: "Academy director",
    email: "marta.ruiz@example.com",
    phone: "+34 600 000 412",
    orgId: "org-med",
    academyIds: ["valencia"],
  }

  /* ---------------- Documents (player vault) ---------------- */
  const documents: VaultDoc[] = [
    {
      id: "doc-tobi-passport",
      playerId: "player-tobi",
      type: "passport",
      name: "tobi-passport.pdf",
      sizeKb: 842,
      uploadedAt: rel(-44),
    },
    {
      id: "doc-tobi-birth",
      playerId: "player-tobi",
      type: "birth",
      name: "tobi-birth-certificate.pdf",
      sizeKb: 516,
      uploadedAt: rel(-44),
    },
    {
      id: "doc-tobi-medical",
      playerId: "player-tobi",
      type: "medical",
      name: "tobi-medical.pdf",
      sizeKb: 311,
      uploadedAt: rel(-31),
    },
    {
      id: "doc-tobi-consent",
      playerId: "player-tobi",
      type: "consent",
      name: "tobi-parental-consent.pdf",
      sizeKb: 204,
      uploadedAt: rel(-31),
    },
    {
      id: "doc-tobi-cv",
      playerId: "player-tobi",
      type: "cv",
      name: "tobi-football-cv.pdf",
      sizeKb: 388,
      uploadedAt: rel(-30),
    },
    {
      id: "doc-tobi-school",
      playerId: "player-tobi",
      type: "school",
      name: "tobi-school-report.pdf",
      sizeKb: 1260,
      uploadedAt: rel(-30),
    },
    {
      id: "doc-zara-passport",
      playerId: "player-zara",
      type: "passport",
      name: "zara-passport.pdf",
      sizeKb: 790,
      uploadedAt: rel(-41),
    },
    {
      id: "doc-zara-birth",
      playerId: "player-zara",
      type: "birth",
      name: "zara-birth-certificate.pdf",
      sizeKb: 498,
      uploadedAt: rel(-41),
    },
    {
      id: "doc-zara-consent",
      playerId: "player-zara",
      type: "consent",
      name: "zara-parental-consent.pdf",
      sizeKb: 199,
      uploadedAt: rel(-41),
    },
    {
      id: "doc-zara-photo",
      playerId: "player-zara",
      type: "photo",
      name: "zara-photo.jpg",
      sizeKb: 146,
      uploadedAt: rel(-41),
    },
    {
      id: "doc-zara-school",
      playerId: "player-zara",
      type: "school",
      name: "zara-school-report.pdf",
      sizeKb: 1104,
      uploadedAt: rel(-12),
    },
  ]

  /* ---------------- Applications ---------------- */
  let seq = 0
  const refChars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  function ref() {
    // deterministic refs for seeds
    seq += 1
    let s = ""
    for (let i = 0; i < 5; i++)
      s += refChars[(seq * 7 + i * 11 + seq * i * 3) % refChars.length]
    return "GFA-" + year + "-" + s
  }
  function ev(
    status: AppStatus,
    days: number,
    hhmm: string,
    by: Actor,
    note?: string
  ): AppEvent {
    return { status: status, at: at(days, hhmm), by: by, note: note || "" }
  }
  function docsFor(
    playerId: string,
    types: DocTypeId[],
    statuses?: AppDocStatus[]
  ): AppDoc[] {
    return types.map(function (t, i) {
      const d = documents.filter(function (x) {
        return x.playerId === playerId && x.type === t
      })[0]
      return d
        ? {
            docId: d.id,
            type: t,
            status: (statuses && statuses[i]) || "uploaded",
          }
        : { docId: null, type: t, status: "missing" }
    })
  }
  function paidThrough(
    items: PlanItem[],
    ids: string[],
    days: number
  ): PlanItem[] {
    items.forEach(function (it) {
      if (ids.indexOf(it.id) > -1) {
        it.status = "paid"
        it.paidAt = rel(days)
      }
    })
    return items
  }
  function app(o: AppSeed): Application {
    const l = listing(o.listingId)
    const a = {
      id: o.id,
      ref: o.status === "draft" ? null : ref(),
      familyId: o.familyId || null,
      listingId: o.listingId,
      intakeId: l.intakes[o.intake || 0].id,
      playerId: o.playerId || null,
      applicant: o.applicant || null,
      status: o.status,
      events: o.events || [],
      createdAt:
        o.createdAt || (o.events && o.events[0] ? o.events[0].at : at(-1)),
      answers: o.answers || {},
      documents: o.documents || [],
      optional: o.optional || [],
      payment: null as Application["payment"],
      lastStep: o.lastStep || null,
    }
    if (o.plan) {
      const items = FLOW.paymentPlan(
        l,
        l.intakes[o.intake || 0],
        o.plan.from,
        a.optional
      )
      a.payment = {
        items: o.plan.paid
          ? paidThrough(items, o.plan.paid, o.plan.paidDays ?? 0)
          : items,
        createdAt: o.plan.from,
      }
    }
    return a
  }

  const fam = "parent-amara"
  let applications: Application[] = [
    app({
      id: "app-tobi-valencia",
      familyId: fam,
      playerId: "player-tobi",
      listingId: "valencia-u16-season",
      status: "under_review",
      events: [
        ev("submitted", -6, "10:12", "family"),
        ev("under_review", -4, "09:30", "academy"),
      ],
      answers: {
        club: "Trafford Rovers U16 — county league, captain",
        why: "Tobi wants two sessions a day and regular video feedback. The residence means he can train full time.",
        position: "Midfielder",
      },
      documents: docsFor(
        "player-tobi",
        ["passport", "birth", "medical", "consent", "cv"],
        ["accepted", "accepted", "uploaded", "uploaded", "uploaded"]
      ),
      optional: ["transfers"],
    }),
    app({
      id: "app-tobi-barcelona",
      familyId: fam,
      playerId: "player-tobi",
      listingId: "barcelona-school-season",
      status: "enrollment_pending",
      events: [
        ev("submitted", -30, "19:40", "family"),
        ev("under_review", -27, "11:02", "academy"),
        ev("accepted", -12, "15:18", "academy"),
        ev("enrollment_pending", -10, "09:05", "academy"),
      ],
      answers: {
        club: "Trafford Rovers U16",
        why: "We want a program that keeps school and football on one timetable.",
        grade: "Year 11",
      },
      documents: docsFor(
        "player-tobi",
        ["passport", "birth", "medical", "consent", "school"],
        ["accepted", "accepted", "accepted", "accepted", "accepted"]
      ),
      optional: ["transfers"],
      plan: { from: rel(2) },
    }),
    app({
      id: "app-tobi-munich",
      familyId: fam,
      playerId: "player-tobi",
      listingId: "munich-performance-term",
      status: "rejected",
      events: [
        ev("submitted", -21, "20:15", "family"),
        ev("under_review", -19, "08:40", "academy"),
        ev(
          "rejected",
          -14,
          "17:22",
          "academy",
          "This term is for players with academy or national-team experience. We’d welcome a new application after another season."
        ),
      ],
      answers: {
        club: "Trafford Rovers U16",
        why: "Looking for a high-intensity block before the season.",
        video: "https://video.example.com/tobi-highlights",
      },
      documents: docsFor("player-tobi", [
        "passport",
        "birth",
        "medical",
        "consent",
        "cv",
      ]),
    }),
    app({
      id: "app-tobi-madrid",
      familyId: fam,
      playerId: "player-tobi",
      listingId: "madrid-half-season",
      status: "draft",
      createdAt: at(-1, "21:30"),
      events: [],
      answers: { club: "Trafford Rovers U16" },
      lastStep: 3,
      documents: docsFor("player-tobi", [
        "passport",
        "birth",
        "medical",
        "consent",
      ]),
    }),
    app({
      id: "app-zara-porto",
      familyId: fam,
      playerId: "player-zara",
      listingId: "porto-club-academy",
      status: "enrolled",
      events: [
        ev("submitted", -40, "18:30", "family"),
        ev("under_review", -39, "10:00", "academy"),
        ev("accepted", -36, "12:45", "academy"),
        ev("enrollment_pending", -35, "09:10", "academy"),
        ev("enrolled", -34, "19:02", "family"),
      ],
      answers: {
        club: "Manchester Belles U14",
        why: "Extra coaching during the family’s time in Porto.",
      },
      documents: docsFor(
        "player-zara",
        ["birth", "consent", "photo"],
        ["accepted", "accepted", "accepted"]
      ).concat([
        {
          docId: null,
          type: "medical",
          status: "accepted",
          name: "Club medical check (in person)",
        },
      ]),
      plan: {
        from: rel(-35),
        paid: ["registration", "month-1"],
        paidDays: -34,
      },
    }),
    app({
      id: "app-zara-lyon",
      familyId: fam,
      playerId: "player-zara",
      listingId: "lyon-girls-academy",
      status: "info_required",
      events: [
        ev("submitted", -9, "17:55", "family"),
        ev("under_review", -7, "09:20", "academy"),
        ev(
          "info_required",
          -5,
          "14:10",
          "academy",
          "Please upload a medical certificate signed in the last 6 months so we can finish the review."
        ),
      ],
      answers: {
        club: "Manchester Belles U14",
        why: "Zara wants to study in France and train with a girls’ academy every day.",
        french: "Beginner",
      },
      documents: docsFor(
        "player-zara",
        ["passport", "birth", "medical", "consent", "school"],
        ["accepted", "accepted", "missing", "uploaded", "uploaded"]
      ),
    }),
    app({
      id: "app-zara-milan",
      familyId: fam,
      playerId: "player-zara",
      listingId: "milan-youth-day",
      status: "cancelled",
      events: [
        ev("submitted", -18, "12:00", "family"),
        ev(
          "cancelled",
          -15,
          "08:45",
          "family",
          "We chose a program closer to home."
        ),
      ],
      answers: {
        club: "Manchester Belles U14",
        why: "Weekend sessions during a family move.",
      },
      documents: docsFor("player-zara", ["birth", "medical", "consent"]),
    }),
    app({
      id: "app-zara-lisbon",
      familyId: fam,
      playerId: "player-zara",
      listingId: "lisbon-girls-day",
      status: "submitted",
      intake: 1,
      events: [ev("submitted", -1, "20:05", "family")],
      answers: {
        club: "Manchester Belles U14",
        why: "A girls-only program with more touches on the ball.",
      },
      documents: docsFor(
        "player-zara",
        ["birth", "medical", "consent"],
        ["uploaded", "missing", "uploaded"]
      ),
    }),
  ]

  /* Other families — what the host sees in the Valencia pipeline. */
  function other(o: OtherSeed): Application {
    return app({
      id: o.id,
      listingId: o.listingId,
      status: o.status,
      intake: 0,
      events: o.events,
      applicant: o.applicant,
      answers: o.answers,
      plan: o.plan,
      documents: (
        ["passport", "birth", "medical", "consent", "cv"] as DocTypeId[]
      ).map(function (t, i): AppDoc {
        return {
          docId: "ext-" + o.id + "-" + t,
          type: t,
          status: (o.docStatus && o.docStatus[i]) || "uploaded",
          name: o.applicant.first.toLowerCase() + "-" + t + ".pdf",
        }
      }),
    })
  }
  const P = function (
    first: string,
    last: string,
    age: number,
    nationality: string,
    position: string,
    foot: string,
    heightCm: number,
    club: string,
    level: Applicant["level"],
    guardian?: string | null
  ): Applicant {
    return {
      first: first,
      last: last,
      name: first + " " + last,
      initials: first[0] + last[0],
      dob: D.addDays(D.addYears(today, -age), -45),
      nationality: nationality,
      position: position,
      foot: foot,
      heightCm: heightCm,
      club: club,
      level: level,
      guardian: guardian
        ? {
            name: guardian,
            email: guardian.split(" ")[0].toLowerCase() + "@example.com",
          }
        : null,
      video: "https://video.example.com/" + first.toLowerCase() + "-highlights",
    }
  }
  const U16 = "valencia-u16-season",
    U19 = "valencia-u19-term"
  applications = applications.concat([
    other({
      id: "app-h-luca",
      listingId: U16,
      status: "submitted",
      applicant: P(
        "Luca",
        "Moretti",
        15,
        "Italian",
        "Central midfielder",
        "Right",
        170,
        "ASD Torino Nord U16",
        "advanced",
        "Giulia Moretti"
      ),
      events: [ev("submitted", -2, "18:20", "family")],
      answers: {
        club: "ASD Torino Nord U16 — regional league",
        why: "Wants to learn Spanish football and train twice a day.",
        position: "Midfielder",
      },
    }),
    other({
      id: "app-h-samuel",
      listingId: U16,
      status: "submitted",
      applicant: P(
        "Samuel",
        "Mensah",
        16,
        "Ghanaian",
        "Striker",
        "Right",
        178,
        "Accra City Juniors U17",
        "advanced",
        "Kofi Mensah"
      ),
      events: [ev("submitted", -1, "07:45", "family")],
      answers: {
        club: "Accra City Juniors U17",
        why: "Scored 18 goals last season and is ready for a full-time environment.",
        position: "Forward",
      },
    }),
    other({
      id: "app-h-diego",
      listingId: U16,
      status: "under_review",
      applicant: P(
        "Diego",
        "Álvarez",
        14,
        "Mexican",
        "Left back",
        "Left",
        165,
        "Club Pumitas U15",
        "advanced",
        "Lucía Álvarez"
      ),
      events: [
        ev("submitted", -5, "22:10", "family"),
        ev("under_review", -3, "10:15", "academy"),
      ],
      answers: {
        club: "Club Pumitas U15",
        why: "Family is relocating to Valencia for a year.",
        position: "Defender",
      },
    }),
    other({
      id: "app-h-noah",
      listingId: U16,
      status: "info_required",
      applicant: P(
        "Noah",
        "Schmidt",
        15,
        "German",
        "Goalkeeper",
        "Right",
        183,
        "SV Lindenau U16",
        "advanced",
        "Anna Schmidt"
      ),
      events: [
        ev("submitted", -8, "16:00", "family"),
        ev("under_review", -6, "09:00", "academy"),
        ev(
          "info_required",
          -2,
          "11:30",
          "academy",
          "Please send a recent full-match video so our goalkeeper coach can assess distribution."
        ),
      ],
      answers: {
        club: "SV Lindenau U16",
        why: "Wants daily goalkeeper coaching.",
        position: "Goalkeeper",
      },
    }),
    other({
      id: "app-h-karim",
      listingId: U16,
      status: "accepted",
      applicant: P(
        "Karim",
        "Haddad",
        16,
        "Moroccan",
        "Right winger",
        "Left",
        174,
        "Wydad Youth U17",
        "advanced",
        "Samir Haddad"
      ),
      events: [
        ev("submitted", -12, "13:30", "family"),
        ev("under_review", -10, "09:40", "academy"),
        ev("accepted", -1, "17:05", "academy"),
      ],
      answers: {
        club: "Wydad Youth U17",
        why: "Looking for more competitive fixtures.",
        position: "Forward",
      },
      docStatus: ["accepted", "accepted", "accepted", "accepted", "accepted"],
    }),
    other({
      id: "app-h-oliver",
      listingId: U16,
      status: "enrollment_pending",
      applicant: P(
        "Oliver",
        "Bennett",
        14,
        "British",
        "Centre back",
        "Right",
        176,
        "Bristol Harbour U15",
        "advanced",
        "Claire Bennett"
      ),
      events: [
        ev("submitted", -20, "19:10", "family"),
        ev("under_review", -18, "10:30", "academy"),
        ev("accepted", -6, "12:00", "academy"),
        ev("enrollment_pending", -3, "09:15", "academy"),
      ],
      answers: {
        club: "Bristol Harbour U15",
        why: "A season abroad before GCSEs.",
        position: "Defender",
      },
      plan: { from: rel(-3) },
      docStatus: ["accepted", "accepted", "accepted", "accepted", "accepted"],
    }),
    other({
      id: "app-h-mateo",
      listingId: U19,
      status: "enrolled",
      applicant: P(
        "Mateo",
        "Rossi",
        18,
        "Italian",
        "Central midfielder",
        "Right",
        179,
        "Pro Sesto U19",
        "advanced",
        null
      ),
      events: [
        ev("submitted", -34, "15:00", "family"),
        ev("under_review", -32, "10:00", "academy"),
        ev("accepted", -20, "16:45", "academy"),
        ev("enrollment_pending", -18, "09:00", "academy"),
        ev("enrolled", -10, "21:12", "family"),
      ],
      answers: {
        club: "Pro Sesto U19",
        why: "A structured block before university.",
      },
      plan: {
        from: rel(-18),
        paid: ["registration", "deposit"],
        paidDays: -10,
      },
      docStatus: ["accepted", "accepted", "accepted", "accepted", "accepted"],
    }),
    other({
      id: "app-h-yusuf",
      listingId: U19,
      status: "enrolled",
      applicant: P(
        "Yusuf",
        "Demir",
        17,
        "Turkish",
        "Striker",
        "Right",
        181,
        "Kadıköy Spor U19",
        "advanced",
        "Emre Demir"
      ),
      events: [
        ev("submitted", -40, "12:20", "family"),
        ev("under_review", -38, "09:30", "academy"),
        ev("accepted", -25, "14:00", "academy"),
        ev("enrollment_pending", -24, "09:00", "academy"),
        ev("enrolled", -15, "18:40", "family"),
      ],
      answers: {
        club: "Kadıköy Spor U19",
        why: "Physical block and match minutes.",
      },
      plan: {
        from: rel(-24),
        paid: ["registration", "deposit", "balance"],
        paidDays: -15,
      },
      docStatus: ["accepted", "accepted", "accepted", "accepted", "accepted"],
    }),
    other({
      id: "app-h-jonas",
      listingId: U19,
      status: "rejected",
      applicant: P(
        "Jonas",
        "Berg",
        18,
        "Norwegian",
        "Winger",
        "Left",
        177,
        "Bergen Nord U19",
        "intermediate",
        null
      ),
      events: [
        ev("submitted", -9, "10:05", "family"),
        ev("under_review", -7, "09:10", "academy"),
        ev(
          "rejected",
          -4,
          "15:30",
          "academy",
          "The term is full for wide players. We’d be glad to see an application for the next intake."
        ),
      ],
      answers: {
        club: "Bergen Nord U19",
        why: "Wants a term of full-time training.",
      },
    }),
  ])

  /* ---------------- Messages (one thread per application) ---------------- */
  const ACAD = "Marta Ruiz · Valencia International"
  const threads: Record<string, ThreadMessage[]> = {
    "app-tobi-valencia": [
      {
        from: "academy",
        author: ACAD,
        at: at(-4, "09:34"),
        text: "Hi Amara, thanks for Tobi’s application. Our coaches are watching his video this week and we’ll reply by Friday.",
      },
      {
        from: "family",
        author: "Amara Okafor",
        at: at(-4, "11:05"),
        text: "Thank you! Tobi is happy to join a video call if that helps.",
      },
      {
        from: "academy",
        author: ACAD,
        at: at(-3, "16:20"),
        text: "A short call would be great. We’ll suggest times once the coaches have finished the review.",
      },
    ],
    "app-tobi-barcelona": [
      {
        from: "academy",
        author: "Jordi Puig · Barcelona Elite Academy",
        at: at(-12, "15:20"),
        text: "We’re pleased to offer Tobi a place for the upcoming season. The payment request is now in your application.",
      },
      {
        from: "family",
        author: "Amara Okafor",
        at: at(-11, "08:10"),
        text: "Fantastic news, thank you! Is the school uniform included?",
      },
      {
        from: "academy",
        author: "Jordi Puig · Barcelona Elite Academy",
        at: at(-11, "12:45"),
        text: "Yes, the uniform is included in the season fee. The welcome pack follows once the deposit is paid.",
      },
    ],
    "app-tobi-munich": [
      {
        from: "academy",
        author: "Lena Vogt · Munich Performance Academy",
        at: at(-14, "17:25"),
        text: "Thank you for applying. This term is for players with academy experience, but Tobi’s passing range stood out and we’d welcome a new application next season.",
      },
    ],
    "app-zara-porto": [
      {
        from: "academy",
        author: "Rui Costa · Porto Atlântico FC",
        at: at(-34, "19:30"),
        text: "Welcome to the club, Zara! Sessions are Tuesday and Thursday at 17:30. Bring shin pads and a water bottle.",
      },
      {
        from: "family",
        author: "Amara Okafor",
        at: at(-33, "09:00"),
        text: "Thank you, she can’t wait to start.",
      },
    ],
    "app-zara-lyon": [
      {
        from: "academy",
        author: "Claire Martin · Lyon Rive Gauche FC",
        at: at(-5, "14:12"),
        text: "Hello Amara, Zara’s profile looks great. Please upload a medical certificate signed in the last 6 months so we can finish the review.",
      },
    ],
    "app-h-luca": [
      {
        from: "family",
        author: "Giulia Moretti",
        at: at(-2, "18:25"),
        text: "Hello, Luca can travel for an assessment day if needed.",
      },
    ],
    "app-h-noah": [
      {
        from: "academy",
        author: ACAD,
        at: at(-2, "11:32"),
        text: "Please send a recent full-match video so our goalkeeper coach can assess distribution.",
      },
    ],
    "app-h-oliver": [
      {
        from: "academy",
        author: ACAD,
        at: at(-3, "09:20"),
        text: "Oliver’s enrollment payment request is ready. The registration fee and deposit confirm his place.",
      },
      {
        from: "family",
        author: "Claire Bennett",
        at: at(-2, "20:40"),
        text: "Thanks Marta, we’ll pay this week.",
      },
    ],
    "app-h-karim": [
      {
        from: "academy",
        author: ACAD,
        at: at(-1, "17:10"),
        text: "We’d love to offer Karim a place. We’ll send the enrollment payment request shortly.",
      },
    ],
  }

  /* A draft listing the host is still building (shows the Draft state). */
  const hostListings: HostListing[] = [
    {
      id: "valencia-u13-term",
      academyId: "valencia",
      title: "U12–13 Foundation Term",
      status: "draft",
      type: "residential",
      level: "foundation",
      gender: "mixed",
      ageMin: 12,
      ageMax: 13,
      durationWeeks: 12,
      sessionsPerWeek: 8,
      hoursPerWeek: 12,
      summary:
        "A first residential term for younger players, with a lighter weekly load.",
      methodology: "",
      competition: "",
      fees: {
        amount: 2600,
        per: "term",
        registrationFee: 150,
        deposit: { kind: "percent", value: 25 },
        schedule: "deposit_balance",
        balanceDueDays: 21,
      },
      includes: ["coaching", "accommodation", "meals", "kit", "insurance"],
      optional: [],
      accommodation: "included",
      accommodationNote: "Shared rooms on the supervised U13 floor.",
      education: "none",
      educationNote: "",
      requirements: ["Aged 12–13 on the start date"],
      documents: ["passport", "birth", "medical", "consent"],
      gallery: [academyPhoto("card-group.jpg"), academyPhoto("field-goal.jpg")],
      alt: "Young players listening to a coach",
      sponsored: false,
      views30d: 0,
      reviewSummary: {
        count: 0,
        avg: 0,
        areas: {
          training: 0,
          communication: 0,
          facilities: 0,
          organization: 0,
        },
      },
      intakeDraft: [{ monthsAhead: 5, capacity: 20 }],
      wizardStep: 6,
    },
  ]

  return {
    parent: parent,
    players: players,
    host: host,
    documents: documents,
    applications: applications,
    threads: threads,
    hostListings: hostListings,
  }
}
