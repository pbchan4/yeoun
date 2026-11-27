import type { Dict } from "./ko";

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** English copy. Must have exactly the same shape as the Korean dictionary. */
export const en: Dict = {
  dateLocale: "en-US",
  tmdbLanguage: "en-US",

  common: {
    cancel: "Cancel",
    delete: "Delete",
    loading: "Loading...",
    saveFailed: "Couldn't save",
    recordNotFound: "Couldn't find this record.",
    shareFailed: "Couldn't share",
    imageFailed: "Couldn't create the image.",
    makingImage: "Creating image...",
    slogan: "When the film ends, the resonance begins.",
    viewing: (n) => `${ordinal(n)} viewing`,
  },

  titles: {
    home: "Yeoun",
    search: "Find a film",
    record: "First impression",
    movie: "Yeoun",
    recheck: "What remains",
    stats: "My Yeoun",
    archive: "Archive",
    edit: "Edit record",
    about: "About",
    share: "Resonance card",
    recap: "Your year in Yeoun",
    compare: "Compare viewings",
  },

  checkpoints: {
    3: {
      label: "3 hours later",
      prompt: "A few hours since you left the theater. Is it still with you?",
      notifyTitle: "3 hours have passed.",
      notifyBody: (t) => `Is ${t} still on your mind?`,
    },
    24: {
      label: "A day later",
      prompt: "A day has passed. Is this film still with you?",
      notifyTitle: "A day has passed.",
      notifyBody: (t) => `A day after ${t}, how much of it remains?`,
    },
    72: {
      label: "3 days later",
      prompt: "Three days have passed. Is this film still with you?",
      notifyTitle: "3 days have passed.",
      notifyBody: (t) => `How much of ${t} still lingers?`,
    },
    720: {
      label: "A month later",
      prompt: "Read the line you wrote a month ago.",
      notifyTitle: "A letter from a month ago",
      notifyBody: (t, note) =>
        note ? `"${note}" — what you wrote after watching ${t}.` : `It's been a month since ${t}. Is it still with you?`,
    },
  },
  delay: {
    now: "right after",
    overDay: "over a day after",
    hours: (h) => `about ${h}h after`,
  },
  later: "Later",

  strip: {
    pending: (label) => `${label}: not recorded yet`,
    score: (label, score) => `${label}: ${score}`,
  },
  band: {
    caption: "Each bar is one film. The taller and deeper it is, the more vividly it remains.",
    a11y: (label, score) => `${label}, resonance ${score}`,
  },

  change: {
    first: "Your first impression is saved. The real resonance begins with time.",
    deeper: "This film has stayed with you more deeply than at first.",
    clearer: "It's growing a little clearer with time.",
    fadingFast: "A strong first impression that's fading quickly.",
    faded: "It's a little fainter than at first.",
    same: "The feeling remains at about the same warmth.",
  },
  types: {
    deepening: { label: "Deepening", body: "Films that grow deeper with time" },
    lasting: { label: "Lasting", body: "Films that keep their first warmth" },
    fading: { label: "Fading", body: "Intense, but quick to fade" },
  },
  typeBadge: (en) => en,

  questions: {
    immersion: { eyebrow: "01 · Immersion", short: "immersion", label: "How absorbed were you while watching?" },
    emotion: { eyebrow: "02 · Emotion", short: "emotional impact", label: "How strongly did it move you?" },
    thought: { eyebrow: "03 · Thought", short: "thinking after the ending", label: "Do your thoughts keep going after the ending?" },
    rewatch: { eyebrow: "04 · Reunion", short: "wanting to rewatch", label: "Would you like to meet this film again someday?" },
  },

  genres: {
    28: "Action",
    12: "Adventure",
    16: "Animation",
    35: "Comedy",
    80: "Crime",
    99: "Documentary",
    18: "Drama",
    10751: "Family",
    14: "Fantasy",
    36: "History",
    27: "Horror",
    10402: "Music",
    9648: "Mystery",
    10749: "Romance",
    878: "Sci-Fi",
    10770: "TV Movie",
    53: "Thriller",
    10752: "War",
    37: "Western",
  },

  errors: {
    tmdbToken: "TMDB token is missing. Check EXPO_PUBLIC_TMDB_TOKEN.",
    network: "Can't connect to the network. Check your connection.",
    searchFailed: (status) => (status ? `Search failed. (${status})` : "Search failed."),
    backupUnreadable: "Couldn't read the backup file.",
    notBackup: "This isn't a Yeoun backup file.",
    fileShareUnavailable: "File sharing isn't available on this device.",
    shareUnavailable: "Sharing isn't available on this device.",
    cardNotFound: "Couldn't find the card to share.",
  },
  dialogs: {
    backup: "Save Yeoun backup",
    share: "Share Yeoun",
  },
  notificationChannel: "Yeoun reminders",

  home: {
    tagline: "When the film ends,\nthe resonance begins.",
    archiveA11y: "Open archive",
    archive: "Archive",
    statsA11y: "Open my Yeoun stats",
    stats: "My Yeoun",
    heroTitle: "Is the film\nyou watched today\nstill with you?",
    heroSub: "Instead of a star rating, leave a first impression — then record what really remains.",
    recordCta: "Record a film",
    recap: (n) => `Look back on ${n} ${n === 1 ? "film" : "films"} this year`,
    pendingTitle: "Time to check in",
    pendingCta: (label) => `Check in · ${label}`,
    pendingMore: (n) => `Open the other ${n} from your recent records.`,
    strongest: "Lingering most strongly right now",
    recent: "Recent",
    viewAll: "View all",
    emptyTitle: "No records yet.",
    emptyBody: "Record your first film, and the flow of your memories will start to gather here.",
    footer: "Slowly gather what films leave behind.",
    aboutA11y: "About this app",
    aboutLink: "About · TMDB",
  },

  search: {
    previousTitle: "You've recorded this film before",
    previousBody: (title, n) =>
      `You've recorded ${title} ${n === 1 ? "once" : `${n} times`}.\nSave this viewing as a new record?`,
    rewatchCta: "Record as rewatch",
    placeholder: "Search for a film title",
    button: "Search",
    noResults: "No results.",
    unknownYear: "Year unknown",
  },

  record: {
    levels: ["Barely", "A little", "Somewhat", "A lot", "Intensely"],
    delays: ["Just now", "About an hour", "Half a day", "Over a day"],
    untitled: "Untitled",
    thisFilm: "this film",
    savedRewatch: "Rewatch recorded",
    saved: "First impression saved",
    savedBody: (score, next) => `Your first impression score is ${score}.\n${next}, we'll ask what really remains.`,
    home: "Go home",
    saveError: "Couldn't save your record.",
    delayQuestion: "How long ago did the film end?",
    notePlaceholder: "Leave a line that comes to mind, if you like.",
    notYet: (next) => `This isn't the resonance yet.\n${next}, we'll see how much of this film remains.`,
    saving: "Saving...",
    saveCta: "Save first impression",
    reselect: "Change my answers",
    prevQuestion: "Previous question",
  },

  recheck: {
    levels: ["Almost gone", "A faint trace", "It comes back now and then", "Often on my mind", "Still vivid"],
    savedTitle: (label) => `${label}: saved`,
    savedBody: (score) => `Your resonance right now is ${score}.`,
    seeChange: "See the change",
    saveError: "Couldn't save. Please try again.",
    titleLetter: "Here's the line you\nwrote a month ago.",
    title: "Is this film\nstill with you?",
    sub: "No need to judge whether it was good. Just record how much comes back to you now.",
    notePlaceholderLetter: "Here's how I'd answer now.",
    notePlaceholder: "Any scene or line coming back to you? (optional)",
    saveCta: "Save how it feels now",
  },

  movie: {
    deleteTitle: "Delete this record?",
    deleteBody: "Your first impression and all check-ins will be deleted.",
    loading: "Loading record...",
    noteLabel: "Your line from that day",
    flow: "How it lingers",
    timeline: "What remained over time",
    recordCheckpoint: (label) => `Check in · ${label}`,
    shareCard: "Share card",
    compare: "Compare viewings",
    edit: "Edit",
  },

  edit: {
    loadFailedTitle: "Couldn't load",
    loadFailed: "Couldn't load this record.",
    title: "You can edit\nthat day's record.",
    finishedAt: "When the film ended",
    dateHint: "When you save, upcoming reminders will be rescheduled to the new time.",
    noteLabel: "Your line from that day",
    notePlaceholder: "A thought right after the film ended",
    save: "Save",
  },

  archive: {
    all: "All",
    rewatch: "Rewatch",
    title: "Films that stayed",
    count: (n) => `${n} ${n === 1 ? "viewing" : "viewings"} recorded`,
    searchPlaceholder: "Search by title",
    latest: "Latest",
    byScore: "Resonance",
    noMatch: "No records match.",
    empty: "No records yet.",
  },

  stats: {
    insightNone:
      "None of your first impressions predict what lasts yet. Resonance seems to come from somewhere other than the moment of watching.",
    insightHead: (q) => `The films that stay with you longest are the ones with strong ${q}.`,
    insightNegative: (head, q) => `${head} Films with strong ${q} actually tended to fade faster.`,
    insightUnrelated: (head, q) => `${head} Meanwhile, ${q} had little to do with what remained after 3 days.`,
    title: "My Yeoun",
    sub: "Not the moments a film felt good, but what's still there after time passes.",
    recapCta: "See your year in Yeoun",
    records: "Viewings",
    avgFirst: "Avg. first impression",
    lasting: "Still vivid after 3 days",
    rewatches: "Rewatches",
    strongest: "Lingering most strongly right now",
    noData: "No data yet",
    types: "Resonance types",
    typesEmpty: "Types appear once you've checked in on a film a day later.",
    typeCount: (body, n) => `${body} · ${n} ${n === 1 ? "film" : "films"}`,
    insightTitle: "What makes it last",
    insightLocked: (need) =>
      `Once ${need} films have a 3-day check-in, we'll show which first impression predicts what stays with you.`,
    insightFlat: "Your answers are too similar to find a difference yet.",
    corrHint: "Closer to 1 means films that scored high here were still with you after 3 days.",
    genres: "Resonance by genre",
    genresEmpty: "Appears once you've recorded two or more films in the same genre. (Genres are saved for records from this update on.)",
    genreOther: "Other",
    genreHint: "Average of the resonance that remains now.",
  },

  compare: {
    sub: "Same film, different times",
    notes: "A line from each viewing",
  },

  recap: {
    shareTitle: (year) => `${year} in Yeoun`,
    empty: (year) => `No records from ${year}.`,
    title: "Your year in Yeoun",
    films: "films",
    avgFirst: "avg. first impression",
    month: (m) => MONTHS[m - 1] ?? String(m),
    busiest: "busiest month",
    longest: "Stayed with you longest",
    deepest: "Grew deeper than at first",
    shareCta: "Share recap card",
    yearRecords: (year) => `Records from ${year}`,
  },

  share: {
    preparing: "Preparing your card...",
    dialog: (title) => `Yeoun of ${title}`,
    cta: "Share as image",
    hint: "Share it to Instagram Stories, messages, or save it to Photos.",
  },

  about: {
    title: "About Yeoun",
    dataLabel: "Data",
    dataBody:
      "Your first impressions and check-ins are stored only on this device. Nothing is sent to a server.\n\nMake a backup file before deleting the app or switching devices.",
    backupLabel: "Backup",
    backupBody:
      "Export all your records as a single file and keep it in Files, cloud storage, or email. Importing merges with your current records — nothing gets deleted.",
    exportCta: "Create backup file",
    importCta: "Import from backup",
    backupFailed: "Backup failed",
    backupFailedDefault: "Couldn't create the backup file.",
    importDone: "Import complete",
    importBody: (added, updated) => `${added} new, ${updated} updated to a newer version.`,
    importSkipped: (n) => `\nSkipped ${n} unreadable ${n === 1 ? "item" : "items"}.`,
    importFailed: "Import failed",
    importFailedDefault: "Couldn't read the backup file.",
    languageLabel: "Language",
    languageSystem: "Device setting",
    movieInfoLabel: "Film data",
    movieInfoBody: "Film titles, posters, and other film data come from TMDB.",
  },
};
