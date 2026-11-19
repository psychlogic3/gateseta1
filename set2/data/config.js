/* =====================================================================
   PsychLogic GATE 2027 Psychology Mock Test Series: Set 1 settings
   Edit this file to change dates, codes or the device-check endpoint.
   ===================================================================== */
window.PL_CONFIG = {
  seriesName: "GATE 2027 Psychology (XH5) Mock Test Series",
  setName: "Set 2 · Phase 1 Subject-wise Mocks 6–10",

  /* 10 individual access codes. One per student. */
  accessCodes: [
    "psychlogicgate9684978", "psychlogicgate5671093", "psychlogicgate5655640",
    "psychlogicgate2504425", "psychlogicgate5068829", "psychlogicgate4286171",
    "psychlogicgate8167778", "psychlogicgate3465363", "psychlogicgate9002483",
    "psychlogicgate3442002"
  ],

  /* Owner preview code: opens every test regardless of date (for checking only).
     Remove it before the set goes live. */
  previewCodes: [],

  /* Optional: web address of the device / IP log (Google Apps Script).
     Leave empty to switch logging off. */
  logEndpoint: "",

  /* Each test unlocks at its date & time (IST). After that it never locks again. */
  tests: [
    { id: "mock-6", no: 6, title: "Cognition: Thinking, Intelligence, Language & Creativity",
      unlock: "2026-11-30T10:00:00+05:30", file: "data/mock-6.js",
      covers: "Concepts, imagery and propositions, problem solving, decision making and reasoning, metacognition, theories of intelligence, emotional intelligence, creativity, language, plus revision of high-weight areas." },
    { id: "mock-7", no: 7, title: "Personality, Motivation, Emotion, Stress & Coping",
      unlock: "2026-12-02T10:00:00+05:30", file: "data/mock-7.js",
      covers: "Psychodynamic, humanistic, social-cognitive and trait theories, biology of personality, assessment, motivation theories, emotion theories, stress, appraisal and coping, plus revision of high-weight areas." },
    { id: "mock-8", no: 8, title: "Social Psychology",
      unlock: "2026-12-05T10:00:00+05:30", file: "data/mock-8.js",
      covers: "Social cognition and attribution, attitudes and persuasion, social influence, prejudice, aggression, prosocial behaviour, group dynamics, culture and the self, plus revision of high-weight areas." },
    { id: "mock-9", no: 9, title: "Development Across the Life Span",
      unlock: "2026-12-08T10:00:00+05:30", file: "data/mock-9.js",
      covers: "Nature–nurture, prenatal and physical development, Piaget and Vygotsky, language, attachment and parenting, Erikson and Kohlberg, adolescence, adulthood and ageing, developmental research designs, plus revision." },
    { id: "mock-10", no: 10, title: "Clinical Psychology, OB & Applications",
      unlock: "2026-12-10T10:00:00+05:30", file: "data/mock-10.js",
      covers: "Abnormality and DSM classification, major disorders, assessment, psychotherapies (psychodynamic, humanistic, behavioural, CBT, REBT), organisational behaviour and leadership, applications in education, environment and mental health." }
  ],

  durationMinutes: 180,   /* exactly as in GATE */
  timeZone: "Asia/Kolkata"
};
