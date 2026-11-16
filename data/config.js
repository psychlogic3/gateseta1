/* =====================================================================
   PsychLogic GATE 2027 Psychology Mock Test Series: Set 1 settings
   Edit this file to change dates, codes or the device-check endpoint.
   ===================================================================== */
window.PL_CONFIG = {
  seriesName: "GATE 2027 Psychology (XH5) Mock Test Series",
  setName: "Set 1 · Phase 1 Subject-wise Mocks 1–5",

  /* 10 individual access codes. One per student. */
  accessCodes: [
    "psychlogicgate9684978", "psychlogicgate5671093", "psychlogicgate5655640",
    "psychlogicgate2504425", "psychlogicgate5068829", "psychlogicgate4286171",
    "psychlogicgate8167778", "psychlogicgate3465363", "psychlogicgate9002483",
    "psychlogicgate3442002"
  ],

  previewCodes: [],

  /* Optional: web address of the device / IP log (Google Apps Script).
     Leave empty to switch logging off. */
  logEndpoint: "",

  /* Each test unlocks at its date & time (IST). After that it never locks again. */
  tests: [
    { id: "mock-1", no: 1, title: "Psychological Foundations & Research Methods",
      unlock: "2026-11-16T10:00:00+05:30", file: "data/mock-1.js",
      covers: "Schools and perspectives, research approaches, designing research, sampling, data-collection methods, qualitative and mixed methods, validity, research ethics, plus revision of basic statistics." },
    { id: "mock-2", no: 2, title: "Statistics & Experimental Designs",
      unlock: "2026-11-19T10:00:00+05:30", file: "data/mock-2.js",
      covers: "Descriptive statistics, normal curve, standard error, hypothesis testing, Type I/II errors, parametric and non-parametric tests, correlation, regression, factor analysis, factorial and repeated-measures designs." },
    { id: "mock-3", no: 3, title: "Psychometrics",
      unlock: "2026-11-21T10:00:00+05:30", file: "data/mock-3.js",
      covers: "Scales and item analysis, test construction, reliability, validity, norms and standard scores, intelligence, aptitude and personality tests, applications of testing." },
    { id: "mock-4", no: 4, title: "Biological & Evolutionary Basis of Behaviour",
      unlock: "2026-11-24T10:00:00+05:30", file: "data/mock-4.js",
      covers: "Neurons and synapses, neurotransmitters, brain structures, nervous system divisions, endocrine system, hunger, thirst, sleep, emotion, research methods in physiological psychology, behaviour genetics." },
    { id: "mock-5", no: 5, title: "Perception, Learning, Memory & Forgetting",
      unlock: "2026-11-27T10:00:00+05:30", file: "data/mock-5.js",
      covers: "Psychophysics, senses, attention, Gestalt and depth perception, illusions, classical and operant conditioning, observational learning, memory systems, forgetting." }
  ],

  durationMinutes: 180,   /* exactly as in GATE */
  timeZone: "Asia/Kolkata"
};
