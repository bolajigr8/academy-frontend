/*
 * Copy for the sign-in and registration pages, taken verbatim from login.html and
 * register.html of the prototype (curly quotes included). Kept apart from copy.ts,
 * which mirrors js/amk-copy.js byte for byte.
 */
export const AUTH = {
  login: {
    title: "Sign in",
    description:
      "Sign in to Golafly Academy to manage saved academies, applications and enrollments.",
    panelTitle: "Welcome back.",
    panelText:
      "Pick up where you left off: saved academies, applications and messages are all in one place.",
    newHere: "New here?",
    createAccount: "Create an account",
    demoLabel: "Live prototype · demo accounts",
    demoGroup: "Demo accounts",
    demoFamily: {
      initials: "AO",
      name: "Continue as Amara",
      sub: "Family · parent of Tobi (15) and Zara (13)",
    },
    demoHost: {
      initials: "MR",
      name: "Continue as Marta",
      sub: "Academy · Valencia International Football Academy",
    },
    or: "or sign in with email",
    email: "Email",
    password: "Password",
    showPassword: "Show password",
    hidePassword: "Hide password",
    keepSignedIn: "Keep me signed in",
    forgot: "Forgot password?",
    submit: "Sign in",
    hint: "Prototype: nothing is sent. Emails that mention “academy” sign in to the academy demo.",
    errors: {
      email: "Enter an email address like name@example.com",
      password: "Enter your password",
    },
  },
  register: {
    title: "Create an account",
    description:
      "Create a family account to apply to football academies, or list your academy on Golafly Academy.",
    panelFamily: {
      title: "One profile. Every application.",
      text: "Create a family account, add one or more players and apply to academies with a reusable football profile.",
    },
    panelAcademy: {
      title: "List your academy.",
      text: "Publish programs, review applicants and collect enrollment payments. Your listing goes live after Golafly verifies your documents.",
    },
    haveOne: "Already have one?",
    signIn: "Sign in",
    roleLegend: "I’m signing up as",
    roleFamily: { label: "A family", sub: "Parent, guardian or adult player" },
    roleAcademy: {
      label: "An academy or club",
      sub: "List programs and review applicants",
    },
    org: "Academy or club name",
    first: "First name",
    last: "Last name",
    yourRole: "Your role",
    yourRoleHint: "For example: academy director, head of recruitment",
    email: "Email",
    workEmail: "Work email",
    password: "Password",
    passwordHint:
      "At least 8 characters, with upper and lower case letters and a number.",
    strength: ["Too short", "Weak", "Fair", "Good", "Strong"],
    country: "Country",
    countryPlaceholder: "Choose a country",
    countryOther: "Another country",
    authority:
      "I can act on behalf of this organization and will provide verification documents.",
    termsBefore: "I agree to the ",
    terms: "terms",
    termsMiddle: " and ",
    privacy: "privacy policy",
    termsAfter: ".",
    submitFamily: "Create family account",
    submitAcademy: "Create academy account",
    hint: "Prototype: nothing is sent or stored on a server.",
    errors: {
      org: "Enter the academy or club name",
      first: "Enter your first name",
      last: "Enter your last name",
      email: "Enter an email address like name@example.com",
      password:
        "Use at least 8 characters with upper and lower case letters and a number",
      country: "Choose a country",
      authority: "Confirm you can act for this organization",
      terms: "Accept the terms to continue",
    },
    doneFamily: {
      title: "Account created",
      text: "Next: add a player profile you can reuse for every application. In this prototype you’ll continue as the demo family.",
      cta: "Set up player profiles",
    },
    doneAcademy: {
      title: "Academy account created",
      text: "Next: complete your academy profile and upload verification documents. In this prototype you’ll continue as the demo academy, Valencia International.",
      cta: "Go to the academy dashboard",
    },
  },
} as const
