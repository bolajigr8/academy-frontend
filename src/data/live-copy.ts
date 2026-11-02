/*
 * Strings the prototype does not contain, needed only because the backend
 * returns values the prototype never had. Each one is derived from the backend
 * contract or the sync guide (their status labels are the business's own
 * wording). Kept here, flagged, so they are easy to review or replace.
 */
export const LIVE = {
  /** Listing statuses the prototype has no label for (sync guide, section 9) */
  listingStatus: {
    paused: "Paused",
    archived: "Archived",
  },
  /** Academy verification the prototype has no badge for (sync guide, section 9) */
  verificationRejected: "Rejected",
  /** Fee unit for payment_frequency "yearly" (the prototype has season/term/program/week/month) */
  perYear: "year",
  /** Organization type choice at sign-up (contract section 2: club | independent_academy) */
  organizationType: {
    legend: "Organization type",
    club: "Club",
    independent_academy: "Independent academy",
    error: "Choose the organization type",
  },
  /** Club profile when the organization has no academy yet (contract section 4) */
  noAcademy: {
    title: "No academy profile yet",
    text: "Your organization is registered. An academy profile with its location and facilities is needed before you can publish listings.",
  },
  /** Listing editor rules the prototype has no message for (contract section 6) */
  editor: {
    chooseAcademy: "Choose the academy this program belongs to",
    ages: "Ages must be whole numbers from 3 to 99, the maximum not below the minimum",
    depositAbovePrice: "The deposit cannot be more than the price.",
    duration: "Duration must be a whole number from 1 to 520",
    choiceOptions: "A choice question needs 2 to 20 options",
    questionText: "Write the question",
    imageType: "Photos must be JPEG, PNG or WebP",
    /** the size limit (lib/images.ts MAX_IMAGE_BYTES) */
    imageTooBig: (name: string, size: string) =>
      `${name} is ${size}. Photos must be 600 KB or smaller: compress or resize it, then add it again.`,
    imagesTooBig: (n: number) =>
      `${n} photos are larger than 600 KB and were not added. Compress or resize them, then add them again.`,
    imageLimitHint: "JPEG, PNG or WebP, up to 600 KB each.",
    trainingFrequency: "Say how often the players train",
    requirements: "Add at least one entry requirement",
  },
  /** Listing editor controls for backend fields the prototype has no control for */
  editorUi: {
    academy: "Academy",
    trainingFrequency: "Training frequency",
    trainingFrequencyHint: "For example “10 sessions per week”",
    requirementsHint:
      "What a player needs to be accepted, one per line. Golafly needs at least one before review.",
    terms: "Terms",
    termsHint: "Anything families agree to when they apply.",
    schedule: "Weekly schedule",
    scheduleHint:
      "Times or a short note for each training day. Leave other days empty.",
    scheduleExample:
      "For example: Monday “17:00–19:00 training”, Wednesday “17:00–19:00 training”, Saturday “Match day”. Leave rest days empty.",
    schedulePlaceholder: "e.g. 17:00–19:00 training",
    /** optional_services is a list of text in the API (no price field, contract section 6) */
    optionalHint:
      "Extras families can add, such as an airport transfer or private coaching. Golafly lists them as text and does not add them to the fee: if an extra costs more, write its price in the text, for example “Airport transfer (€80 each way)”.",
    addOptional: "Add a service",
    saveOnly: "Save",
    saved: "Changes saved.",
    includedSync:
      "The Accommodation and Schooling chips always match the two answers just above, which families can filter search by.",
    days: {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
    },
    duration: "Program length",
    durationUnit: "Unit",
    currency: "Currency",
    frequency: "How is the fee charged?",
    fee: "Fee",
    registration: "Registration fee",
    deposit: "Deposit",
    depositHint: "Leave empty for no deposit (pay in full).",
    placesHint: "Leave places empty for no limit.",
    addPhotos: "Add photos",
    removePhoto: (n: number) => `Remove photo ${n}`,
    photosLabel: "Photos",
    cover: "Cover",
    questionType: "Answer type",
    questionTypes: {
      text: "Short answer",
      long_text: "Long answer",
      yes_no: "Yes or no",
      choice: "Choice from a list",
    },
    required: "Required",
    options: "Options",
    option: "Option",
    addOption: "Add option",
    removeQuestion: (n: number) => `Remove question ${n}`,
    previewLater:
      "The full page preview appears here once public listing pages are connected.",
    saving: "Saving…",
  },
  /** Organization and academy forms (contract sections 3 and 4; no prototype design) */
  profileForm: {
    pageTitle: "Edit profile",
    pageSubtitle: "Your organization and the academy shown on every listing",
    edit: "Edit",
    createAcademy: "Create academy profile",
    organization: "Organization",
    organizationSub: "The club or company that runs the academy",
    academy: "Academy profile",
    academySub: "Shown on every listing you publish",
    newAcademySub:
      "Create the academy profile families will see on your listings",
    save: "Save",
    saved: "Changes saved.",
    created: "Academy profile created.",
    nothingChanged: "No changes to save.",
    fields: {
      orgName: "Organization name",
      legalName: "Legal name",
      type: "Organization type",
      country: "Country",
      registration: "Registration number",
      website: "Website",
      websiteHint: "Full address, for example https://club.com",
      contactEmail: "Contact email",
      contactPhone: "Contact phone",
      academyName: "Academy name",
      description: "About the academy",
      city: "City",
      address: "Address",
      latitude: "Latitude",
      longitude: "Longitude",
      mapHint:
        "Map position. Both or neither, for example 40.4168 and -3.7038.",
      facilities: "Facilities",
      facility: "Facility",
      addFacility: "Add facility",
      policies: "Policies",
      logo: "Logo",
      cover: "Cover image",
      gallery: "Gallery",
      galleryHint: "JPEG, PNG or WebP. The first photo is the main one.",
      choose: "Choose file",
      replace: "Replace",
    },
    errors: {
      orgName: "Enter the organization name",
      academyName: "Enter the academy name",
      country: "Choose a country",
      city: "Enter the city",
      website: "Enter a full web address, starting with https://",
      email: "Enter a valid email address",
      phone: "Enter a valid phone number",
      latitude: "Latitude is a number from -90 to 90",
      longitude: "Longitude is a number from -180 to 180",
      bothCoordinates: "Enter both latitude and longitude, or neither",
    },
  },
  /** Academy verification on the profile (contract section 11; offline in the MVP) */
  verification: {
    pending: "Golafly will contact you to verify your academy.",
    rejectedReply: "Reply to contact@golafly.com",
    decided: (date: string) => `Last decision ${date}`,
  },
  /** Listing submission and status actions (contract section 12) */
  listingStatus2: {
    /** the contract asks to name the last step this way */
    submitStep: "Submit for review",
    submit: "Submit for review",
    submitting: "Submitting…",
    missingTitle: "Complete these before submitting",
    goToStep: (n: number) => `Go to step ${n}`,
    inReview:
      "Waiting for Golafly’s review. You will be emailed when it is decided.",
    rejectedLead: "Golafly asked for changes:",
    rejectedNext: "Fix it, then submit for review again.",
    paused: "Paused: hidden from search until you resume it.",
    archived: "Archived: this listing is closed for good.",
    backToReview:
      "Saved. The price, age range or requirements changed, so the listing went back to Golafly for review.",
    pause: "Pause",
    resume: "Resume",
    archive: "Archive",
    archiveTitle: "Archive this listing?",
    archiveText:
      "It leaves search and is closed for good. This cannot be undone. A draft can be deleted instead.",
    archiveConfirm: "Archive listing",
    cancel: "Cancel",
  },
  /** Player profiles (week 2 part 1, section 3; the prototype's dialog had 6 fields) */
  players: {
    add: "Add player",
    edit: "Edit profile",
    createTitle: "New player profile",
    editTitle: "Edit player profile",
    emptyTitle: "No player profiles yet",
    emptyText:
      "Add a profile for yourself or for each child you apply for. You fill it in once and reuse it for every application.",
    neededLead: "Needed before applying:",
    readyNote: "Complete: ready to use in applications.",
    /** is_complete counts only options.required_fields (contract part 1, §2-3): documents are per application */
    /** reuse a profile file as an application document (same paper, two names) */
    fromProfile: (first: string) =>
      first
        ? `Use the one from ${first}’s profile`
        : "Use the one from the profile",
    fromProfileDone: "Document added from the player’s profile.",
    docsNote:
      "Each program asks for its own documents; a passport, medical certificate or CV saved here can be added to an application in one tap.",
    save: "Save profile",
    created: "Player profile created.",
    saved: "Player profile saved.",
    deleted: "Player profile deleted.",
    remove: "Delete profile",
    removeTitle: "Delete this player profile?",
    removeText:
      "The profile and its files are deleted. Draft applications for this player are deleted too.",
    removeConfirm: "Delete profile",
    cancel: "Cancel",
    download: "Download",
    notUploaded: "Not uploaded",
    uploaded: "Uploaded",
    fileType: (photo: boolean) =>
      photo
        ? "The photo must be JPEG, PNG or WebP"
        : "Files must be PDF, JPEG or PNG",
    minorDocs:
      "A player under 18 cannot upload a passport, medical certificate or CV on their own profile. A parent or guardian adds them from their own account.",
    replace: "Replace",
    upload: "Upload",
    removeFile: "Remove",
    noVideos: "No video links yet.",
    noClubs: "No previous clubs added.",
    sections: {
      who: "Who is this player?",
      football: "Football",
      contact: "Contact and documents",
      emergency: "Emergency contact and guardian",
    },
    relationships: {
      self: "Me (I am the player)",
      parent: "My child (parent)",
      guardian: "A player I am guardian of",
    },
    /** the family's first question when adding a player (product story) */
    who: {
      question: "Who is this player?",
      options: {
        self: "I am registering myself",
        parent: "I am registering my child as a parent",
        guardian: "I am registering a child as a guardian",
      },
      selfExists:
        "You already have your own player profile, so this one is for a child.",
    },
    /** relationship as shown on a player card */
    relationshipShort: {
      self: "Self",
      parent: "Parent",
      guardian: "Guardian",
    } as Record<string, string>,
    minorSelf:
      "Under 18: a parent or guardian must continue from their own account to upload documents and apply.",
    myPlayers: "My players",
    complete: "Complete",
    incomplete: "Incomplete",
    missing: "Missing:",
    editPlayer: "Edit player",
    startApplication: "Start application",
    chooseProgram: "Choose a program",
    chooseProgramText:
      "Programs open for applications now. Pick one to apply for this player.",
    noPrograms: "No programs are open for applications right now.",
    fields: {
      owner_relationship: "This profile is for",
      first_name: "First name",
      last_name: "Last name",
      date_of_birth: "Date of birth",
      gender: "Gender",
      nationality: "Nationality",
      country_of_residence: "Country of residence",
      city: "City",
      email: "Player email",
      phone: "Player phone",
      passport_number: "Passport number",
      primary_position: "Position",
      secondary_position: "Second position",
      preferred_foot: "Preferred foot",
      height_cm: "Height (cm)",
      current_club_academy: "Current club or academy",
      previous_clubs: "Previous clubs",
      previous_club: "Club",
      add_club: "Add club",
      current_level: "Playing level",
      highlight_video_url: "Highlight video link",
      video_links: "Other video links",
      video_link: "https://…",
      add_video: "Add link",
      emergency_contact_name: "Emergency contact name",
      emergency_contact_relationship: "Relationship",
      emergency_contact_phone: "Emergency phone",
      emergency_contact_email: "Emergency email",
      guardian_name: "Guardian name",
      guardian_phone: "Guardian phone",
      profile_photo: "Profile photo",
      passport_document: "Passport",
      medical_certificate: "Medical certificate",
      player_cv: "Football CV",
    },
    errors: {
      relationship: "Choose who this player is",
      firstName: "Enter the first name",
      lastName: "Enter the last name",
      height: "Height is a whole number of centimetres, 50 to 250",
      link: "Enter a full link starting with http:// or https://",
    },
  },
  /** Public listing page and Apply start (api mode) */
  program: {
    ages: "Ages",
    duration: "Duration",
    type: "Program type",
    level: "Playing level",
    gender: "Open to",
    training: "Training",
    startsOn: "Starts",
    applyBy: "Apply by",
    placesLeft: "Places left",
    unlimited: "No limit",
    noDates: "No start dates are open right now.",
    optional: "Optional extras",
    accommodation: "Accommodation",
    education: "Schooling",
    included: "Included",
    notOffered: "Not offered",
    price: "Program fee",
    deposit: "Deposit",
    registration: "Registration fee",
    noReviews: "New · no reviews yet",
    facilities: "Facilities",
  },
  apply: {
    title: "Apply to Join",
    lead: "Choose the player and the start date. You then answer the academy's questions, upload documents and send it.",
    player: "Player",
    intake: "Start date",
    choosePlayer: "Choose a player",
    addPlayer: "Add a player profile first",
    noPlayers:
      "Add a player profile to apply. You fill it in once and reuse it for every application.",
    start: "Continue",
    signIn: "Sign in as a family to apply",
    academyAccount:
      "Academy accounts cannot apply. Sign in with a family account.",
    notComplete:
      "This profile is not complete yet; you can finish it before sending.",
    /** Added (Oct 2026 UX round): the way back from Apply */
    backToProgram: "Back to the program",
  },
  /**
   * Verification documents (part 2, section 11), shown only when
   * options.verification_documents_enabled is true (false in the MVP).
   * Labels for options.verification_document_types; other values are humanized.
   */
  verificationDocs: {
    title: "Verification documents",
    lead: "Upload the documents Golafly asked for. PDF, JPEG or PNG, up to 10 MB each.",
    type: "Document type",
    file: "File",
    upload: "Upload for review",
    chooseType: "Choose a type",
    chooseFile: "Choose a file to upload",
    uploaded: "Documents sent to Golafly for review.",
    none: "No documents uploaded yet.",
    types: {
      registration_certificate: "Registration certificate",
      proof_of_address: "Proof of address",
      club_affiliation: "Club affiliation",
    } as Record<string, string>,
    status: {
      pending: "Waiting for review",
      accepted: "Accepted",
      rejected: "Rejected",
    } as Record<string, string>,
  },
  /**
   * Search in api mode (week 1 part 2, section 14): only what the prototype
   * lacks. Filter names reuse the prototype's search copy.
   */
  search: {
    places: "Places available",
    placesHint: "Only programs with a start date that still has places",
    clubOnly: "Club Academy only",
    any: "Any",
    withIt: "Included",
    without: "Not offered",
    currency: "Currency",
    min: "Min",
    max: "Max",
    priceRange: (lo: string, hi: string) => `Price ${lo} to ${hi}`,
    priceHint: (currency: string) =>
      `Program fee in ${currency}. Programs priced in other currencies are not compared.`,
    page: (n: number, of: number) => `Page ${n} of ${of}`,
    previous: "Previous page",
    next: "Next page",
    noReviews: "New · no reviews yet",
  },
  /** Academy public profile (week 1 part 2, section 15). No prototype page: added. */
  academyProfile: {
    about: "About the academy",
    facilities: "Facilities",
    policies: "Policies",
    photos: "Photos",
    programs: "Programs",
    noPrograms: "This academy has no published programs right now.",
    officialAcademyOf: "Official academy of",
    notFoundTitle: "We couldn’t find that academy",
    notFoundText:
      "It may not be verified yet, or the link is incomplete. Browse every program instead.",
    browse: "Browse programs",
  },
  /** Added (Oct 2026 UX round): the progress bar across Apply and the draft */
  journey: {
    label: "Application steps",
    pick: "Player and start date",
    answers: "Questions",
    documents: "Documents",
    send: "Review and send",
    done: "done",
    toDo: "to do",
    allApplications: "All applications",
  },
  /** The family's applications list and dashboard (api mode) */
  applicationsList: {
    all: "All statuses",
    emptyTitle: "No applications yet",
    emptyText:
      "Applications you start appear here, with the next step for each.",
  },
  /** The family's application page (week 2 part 1 sections 5 to 7; part 2 section 13) */
  /**
   * Messages (week 2 part 2, section 14). The prototype's own wording where it
   * has one (AmInbox / AmThread); the rest is added for states it has no
   * screen for (attachments, a closed conversation, a draft).
   */
  messages: {
    title: "Messages",
    conversations: "Conversations",
    conversation: "Conversation",
    allMessages: "All messages",
    openApplication: "Open application",
    choose: "Choose a conversation",
    empty: "No messages yet. Questions about this application go here.",
    you: "You",
    youPrefix: "You: ",
    unread: "Unread",
    message: "Message",
    writeAcademy: "Write to the academy…",
    writeFamily: "Write to the family…",
    send: "Send",
    attach: "Attach a file",
    attachment: "Attachment",
    removeAttachment: "Remove attachment",
    attachTypes: "PDF, JPEG or PNG",
    attachRefused: "Attach a PDF, JPEG or PNG file.",
    closed: "This application was withdrawn, so its conversation is closed.",
    notSent: "The conversation starts once the application is sent.",
    loading: "Loading the conversation…",
  },
  /**
   * The offer message (week 2 part 2, section 12: accept takes an optional
   * message, stored as decision_reason and posted in the conversation). The
   * academy sees the standard text and can keep it or write its own.
   */
  offer: {
    ownLabel: "Message to the family",
    ownHint:
      "Filled in from the application. Read it, then change anything before you send it.",
    resetStandard: "Use the standard message",
    standard: (player: string, program: string, start: string) =>
      `Congratulations! We are pleased to offer ${player} a place in ${program}, starting ${start}. We will be in touch soon with the next steps.`,
    empty: "Write a message to the family.",
  },
  /** Week 3 part 3, sections 19-20: the money, line by line */
  money: {
    views: {
      payments: "Payments received",
      enrollments: "Enrollments",
    } as Record<string, string>,
    paidGross: "Paid by families",
    commission: "Golafly commission",
    academyNet: "Your payout",
    academyNetAdmin: "Academy payout",
    paidOut: "Paid out",
    payoutPending: "Waiting to be sent",
    outstanding: "Still to be paid",
    /** the academy's Payments page: what it is, not how the money moves */
    academySub: "Payments from families and your payouts",
    academyEmpty: "Payments appear here as families pay.",
    payoutSplit: (sent: string, coming: string) =>
      `${sent} sent · ${coming} on the way`,
    paidCount: (n: number) => (n === 1 ? "1 payment" : `${n} payments`),
    totalsFor: (currency: string) => `Totals in ${currency}`,
    noTotals: "No payments yet.",
    filters: {
      status: "Payment",
      listing: "Program",
      academy: "Academy",
      payout: "Payout",
    },
    allStatuses: "All (not cancelled)",
    allListings: "All programs",
    allAcademies: "All academies",
    allPayouts: "All payouts",
    line: "Line",
    player: "Player",
    amount: "Amount",
    payout: "Payout",
    date: "Date",
    paidOn: (d: string) => `Paid ${d}`,
    dueOn: (d: string) => `Due ${d}`,
    /** the academy's wording (week 3 part 4, section 23) */
    payoutStatus: {
      pending: "Waiting for your Stripe account",
      held: "Golafly is reviewing this payout",
      processing: "Being sent",
      paid_out: "Sent",
      failed: "Sending failed; Golafly will try again",
      cancelled: "Golafly decided not to send this payout",
      reversed: "This payout was taken back by Golafly",
    } as Record<string, string>,
    /** pending once the account is ready */
    pendingReady: "Will be sent soon",
    /** Golafly's own, shorter wording for the same statuses */
    payoutStatusAdmin: {
      pending: "Waiting to be sent",
      held: "Held",
      processing: "Being sent",
      paid_out: "Sent",
      failed: "Failed",
      cancelled: "Cancelled",
      reversed: "Reversed",
    } as Record<string, string>,
    sentOn: (d: string) => `Sent ${d}`,
    enrollmentCancelled: "Enrollment cancelled",
    none: "No payment lines here.",
    howPayout:
      "Families pay Golafly by card. Golafly keeps its commission and sends the rest, your payout, to your academy.",
    family: "Family",
    card: "Card payment",
    // transactions (admin)
    transactionsTitle: "Card payments",
    transactionsSub:
      "Every card payment families started on Stripe. Refund due: paid but not applied, refund it by hand in Stripe.",
    txViews: {
      all: "All",
      refund_due: "Refund due",
      applied: "Applied",
      pending: "Not settled",
    } as Record<string, string>,
    txSearch: "Payer’s email",
    txPayment: {
      pending: "Open",
      paid: "Paid",
      failed: "Failed",
      expired: "Expired",
    } as Record<string, string>,
    txFulfilment: {
      pending: "Not applied yet",
      applied: "Applied",
      refund_due: "Refund due",
    } as Record<string, string>,
    txNone: "No card payments here.",
    txSession: "Stripe session",
    refundsTitle: "Payments to refund",
    refundsLead:
      "Paid by card but not applied (the enrollment was cancelled meanwhile). Refund them by hand in Stripe.",
    reviewRefunds: "Review refunds",
  },
  /** Week 3 part 4, section 24: Golafly's decision on a held payout */
  payoutDecision: {
    release: "Release",
    cancel: "Cancel payout",
    releaseTitle: "Release this payout?",
    releaseText:
      "The academy is paid after all: the payout is sent at once if its Stripe account is ready, or as soon as it is. Payouts are in euros only.",
    cancelTitle: "Cancel this payout?",
    cancelText:
      "The academy is never paid this line, for example because the family was refunded by hand. This cannot be undone here.",
    note: "Why (only Golafly sees it)",
    noteError: "Write why",
    transfer: (id: string) => `Transfer ${id}`,
    attempts: (n: number) => (n === 1 ? "1 attempt" : `${n} attempts`),
    decidedBy: (name: string) => `Decided by ${name}`,
    keep: "Keep it held",
  },
  /** Week 3 part 4, section 22: the academy's payout account */
  payoutAccount: {
    title: "Your payout account",
    none: "Connect your bank account to receive your payouts.",
    connect: "Connect your bank account",
    onboarding:
      "You started Stripe’s form but have not finished it, or Stripe is still checking what you sent.",
    continue: "Continue on Stripe",
    checking:
      "Stripe is checking your details. Your payouts will start by themselves as soon as it is done.",
    restricted: (n: number) =>
      n > 0
        ? `Stripe needs ${n === 1 ? "1 more thing" : `${n} more things`} from you before payouts can be sent.`
        : "Stripe has paused payouts to this account and needs more information.",
    finish: "Finish on Stripe",
    ready:
      "Payouts are on. Your share of each payment is sent to your Stripe account automatically.",
    manage: "Change bank details",
    disconnected:
      "Golafly’s access to your Stripe account was removed, so payouts cannot be sent. Contact Golafly to reconnect.",
    contactGolafly:
      "Contact Golafly: your Stripe account cannot receive these transfers.",
    country: (country: string) =>
      `Payouts aren’t available in ${country} yet. Please contact Golafly.`,
    ownerOnly:
      "Only your organization’s owner can connect or change the payout account.",
    returning: "Checking your Stripe account…",
    refreshing: "Opening a new Stripe link…",
    lastChecked: (d: string) => `Last checked ${d}`,
    statusLabel: {
      none: "Not connected",
      onboarding: "Setup not finished",
      restricted: "Needs information",
      ready: "Payouts on",
      disconnected: "Disconnected",
    } as Record<string, string>,
  },
  /** Week 3 part 3, section 18: the page Stripe sends the family back to */
  checkout: {
    title: "Your payment",
    // the headline of each outcome (the sentences below stay as the detail)
    head: {
      confirming: "Confirming your payment",
      enrolled: "You’re in!",
      paid: "Payment received",
      cancelled: "Payment received",
      refund: "We’ll refund you",
      expired: "Nothing was paid",
      failed: "Payment didn’t go through",
      left: "Nothing was paid",
      pending: "Still confirming",
      notFound: "Payment not found",
    } as Record<string, string>,
    paidLabel: "Amount paid",
    linesTitle: "What you paid for",
    confirming: "Confirming your payment…",
    confirmingLead: "Stripe has sent you back. This takes a few seconds.",
    stillPending:
      "Your payment is still being confirmed. You will get a notification and an email as soon as it is done; there is no need to pay again.",
    paidEnrolled: (player: string) =>
      `Payment received. ${player} is enrolled.`,
    paidPart: "Payment received. Thank you!",
    paidPartLead: (amount: string) =>
      `Still to pay later: ${amount}. You will be reminded a week before each date.`,
    paidCancelled:
      "Payment received, but this enrollment has since been cancelled. Golafly will contact you about it.",
    refundDue:
      "We received your payment but could not complete it, because the enrollment was cancelled meanwhile. Golafly will contact you and refund you.",
    expired: "This payment page closed without a payment. Nothing was paid.",
    failed: "The card payment did not go through. Nothing was paid.",
    left: "You left the payment page. Nothing was paid.",
    notFound: "We could not find this payment.",
    payAgain: "Pay again",
    viewApplication: "View application",
    payments: "Payments",
    amountPaid: (amount: string) => `Amount: ${amount}`,
  },
  /** The family dashboard's to-dos (what an academy is waiting for) */
  actionNeeded: {
    info: (n: number) =>
      n === 1
        ? "An academy needs more information from you: answer its request or upload the document it asked for."
        : `${n} academies need more information from you: answer their requests or upload the documents they asked for.`,
    pay: (n: number) =>
      n === 1
        ? "A place is held for you: pay what is due now to keep it."
        : `${n} places are held for you: pay what is due now to keep them.`,
    open: "Open it",
    openFirst: "Open the first",
  },
  /** Week 3 part 2, sections 10 to 12: reviews */
  reviews: {
    categories: {
      training: "Training",
      communication: "Communication",
      facilities: "Facilities",
      organization: "Organization",
    } as Record<string, string>,
    stars: (n: number) => (n === 1 ? "1 star" : `${n} stars`),
    // the family
    writeTitle: "How was it?",
    writeLead: (academy: string) =>
      `Rate ${academy} and tell other families what to expect. Golafly checks each review before it goes public; your name shows as first name and initial.`,
    body: "Your review",
    bodyHint: "10 to 2,000 characters",
    send: "Send review",
    sent: "Review sent. It will appear once Golafly has checked it.",
    chooseRating: "Choose from 1 to 5 stars",
    bodyShort: "Write at least 10 characters",
    yours: "Your review",
    status: {
      pending: "Waiting for Golafly’s check",
      published: "Published",
      rejected: "Not published",
    } as Record<string, string>,
    rejectedWhy: (reason: string) => `Golafly’s reason: ${reason}`,
    academyReplied: "The academy’s reply",
    // public
    title: "Reviews",
    verified: "Verified enrollment",
    none: "No reviews yet. Reviews come from families with a confirmed enrollment.",
    based: (n: number) => (n === 1 ? "from 1 review" : `from ${n} reviews`),
    more: "Show more reviews",
    replyFrom: (academy: string) => `Reply from ${academy}`,
    // the academy
    portalTitle: "Reviews",
    portalSub:
      "Published reviews of your programs. You can reply once to each, publicly.",
    tabs: { reply: "To answer", all: "All" } as Record<string, string>,
    replyLabel: "Your public reply",
    replyHint:
      "Shown under the review. One reply per review; it cannot be edited.",
    replySend: "Publish reply",
    replied: "Reply published.",
    replyEmpty: "Write a reply.",
    noneToAnswer: "No review is waiting for a reply.",
    noneYet: "No published reviews yet.",
  },
  /** Week 3 part 2, section 13: the academy dashboard from the backend */
  dashboard: {
    ranges: [
      { days: 7, label: "Last 7 days" },
      { days: 30, label: "Last 30 days" },
      { days: 90, label: "Last 90 days" },
    ],
    rangeLabel: "Period",
    received: "received",
    enrolledSub: "players confirmed",
    conversionSub: (applications: number, views: number) =>
      `${applications} ${applications === 1 ? "application" : "applications"} from ${views} ${views === 1 ? "view" : "views"}`,
    noViews: "no views yet",
    enrollRate: (rate: number | null) =>
      rate === null ? "" : `${rate}% of applications enrolled`,
    revenueNone: "Nothing paid yet",
    revenueSub: "after Golafly’s fee",
    revenueSoon: "online payments arrive with the next update",
    viewsSub: "the last 8 weeks",
    reviewsToAnswer: "Reviews to answer",
    reviewsToAnswerSub: "Published reviews waiting for your reply",
    noReviewsToAnswer: "No review is waiting for a reply.",
    answer: "Reply",
    allReviews: "All reviews",
    verification: {
      verified: "is Golafly Verified.",
      club_academy: "is a Club Academy.",
      pending: "is waiting for Golafly’s check.",
      rejected: "could not be verified yet: see the note on your profile.",
    } as Record<string, string>,
    capacityNone: "No start dates with a place limit yet.",
    weekOf: (date: string) => `Week of ${date}`,
  },
  /**
   * Week 3 part 1: enrollment and the payment schedule. Paying itself arrives
   * in part 3, so no screen offers a Pay button yet.
   */
  enrollment: {
    kinds: {
      registration_fee: "Registration fee",
      deposit: "Deposit",
      full: "Full payment",
      balance: "Balance",
      installment: "Instalment",
      extra: "Extra",
    } as Record<string, string>,
    paymentStatus: {
      scheduled: "Upcoming",
      due: "Due now",
      paid: "Paid",
      overdue: "Overdue",
      cancelled: "Cancelled",
    } as Record<string, string>,
    status: {
      pending: "Waiting for payment",
      confirmed: "Enrolled",
      cancelled: "Cancelled",
    } as Record<string, string>,
    plans: {
      full: "Everything at once",
      deposit_balance: "Deposit now, balance later",
      installments: "Deposit now, then instalments",
    } as Record<string, string>,
    planHints: {
      full: "The registration fee, the full price and any extras, all due within 7 days.",
      deposit_balance:
        "The registration fee, the deposit and any extras within 7 days; the balance on the date you pick.",
      installments:
        "The registration fee, the deposit and any extras within 7 days; the rest in instalments on the dates you pick.",
    } as Record<string, string>,
    // the move (academy)
    move: "Move to enrollment",
    moveTitle: "Move to enrollment",
    moveLead: (first: string) =>
      `Choose how the family pays. The amounts come from the listing; ${first}’s place is held as soon as you send it, and the family has 7 days for the first payment.`,
    plan: "Payment plan",
    balanceDate: "Balance due on",
    installmentsTitle: "Instalments",
    installmentAmount: (n: number) => `Instalment ${n} amount`,
    installmentDate: (n: number) => `Instalment ${n} due on`,
    addInstallment: "Add an instalment",
    remove: "Remove",
    left: (amount: string) => `Left to schedule: ${amount}`,
    over: (amount: string) =>
      `Over the price by ${amount}: lower an instalment`,
    extrasTitle: "Extras (optional)",
    extrasHint:
      "Added on top of the price and due within 7 days, for example an airport transfer.",
    extraLabel: "What it is",
    extraAmount: "Amount",
    addExtra: "Add an extra",
    preview: "The family will be asked to pay",
    dueNow: "Within 7 days",
    total: "Total",
    confirmsPlace: "Confirms place",
    free: "This listing has nothing to pay: the player is enrolled as soon as you send it.",
    send: "Send the payment schedule",
    planOnlyFull:
      "This listing has no deposit smaller than its price, so only full payment is available.",
    // the enrollment (both sides)
    title: "Enrollment",
    paid: "Paid",
    outstanding: "Still to pay",
    // the family is the one who pays; the academy only waits for it
    payBy: (date: string) =>
      `Pay what is due now by ${date} to keep your place.`,
    familyDeadline: (date: string) =>
      `The family has until ${date} to pay what is due now. The place is held for them until then.`,
    familyPaysBy: (date: string) => `Family pays by ${date}`,
    /** the family's status line while waiting for payment (any plan, deposit or not) */
    pendingFamily: "Pay what is due now to confirm the place.",
    // paying arrives in part 3: the button is there, and says so when pressed
    payNow: "Pay now",
    payAmount: (amount: string) => `Pay ${amount} now`,
    payHint: "You pay by card on Stripe’s secure page, then come back here.",
    goPayments: "Go to Payments",
    viewApplication: "View application",
    cardNext: "Next: move to enrollment",
    viewAndPay: "View and pay",
    acceptedBanner: (n: number) =>
      n === 1
        ? "1 accepted player is waiting for a payment schedule. Open the card in Accepted and choose Move to enrollment."
        : `${n} accepted players are waiting for a payment schedule. Open a card in Accepted and choose Move to enrollment.`,
    showAccepted: "Show accepted",
    acceptedNext: "Next: send the family a payment schedule to hold the place.",
    confirmedOn: (date: string) => `Enrolled on ${date}.`,
    cancelledOn: (date: string, reason: string | null) =>
      `Cancelled on ${date}${reason ? `: ${reason}` : ""}.`,
    schedule: "Payment schedule",
    payment: "Payment",
    due: "Due",
    status_: "Status",
    amount: "Amount",
    paidOn: (date: string) => `Paid ${date}`,
    noRows: "Nothing to pay.",
    startsOn: (date: string) => `Starts ${date}`,
    // academy list
    tabs: {
      pending: "Waiting for payment",
      confirmed: "Enrolled",
      cancelled: "Cancelled",
    } as Record<string, string>,
    listTitle: "Payments",
    listSub:
      "Enrollments: the players you moved to enrollment and their payment schedules",
    scheduleShort: "Schedule",
    searchLabel: "Search by family or player",
    allListings: "All listings",
    empty:
      "No enrollments here yet. Move an accepted application to enrollment from its page.",
    player: "Player",
    familyCol: "Family",
    program: "Program",
    open: "Open",
    // family payments page
    kpiDue: "Due now",
    kpiDueSub: "due or overdue",
    kpiUpcoming: "Upcoming",
    kpiUpcomingSub: "later in the schedule",
    kpiPaid: "Paid",
    kpiPaidSub: "so far",
    kpiEnrollments: "Enrollments",
    kpiEnrollmentsSub: "waiting or confirmed",
    cancelPending:
      "The payment schedule is cancelled and the place held for you goes back to the academy.",
    howPoints: [
      "When an academy offers a place, it sends a payment schedule: the registration fee, the full price or a deposit, and any extras.",
      "What is due now must be paid within 7 days, or the place is released.",
      "Later payments keep their dates; you are reminded a week before each one.",
      "You can withdraw before paying anything. Once a payment is made, Golafly handles any cancellation.",
    ],
    paymentsEmpty:
      "No payments yet. When an academy offers a place, its payment schedule appears here.",
    errors: {
      planNotAvailable:
        "This listing has no deposit smaller than its price, so only full payment is available.",
      balanceDate: "Choose when the balance is due",
      date: (deadline: string, end: string | null) =>
        end
          ? `Pick a date after ${deadline} and no later than ${end} (the end of the intake)`
          : `Pick a date after ${deadline} (the first-payment deadline)`,
      installmentsNone: "Add at least one instalment",
      installmentsMax: "Up to 24 instalments",
      installmentDate: "Choose when this instalment is due",
      amount: "Enter an amount, for example 250 or 250.50",
      mustAddUp: (amount: string) =>
        `The instalments must add up to ${amount} (the price minus the deposit)`,
      extrasMax: "Up to 10 extras",
      extraLabel: "Say what the extra is",
      extraLabelLong: "Up to 100 characters",
    },
  },
  /** Added (week 2 part 1, section 5): moving a draft to another start date */
  changeIntake: {
    open: "Change",
    title: "Change the start date",
    lead: "Pick another start date of this program. The answers and documents you added are kept.",
    label: "Start date",
    save: "Save start date",
    cancel: "Cancel",
    done: "Start date changed.",
    none: "This program has no other start date open right now.",
    option: (date: string, label: string | null, places: string) =>
      [date, label, places].filter(Boolean).join(" · "),
  },
  application: {
    notFound: "Application not found.",
    reference: "Reference",
    academy: "Academy",
    program: "Program",
    starts: "Starts",
    player: "Player",
    sent: "Sent",
    summary: "Application",
    documents: "Documents",
    other: "Other document",
    upload: "Upload",
    replace: "Replace",
    remove: "Remove",
    download: "Download",
    review: {
      uploaded: "Uploaded",
      fileType: (photo: boolean) =>
        photo
          ? "The photo must be JPEG, PNG or WebP"
          : "Files must be PDF, JPEG or PNG",
      minorDocs:
        "A player under 18 cannot upload a passport, medical certificate or CV on their own profile. A parent or guardian adds them from their own account.",
      accepted: "Accepted",
      needs_update: "Needs a new version",
    },
    answers: "Your answers",
    yes: "Yes",
    no: "No",
    choose: "Choose…",
    saveAnswers: "Save answers",
    answersSaved: "Answers saved.",
    notAnswered: "Not answered",
    submitTitle: "Ready to send?",
    missingLead: "Still needed before you can send it:",
    consent: (name: string) =>
      `As ${name}'s parent or guardian, I consent to this application.`,
    submit: "Send application",
    submitted: "Application sent to the academy.",
    infoLead: "The academy asked for more information:",
    respondNote: "Message to the academy",
    respond: "Send back to the academy",
    responded: "Sent back to the academy.",
    cancel: "Withdraw application",
    cancelTitle: "Withdraw this application?",
    cancelText:
      "The academy will be told. You can apply again later if the intake is still open.",
    cancelReason: "Reason",
    cancelConfirm: "Withdraw",
    keep: "Keep it",
    cancelled: "Application withdrawn.",
    decisionLead: "The academy's message:",
    docLabels: {
      passport: "Passport or national ID",
      medical_certificate: "Medical certificate",
      player_cv: "Football CV",
      other: "Other document",
    } as Record<string, string>,
  },
  /** Academy inbox and applicant page (week 2 part 2) */
  academyApps: {
    askNewVersion: "Ask for a new version",
    parent: "Parent or guardian",
    relationship: {
      parent: "Parent",
      guardian: "Guardian",
      self: "The player",
    } as Record<string, string>,
    infoSent: "Request sent. The family has been told.",
    accepted: "Place offered. The family has been told.",
    declined: "Application declined. The family has been told.",
    flagDocs: "Documents that need a new version (optional)",
    consent: "Parent or guardian consent given",
    noDocs: "No documents uploaded.",
    reference: "Reference",
    download: "Download",
  },
  /** Pages still on sample data while the app runs on the backend (api mode) */
  sampleData:
    "Sample data: this page is not connected to the backend yet. It shows how it will look; real data arrives in a later delivery.",
  /** Deleting a draft from the listings page (DELETE /academy/portal/listings/{id}) */
  deleteDraft: {
    action: "Delete",
    title: "Delete this draft?",
    text: "The draft, its photos and its start dates are removed. This cannot be undone.",
    confirm: "Delete draft",
    cancel: "Cancel",
    done: "Draft deleted.",
  },
  /** 429 (week 2 part 1, section 1: ask the user to wait a minute) */
  tooManyAttempts: "Too many attempts. Please wait a minute and try again.",
  /** Fallback when a request fails without a message from the server */
  requestFailed: "Something went wrong. Please try again.",
} as const
