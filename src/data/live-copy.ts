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
      "For example: Monday “17:00–19:00 training”, Wednesday “17:00–19:00 training”, Saturday “Match day”. Rest days stay empty.",
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
    useStandard: "Send our standard offer message",
    standardLabel: "The family will receive:",
    ownLabel: "Your message to the family",
    ownHint:
      "Edit the standard message or write your own. Up to 2,000 characters.",
    standard: (player: string, program: string, start: string) =>
      `Congratulations! We are pleased to offer ${player} a place in the ${program}, starting ${start}. We will be in touch soon with the next steps.`,
    empty: "Write a message, or send the standard one.",
  },
  /** Added (week 2 part 1, section 5): moving a draft to another start date */
  changeIntake: {
    open: "Change",
    title: "Change the start date",
    lead: "Pick another start date of this program. The answers and documents you added stay.",
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
    respondNote: "Message to the academy (optional)",
    respond: "Send back to the academy",
    responded: "Sent back to the academy.",
    cancel: "Withdraw application",
    cancelTitle: "Withdraw this application?",
    cancelText:
      "The academy will be told. You can apply again later if the intake is still open.",
    cancelReason: "Reason (optional)",
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
