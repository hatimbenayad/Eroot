export const en = {
  common: {
    appName: 'Eroot',
    tagline: 'Live & self-paced interactive quizzes — fast, open, and free.',
    loading: 'Loading...',
    signOut: 'Sign out',
    signIn: 'Sign in',
    signUp: 'Create account',
    backHome: 'Back to home',
    unconfiguredTitle: 'Backend configuration required',
    unconfiguredDescription:
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment to enable authentication, quizzes, and live games.',
  },
  nav: {
    library: 'My Library',
    reports: 'Reports',
    joinGame: 'Join a game',
    hostSignIn: 'Host sign in',
  },
  landing: {
    heroTitle: 'Host live quizzes everyone can join in seconds.',
    heroSubtitle:
      'Build interactive quizzes with geometric high-contrast tiles, run live games with a PIN, and review instant insights — no paywalls, no accounts needed for players.',
    joinCta: 'Join with Game PIN',
    hostCta: 'Host & Create Quizzes',
    featureGridTitle: 'Built for classrooms, teams, and game nights',
    featureCreatorTitle: 'Visual Quiz Studio',
    featureCreatorDesc:
      'Three-pane creator with inline validation, drag-and-drop slides, themes, and instant preview.',
    featureLiveTitle: 'Authoritative Live Engine',
    featureLiveDesc:
      'Players join anonymously with a PIN and nickname while scores compute securely on the server.',
    featureAccessTitle: 'Accessible by Design',
    featureAccessDesc:
      'Every answer pairs colour with distinct shapes and labels, keyboard navigation, and reduced motion.',
  },
  auth: {
    title: 'Host Account',
    subtitle: 'Sign in or create an account to build and host Eroot quizzes.',
    signInTab: 'Sign in',
    signUpTab: 'Create account',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Minimum 8 characters',
    displayNameLabel: 'Display name',
    displayNamePlaceholder: 'Host name (optional)',
    submitSignIn: 'Sign in to Eroot',
    submitSignUp: 'Create host account',
    checkingSession: 'Checking your session...',
    verificationSent:
      'Account created! Check your inbox to verify your email address before signing in.',
    errors: {
      invalidEmail: 'Enter a valid email address.',
      passwordMin: 'Password must be at least 8 characters.',
      genericAuth: 'Unable to authenticate right now. Check your credentials and try again.',
    },
  },
  library: {
    title: 'My Library',
    subtitle: 'Your saved drafts and published quizzes will appear here.',
    emptyTitle: 'No quizzes yet',
    emptyDescription:
      'The three-pane Quiz Creator lands in Unit U2. Your host authentication and workspace shell are ready.',
    signedInAs: 'Signed in as',
  },
  join: {
    title: 'Join an Eroot Game',
    subtitle: 'Enter a 6–7 digit Game PIN from your host screen to play — no account required.',
    pinPlaceholder: 'Game PIN',
    comingInU4: 'Live lobby & gameplay engine unlocks in Unit U4.',
  },
  reports: {
    title: 'Reports',
    subtitle: 'Post-game analytics, difficult questions, and exports arrive in Unit U6.',
  },
  tiles: {
    optionLabel: 'Option {letter} ({shape}): {text}',
  },
} as const;

export type TranslationDictionary = typeof en;

