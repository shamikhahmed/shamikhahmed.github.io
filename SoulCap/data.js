/* SoulCap — content layer
 *
 * CLINICAL REVIEW STATUS: nothing here has been signed off by a licensed clinician.
 * The UI states this. Do not remove that banner until a named reviewer has signed
 * each card. See SAFETY.md.
 *
 * Card fields
 *   mechanism        why it works, in one plain sentence — this is the documentation
 *   indication       states it suits
 *   contraindication when NOT to offer it (filtered out before ranking, never ranked down)
 *   needs            what must be to hand: 'none' | 'water' | 'cold' | 'sour' | 'space' | 'quiet'
 *   discreet         true if it can be done unseen in public
 *   capacity         'low' works mid-panic | 'medium' needs some reserve | 'any'
 */

/* Check-in intent outranks ambient context such as time of day. “Not sure”
   deliberately starts with low-demand grounding rather than pretending certainty. */
var CHECKIN_PROFILES = {
  Steady: { tags:['stable','stuck'], weight:5, reason:'you said you’re feeling steady' },
  Wired: { tags:['anxiety','panic','wired'], weight:5, reason:'you said you’re feeling wired' },
  Flat: { tags:['flat','withdrawn','numb'], weight:5, reason:'you said you’re feeling flat' },
  Heavy: { tags:['shame','self-critical','low','overwhelmed'], weight:5, reason:'you said things feel heavy' },
  'Not sure': { families:['orienting','sensory'], weight:3.5, reason:'you’re not sure yet, so this starts gently' }
};

var CHECKIN_DIMENSIONS = [
  { key:'energy', label:'Energy', low:'Very low', high:'Plenty' },
  { key:'tension', label:'Body tension', low:'Loose', high:'Very tense' },
  { key:'noise', label:'Mental noise', low:'Quiet', high:'Very loud' },
  { key:'social', label:'Social capacity', low:'Need space', high:'Open to people' },
  { key:'sleep', label:'Sleep quality', low:'Rough', high:'Rested' }
];

var CHECKIN_TRIGGERS = [
  { key:'work', label:'Work or study' },
  { key:'family', label:'Family' },
  { key:'relationship', label:'Relationship' },
  { key:'health', label:'Health' },
  { key:'money', label:'Money' },
  { key:'sleep', label:'Sleep' },
  { key:'unknown', label:'Not sure' }
];

var CHECKIN_DIRECT_NEEDS = [
  { key:'settle', label:'Settle down', families:['autonomic','sensory','orienting'], reason:'you asked to settle down' },
  { key:'lift', label:'A little energy', families:['activation'], reason:'you asked for a little energy' },
  { key:'sleep', label:'Rest or sleep', domains:['rest'], reason:'you asked for rest' },
  { key:'clarity', label:'Clear my head', families:['load','cognitive'], reason:'you asked for a clearer head' },
  { key:'kindness', label:'Be kinder to myself', families:['soothing'], reason:'you asked for self-kindness' },
  { key:'connection', label:'Feel less alone', families:['connection'], reason:'you asked for connection' },
  { key:'space', label:'Space from everything', families:['orienting','sensory'], reason:'you asked for space' }
];

var CHECKIN_UI = {
  addDetail:'Add optional detail',
  editDetail:'Edit today’s detail',
  detailTitle:'A little more detail',
  detailHint:'Skip anything. This stays on this device and only supports local suggestions.',
  dimensions:'How is each part?',
  dimensionsHint:'Leave a slider at “Not set” if you do not want to answer.',
  need:'What would help most?',
  triggers:'What might be affecting this?',
  feeling:'Your own words (optional)',
  feelingPlaceholder:'A word or short phrase',
  save:'Save detail',
  saveFailedTitle:'That did not save',
  saveFailedBody:'Your previous check-in is still here. This phone may be low on local storage.',
  crisisSaveFailed:'This check-in did not save, but Help is still available.',
  localSafetyNote:'Short check-in words are checked on this device only so Help can appear when needed.',
  ok:'OK',
  cancel:'Cancel'
};

var PATTERN_UI = {
  heading:'Possible patterns',
  intro:'Local observations from repeated days. Each one shows its evidence and stays a possibility until you confirm it.',
  lateTitle:'Late hours may be harder',
  lateSummary:'Several check-ins may have happened late at night.',
  noiseTitle:'Mental noise may be running high',
  noiseSummary:'You marked mental noise near the high end on several days.',
  triggerSuffix:'may be showing up often',
  triggerSummary:'This context may appear repeatedly',
  evidence:'See evidence',
  confirm:'Yes, that fits',
  reject:'Not really',
  hide:'Hide',
  confirmed:'You confirmed',
  guess:'A possibility',
  reset:'Reset pattern decisions',
  disabled:'Pattern observations are off. Check-ins still work normally.',
  weeklyTitle:'Recent seven days',
  weeklySummary:'days checked in',
  weeklyCommon:'appeared most often',
  weeklyNote:'A factual summary of what you recorded — not a score or interpretation.',
  dayBasis:'distinct days',
  evidenceNote:'This is a repeated correlation, not a cause or diagnosis. It was calculated only on this device.',
  done:'Done',
  noWeekly:'Not enough recent check-ins for a summary yet.'
};

var PRESENTATION_UI = {
  accent:'Accent colour',
  text:'Text size',
  density:'Layout spacing',
  contrast:'Higher contrast',
  transparency:'Reduce transparency',
  patternLearning:'Local pattern observations',
  patternHint:'When off, SoulCap stops deriving new pattern cards. Your check-ins and existing data stay unchanged.',
  saveFailedTitle:'That setting did not save',
  saveFailedBody:'Your previous settings are still in place. This phone may be low on local storage.'
};

var ACCENT_OPTIONS = [
  { k:'plum', l:'Plum' },
  { k:'lilac', l:'Lilac' },
  { k:'mulberry', l:'Mulberry' },
  { k:'indigo', l:'Indigo' }
];

var TEXT_OPTIONS = [{ k:'standard', l:'Standard' }, { k:'large', l:'Large' }];
var DENSITY_OPTIONS = [{ k:'compact', l:'Compact' }, { k:'comfortable', l:'Comfortable' }];

var THEME_OPTIONS = [
  { k:null, l:'Auto' },
  { k:'light', l:'Light' },
  { k:'dark', l:'Dark' },
  { k:'night', l:'Night' },
  { k:'ocean', l:'Ocean' },
  { k:'forest', l:'Forest' },
  { k:'rain', l:'Rain' },
  { k:'space', l:'Space' },
  { k:'sunrise', l:'Sunrise' },
  { k:'minimal', l:'Minimal' },
  { k:'amoled', l:'AMOLED' }
];

var LOCALE_OPTIONS = [
  { k:'en', l:'English', dir:'ltr' },
  { k:'rui', l:'Roman Urdu (preview)', dir:'ltr' }
];

var LOCALE_UI = {
  language:'Language',
  previewNote:'Roman Urdu is a layout preview only. Clinical and safety wording still needs a native clinical-copy review before it replaces English.',
  reviewPending:'Roman Urdu clinical review is not complete yet. English remains the default safety language.'
};

var MAP_PACE_OPTIONS = [
  { k:'still', l:'Still' },
  { k:'drift', l:'Drift' },
  { k:'live', l:'Live' }
];

var RESET_UI = {
  title:'Personal reset menu',
  homeHint:'Small steps that help you land again. Yours to edit.',
  intro:'Add a few gentle resets for hard moments. Tap one when you have done it today — no streaks or scores.',
  empty:'Start with one or two small things that help you reset. You can rename them anytime.',
  add:'Add a reset step',
  edit:'Edit reset menu',
  titleLabel:'Title',
  notesLabel:'Notes (optional)',
  enabled:'Show on menu',
  save:'Save',
  cancel:'Cancel',
  done:'Done for today',
  notDone:'Mark for today',
  remove:'Remove',
  back:'← Back to Calm'
};

var PARK_UI = {
  button:'Park a thought',
  title:'Park a thought',
  hint:'Set it aside for later. No reminders — it will reappear when the time you choose has passed.',
  titleLabel:'What is it about?',
  bodyLabel:'Anything else to remember',
  whenLabel:'Come back after',
  tomorrow:'Tomorrow',
  weekend:'Weekend',
  week:'One week',
  save:'Park it',
  cancel:'Cancel',
  dueHeading:'Due to revisit',
  archive:'Archive',
  dismiss:'Dismiss for now',
  empty:'Nothing parked right now.',
  archived:'Archived'
};

var TIMELINE_UI = {
  title:'Your week',
  cardHint:'Check-ins and journal titles, day by day.',
  empty:'Your week will slowly become a story rather than a list.',
  checkin:'Check-in',
  journal:'Journal',
  close:'Close',
  prev:'Earlier',
  next:'Later'
};

var REFLECTION_UI = {
  cardTitle:'A gentle reflection',
  skip:'Skip for now',
  answer:'Write a short note',
  dismiss:'Do not show again',
  save:'Save note',
  cancel:'Cancel',
  placeholder:'A sentence is enough.'
};

var PRINCIPLES_UI = {
  title:'Principles',
  cardHint:'Short reminders you choose for yourself.',
  empty:'Add a line or two that helps you steer.',
  add:'Add principle',
  save:'Save',
  remove:'Remove'
};

var MANUAL_SECTIONS = ['rest', 'people', 'work', 'thinking', 'recovery'];

var MANUAL_UI = {
  title:'My manual',
  cardHint:'Your own notes — grown from what you confirm here.',
  empty:'Nothing here yet. As you add principles, confirm patterns, and use resets, gentle suggestions can appear. You can edit or remove anything.',
  refresh:'Refresh suggestions',
  refreshAdded:'{n} new line added.',
  refreshAddedPlural:'{n} new lines added.',
  refreshNone:'No new suggestions right now.',
  add:'Add a line',
  remove:'Remove',
  pickSection:'Section',
  lineLabel:'Manual line',
  editHint:'Edits stay yours — suggestions will not overwrite them.',
  sectionRest:'Rest',
  sectionPeople:'People',
  sectionWork:'Work',
  sectionThinking:'Thinking',
  sectionRecovery:'Recovery'
};

var EMPTY_UI = {
  now:'No check-ins yet. Tap how you are arriving — a quiet picture of your days can build here. No streaks, no score.',
  calm:'Pick what you need, or browse everything below. Nothing to get right.',
  journal:'A private place for your words. One line is enough.',
  map:'You at the centre. Add someone when it feels useful — only you see this map.',
  me:'This space fills in as you go. Profile, story, and plan are all optional.',
  nowAction:'How are you arriving?',
  journalAction:'Write first entry',
  meAction:'Set up profile'
};

/* Guided Path v2.1 — rule-based feeling → chips → family why → exercise.
 * Never diagnose. Never prescribe CBT/DBT/ACT as treatment. */
var PATH_UI = {
  cardTitle:'A short path',
  cardHint:'A few taps → something that may fit. Optional. Not a diagnosis.',
  calmHint:'Feeling → what you notice → one exercise.',
  arrivalTitle:'How are you arriving?',
  chipsTitle:'What are you noticing?',
  chipsHint:'Pick up to four. Skip any that do not fit.',
  continue:'Continue',
  skip:'Skip',
  back:'Back',
  resultTitle:'Something that may help',
  begin:'Begin',
  somethingElse:'Something else',
  readAbout:'Read about this',
  offerHelp:'I need help now',
  offerHelpHint:'If this feels unsafe or too big to hold alone, use Help. SoulCap never calls anyone for you.',
  disclaimer:'Educational self-help only. Not therapy, not a diagnosis, not a crisis service. Nothing leaves this device.',
  footnote:'Some people learn related ideas in CBT, DBT, ACT, or behavioural activation. SoulCap is not those therapies.',
  reviewNote:'Path copy is not yet clinically reviewed.',
  knowsLabel:'Short path',
  knowsSub:'You explored a short path on this device · not a diagnosis',
  clear:'Clear this path note',
  hideCard:'Hide short path on Now',
  showCard:'Show short path on Now',
  close:'Close',
  maxChips:4,
  advancedTitle:'Thought habits (optional)',
  advancedHint:'Gentle labels for how thinking can tilt — not a diagnosis.',
  pickArrival:'Choose how you are arriving to continue.',
  pickChip:'Pick at least one thing you notice, or go back.',
  familyLabel:'Starting place'
};

var PATH_ARRIVALS = [
  { key:'Wired', label:'Wired', checkin:'Wired' },
  { key:'Heavy', label:'Heavy', checkin:'Heavy' },
  { key:'Flat', label:'Flat', checkin:'Flat' },
  { key:'Overwhelmed', label:'Overwhelmed', checkin:'Wired' },
  { key:'Not sure', label:'Not sure', checkin:'Not sure' }
];

var PATH_CHIPS = [
  { id:'heart', label:'Heart racing / body alarm', families:{ autonomic:3, sensory:1 },
    experiences:['racing-heart'], skills:['physiological-sigh','grounding-54321'], panicHint:true },
  { id:'worry', label:'Worry / what-ifs', families:{ cognitive:3, sleep:1 },
    experiences:['catastrophising'], skills:['worry-vs-problem','thought-record'], panicHint:false },
  { id:'spin', label:'Thoughts won’t stop', families:{ cognitive:3, load:1 },
    experiences:['racing-thoughts','rumination'], skills:['defusion','count-backwards'], panicHint:false },
  { id:'tension', label:'Tight muscles / can’t settle', families:{ autonomic:3 },
    experiences:[], skills:['pmr','box-breathing'], panicHint:true },
  { id:'sleep', label:'Sleep is hard', families:{ sleep:3, autonomic:1 },
    experiences:[], skills:['wind-down','worry-postponement','stimulus-control'], panicHint:false },
  { id:'avoid', label:'Avoiding / shutting down', families:{ activation:3, cognitive:1 },
    experiences:[], skills:['behavioural-activation','values-check','opposite-action'], panicHint:false },
  { id:'low', label:'Flat / no energy', families:{ activation:3, connection:1 },
    experiences:[], skills:['behavioural-activation','ten-minute-walk'], panicHint:false },
  { id:'edge', label:'On edge / scanning', families:{ orienting:2, autonomic:2, cognitive:1 },
    experiences:['hypervigilance'], skills:['orient-room','feet-floor','physiological-sigh'], panicHint:false }
];

var PATH_ADVANCED = [
  { id:'allornothing', label:'All-or-nothing thinking', families:{ cognitive:2 },
    experiences:[], skills:['thought-record','defusion'], panicHint:false },
  { id:'mindread', label:'Mind-reading', families:{ cognitive:2 },
    experiences:[], skills:['thought-record','defusion'], panicHint:false },
  { id:'overgeneral', label:'Always / never thinking', families:{ cognitive:2 },
    experiences:[], skills:['thought-record','worry-vs-problem'], panicHint:false }
];

var PATH_REASONS = {
  autonomic:'When the body is loud, starting with the nervous system often helps more than arguing with thoughts.',
  sensory:'Anchoring through the senses can interrupt a spiral without needing the right words.',
  orienting:'Checking the room tells a threat-primed body that it has looked around.',
  load:'A short structured task can occupy the space a thought-loop needs to run.',
  soothing:'Gentle rhythm and touch you give yourself can lower intensity a notch.',
  imagery:'A vivid safer scene can give the body something else to respond to — only if it feels okay.',
  sleep:'Night and sleep ask for different moves than daytime spikes.',
  cognitive:'When there is a little room, looking at a thought as a thought can loosen its grip.',
  activation:'Small outward action can shift mood from the outside in when energy is low.',
  connection:'A tiny step toward people can reverse withdrawal — only if it feels safe enough.'
};

var ABOUT_UI = {
  title:'About SoulCap',
  purpose:'A calm, private place for self-regulation skills, a journal, and the people around you.',
  honesty:'Not therapy. Not a diagnosis tool. Not a crisis service. Nothing leaves this device.',
  credits:'Built by Capricorn Systems. Techniques are evidence-informed and not yet clinically reviewed.',
  open:'About SoulCap',
  close:'Close'
};

var WHATS_NEW_UI = {
  title:'What’s new',
  body:'SoulCap 2.1 — a short optional path: how you are arriving, what you notice, then one exercise that may fit. Still private and offline. Not therapy, not a diagnosis.',
  dismiss:'Got it'
};

var SETTINGS_UI = {
  personalisation:'Personalisation',
  guided:'Guided exercises',
  constellation:'Constellation',
  yourData:'Your data',
  about:'About',
  spoken:'Spoken guidance',
  voiceAccent:'Voice & accent',
  vibration:'Vibration',
  exercisePace:'Exercise pace',
  paceHint:'How long each step of a guided exercise stays on screen. Slow gives more time to read.',
  mapPace:'Map pace',
  mapPaceHint:'Still keeps the map fixed. Drift is gentle. Live moves faster. Reduced-motion always uses Still.',
  showLinks:'Show links between people',
  trackContact:'Track when we last spoke',
  trackHint:'Both off by default. Contact tracking only ever shows you the number — it will never tell you to reach out to anyone.',
  export:'Export everything',
  delete:'Delete everything, permanently',
  slow:'Slow',
  steady:'Steady',
  brisk:'Brisk'
};

var CONSTELLATION_UI = {
  notesLabel:'Private notes',
  notesPlaceholder:'What helps you remember about this person…',
  eventsHeading:'Life events',
  eventLabel:'Event',
  eventPlaceholder:'e.g. moved away, new job…',
  addEvent:'Add event',
  removeEvent:'Remove',
  ringHistoryHeading:'Closer / further history',
  ringHistoryQuiet:'Ring changes you logged here.'
};

var EMOTION_WORDS = [
  'Disappointed','Uneasy','Content','Relieved','Hopeful','Ashamed',
  'Restless','Curious','Inspired','Calm','Grateful','Lonely',
  'Overwhelmed','Tender','Frustrated','Peaceful'
];

var REFLECTION_PROMPTS = {
  journal:'What stood out from what you wrote?',
  pattern:'Does this pattern feel familiar in your day?',
  park:'What would help you let that thought rest for now?'
};

var DRIP_UI = {
  title:'A few gentle questions',
  cardTitle:'Know you a little better',
  cardHint:'A few optional questions today. Estimates only — never a diagnosis.',
  intro:'Answer only what feels useful. Skip anything. SoulCap builds gentle estimates with confidence, never labels or diagnoses.',
  doneToday:'Enough for today. More questions can wait until another day.',
  empty:'No more questions in this short set.',
  skip:'Skip this one',
  save:'Save answer',
  close:'Close',
  estimateHeading:'Gentle estimates',
  estimateHint:'These are local estimates from what you share. They are not diagnoses, scores, or clinical results.',
  confidence:'confidence',
  correct:'Adjust',
  reset:'Clear this estimate',
  low:'Low',
  mid:'Medium',
  high:'High',
  saveFailedTitle:'That did not save',
  saveFailedBody:'Your previous answers are still here. This phone may be low on local storage.',
  notDiagnosis:'Not a diagnosis or clinical score.'
};

var SCREENER_UI = {
  cardTitle:'Reflection check',
  cardHint:'Optional PHQ-9 or GAD-7 style check. Reflection only — never a diagnosis.',
  pickTitle:'Choose a reflection check',
  pickIntro:'Public-domain questionnaires used for reflection. Scores are not diagnoses. Skip anytime.',
  scaleHint:'Over the last 2 weeks, how often have you been bothered by the following?',
  scale0:'Not at all',
  scale1:'Several days',
  scale2:'More than half the days',
  scale3:'Nearly every day',
  next:'Next',
  back:'Back',
  finish:'See reflection',
  resultTitle:'Your reflection',
  resultLead:'Your answers over the last two weeks are in a range some people describe as ',
  resultMid:'. This is not a diagnosis — only a professional can give one — but a level around here often means it is worth talking to someone you trust or a professional. Here are some things that may help in the meantime.',
  topBandNudge:'This range is often a signal to seek professional support soon, alongside anything that helps day to day.',
  notDiagnosis:'Not a diagnosis.',
  lowConfidence:'Stored as a low-confidence local signal — never a label like a diagnosis.',
  clear:'Clear this signal',
  retake:'Take again',
  close:'Close',
  progress:'Question {n} of {total}',
  knowsLabel:'Reflection check',
  knowsSub:'Local signal only · low confidence · not a diagnosis',
  historyLine:'Last score {score} · {band}'
};

var SCREENERS = [
  { id:'phq9', name:'Mood reflection (PHQ-9)',
    blurb:'Nine questions about the last two weeks. Reflection only.',
    item9Index:8,
    items:[
      'Little interest or pleasure in doing things',
      'Feeling down, depressed, or hopeless',
      'Trouble falling or staying asleep, or sleeping too much',
      'Feeling tired or having little energy',
      'Poor appetite or overeating',
      'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
      'Trouble concentrating on things, such as reading the newspaper or watching television',
      'Moving or speaking so slowly that other people could have noticed — or being so fidgety or restless that you have been moving around a lot more than usual',
      'Thoughts that you would be better off dead, or of hurting yourself'
    ],
    bands:[
      { id:'minimal', min:0, max:4, label:'minimal' },
      { id:'mild', min:5, max:9, label:'mild' },
      { id:'moderate', min:10, max:14, label:'moderate' },
      { id:'moderately_severe', min:15, max:19, label:'moderately severe' },
      { id:'severe', min:20, max:27, label:'severe' }
    ],
    topBand:'severe',
    helpSkills:['self-compassion-break','behavioural-activation','hand-on-heart'],
    helpExperiences:['fatigue','self-criticism','rumination']
  },
  { id:'gad7', name:'Worry reflection (GAD-7)',
    blurb:'Seven questions about anxiety and worry over the last two weeks. Reflection only.',
    item9Index:-1,
    items:[
      'Feeling nervous, anxious, or on edge',
      'Not being able to stop or control worrying',
      'Worrying too much about different things',
      'Trouble relaxing',
      'Being so restless that it is hard to sit still',
      'Becoming easily annoyed or irritable',
      'Feeling afraid as if something awful might happen'
    ],
    bands:[
      { id:'minimal', min:0, max:4, label:'minimal' },
      { id:'mild', min:5, max:9, label:'mild' },
      { id:'moderate', min:10, max:14, label:'moderate' },
      { id:'severe', min:15, max:21, label:'severe' }
    ],
    topBand:'severe',
    helpSkills:['box-breathing','worry-postponement','grounding-54321'],
    helpExperiences:['racing-thoughts','catastrophising','hypervigilance']
  }
];

var USER_MODEL_KEYS = [
  { key:'stress', label:'Stress load', low:'Lighter', high:'Heavier' },
  { key:'sleep', label:'Sleep strain', low:'Rested', high:'Worn' },
  { key:'energy', label:'Energy reserve', low:'Low', high:'Steady' },
  { key:'resilience', label:'Recovery sense', low:'Fragile', high:'Steadying' }
];

/* Tiny drip bank. Sessions stay small; branching uses prior answers only. */
var DRIP_QUESTIONS = [
  { id:'stress-week', key:'stress', invert:false, weight:1,
    text:'How heavy has the last week felt?',
    options:[{ v:1, l:'Light' },{ v:2, l:'Manageable' },{ v:3, l:'Busy' },{ v:4, l:'Heavy' },{ v:5, l:'Overwhelming' }] },
  { id:'stress-body', key:'stress', invert:false, weight:0.8, when:{ stress:{ min:3 } },
    text:'Where does that heaviness show up most?',
    options:[{ v:2, l:'Thoughts' },{ v:3, l:'Body' },{ v:4, l:'Both' },{ v:3, l:'Not sure' }] },
  { id:'sleep-quality', key:'sleep', invert:false, weight:1,
    text:'How has sleep been lately?',
    options:[{ v:1, l:'Restful' },{ v:2, l:'Mostly okay' },{ v:3, l:'Uneven' },{ v:4, l:'Broken' },{ v:5, l:'Very rough' }] },
  { id:'sleep-mind', key:'sleep', invert:false, weight:0.8, when:{ sleep:{ min:3 } },
    text:'When sleep is hard, what is most true?',
    options:[{ v:3, l:'Mind will not switch off' },{ v:4, l:'Wake often' },{ v:2, l:'Hard to get to bed' },{ v:3, l:'Not sure' }] },
  { id:'energy-day', key:'energy', invert:true, weight:1,
    text:'How much energy do you usually have for ordinary things?',
    options:[{ v:1, l:'Very little' },{ v:2, l:'Some' },{ v:3, l:'Enough' },{ v:4, l:'Plenty' },{ v:5, l:'A lot' }] },
  { id:'energy-start', key:'energy', invert:true, weight:0.7, when:{ energy:{ max:2 } },
    text:'What feels most available on a low day?',
    options:[{ v:2, l:'One small task' },{ v:3, l:'Rest first' },{ v:2, l:'Ask for help' },{ v:1, l:'Not sure yet' }] },
  { id:'resilience-bounce', key:'resilience', invert:true, weight:1,
    text:'After a hard day, how quickly do you usually find your feet again?',
    options:[{ v:1, l:'Very slowly' },{ v:2, l:'Slowly' },{ v:3, l:'In time' },{ v:4, l:'Fairly soon' },{ v:5, l:'Quite quickly' }] },
  { id:'resilience-help', key:'resilience', invert:true, weight:0.7, when:{ resilience:{ max:2 } },
    text:'What helps you recover, even a little?',
    options:[{ v:3, l:'Quiet' },{ v:4, l:'Someone kind' },{ v:3, l:'Movement' },{ v:2, l:'Still figuring that out' }] }
];

var STRINGS = {
  en: {
    helpNow:'I need help now',
    tabs:{ now:'Now', calm:'Calm', journal:'Journal', map:'People', me:'You' },
    common:{
      close:'Close', cancel:'Cancel', done:'Done', save:'Save', delete:'Delete', edit:'Edit',
      add:'Add', open:'Open', back:'Back', next:'Next', skip:'Skip', confirm:'Confirm',
      settings:'Settings', appearance:'Appearance', ok:'OK', on:'On', off:'Off', help:'Help'
    },
    welcome:{
      title:'A quiet place to steady yourself.',
      subtitle:'Techniques that work in a few minutes. A private journal. A map of the people around you. Everything stays on your phone.',
      tagline:'Not therapy. Not a crisis service. Just something that helps.',
      begin:'Begin'
    },
    onboarding:{
      ageTitle:'First — how old are you?',
      ageBody:'SoulCap is built for adults. We ask because the right support for someone under 18 looks different, and we’d rather point you somewhere better than get it wrong.',
      over18:'18 or older',
      under18:'Under 18',
      under18Hint:'This isn’t built for you yet — please talk to a trusted adult or a service for young people',
      under18Body:'SoulCap isn’t the right fit yet. Please reach out to a trusted adult, or a support service made for young people where you are.',
      nameTitle:'What should we call you?',
      nameBody:'So this feels like yours. Skip it if you’d rather not.',
      namePlaceholder:'Your name or a nickname',
      continue:'Continue',
      consentTitle:'What this is, plainly.',
      understand:'I understand',
      concernsTitle:'What’s been hard lately?',
      concernsBody:'Pick any, or none. You can change this whenever — skipping doesn’t break anything.',
      start:'Start',
      skipIn:'Skip — just let me in'
    },
    checkin:{
      addDetail:'Add optional detail',
      editDetail:'Edit today’s detail',
      detailTitle:'A little more detail',
      detailHint:'Skip anything. This stays on this device and only supports local suggestions.',
      dimensions:'How is each part?',
      dimensionsHint:'Leave a slider at “Not set” if you do not want to answer.',
      need:'What would help most?',
      triggers:'What might be affecting this?',
      feeling:'Your own words (optional)',
      feelingPlaceholder:'A word or short phrase',
      save:'Save detail',
      saveFailedTitle:'That did not save',
      saveFailedBody:'Your previous check-in is still here. This phone may be low on local storage.',
      crisisSaveFailed:'This check-in did not save, but Help is still available.',
      localSafetyNote:'Short check-in words are checked on this device only so Help can appear when needed.',
      ok:'OK',
      cancel:'Cancel',
      arrival:'How are you arriving right now?',
      states:{ Steady:'Steady', Wired:'Wired', Flat:'Flat', Heavy:'Heavy', 'Not sure':'Not sure' }
    },
    calm:{
      whereAreYou:'Where are you?',
      onMyOwn:'On my own',
      aroundPeople:'Around people',
      gotAnything:'Got anything to hand?',
      browseAll:'Browse all techniques',
      showEverything:'Just show me everything',
      backToGuided:'← Back to guided'
    },
    me:{
      eyebrow:'You',
      yourSpace:'Your space.',
      profile:'Profile',
      setupProfile:'Set up your profile',
      yourStory:'Your story',
      myPlan:'My plan',
      edit:'Edit',
      add:'Add',
      optional:'Optional',
      sectionAbout:'About you',
      sectionInsights:'Your insights',
      sectionTools:'Your tools',
      knowsHeading:'What SoulCap knows',
      calmMore:'Also here'
    },
    concerns:{
      hard_to_switch_off:'Hard to switch off',
      sleep:'Sleep',
      low_mood:'Low mood',
      panic:'Panic',
      grief:'Grief',
      anger:'Anger',
      loneliness:'Loneliness',
      work:'Work',
      family:'Family',
      not_sure_yet:'Not sure yet'
    },
    locale:{
      language:'Language',
      previewNote:'Roman Urdu is a layout preview only. Clinical and safety wording still needs a native clinical-copy review before it replaces English.',
      reviewPending:'Roman Urdu clinical review is not complete yet. English remains the default safety language.',
      clinicalNotice:'Technique steps, library articles, and crisis guidance stay in English until clinical review is complete.',
      clinicalDismiss:'Got it'
    },
    themes:{
      auto:'Auto', light:'Light', dark:'Dark', night:'Night', ocean:'Ocean', forest:'Forest',
      rain:'Rain', space:'Space', sunrise:'Sunrise', minimal:'Minimal', amoled:'AMOLED'
    },
    presentation:{
      accent:'Accent colour', text:'Text size', density:'Layout spacing', contrast:'Higher contrast',
      transparency:'Reduce transparency', patternLearning:'Local pattern observations',
      patternHint:'When off, SoulCap stops deriving new pattern cards. Your check-ins and existing data stay unchanged.',
      themeNote:'Night is dimmer than dark. AMOLED is near-black. Mood themes keep contrast and reduced-motion intact.',
      standard:'Standard', large:'Large', compact:'Compact', comfortable:'Comfortable',
      plum:'Plum', lilac:'Lilac', mulberry:'Mulberry', indigo:'Indigo'
    },
    empty:{
      now:'No check-ins yet. When you tap how you are arriving, a quiet picture of your days can build here — no streaks, no score.',
      calm:'Pick what you need, or browse everything below. Nothing to get right.',
      journal:'A private place for your words. One line is enough when you are ready.',
      map:'You at the centre. Add someone when it feels useful — only you see this map.',
      me:'This space fills in as you go. Profile, story, and plan are all optional.'
    },
    reset:{
      title:'Personal reset menu', homeHint:'Small steps that help you land again. Yours to edit.',
      intro:'Add a few gentle resets for hard moments. Tap one when you have done it today — no streaks or scores.',
      empty:'Start with one or two small things that help you reset. You can rename them anytime.',
      add:'Add a reset step', edit:'Edit reset menu', titleLabel:'Title', notesLabel:'Notes (optional)',
      enabled:'Show on menu', save:'Save', cancel:'Cancel', done:'Done for today',
      notDone:'Mark for today', remove:'Remove', back:'← Back to Calm'
    },
    park:{
      button:'Park a thought', title:'Park a thought',
      hint:'Set it aside for later. No reminders — it will reappear when the time you choose has passed.',
      titleLabel:'What is it about?', bodyLabel:'Anything else to remember', whenLabel:'Come back after',
      tomorrow:'Tomorrow', weekend:'Weekend', week:'One week', save:'Park it', cancel:'Cancel',
      dueHeading:'Due to revisit', archive:'Archive', dismiss:'Dismiss for now',
      empty:'Nothing parked right now.', archived:'Archived'
    },
    pattern:{
      evidence:'See evidence', confirm:'Yes, that fits', reject:'Not really', hide:'Hide',
      confirmed:'You confirmed', guess:'A possibility', reset:'Reset pattern decisions',
      disabled:'Pattern observations are off. Check-ins still work normally.', done:'Done',
      reviewNote:'Not yet reviewed by a licensed clinician.'
    },
    timeline:{
      title:'Your week', empty:'Your week will slowly become a story rather than a list.',
      checkin:'Check-in', journal:'Journal', close:'Close', prev:'Earlier', next:'Later'
    },
    principles:{
      title:'Principles', cardHint:'Short reminders you choose for yourself.',
      empty:'Add a line or two that helps you steer.', add:'Add principle', save:'Save', remove:'Remove', close:'Close'
    },
    manual:{
      title:'My manual', cardHint:'Your own notes — grown from what you confirm here.',
      empty:'Nothing here yet. As you add principles, confirm patterns, and use resets, gentle suggestions can appear. You can edit or remove anything.',
      refresh:'Refresh suggestions', add:'Add a line', remove:'Remove', close:'Close'
    },
    mapPace:{ still:'Still', drift:'Drift', live:'Live' },
    panic:{ exit:'I’m okay — go back', plan:'Open my plan' },
    settingsCard:{ title:'Settings', hint:'Appearance, language, accessibility, and your data.', open:'Open' }
  },
  rui: {
    helpNow:'Mujhe ab madad chahiye',
    tabs:{ now:'Ab', calm:'Sakoon', journal:'Journal', map:'Log', me:'Aap' },
    common:{
      close:'Band karein', cancel:'Mansookh', done:'Ho gaya', save:'Mehfooz karein', delete:'Hata dein',
      edit:'Tabdeel karein', add:'Shamil karein', open:'Kholen', back:'Wapas', next:'Agla', skip:'Chhor dein',
      confirm:'Tasdeeq karein', settings:'Tanzimaat', appearance:'Roop', ok:'Theek hai', on:'Chalu', off:'Band', help:'Madad'
    },
    welcome:{
      title:'Apne aap ko sambhalne ki ek pur-sukoon jagah.',
      subtitle:'Chand minute mein kaam karne wali techniques. Private journal. Aap ke ird-gird logon ka naqsha. Sab kuch phone par rehta hai.',
      tagline:'Therapy nahi. Crisis service nahi. Bas kuch jo madad kare.',
      begin:'Shuru karein'
    },
    onboarding:{
      ageTitle:'Pehle — aap ki umar kya hai?',
      ageBody:'SoulCap adults ke liye bana hai. Hum is liye poochte hain ke 18 se kam umar ke liye sahi madad alag hoti hai.',
      over18:'18 ya us se ziyada',
      under18:'18 se kam',
      under18Hint:'Abhi aap ke liye nahi — kisi trusted adult ya young people service se baat karein',
      under18Body:'SoulCap abhi sahi fit nahi. Kisi trusted adult ya apne ilaqay ki young people service se rabta karein.',
      nameTitle:'Aap ko kya keh kar bulayen?',
      nameBody:'Taake yeh aap jaisa lage. Chhor sakte hain agar na chahein.',
      namePlaceholder:'Naam ya nickname',
      continue:'Agla',
      consentTitle:'Yeh kya hai, seedhi baat.',
      understand:'Samajh gaya',
      concernsTitle:'Haal mein kya mushkil raha?',
      concernsBody:'Jo chaahein chun lein, ya kuch na chunen. Kabhi bhi badal sakte hain — skip karne se kuch nahi bigadta.',
      start:'Shuru',
      skipIn:'Chhor dein — bas andar aa jayein'
    },
    checkin:{
      addDetail:'Optional detail shamil karein',
      editDetail:'Aaj ka detail tabdeel karein',
      detailTitle:'Thori aur detail',
      detailHint:'Jo na chahein chhor dein. Yeh sirf is device par rehta hai.',
      dimensions:'Har hissa kaisa hai?',
      dimensionsHint:'Jawab na dena ho to slider “Not set” par chhor dein.',
      need:'Sab se ziyada kya madad karega?',
      triggers:'Is par kya asar ho sakta hai?',
      feeling:'Apne alfaz (optional)',
      feelingPlaceholder:'Ek lafz ya chhoti phrase',
      save:'Detail mehfooz karein',
      saveFailedTitle:'Mehfooz nahi hua',
      saveFailedBody:'Purana check-in ab bhi yahan hai. Shayad storage kam ho.',
      crisisSaveFailed:'Check-in save nahi hua, lekin Madad ab bhi maujood hai.',
      localSafetyNote:'Check-in ke chhotay alfaz sirf is device par check hote hain taake Madad zaroorat par aa sake.',
      ok:'Theek hai',
      cancel:'Mansookh',
      arrival:'Ab aap kaisay aa rahe hain?',
      states:{ Steady:'Mustaqil', Wired:'Be-qarar', Flat:'Sust', Heavy:'Bhari', 'Not sure':'Yaqeen nahi' }
    },
    calm:{
      whereAreYou:'Aap kahan hain?',
      onMyOwn:'Akela / akeli',
      aroundPeople:'Logon ke darmiyan',
      gotAnything:'Kuch paas hai?',
      browseAll:'Tamam techniques dekhein',
      showEverything:'Sab dikha dein',
      backToGuided:'← Guided par wapas'
    },
    me:{
      eyebrow:'Aap',
      yourSpace:'Aap ki jagah.',
      profile:'Profile',
      setupProfile:'Profile set karein',
      yourStory:'Aap ki kahani',
      myPlan:'Mera plan',
      edit:'Tabdeel',
      add:'Shamil',
      optional:'Optional',
      sectionAbout:'Aap ke baare mein',
      sectionInsights:'Aap ki samajh',
      sectionTools:'Aap ke tools',
      knowsHeading:'SoulCap kya jaanta hai',
      calmMore:'Aur yahan'
    },
    concerns:{
      hard_to_switch_off:'Band hona mushkil',
      sleep:'Neend',
      low_mood:'Mood kam',
      panic:'Ghabrahat',
      grief:'Gham',
      anger:'Gussa',
      loneliness:'Tanhai',
      work:'Kaam',
      family:'Khandan',
      not_sure_yet:'Abhi yaqeen nahi'
    },
    locale:{
      language:'Zubaan',
      previewNote:'Roman Urdu abhi sirf layout ka preview hai. Clinical aur safety alfaaz tab tak English mein rahenge jab tak native clinical review na ho.',
      reviewPending:'Roman Urdu clinical review abhi mukammal nahi. Safety ke liye English default rehti hai.',
      clinicalNotice:'Technique steps, library articles, aur crisis guidance abhi English mein hain — jab tak clinical review na ho.',
      clinicalDismiss:'Samajh gaya'
    },
    themes:{
      auto:'Khud', light:'Roshan', dark:'Andhera', night:'Raat', ocean:'Samandar', forest:'Jungle',
      rain:'Barish', space:'Khala', sunrise:'Tulu-e-aftaab', minimal:'Sada', amoled:'AMOLED'
    },
    presentation:{
      accent:'Rang', text:'Matn ka size', density:'Fasaail', contrast:'Ziyada contrast',
      transparency:'Shefafiat kam karein', patternLearning:'Local pattern observations',
      patternHint:'Band karne par naye pattern cards nahi banenge. Purana data waisa hi rahega.',
      themeNote:'Raat andhere se bhi halki hai. AMOLED qareeb siyah hai. Mood themes contrast aur reduced-motion ko sambhalte hain.',
      standard:'Aam', large:'Barha', compact:'Squeeze', comfortable:'Aram se',
      plum:'Baingani', lilac:'Lilac', mulberry:'Shahtoot', indigo:'Neela'
    },
    empty:{
      now:'Abhi koi check-in nahi. Jab aap batayenge ke aap kaisay aa rahe hain, dinon ki halki tasveer yahan ban sakti hai — na streak, na score.',
      calm:'Jo chahiye woh chun lein, ya neeche sab dekhein. Kuch sahi karne ki zaroorat nahi.',
      journal:'Apne alfaz ke liye private jagah. Ek line bhi kaafi hai jab tayyar hon.',
      map:'Aap markaz mein. Jab faida lage kisi ko shamil karein — yeh map sirf aap dekhte hain.',
      me:'Yeh jagah dheere dheere bharti hai. Profile, kahani, aur plan sab optional hain.'
    },
    reset:{
      title:'Apna reset menu', homeHint:'Chhotay qadam jo dubara land karne mein madad karein. Aap tabdeel kar sakte hain.',
      intro:'Mushkil lamhon ke liye kuch halkay resets shamil karein. Jab aaj kar lein to tap karein — na streak, na score.',
      empty:'Ek do chhoti cheezein se shuru karein jo reset mein madad karti hain. Naam kabhi bhi badal sakte hain.',
      add:'Reset step shamil karein', edit:'Reset menu tabdeel karein', titleLabel:'Unwan', notesLabel:'Notes (optional)',
      enabled:'Menu par dikhayen', save:'Mehfooz karein', cancel:'Mansookh', done:'Aaj ke liye ho gaya',
      notDone:'Aaj ke liye mark karein', remove:'Hata dein', back:'← Sakoon par wapas'
    },
    park:{
      button:'Soch park karein', title:'Soch park karein',
      hint:'Baad ke liye rakh dein. Koi reminder nahi — jab aap ka time aa jaye tab wapas aayegi.',
      titleLabel:'Kis baare mein hai?', bodyLabel:'Yaad rakhne ke liye kuch aur', whenLabel:'Kab wapas aayein',
      tomorrow:'Kal', weekend:'Weekend', week:'Ek hafta', save:'Park kar dein', cancel:'Mansookh',
      dueHeading:'Dobara dekhne ka waqt', archive:'Archive', dismiss:'Abhi ke liye chhor dein',
      empty:'Abhi kuch park nahi.', archived:'Archive ho gaya'
    },
    pattern:{
      evidence:'Saboot dekhein', confirm:'Haan, theek lagta hai', reject:'Ziyada nahi', hide:'Chhupa dein',
      confirmed:'Aap ne tasdeeq ki', guess:'Ek mumkinat', reset:'Pattern faislay reset karein',
      disabled:'Pattern observations band hain. Check-ins normal chalte hain.', done:'Ho gaya',
      reviewNote:'Abhi licensed clinician ne review nahi ki.'
    },
    timeline:{
      title:'Aap ka hafta', empty:'Aap ka hafta dheere dheere list se kahani ban jayega.',
      checkin:'Check-in', journal:'Journal', close:'Band karein', prev:'Pehle', next:'Baad mein'
    },
    principles:{
      title:'Usool', cardHint:'Chhoti yaad dahaniyan jo aap khud chunte hain.',
      empty:'Ek do line shamil karein jo rasta dikhaye.', add:'Usool shamil karein', save:'Mehfooz karein',
      remove:'Hata dein', close:'Band karein'
    },
    manual:{
      title:'Mera manual', cardHint:'Aap ke apne notes — jo yahan tasdeeq karte hain us se.',
      empty:'Abhi kuch nahi. Usool, patterns, aur resets se halki suggestions aa sakti hain. Sab tabdeel ya hata sakte hain.',
      refresh:'Suggestions taza karein', add:'Line shamil karein', remove:'Hata dein', close:'Band karein'
    },
    mapPace:{ still:'Saakin', drift:'Halki halchal', live:'Zinda' },
    panic:{ exit:'Madad screen chhor dein', plan:'Mera plan kholen' },
    settingsCard:{ title:'Tanzimaat', hint:'Roop, zubaan, accessibility, aur aap ka data.', open:'Kholen' }
  }
};

var LIBRARY_UI = {
  label:'Emotional library',
  title:'Understand what’s happening',
  intro:'Short, evidence-informed reading and body/mind experiences. Not a diagnosis, treatment, or substitute for care.',
  homeHint:'Experiences you might notice, plus short articles on anxiety, sleep, mood, and more.',
  searchLabel:'Search the emotional library',
  searchPlaceholder:'Search racing heart, fog, sleep…',
  filterAll:'All',
  filterExperiences:'Experiences',
  filterArticles:'Articles',
  filterSaved:'Saved',
  save:'Save article',
  saved:'Saved',
  unsave:'Remove bookmark',
  noMatches:'Nothing matches that search yet.',
  noSaved:'Nothing saved yet. Tap Save on any article to keep it here.',
  resultStatus:'{n} results',
  resultStatusOne:'1 result',
  experiencesHeading:'Experiences',
  articlesHeading:'Articles',
  experiencesIntro:'This helps you understand and cope — it does not replace a medical check-up.',
  whatItIs:'What it can feel like',
  why:'Why this can happen',
  helps:'What may help',
  selfCare:'Gentle self-care',
  reflect:'A question to consider',
  source:'Source note',
  akaPrefix:'Also called',
  tryExercise:'Try',
  back:'← Back to Calm',
  practical:'Things that may help',
  support:'When professional support may help',
  references:'Sources and further reading',
  related:'Related exercises',
  reviewNote:'Not yet reviewed by a licensed clinician. Not a diagnosis.',
  close:'Close'
};
var EXPERIENCE_PICKER_UI = {
  title:'What’s happening?',
  cardTitle:'Notice what’s happening',
  cardHint:'Optional. Body or mind sensations → something that may help.',
  calmHint:'Pick a sensation. Never required.',
  intro:'Choose anything that fits. This is reflection, not a diagnosis.',
  searchLabel:'Search experiences',
  searchPlaceholder:'heart, fog, rumination…',
  back:'Close'
};
var CALM_REVIEW_NOTE = 'Skills, articles, and experiences are evidence-informed but not yet reviewed by a licensed clinician.';

var EXPERIENCE_GROUPS = [
  { id:'physical', label:'Body / somatic', blurb:'Sensations people often notice when the alarm system is on.' },
  { id:'cognitive', label:'Mind / cognitive', blurb:'Thought patterns and fog that can ride with stress or mood.' }
];

var REDFLAG_UI = {
  emergencyTitle:'Please get urgent help',
  emergencyLead:'This is different from anxiety.',
  emergencyTail:'Please stop and contact your local emergency services or a doctor now.',
  seeDoctorTitle:'Worth a medical check',
  seeDoctorLead:'If this is new, severe, or mainly physical, please get it checked by a doctor.',
  seeDoctorTail:'Anxiety is diagnosed only after physical causes are ruled out.',
  notDiagnosis:'Not a diagnosis. SoulCap never decides what you “have”.'
};

/* Experiences library (v1.9). Screen + reflect — never diagnose. helps ids must exist in SKILLS. */
var EXPERIENCES = [
  { id:'racing-heart', name:'Racing heart or palpitations', group:'physical',
    aka:['heart pounding','chest fluttering','skipping beats'],
    whatItis:'Your heart feels like it is pounding, racing, or skipping. It is one of the most common and most frightening feelings of anxiety.',
    why:'When your brain senses threat it releases adrenaline, which speeds the heart to ready you to act. There is nothing wrong with the heart itself — it is doing its job, just when no running or fighting is needed.',
    commonWith:['anxiety','panic'],
    helps:['physiological-sigh','cold-water','box-breathing'],
    selfCare:['Let the wave crest — it peaks and falls within minutes; it cannot harm a healthy heart.','Slow the exhale; a long out-breath is the brake.','Feel your feet on the floor.'],
    reflection:['What was happening just before it started?'],
    redFlag:{ level:'emergency', text:'Crushing chest pain, pain spreading to your arm or jaw, or breathlessness while resting is different from anxiety — treat it as a possible heart problem and contact emergency services or a doctor now.' },
    source:'Autonomic arousal — standard anxiety psychoeducation' },

  { id:'short-breath', name:'Can’t get a full breath', group:'physical',
    aka:['air hunger','shallow breathing','can’t breathe deep'],
    whatItis:'You feel you cannot take a satisfying breath, even though air is moving. The urge to gulp more air can make the feeling stronger.',
    why:'Anxiety often leads to over-breathing. Blowing off carbon dioxide too fast can create air hunger that feels like a lack of oxygen — even when your lungs are fine.',
    commonWith:['anxiety','panic'],
    helps:['box-breathing','four-seven-eight','grounding-54321'],
    selfCare:['Lengthen the out-breath more than the in-breath.','Breathe into a cupped hand or a scarf to gently raise CO₂.','Name five things you can see while you breathe.'],
    reflection:['Did the breath change before or after the worry peaked?'],
    redFlag:{ level:'emergency', text:'Sudden severe breathlessness, blue lips, or breathlessness with chest pain is not something to wait out — contact emergency services or a doctor now.' },
    source:'Hyperventilation / respiratory alkalosis — standard anxiety psychoeducation' },

  { id:'chest-tight', name:'Chest tightness or pressure', group:'physical',
    aka:['chest pressure','tight chest','band around chest'],
    whatItis:'A sense of pressure, bracing, or a band around the chest. It can feel alarming even when it comes and goes with stress.',
    why:'Shoulders, chest, and breathing muscles brace when the threat system is on. Shallow breathing and muscle tension can create a tight, heavy feeling without a heart problem.',
    commonWith:['anxiety','panic'],
    helps:['pmr','physiological-sigh'],
    selfCare:['Unclench your jaw and drop your shoulders.','Place a hand on the chest and feel one slow out-breath.','Change posture — stand or walk a few steps.'],
    reflection:['Where else in your body is bracing right now?'],
    redFlag:{ level:'emergency', text:'Pain spreading to arm or jaw, sweating, or breathlessness with chest pressure can be a heart emergency — contact emergency services or a doctor now.' },
    source:'Somatic bracing + shallow breathing — standard anxiety psychoeducation' },

  { id:'dizzy', name:'Dizziness or lightheaded', group:'physical',
    aka:['lightheaded','woozy','unsteady'],
    whatItis:'The room may feel floaty, or you feel briefly unsteady. It often arrives with fast breathing or a surge of fear.',
    why:'Fast breathing lowers carbon dioxide, which can reduce blood flow to the brain briefly and create lightheadedness. The sensation is usually temporary.',
    commonWith:['anxiety','panic'],
    helps:['box-breathing','feet-floor'],
    selfCare:['Sit or lean somewhere safe.','Slow the exhale.','Press both feet into the floor and name the contact.'],
    reflection:['Were you standing still, over-breathing, or skipping food or water?'],
    redFlag:{ level:'seeDoctor', text:'Fainting, the room truly spinning, or one-sided weakness is not typical anxiety — get it checked by a doctor. Sudden confusion with weakness needs urgent care.' },
    source:'Hypocapnia / vestibular cueing — standard anxiety psychoeducation' },

  { id:'trembling', name:'Trembling or shaking', group:'physical',
    aka:['shaking','tremor','jitters'],
    whatItis:'Hands, legs, or the whole body may tremble. It can feel embarrassing and hard to hide.',
    why:'Adrenaline readies muscles for action. When you are still, that charge can show up as shaking until the surge settles.',
    commonWith:['anxiety','panic'],
    helps:['burst-movement','physiological-sigh'],
    selfCare:['Shake out your hands on purpose for ten seconds.','Take a short burst of movement, then slow the breath.','Warm your hands if they feel cold.'],
    reflection:['Does movement or stillness change the shake?'],
    redFlag:null,
    source:'Adrenergic muscle readiness — standard anxiety psychoeducation' },

  { id:'nausea-gut', name:'Nausea, butterflies, or gut clench', group:'physical',
    aka:['butterflies','sick stomach','gut knot'],
    whatItis:'The stomach drops, flutters, or clenches. Appetite may vanish or food may feel hard to keep down.',
    why:'The gut and brain share a fast signalling loop. Threat chemistry shifts digestion toward “pause,” which many people feel as butterflies or nausea.',
    commonWith:['anxiety','stress'],
    helps:['grounding-54321','cold-sip'],
    selfCare:['Sip something cool slowly.','Feel your feet and name three sounds.','Avoid forcing a big meal until the wave softens.'],
    reflection:['What was the first body cue — gut, chest, or thought?'],
    redFlag:{ level:'seeDoctor', text:'Severe or persistent abdominal pain, vomiting blood, or black stools need a doctor — do not treat that as anxiety alone.' },
    source:'Gut–brain axis / autonomic shift — standard stress psychoeducation' },

  { id:'facial-tension', name:'Jaw or face tension, tingling, numb lips', group:'physical',
    aka:['jaw clench','numb lips','face tingling'],
    whatItis:'Jaw, cheeks, or lips feel tight, tingly, or briefly numb. Some people notice it around the mouth first.',
    why:'Bracing the jaw and over-breathing can change blood chemistry and nerve sensation around the face. It feels strange; it is usually temporary with stress.',
    commonWith:['anxiety','panic'],
    helps:['pmr','box-breathing'],
    selfCare:['Unclench your teeth; rest the tongue gently on the floor of the mouth.','Slow the out-breath.','Massage the hinge of the jaw lightly if that feels safe.'],
    reflection:['Have you been holding your breath or clenching while concentrating?'],
    redFlag:{ level:'emergency', text:'Sudden one-sided facial droop, slurred speech, or arm weakness can be a stroke emergency — contact emergency services or a doctor now.' },
    source:'Bracing + hyperventilation paraesthesia — standard anxiety psychoeducation' },

  { id:'muscle-tension', name:'Neck, shoulder, or back tension', group:'physical',
    aka:['tight shoulders','stiff neck','back knot'],
    whatItis:'Muscles stay braced as if ready for impact. The neck and shoulders often carry it first.',
    why:'Sustained bracing is part of the threat response. Held for hours or days, it becomes aches and stiffness even after the moment of stress has passed.',
    commonWith:['stress','anxiety'],
    helps:['pmr','ten-minute-walk'],
    selfCare:['Drop the shoulders and roll them once.','Stand and walk for a few minutes.','Heat or a warm shower if available.'],
    reflection:['When did you last fully unclench today?'],
    redFlag:null,
    source:'Sustained muscle bracing — standard stress psychoeducation' },

  { id:'headache', name:'Tension headache or band around the head', group:'physical',
    aka:['band headache','tight scalp','stress headache'],
    whatItis:'A dull band or pressure around the head, often with a tight neck. Screens and jaw clench can amplify it.',
    why:'Scalp, jaw, and neck muscles brace under load. Shallow breathing and screen posture stack on top.',
    commonWith:['stress','anxiety'],
    helps:['pmr','wind-down'],
    selfCare:['Soften the jaw and forehead.','Dim the screen and look far away for a minute.','Drink water if you have been under-hydrated.'],
    reflection:['Is this more posture and bracing, or did it arrive with a fear spike?'],
    redFlag:{ level:'seeDoctor', text:'A sudden “worst ever” headache, or headache with fever, confusion, stiff neck, or weakness needs urgent medical care — contact emergency services or a doctor now.' },
    source:'Tension-type headache mechanisms — standard stress psychoeducation' },

  { id:'fatigue', name:'Exhaustion or heavy limbs', group:'physical',
    aka:['heavy limbs','wiped out','bone tired'],
    whatItis:'The body feels drained or weighted. Ordinary tasks can feel like climbing.',
    why:'Chronic arousal burns energy. Low mood and poor sleep stack on top, so heaviness can be both physical and emotional.',
    commonWith:['low mood','stress'],
    helps:['behavioural-activation','wind-down'],
    selfCare:['Choose one tiny action — smaller than you think you “should.”','Rest without calling it failure.','Protect an earlier wind-down if evenings run late.'],
    reflection:['What has been asking for constant readiness lately?'],
    redFlag:{ level:'seeDoctor', text:'Sudden severe weakness, especially one-sided, needs urgent medical care — contact emergency services or a doctor now.' },
    source:'Allostatic load / low mood energy — standard psychoeducation' },

  { id:'sweating-flush', name:'Sweating, hot-cold flushes, or dry mouth', group:'physical',
    aka:['hot flush','cold sweat','dry mouth'],
    whatItis:'Sudden heat, chills, sweat, or a mouth that feels dry. It can arrive with embarrassment or fear.',
    why:'The autonomic system redirects blood flow and moisture when it prepares for action. The body is doing alarm chemistry, not “failing.”',
    commonWith:['anxiety','panic'],
    helps:['cold-water','grounding-54321'],
    selfCare:['Cool your wrists or face if you can.','Name five things you see.','Loosen a collar or step into cooler air.'],
    reflection:['Did the flush follow a social moment, a thought, or come from nowhere?'],
    redFlag:null,
    source:'Autonomic surge — standard anxiety psychoeducation' },

  { id:'clenching', name:'Teeth grinding or jaw clenching', group:'physical',
    aka:['bruxism','jaw clench','grinding teeth'],
    whatItis:'You catch yourself pressing teeth together, or wake with a sore jaw. It often runs under awareness.',
    why:'Stress bracing includes the jaw. At night it can continue as grinding while the mind is offline.',
    commonWith:['stress','anxiety'],
    helps:['pmr','wind-down'],
    selfCare:['Rest the tongue gently and separate the teeth a little.','Massage the jaw hinge.','Build a calmer wind-down before bed.'],
    reflection:['When do you notice the clench most — screens, driving, sleep?'],
    redFlag:null,
    source:'Orofacial bracing — standard stress psychoeducation' },

  { id:'appetite', name:'Appetite change (loss or comfort eating)', group:'physical',
    aka:['no appetite','comfort eating','stress eating'],
    whatItis:'Food interest shrinks, or eating becomes a way to soothe. Both can show up in the same week.',
    why:'Threat chemistry pauses digestion for some people; for others, eating briefly settles the nervous system. Mood shifts also change appetite signals.',
    commonWith:['stress','low mood'],
    helps:['self-compassion-break','wind-down'],
    selfCare:['Eat something small and regular rather than waiting for perfect hunger.','If comfort eating, pause and ask what the body needed besides food.','Keep harsh self-talk out of the kitchen.'],
    reflection:['Is appetite quieter, louder, or swinging?'],
    redFlag:{ level:'seeDoctor', text:'Rapid weight loss, inability to keep food down, or medical concerns around eating need a doctor — do not rely on this app alone.' },
    source:'Stress–appetite links — standard psychoeducation' },

  { id:'restless', name:'Restlessness / can’t sit still', group:'physical',
    aka:['can’t sit still','fidgety','wired body'],
    whatItis:'An urge to move, pace, or fidget. Sitting can feel impossible even when you are tired.',
    why:'Circulating adrenaline wants an outlet. Stillness can make the charge feel louder until some of it is used.',
    commonWith:['anxiety','wired'],
    helps:['burst-movement','feet-floor'],
    selfCare:['Give the body a short, safe burst of movement.','Then plant both feet and name the contact.','Shake out your hands on purpose.'],
    reflection:['Does a short walk change the urge?'],
    redFlag:null,
    source:'Adrenergic restlessness — standard anxiety psychoeducation' },

  { id:'racing-thoughts', name:'Racing thoughts', group:'cognitive',
    aka:['thoughts racing','mind spinning','too many thoughts'],
    whatItis:'Thoughts arrive faster than you can finish them. Topics jump; nothing feels settled.',
    why:'A threat-scanning mind keeps generating possibilities. Speed can feel like problem-solving while it rarely reaches a next useful step.',
    commonWith:['anxiety','wired'],
    helps:['count-backwards','categories-game','worry-postponement'],
    selfCare:['Park one thought on paper.','Do a short cognitive load task to interrupt the spin.','Choose a later worry window if nothing is actionable now.'],
    reflection:['Is there one next action, or only circling?'],
    redFlag:null,
    source:'Threat scanning / cognitive load — standard anxiety psychoeducation' },

  { id:'rumination', name:'Rumination (chewing the past)', group:'cognitive',
    aka:['chewing the past','replaying','stuck on what happened'],
    whatItis:'The mind replays a scene, conversation, or mistake. It feels sticky and hard to leave.',
    why:'Rumination tries to gain control after the fact. The loop can keep the body in mild alarm without producing new information.',
    commonWith:['low mood','anxiety'],
    helps:['defusion','worry-vs-problem','behavioural-activation'],
    selfCare:['Name it: “this is a replay.”','Ask whether a next action exists; if not, gently shift to one small present task.','Move your body briefly to change state.'],
    reflection:['What would “enough revisiting for now” look like?'],
    redFlag:null,
    source:'Ruminative looping — standard CBT/ACT psychoeducation' },

  { id:'overthinking', name:'Overthinking / paralysis', group:'cognitive',
    aka:['analysis paralysis','stuck deciding','over-analysing'],
    whatItis:'You keep analysing options until action feels impossible. Certainty never quite arrives.',
    why:'Analysis can be a way to avoid the discomfort of choosing. The loop grows with each new “what if.”',
    commonWith:['anxiety','worry'],
    helps:['thought-record','behavioural-activation'],
    selfCare:['Write the decision in one sentence.','Pick a time-box: decide within ten minutes, or defer with a date.','Do one tiny related action even if imperfect.'],
    reflection:['What is the smallest reversible next step?'],
    redFlag:null,
    source:'Avoidance via analysis — standard CBT psychoeducation' },

  { id:'catastrophising', name:'“What if the worst…”', group:'cognitive',
    aka:['catastrophising','worst case','what if'],
    whatItis:'The mind jumps to the worst outcome and treats it as likely. Body alarm often follows the picture.',
    why:'Threat systems overestimate danger to keep you safe. Probability gets distorted; vivid images feel like evidence.',
    commonWith:['anxiety','worry'],
    helps:['thought-record','worry-postponement'],
    selfCare:['Write the feared outcome and a more balanced alternative.','Ask what you would tell a friend.','Postpone further worry to a set time if no action is needed now.'],
    reflection:['How many times has the worst version actually happened?'],
    redFlag:null,
    source:'Threat overestimation — standard CBT psychoeducation' },

  { id:'intrusive', name:'Intrusive thoughts', group:'cognitive',
    aka:['unwanted thoughts','intrusions','sticky image'],
    whatItis:'Unwanted images or thoughts pop in and feel shocking or “not me.” Distress is common; the thought itself is not a plan.',
    why:'Brains misfile and generate odd content under stress. Fighting the thought hard can make it stickier. Distressing does not mean dangerous or intended.',
    commonWith:['anxiety','OCD-like worry'],
    helps:['defusion','container','self-compassion-break'],
    selfCare:['Label: “an intrusive thought showed up.”','Do not treat it as a command.','Return attention to the room with a grounding skill.'],
    reflection:['Did the thought feel more sticky when you tried to push it away?'],
    redFlag:null,
    source:'Intrusive cognition — standard OCD/anxiety psychoeducation; not a diagnosis' },

  { id:'brain-fog', name:'Can’t concentrate / fog', group:'cognitive',
    aka:['brain fog','can’t focus','fuzzy mind'],
    whatItis:'Focus slips. Words hide. Reading or deciding feels muffled.',
    why:'Arousal steals working memory. Sleep debt and low mood amplify the fog. It is usually a capacity issue, not a character flaw.',
    commonWith:['stress','low mood','poor sleep'],
    helps:['grounding-54321','feet-floor'],
    selfCare:['Shrink the task to one tiny step.','Orient to the room before forcing focus.','Protect rest if nights have been rough.'],
    reflection:['What load has been constant for days?'],
    redFlag:{ level:'seeDoctor', text:'Sudden confusion or disorientation is not ordinary fog — seek urgent medical care now.' },
    source:'Arousal and working memory — standard stress psychoeducation' },

  { id:'indecision', name:'Indecision', group:'cognitive',
    aka:['can’t decide','stuck choosing','decision fog'],
    whatItis:'Even small choices feel heavy. You bounce between options without landing.',
    why:'Load and fear of regret make every option look costly. The nervous system prefers delay over a wrong move.',
    commonWith:['anxiety','overwhelm'],
    helps:['values-check'],
    selfCare:['Name what matters most in one line.','Choose a reversible option.','Ask a trusted person for one perspective, not ten.'],
    reflection:['Which choice fits your values even if it is imperfect?'],
    redFlag:null,
    source:'Decision load under threat — standard psychoeducation' },

  { id:'self-criticism', name:'Harsh self-talk', group:'cognitive',
    aka:['inner critic','beating myself up','harsh voice'],
    whatItis:'An inner voice attacks, shames, or calls you a failure. It can feel like the only honest voice.',
    why:'Many people learn a critic early as a way to stay safe or accepted. Under stress it gets louder, even when it no longer helps.',
    commonWith:['low mood','anxiety'],
    helps:['self-compassion-break','thought-record'],
    selfCare:['Notice the critic without agreeing.','Speak one kinder factual line.','Ask what you needed instead of what you “are.”'],
    reflection:['Would you say this to someone you care about?'],
    redFlag:null,
    source:'Internalised critic — standard compassion-focused / CBT psychoeducation' },

  { id:'time-blur', name:'“The day is a blur”', group:'cognitive',
    aka:['day blur','dissociative fog','checked out'],
    whatItis:'Hours pass without a clear memory of them. You feel distant from yourself or the room.',
    why:'Under overload, attention can narrow or detach. It is a protective fog, not proof you are broken — though it can feel eerie.',
    commonWith:['stress','overwhelm'],
    helps:['grounding-54321','orient-room'],
    selfCare:['Name three colours and two sounds.','Feel your feet and the temperature of the air.','Do one ordinary task slowly on purpose.'],
    reflection:['When did the blur start today?'],
    redFlag:null,
    source:'Attentional detachment under load — gentle psychoeducation; not a diagnosis' },

  { id:'hypervigilance', name:'On edge / startle / scanning', group:'cognitive',
    aka:['on edge','startle','scanning for danger'],
    whatItis:'You jump at sounds, scan faces or rooms, and struggle to feel “off duty.”',
    why:'The threat system can stay switched on after stress. Scanning once helped; stuck scanning exhausts you.',
    commonWith:['anxiety','trauma history'],
    helps:['orient-room','box-breathing'],
    selfCare:['Look around and name that you are here, now.','Slow the exhale.','Reduce one input (news, alerts) for a short window.'],
    reflection:['What would “safe enough for this next hour” look like?'],
    redFlag:null,
    source:'Sustained threat orientation — standard anxiety/trauma-informed psychoeducation' }
];

var ARTICLES = [
  { id:'anxiety-panic', title:'Anxiety and panic', tags:['anxiety','panic','wired','fear'],
    summary:'When the body’s alarm system fires hard, even without immediate danger.',
    sections:[
      { title:'What it can feel like', body:'A racing heart, short breath, dizziness, tightness, dread, or a strong urge to escape. The sensations are real. They do not tell you, by themselves, what is causing them.' },
      { title:'What may be happening', body:'The threat system prepares the body to act. Fighting every sensation can add another layer of alarm; some people find it easier to orient to the room and let the wave change at its own pace.' }
    ],
    practical:['Put both feet somewhere supported and name what you can see.','Try a slower exhale without forcing a deep breath.','If symptoms are new, severe, or medically concerning, seek medical advice rather than assuming anxiety.'],
    reflection:['What did you notice first: a thought, a body sensation, or something around you?','What helped the wave become even slightly more manageable?'],
    support:'Consider professional support when panic keeps returning, changes what you can do, or you are unsure whether symptoms have a physical cause.',
    references:['World Health Organization — Doing What Matters in Times of Stress (2020)','NHS — Panic disorder overview and self-help guidance'],
    skillIds:['physiological-sigh','feet-floor','orient-room'] },

  { id:'overthinking', title:'Overthinking and worry', tags:['worry','overthinking','thoughts','focus'],
    summary:'When the mind keeps rehearsing possibilities without reaching a useful next step.',
    sections:[
      { title:'Worry is not failure', body:'Worry often tries to create certainty. It can feel productive while repeating the same question. A useful distinction is whether something needs one concrete action now or whether the mind is circling an uncertainty.' },
      { title:'Making room around a thought', body:'A thought can be important without being a fact or an instruction. Writing it down, naming it as a thought, or choosing a later time to revisit it can reduce the need to keep holding it.' }
    ],
    practical:['Write the question down once.','Ask whether one small action is available today.','If no action is available, choose when you will revisit it and return attention to the present task.'],
    reflection:['Is this a problem with a next action, or an uncertainty you cannot settle tonight?','What would “enough thinking for now” look like?'],
    support:'Consider professional support when worry takes up much of the day, disrupts sleep, or makes ordinary responsibilities hard to manage.',
    references:['World Health Organization — Doing What Matters in Times of Stress (2020)','NHS Every Mind Matters — Tackling your worries'],
    skillIds:['worry-vs-problem','worry-postponement','defusion'] },

  { id:'sleep', title:'Sleep when the mind will not switch off', tags:['sleep','night','rest','insomnia'],
    summary:'A gentle explanation of why trying harder to sleep can sometimes keep you awake.',
    sections:[
      { title:'Sleep cannot be forced', body:'Pressure to sleep can make the bed feel like a place for effort and monitoring. A calmer aim is to create conditions for rest, then let sleep arrive rather than checking whether it has.' },
      { title:'Protecting the association', body:'If you are awake and frustrated for a while, some sleep guidance suggests moving to a dim, quiet activity and returning when sleepiness comes back.' }
    ],
    practical:['Keep light low and avoid clock-checking if you can.','Choose something quiet and uninteresting rather than trying to solve tomorrow.','Keep wake time reasonably consistent after a rough night.'],
    reflection:['What usually turns bedtime into effort?','What is one part of the evening you can make less demanding?'],
    support:'Consider professional or medical support when sleep trouble persists, affects safety or daily functioning, or comes with breathing problems, severe mood changes, or medication concerns.',
    references:['NHS — Insomnia guidance','American Academy of Sleep Medicine — Behavioral and psychological treatments for chronic insomnia'],
    skillIds:['stimulus-control','wind-down','worry-postponement'] },

  { id:'low-mood', title:'Low mood and feeling flat', tags:['low mood','flat','heavy','motivation'],
    summary:'When energy and interest shrink, small action can be more available than motivation.',
    sections:[
      { title:'Why starting feels hard', body:'Low mood can reduce energy, reward, and expectation that anything will help. Waiting to feel motivated may keep life smaller; a tiny chosen action can sometimes come before any change in feeling.' },
      { title:'Small means small', body:'The aim is not a perfect routine. It may be standing by an open window, washing one cup, or walking for two minutes. Completion is information, not a score.' }
    ],
    practical:['Choose one action that takes under ten minutes.','Make the first step smaller than your mind says it should be.','Notice what happened without demanding that it improve your mood.'],
    reflection:['What has become harder lately?','What used to give even a small sense of interest, care, or movement?'],
    support:'Consider professional support when low mood lasts, keeps deepening, affects basic care or functioning, or includes thoughts of self-harm or not wanting to live.',
    references:['NHS — Low mood and depression guidance','World Health Organization — Doing What Matters in Times of Stress (2020)'],
    skillIds:['behavioural-activation','ten-minute-walk','self-compassion-break'] },

  { id:'grief', title:'Grief', tags:['grief','loss','bereavement','missing'],
    summary:'Grief can move between pain, numbness, memory, anger, relief, and ordinary moments.',
    sections:[
      { title:'No single correct shape', body:'Grief is not a fixed sequence. Feelings can change by the hour, return after quiet periods, or be absent when you expected them. None of that measures how much someone mattered.' },
      { title:'Continuing while carrying it', body:'Support can include remembering, resting, keeping one ordinary routine, or being near someone who does not require you to explain.' }
    ],
    practical:['Lower expectations on days with less capacity.','Choose one person or place where you do not have to perform being okay.','Keep a small routine that supports food, rest, or daylight.'],
    reflection:['What part of this loss feels most present today?','Is there a way you want to remember or stay connected to what mattered?'],
    support:'Consider professional support when grief feels impossible to carry alone, daily functioning remains severely affected, or safety becomes a concern.',
    references:['NHS — Grief after bereavement or loss','American Psychological Association — Grief resources'],
    skillIds:['hand-on-heart','reach-out','values-check'] },

  { id:'boundaries', title:'Boundaries and difficult relationships', tags:['boundaries','relationships','family','work'],
    summary:'A boundary describes what you will do to protect capacity; it does not control another person.',
    sections:[
      { title:'Boundaries can be quiet', body:'A boundary may be ending a conversation, delaying a reply, sharing less information, or choosing where you spend time. It does not need a perfect speech.' },
      { title:'Discomfort is not proof of wrongdoing', body:'Setting a limit can bring guilt or anxiety, especially when others expect access. Those feelings may need care without deciding the limit was wrong.' }
    ],
    practical:['Name the limit in one plain sentence.','Choose what you will do if the limit is not respected.','Practise with a lower-stakes situation first.'],
    reflection:['What interaction leaves you with less capacity than you can afford?','What is in your control before, during, or after it?'],
    support:'Consider professional support when a relationship involves fear, coercion, threats, violence, or repeated control. Prioritise local, qualified help and immediate safety.',
    references:['NHS — Mental wellbeing and relationships resources','American Psychological Association — Building and maintaining healthy relationships'],
    skillIds:['values-check','self-compassion-break','orient-room'] },

  { id:'alarm-system', title:'Your body’s alarm — fight, flight, freeze', tags:['fight','flight','freeze','fawn','adrenaline','alarm','panic','threat'],
    summary:'Why the threat response is protective — and why it produces so many of the body sensations in the Experiences library.',
    sections:[
      { title:'An alarm, not a broken system', body:'When the brain detects possible danger it prepares the body to act. Heart rate rises, breath quickens, muscles brace, digestion pauses, attention narrows. That is the same family of change behind a racing heart, short breath, shaking, gut clench, and scanning the room. The system is doing a job — often at the wrong time.' },
      { title:'Fight, flight, freeze — and fawn', body:'Fight mobilises energy toward confrontation. Flight mobilises toward escape. Freeze can feel like shutdown, fog, or inability to move or speak. Fawn is a social appease response some people notice under threat. None of these prove you are weak; they are old survival options.' },
      { title:'The recovery side', body:'The parasympathetic side of the nervous system helps the body come back down. A longer exhale is one lever many people find useful. Co-regulation — being near a calm person, voice, or place — can also help. Recovery is not forced calm; it is giving the alarm a chance to stand down.' }
    ],
    practical:['Name the alarm: “my body is preparing for action.”','Lengthen the out-breath without forcing a deep gasp.','Orient: look around and name what is here, now.','If symptoms are new, severe, or medically concerning, seek medical advice rather than assuming anxiety.'],
    reflection:['Which mode shows up most for you — fight, flight, freeze, or fawn?','What usually helps the wave crest and fall, even a little?'],
    support:'Consider professional support when the alarm keeps returning, changes what you can do, or you are unsure whether symptoms have a physical cause. Sudden crushing chest pain, one-sided weakness, or severe breathlessness need urgent medical care.',
    references:['World Health Organization — Doing What Matters in Times of Stress (2020)','NHS — Anxiety and panic self-help guidance'],
    skillIds:['physiological-sigh','box-breathing','orient-room','grounding-54321'] },

  { id:'wind-down-boundaries', title:'Slowing down — boundaries and winding down', tags:['boundaries','wind-down','evening','screens','rest','work','sleep'],
    summary:'A protected wind-down window, closing the day, and why chronic arousal needs an off-ramp — without guilt if you miss it.',
    sections:[
      { title:'Why evenings bleed', body:'Work, messages, and bright screens keep the threat and reward systems half-awake. Chronic arousal needs a daily off-ramp. A wind-down window is not a rule to fail; it is a protected stretch where fewer demands are allowed in.' },
      { title:'Close the day', body:'A short ritual can mark the end of effort: write tomorrow’s one next step, put the phone out of arm’s reach, dim lights, or use a night reflection in the journal. Micro-breaks and single-tasking during the day reduce how much evening has to repair.' },
      { title:'Light, sleep pressure, and morning', body:'Morning light helps set sleep pressure later. An earlier wind-down supports that loop. Missed nights happen. The kind next move is one smaller boundary tomorrow — not a streak to rebuild.' }
    ],
    practical:['Choose an optional wind-down hour in Settings (no notifications — only a gentle card in the app after that hour).','Pick one “close the day” action under five minutes.','Protect one screen-dim stretch before bed if you can.','Link a daily support or a journal night template when that feels useful.'],
    reflection:['What usually steals the last quiet hour of your day?','What is one boundary you can keep even on a hard day?'],
    support:'Consider professional or medical support when sleep trouble persists, mood keeps worsening, or you cannot protect basic rest and safety. This article is not a diagnosis or a treatment plan.',
    references:['NHS — Sleep and tiredness guidance','World Health Organization — Doing What Matters in Times of Stress (2020)'],
    skillIds:['wind-down','stimulus-control','worry-postponement','values-check'] }
];

var WIND_DOWN_UI = {
  settingsTitle:'Evening wind-down (optional)',
  settingsHint:'No notifications. After this hour, Now may show a gentle card. Off means no card.',
  off:'Off',
  nowTitle:'Wind-down window',
  nowHint:'You chose this hour as a quieter stretch. No guilt if you miss it — one small close-the-day step is enough.',
  openArticle:'Read about winding down',
  journalNight:'Open journal'
};

var SUPPORT_UI = {
  title:'Small daily supports',
  intro:'Choose only what feels useful. Mark today if you want. No streaks, scores, reminders, or missed-day messages.',
  homeHint:'Optional daily actions. No streaks, scores, or pressure.',
  choose:'Choose your supports',
  today:'Today',
  empty:'Pick one or two small supports. You can change them any time.',
  done:'Done today',
  notDone:'Mark for today',
  remove:'Remove',
  back:'← Back to Calm',
  saveFailedTitle:'That did not save',
  saveFailedBody:'Your previous daily-support choices are still here. Nothing was counted.'
};

var DAILY_SUPPORTS = [
  { id:'water', title:'Have some water', note:'A glass, a few sips, whatever is available.' },
  { id:'daylight', title:'See some daylight', note:'A window, doorway, balcony, or brief step outside.' },
  { id:'move', title:'Move for a few minutes', note:'Walk, stretch, or change position.' },
  { id:'journal', title:'Put one thought down', note:'One sentence counts. A full entry is not required.' },
  { id:'connect', title:'Speak or message someone', note:'You choose the person and use your own phone.' },
  { id:'quiet', title:'Take a quiet pause', note:'One minute without needing to improve anything.' }
];

var SKILLS = [
  /* ─────────────── AUTONOMIC — works on the nervous system directly ─────────── */
  { id:'physiological-sigh', name:'Physiological sigh', domain:'breath', family:'autonomic',
    mins:2, capacity:'low', needs:'none', discreet:true,
    indication:['panic','wired','acute','anxiety'], contraindication:[],
    mechanism:'A second short inhale reopens collapsed air sacs, and the long exhale slows the heart through the vagus nerve. It is the fastest voluntary way down from peak arousal.',
    blurb:'Two inhales, one long exhale. The quickest way down.',
    steps:['Breathe in through your nose.','Now a second, shorter sniff on top. Fill the last bit.','Long, slow breath out through your mouth. Let it all go.','Again — twice in, once long out.','Three more. Then just breathe normally.'],
    // Paced breathing: the runner drives a synced orb + voice through these phases.
    pattern:{ defaultBreaths:6, phases:[
      { label:'Breathe in through your nose', secs:3, scale:0.9 },
      { label:'One more sip of air on top', secs:1, scale:1 },
      { label:'Long breath out through your mouth', secs:6, scale:0.55 }
    ]},
    source:'Cyclic sighing — respiratory physiology literature' },

  { id:'box-breathing', name:'Box breathing', domain:'breath', family:'autonomic',
    mins:4, capacity:'low', needs:'none', discreet:true,
    indication:['anxiety','panic','wired'], contraindication:[],
    mechanism:'Equal counts lengthen the exhale relative to a panicking breath rate, which shifts the balance from fight-or-flight toward rest.',
    blurb:'Even, counted breathing. Steady and portable.',
    steps:['Sit or lie however you are. Nothing to fix.','In through your nose while I count four.','Hold for four. Loose, not clenched.','Out through your mouth for four. Slow.','Hold empty for four.','Again. Four more rounds, then we stop.'],
    pattern:{ defaultBreaths:8, phases:[
      { label:'Breathe in through your nose', secs:4, scale:1 },
      { label:'Hold', secs:4, scale:1 },
      { label:'Breathe out through your mouth', secs:4, scale:0.55 },
      { label:'Hold, empty', secs:4, scale:0.55 }
    ]},
    source:'Paced breathing — WHO mhGAP self-help materials' },

  { id:'four-seven-eight', name:'4-7-8 breathing', domain:'breath', family:'autonomic',
    mins:4, capacity:'low', needs:'none', discreet:true,
    indication:['sleep','wired','anxiety'], contraindication:[],
    mechanism:'A much longer exhale than inhale maximises the vagal braking effect on heart rate. Good for winding down rather than for peak panic.',
    blurb:'Long exhales. Best for settling toward sleep.',
    steps:['In through your nose for four.','Hold for seven. If seven is too long, shorten everything but keep the ratio.','Out through your mouth for eight, slowly.','That is one round. Do four.','Stop if you feel lightheaded — that is normal and it passes.'],
    pattern:{ defaultBreaths:6, phases:[
      { label:'Breathe in through your nose', secs:4, scale:1 },
      { label:'Hold', secs:7, scale:1 },
      { label:'Breathe out through your mouth', secs:8, scale:0.5 }
    ]},
    source:'Extended-exhale breathing — relaxation training literature' },

  { id:'cold-water', name:'Cold water on your face', domain:'breath', family:'autonomic',
    mins:3, capacity:'low', needs:'water', discreet:false,
    indication:['acute','panic','overwhelmed','dissociation'],
    contraindication:['heart condition','eating disorder','self-harm history'],
    mechanism:'Cold on the face around the eyes triggers the mammalian dive reflex, which slows the heart within seconds. Blunt, physical, and faster than anything cognitive.',
    blurb:'Cold on the face. Physically slows your heart.',
    steps:['Get to a sink, or hold something cold.','Cold water on your face — especially around the eyes.','Or hold the cold thing against your cheeks for thirty seconds.','Breathe out slowly while you do it.','Notice if anything shifted. Even slightly counts.'],
    source:'TIPP temperature, DBT distress tolerance' },

  { id:'ice-hold', name:'Hold something cold', domain:'breath', family:'autonomic',
    mins:2, capacity:'low', needs:'cold', discreet:true,
    indication:['acute','dissociation','overwhelmed'],
    contraindication:['self-harm history','eating disorder','circulation problems'],
    mechanism:'A strong, harmless physical sensation competes for attention with distress and pulls you back into the present body.',
    blurb:'An ice cube or cold can. Strong sensation, no harm.',
    steps:['Hold an ice cube, a cold drink, or anything from the fridge.','Hold it in one hand. Notice exactly where the cold is.','Swap hands when it gets uncomfortable.','Breathe out slowly.','Put it down when you feel more here than you did.'],
    source:'TIPP temperature, DBT distress tolerance' },

  { id:'humming', name:'Humming', domain:'breath', family:'autonomic',
    mins:3, capacity:'low', needs:'quiet', discreet:false,
    indication:['anxiety','wired','panic'], contraindication:[],
    mechanism:'Humming vibrates the vocal folds, stimulating the vagus nerve, and forces a long controlled exhale at the same time.',
    blurb:'Low humming. Two calming effects at once.',
    steps:['Breathe in normally through your nose.','Hum on the way out — low and steady, any note.','Let the hum run until the breath runs out.','Feel the buzz in your chest and throat.','Six or seven rounds.'],
    source:'Vagal tone and vocalisation — autonomic regulation literature' },

  { id:'pmr', name:'Muscle release', domain:'breath', family:'autonomic',
    mins:8, capacity:'medium', needs:'space', discreet:false,
    indication:['wired','sleep','anxiety'], contraindication:['recent injury'],
    mechanism:'Deliberately tensing then releasing a muscle produces a deeper relaxation than trying to relax it directly, and gives the mind something concrete to track.',
    blurb:'Tense, then let go. Whole body, one part at a time.',
    steps:['Start at your feet. Curl them tight for five seconds.','Let go completely. Notice the difference.','Calves. Tense, hold five, release.','Work upward — thighs, stomach, hands, arms, shoulders, face.','Finish with everything at once: tense, hold, release.','Lie still for a minute.'],
    source:'Progressive muscle relaxation — Jacobson method' },

  { id:'burst-movement', name:'Thirty seconds of effort', domain:'move', family:'autonomic',
    mins:2, capacity:'medium', needs:'space', discreet:false,
    indication:['wired','panic','anger'],
    contraindication:['heart condition','acute','injury'],
    mechanism:'Short intense movement burns off circulating adrenaline that has nowhere to go, which is what much of panic physically is.',
    blurb:'Short and hard. Burns off the adrenaline.',
    steps:['Somewhere you can move. Thirty seconds only.','Star jumps, running on the spot, fast stairs — anything hard.','Go properly hard. Thirty seconds.','Stop. Stand still. Let your breathing settle on its own.','Notice what changed.'],
    source:'TIPP intense exercise, DBT distress tolerance' },

  /* ─────────────── SENSORY — anchoring through the senses ───────────────────── */
  { id:'grounding-54321', name:'5-4-3-2-1', domain:'ground', family:'sensory',
    mins:3, capacity:'low', needs:'none', discreet:true,
    indication:['dissociation','anxiety','panic'], contraindication:[],
    mechanism:'Deliberately cataloguing sensory input occupies the attention that panic is using, and re-anchors you in the room rather than the thought.',
    blurb:'Five senses, counted down. The classic.',
    steps:['Five things you can see. Say them, or just notice them.','Four things you can feel. Chair, floor, fabric, air.','Three things you can hear.','Two things you can smell.','One thing you can taste.','You are here. That is the whole point of the exercise.'],
    source:'Sensory grounding — standard technique, no single owner' },

  { id:'sour-anchor', name:'Something sharply sour', domain:'ground', family:'sensory',
    mins:2, capacity:'low', needs:'sour', discreet:true,
    indication:['dissociation','panic','numb'], contraindication:['eating disorder','dental problems'],
    mechanism:'A strong sour taste is nearly impossible to ignore, so it cuts through dissociation and drags attention back into the body.',
    blurb:'Lemon, strong mint, sour sweet. Impossible to ignore.',
    steps:['Lemon, a sour sweet, strong mint — whatever you have.','Put it in your mouth. Do not rush it.','Notice exactly where the sharpness lands on your tongue.','Notice your face reacting.','Stay with it until it fades.'],
    source:'Sensory grounding via strong taste — trauma-informed practice' },

  { id:'texture-focus', name:'Find five textures', domain:'ground', family:'sensory',
    mins:3, capacity:'low', needs:'none', discreet:true,
    indication:['dissociation','anxiety'], contraindication:[],
    mechanism:'Touch is processed fast and hard to fake, so detailed tactile attention is a reliable route back into the present.',
    blurb:'Touch five different things. Properly notice each.',
    steps:['Look around for five things with different surfaces.','Touch the first. Rough or smooth? Warm or cool?','Describe it to yourself in three words.','Move to the next. Take your time.','All five. No rush.'],
    source:'Tactile grounding — sensory anchoring practice' },

  { id:'cold-sip', name:'Slow cold drink', domain:'ground', family:'sensory',
    mins:3, capacity:'low', needs:'water', discreet:true,
    indication:['panic','wired','dissociation'], contraindication:[],
    mechanism:'Swallowing engages the throat and interrupts hyperventilation, and the cold gives the attention a clear track to follow.',
    blurb:'Cold water, drunk slowly. Interrupts fast breathing.',
    steps:['Cold water if you can get it.','Small sip. Hold it in your mouth a moment.','Swallow slowly. Follow the cold down.','Breathe out.','Repeat until the glass is done or you feel steadier.'],
    source:'Sensory grounding — interoceptive attention' },

  /* ─────────────── ORIENTING — spatial, safety-focused ──────────────────────── */
  { id:'feet-floor', name:'Feet on the floor', domain:'ground', family:'orienting',
    mins:2, capacity:'low', needs:'none', discreet:true,
    indication:['dissociation','panic','anxiety'], contraindication:[],
    mechanism:'Pressing into a solid surface gives the body clear proprioceptive proof of where it is, which is what dissociation temporarily loses.',
    blurb:'Press down. Feel the ground hold you.',
    steps:['Put both feet flat on the floor.','Press down. Push properly.','Feel the floor pushing back. It is holding you.','Notice your heels, then the balls of your feet, then your toes.','Keep pressing while you breathe out slowly. Five breaths.'],
    source:'Grounding through proprioception — somatic practice' },

  { id:'orient-room', name:'Look around the room', domain:'ground', family:'orienting',
    mins:3, capacity:'low', needs:'none', discreet:true,
    indication:['panic','dissociation','hypervigilance'], contraindication:[],
    mechanism:'Slowly turning the head and scanning the space signals to a threat-primed nervous system that it has checked its surroundings and found no danger.',
    blurb:'Slow scan of the space. Tells your body it is safe.',
    steps:['Turn your head slowly to the left. Really look.','Now slowly to the right.','Find the door. Find the window.','Name three things that are not a threat.','Let your shoulders drop.'],
    source:'Orienting response — polyvagal-informed practice' },

  { id:'name-colours', name:'Name the colours', domain:'ground', family:'orienting',
    mins:2, capacity:'low', needs:'none', discreet:true,
    indication:['panic','dissociation','rumination'], contraindication:[],
    mechanism:'Naming requires language, and language competes with the wordless alarm state, which reduces its intensity.',
    blurb:'Find every colour you can see. Say them.',
    steps:['Find something red. Say "red" to yourself.','Now blue. Now green.','Now something yellow, or the nearest to it.','Keep going through as many colours as you can find.','Notice you are looking outward now, not inward.'],
    source:'Verbal labelling of sensory input — affect labelling research' },

  /* ─────────────── COGNITIVE LOAD — crowding out the spiral ─────────────────── */
  { id:'count-backwards', name:'Count backwards by seven', domain:'clarity', family:'load',
    mins:3, capacity:'low', needs:'none', discreet:true,
    indication:['panic','rumination','spiralling'], contraindication:[],
    mechanism:'Effortful arithmetic occupies working memory, and a spiral needs that same working memory to keep running.',
    blurb:'From 100, subtract seven. Hard enough to crowd out the spiral.',
    steps:['Start at one hundred.','Take away seven. Say the answer.','Take away seven again.','Keep going. Losing your place is fine — start again.','Stop when the thought has loosened.'],
    source:'Cognitive load interference — attentional control practice' },

  { id:'categories-game', name:'Categories', domain:'clarity', family:'load',
    mins:3, capacity:'low', needs:'none', discreet:true,
    indication:['panic','rumination','3am'], contraindication:[],
    mechanism:'Retrieval from memory is demanding enough to interrupt rumination, but easy enough to manage while distressed.',
    blurb:'Name five of something. Then five of something else.',
    steps:['Five animals. Go.','Five countries.','Five things in a kitchen.','Five songs you know all the words to.','Keep inventing categories until it eases.'],
    source:'Distraction via structured recall — DBT distress tolerance' },

  { id:'alphabet-game', name:'Alphabet run', domain:'clarity', family:'load',
    mins:4, capacity:'low', needs:'none', discreet:true,
    indication:['3am','rumination','sleep'], contraindication:[],
    mechanism:'A fixed structure gives the mind a track to run on instead of the worry, and it is dull enough to let sleep arrive.',
    blurb:'A to Z on a theme. Dull on purpose.',
    steps:['Pick something ordinary. Foods, or towns.','A. Then B. Then C.','Stuck on a letter? Skip it.','Reach Z, or fall asleep first. Both are fine.'],
    source:'Cognitive shuffling — sleep-onset distraction' },

  /* ─────────────── SELF-SOOTHING & BILATERAL ────────────────────────────────── */
  { id:'butterfly-hug', name:'Butterfly hug', domain:'warmth', family:'soothing',
    mins:4, capacity:'low', needs:'quiet', discreet:false,
    indication:['panic','distress','dissociation'], contraindication:[],
    mechanism:'Slow alternating taps left and right provide bilateral stimulation, which tends to reduce the intensity of a distressing feeling as you hold it.',
    blurb:'Cross your arms. Tap slowly, side to side.',
    steps:['Cross your arms over your chest, hands on opposite shoulders.','Tap one hand, then the other. Slow — about one per second.','Breathe normally. Keep tapping.','Notice the feeling without trying to change it.','Thirty taps or so, then rest your hands.'],
    source:'Bilateral stimulation — EMDR-adjacent self-soothing' },

  { id:'hand-on-heart', name:'Hand on your heart', domain:'warmth', family:'soothing',
    mins:3, capacity:'low', needs:'none', discreet:true,
    indication:['shame','distress','lonely'], contraindication:[],
    mechanism:'Warm pressure on the chest is a self-directed soothing signal, and it works even when you feel silly doing it.',
    blurb:'Warm hand, own chest. Simple and it works.',
    steps:['Put one hand flat on your chest.','Feel the warmth and the weight of it.','Feel your chest rise and fall underneath.','Say something kind to yourself. Anything.','Stay for five breaths.'],
    source:'Soothing touch — self-compassion practice' },

  { id:'self-compassion-break', name:'Self-compassion break', domain:'warmth', family:'soothing',
    mins:5, capacity:'low', needs:'none', discreet:true,
    indication:['self-critical','shame','low'], contraindication:[],
    mechanism:'Naming a difficulty, normalising it, and offering yourself warmth interrupts the shame loop that turns a hard moment into a verdict about you.',
    blurb:'Speak to yourself the way you would to someone you like.',
    steps:['Name what is hard right now. "This is difficult."','Remind yourself: other people feel this too. You are not defective for it.','Hand on your chest, if that is not uncomfortable.','Say what you would say to a friend in this exact spot.','Say it to yourself. It will feel false. Do it anyway.'],
    source:'Mindful self-compassion practice' },

  { id:'rocking', name:'Slow rocking', domain:'warmth', family:'soothing',
    mins:3, capacity:'low', needs:'quiet', discreet:false,
    indication:['distress','dissociation','overwhelmed'], contraindication:[],
    mechanism:'Rhythmic, predictable movement is one of the oldest soothing signals there is, and the vestibular system responds to it regardless of what you are thinking.',
    blurb:'Gentle rocking. Old, and it works.',
    steps:['Sit somewhere you will not be watched.','Rock slowly forward and back. Small movements.','Let it find its own rhythm.','Breathe with the rhythm.','Slow to a stop when you are ready.'],
    source:'Rhythmic vestibular soothing — trauma-informed practice' },

  /* ─────────────── IMAGERY ──────────────────────────────────────────────────── */
  { id:'safe-place', name:'Safe place', domain:'reflect', family:'imagery',
    mins:6, capacity:'medium', needs:'quiet', discreet:true,
    indication:['anxiety','distress'], contraindication:['acute','psychosis'],
    mechanism:'A vividly imagined safe scene recruits the same sensory systems as the real thing, so the body responds to some of it as though it were true.',
    blurb:'Build somewhere calm in detail, and go there.',
    steps:['Think of a place where you feel settled. Real or invented.','What can you see there? Look around properly.','What can you hear?','What is the temperature on your skin?','Is there a smell?','Stay a while. You can come back here any time.'],
    source:'Guided imagery — anxiety management practice' },

  { id:'container', name:'Container', domain:'reflect', family:'imagery',
    mins:5, capacity:'medium', needs:'quiet', discreet:true,
    indication:['intrusive','rumination','overwhelmed'], contraindication:['acute'],
    mechanism:'Imagining a thought sealed away is not suppression — it is a deliberate postponement that reduces intrusion without pretending the thing is resolved.',
    blurb:'Put it somewhere safe. Not gone — just not now.',
    steps:['Picture a container. Any size, any material. Strong.','Give it a lid that seals properly.','Put the thought inside. Watch it go in.','Close it. Lock it if it has a lock.','Put it somewhere out of sight.','You know where it is. You can open it when you choose.'],
    source:'Containment imagery — trauma stabilisation practice' },

  { id:'body-scan', name:'Body scan', domain:'reflect', family:'imagery',
    mins:8, capacity:'medium', needs:'quiet', discreet:true, traumaCaution:true,
    indication:['wired','sleep','disconnected'], contraindication:['acute','dissociation'],
    mechanism:'Moving attention deliberately through the body rebuilds the connection to physical sensation that stress and rumination tend to sever.',
    blurb:'Attention through the whole body, slowly.',
    steps:['Lie or sit comfortably. Eyes closed if that is okay.','Start at the top of your head. What is there?','Move down slowly — face, neck, shoulders.','Arms, hands, chest, stomach.','Hips, legs, feet.','Nothing to fix. Just noticing.'],
    source:'Body scan — mindfulness-based stress reduction' },

  /* ─────────────── SLEEP ────────────────────────────────────────────────────── */
  { id:'stimulus-control', name:'Getting back to sleep', domain:'rest', family:'sleep',
    mins:6, capacity:'any', needs:'space', discreet:true,
    indication:['sleep','3am','rumination'], contraindication:[],
    mechanism:'Lying awake teaches your brain that bed is a place for being awake. Getting up protects the association between bed and sleep.',
    blurb:'Counterintuitive, and among the best-supported sleep advice there is.',
    steps:['Awake more than about twenty minutes? Get up.','Another room if you can. Keep the light low.','Something dull. Not your phone.','Wait until you feel sleepy — not tired, sleepy.','Then go back to bed.','Happens again? Do it again. The bed is for sleeping.'],
    source:'Stimulus control, CBT-I — NICE insomnia guidance' },

  { id:'wind-down', name:'Wind-down', domain:'rest', family:'sleep',
    mins:10, capacity:'any', needs:'none', discreet:true,
    indication:['sleep','wired'], contraindication:[],
    mechanism:'A consistent pre-sleep sequence becomes a learned cue, so the body starts preparing for sleep before you get into bed.',
    blurb:'A boundary between the day and the night.',
    steps:['Pick a time. Roughly an hour before you want to sleep.','Lights down. Screens away or dimmed.','Write down anything you are holding. It will keep until morning.','Something slow — stretching, washing, reading paper.','Same order most nights. Predictability is the active ingredient.'],
    source:'Sleep hygiene — CBT-I components' },

  { id:'worry-postponement', name:'Worry postponement', domain:'rest', family:'sleep',
    mins:5, capacity:'any', needs:'none', discreet:true,
    indication:['rumination','3am','sleep'], contraindication:[],
    mechanism:'Worry resists suppression but responds to scheduling, because the mind stops rehearsing what it trusts you will return to.',
    blurb:'Not suppressing the worry. Scheduling it.',
    steps:['Write the worry down. One line is enough.','Pick a time tomorrow to think about it properly. Fifteen minutes.','Tell yourself: not now, then. It is on the list.','When it comes back — and it will — point at the list.','Keep the appointment tomorrow. That is what makes it work next time.'],
    source:'Stimulus control for worry — CBT for GAD' },

  /* ─────────────── COGNITIVE ───────────────────────────────────────────────── */
  { id:'thought-record', name:'Thought record', domain:'clarity', family:'cognitive',
    mins:9, capacity:'any', needs:'none', discreet:true,
    indication:['rumination','low','self-critical'], contraindication:['acute'],
    mechanism:'Writing a thought down converts it from an atmosphere you are inside into an object you can examine, which is most of the work.',
    blurb:'Get the thought out of your head and onto something you can look at.',
    steps:['What happened? Just the facts, no interpretation.','What went through your mind?','How much do you believe it, zero to a hundred?','What supports it? Actual evidence, not feelings.','What does not support it?','Given both — is there a fairer way to say it?','How much do you believe the original now?'],
    source:'Cognitive restructuring — core CBT technique' },

  { id:'defusion', name:'Stepping back from a thought', domain:'clarity', family:'cognitive',
    mins:4, capacity:'any', needs:'none', discreet:true,
    indication:['rumination','self-critical'], contraindication:[],
    mechanism:'Adding "I am having the thought that" restores the gap between you and the thought, without needing to argue about whether it is true.',
    blurb:'You do not have to argue with a thought to loosen its grip.',
    steps:['Catch the thought. Say it plainly to yourself.','Now put "I am having the thought that" in front of it.','Say it again with that added.','Now: "I notice I am having the thought that…"','Same words. Slightly more room around them.'],
    source:'Cognitive defusion — ACT' },

  { id:'worry-vs-problem', name:'Worry or problem?', domain:'clarity', family:'cognitive',
    mins:5, capacity:'any', needs:'none', discreet:true,
    indication:['rumination','anxiety'], contraindication:[],
    mechanism:'Worries with an available action and worries without one need opposite responses, and most distress comes from treating the second kind like the first.',
    blurb:'Some worries have an action. Most do not.',
    steps:['Name the worry.','Is there something you could actually do about it today?','If yes — what is the smallest first step? Write it. Do that.','If no — it is a worry, not a problem. Nothing to solve.','For worries: let it be there without working on it.'],
    source:'Worry classification — CBT for GAD' },

  /* ─────────────── ACTIVATION & CONNECTION ─────────────────────────────────── */
  { id:'ten-minute-walk', name:'Ten-minute walk', domain:'move', family:'activation',
    mins:10, capacity:'medium', needs:'space', discreet:true,
    indication:['low','flat','rumination'], contraindication:['acute','panic'],
    mechanism:'Physical activity has among the strongest evidence of anything for low mood, and short walks are the version people actually do.',
    blurb:'Unglamorous, and among the best-evidenced things there is.',
    steps:['Shoes on. That is the hard part, genuinely.','Out the door. Any direction.','Five minutes out, five minutes back. That is the plan.','You do not have to enjoy it or think about anything.','If ten is too much, go to the end of the road and back.'],
    source:'Physical activity for depression — NICE depression guidance' },

  { id:'behavioural-activation', name:'One small thing', domain:'move', family:'activation',
    mins:6, capacity:'medium', needs:'none', discreet:true,
    indication:['low','flat','withdrawn'], contraindication:['acute'],
    mechanism:'In low mood, motivation follows action rather than preceding it. Waiting to feel like it is the trap that keeps the low going.',
    blurb:'Action before motivation, not after.',
    steps:['Think of something you used to do and have stopped.','Shrink it until it is almost too small to count.','Not "cook a meal" — "take one thing out of the fridge".','Pick a time today. Any time.','Do the small version. Motivation shows up afterwards.'],
    source:'Behavioural activation — NICE depression guidance' },

  { id:'opposite-action', name:'Opposite action', domain:'warmth', family:'activation',
    mins:6, capacity:'medium', needs:'none', discreet:true,
    indication:['shame','anger','withdrawn'], contraindication:['acute'],
    mechanism:'Emotions push toward actions that often deepen them. Acting opposite, fully, tends to reduce the emotion rather than suppress it.',
    blurb:'When the urge does not fit the facts, do the opposite.',
    steps:['Name the feeling and what it is pushing you to do.','Does the action actually fit the situation? Be honest.','If not — what would the opposite look like?','Shame says hide. Opposite is to stay visible.','Do the opposite, all the way, not half.'],
    source:'Opposite action — DBT emotion regulation' },

  { id:'reach-out', name:'Reach out to one person', domain:'connect', family:'connection',
    mins:5, capacity:'medium', needs:'none', discreet:true,
    indication:['lonely','withdrawn','low'], contraindication:['acute'],
    mechanism:'Withdrawal is one of the most reliable markers of a worsening episode, and reversing it in one small way interrupts the slide.',
    blurb:'One message counts. It does not have to explain anything.',
    steps:['Pick one person. Your Constellation can suggest someone.','You do not have to explain how you are.','"Thinking of you" is a complete message.','Send it before you talk yourself out of it.','No obligation to manage the reply.'],
    source:'Social connection — behavioural activation component' },

  { id:'sit-near-people', name:'Be around people', domain:'connect', family:'connection',
    mins:20, capacity:'medium', needs:'space', discreet:true,
    indication:['lonely','withdrawn'], contraindication:['acute'],
    mechanism:'Co-presence provides some of the regulating benefit of company without the demand of conversation, which makes it accessible on days talking is not.',
    blurb:'Not socialising. Just being near other humans.',
    steps:['Somewhere public with people. Café, library, park bench.','Bring something to do so you have a reason to be there.','You do not have to speak to anyone.','Twenty minutes is plenty.','Presence counts without conversation.'],
    source:'Behavioural activation — social contact hierarchy' },

  { id:'values-check', name:'Values check', domain:'reflect', family:'cognitive',
    mins:8, capacity:'any', needs:'none', discreet:true,
    indication:['stuck','stable'], contraindication:['acute'],
    mechanism:'Comparing how you spend your time against what you say matters surfaces gaps that low mood usually explains as personal failure.',
    blurb:'For steadier days. What matters, versus where you are spending yourself.',
    steps:['Name three things that matter to you. Not goals — directions.','For each, how much of last week went toward it?','Where is the biggest gap?','One small thing this week that closes it slightly?','Small. This is not a life overhaul.'],
    source:'Values clarification — ACT' }
];

var DOMAIN_META = {
  breath:  { label:'Breath',  cssVar:'--breath'  },
  ground:  { label:'Ground',  cssVar:'--ground-h'},
  rest:    { label:'Rest',    cssVar:'--rest'    },
  clarity: { label:'Clarity', cssVar:'--clarity' },
  move:    { label:'Move',    cssVar:'--move'    },
  warmth:  { label:'Warmth',  cssVar:'--warmth'  },
  connect: { label:'Connect', cssVar:'--connect' },
  reflect: { label:'Reflect', cssVar:'--reflect' }
};

var FAMILY_META = {
  autonomic:  { label:'Nervous system', note:'Works on your body directly — fastest in a spike.' },
  sensory:    { label:'Senses',         note:'Anchors you through what you can feel and taste.' },
  orienting:  { label:'Orienting',      note:'Tells a threat-primed body that it has checked the room.' },
  load:       { label:'Crowding out',   note:'Occupies the mental space a spiral needs to run.' },
  soothing:   { label:'Self-soothing',  note:'Rhythm, warmth and touch you give yourself.' },
  imagery:    { label:'Imagery',        note:'Builds a scene vivid enough for the body to respond to.' },
  sleep:      { label:'Sleep',          note:'For nights, and for 3am.' },
  cognitive:  { label:'Thinking',       note:'For when there is enough room to look at a thought.' },
  activation: { label:'Doing',          note:'Small actions that shift mood from the outside in.' },
  connection: { label:'People',         note:'Reversing withdrawal, one small step.' }
};

/* What must be to hand for a technique to be possible right now. */
var NEEDS_META = {
  none:  { label:'Nothing needed' },
  water: { label:'A tap or a drink' },
  cold:  { label:'Something cold' },
  sour:  { label:'Something sour' },
  space: { label:'Room to move' },
  quiet: { label:'Somewhere private' }
};

var CALM_HAND_OPTIONS = [
  { key:'none', label:'Nothing' },
  { key:'water', label:'A tap or drink' },
  { key:'cold', label:'Something cold' },
  { key:'sour', label:'Something sour' },
  { key:'space', label:'Room to move' }
];

// No crisis-line directory and no region/country selection (owner decision — we
// can't promise any specific line is reachable, so we point to people and general
// emergency services rather than naming numbers). See renderPanicHelp in app.js.

var CONCERNS = [
  'Hard to switch off','Sleep','Low mood','Panic','Grief',
  'Anger','Loneliness','Work','Family','Not sure yet'
];

var RELATIONSHIP_TYPES = [
  { code:'FAMILY',    label:'Family',    cssVar:'--warmth'  },
  { code:'FRIEND',    label:'Friend',    cssVar:'--clarity' },
  { code:'PARTNER',   label:'Partner',   cssVar:'--rest'    },
  { code:'CARE',      label:'Care team', cssVar:'--breath'  },
  { code:'COLLEAGUE', label:'Work',      cssVar:'--reflect' },
  { code:'OTHER',     label:'Other',     cssVar:'--connect' }
];

/* Calm front-door — "what do you need right now?" maps intent to families,
 * so Calm asks a real question instead of mirroring the Techniques library. */
var CALM_NEEDS = [
  { key:'settle', label:'Settle down',        sub:'Racing, wired, panicky', families:['autonomic','sensory','orienting'] },
  { key:'lift',   label:'Lift a low mood',    sub:'Flat, heavy, stuck',      families:['activation','connection','cognitive'] },
  { key:'sleep',  label:'Get to sleep',       sub:'Can’t switch off',        families:['sleep','autonomic','imagery'] },
  { key:'head',   label:'Get out of my head', sub:'Looping, overthinking',   families:['load','cognitive','imagery'] },
  { key:'kind',   label:'Be kinder to myself',sub:'Self-critical, ashamed',  families:['soothing','cognitive'] },
  { key:'less',   label:'Feel less alone',    sub:'Lonely, withdrawn',       families:['connection','soothing'] }
];

/* Journal book-cover options — colours (as gradient pairs) and stickers. */
var COVER_COLORS = [
  ['#6C5CE7', '#4A3A9E'], ['#8E7CC3', '#5B4A8A'], ['#4F6E88', '#2F4459'],
  ['#4F6E6A', '#2E4642'], ['#8A5F3C', '#5A3C24'], ['#9C6B52', '#6A4636'],
  ['#635777', '#3F3651'], ['#2A2430', '#141018']
];
var JOURNAL_STICKERS = ['📔', '🌙', '🌿', '⭐', '🕊️', '🫧', '🌊', '🔥', '🌸', '☕', '🎧', '✨', '🧭', '🪶'];

/* Starting points, not assignments. Blank always stays first. */
var JOURNAL_TEMPLATES = [
  { key:'blank', title:'Blank page', prompt:'Start wherever you like.', seedTitle:'', seedBody:'' },
  { key:'gratitude', title:'Three good things', prompt:'Small things count.', seedTitle:'Three good things', seedBody:'1. \n\n2. \n\n3. ' },
  { key:'morning', title:'Morning pages', prompt:'What is here as the day begins?', seedTitle:'Morning pages', seedBody:'Right now I notice…\n\nToday I need…\n\nOne gentle intention…' },
  { key:'night', title:'Night reflection', prompt:'Put the day down before sleep.', seedTitle:'Night reflection', seedBody:'What stayed with me today…\n\nWhat I can leave here for tonight…\n\nSomething kind I can give myself…' },
  { key:'worry', title:'Worry dump', prompt:'No need to solve any of it yet.', seedTitle:'What is on my mind', seedBody:'What I am worried about…\n\nWhat is in my control…\n\nWhat can wait…' },
  { key:'wins', title:'Daily wins', prompt:'Include anything that took effort.', seedTitle:'Today’s wins', seedBody:'Something I handled…\n\nSomething I tried…\n\nSomething I want to remember…' },
  { key:'future', title:'Letter to future me', prompt:'Write to yourself with warmth, not pressure.', seedTitle:'Dear future me', seedBody:'I hope you remember…\n\nRight now, life feels…\n\nWhat I want for you…' },
  { key:'dream', title:'A dream', prompt:'Fragments and feelings are enough.', seedTitle:'A dream I remember', seedBody:'What happened…\n\nWhat it felt like…\n\nWhat stayed with me after waking…' }
];

var JOURNAL_DECORATIONS = [
  { key:'', title:'Plain page', prompt:'Nothing extra.' },
  { key:'washi', title:'Washi edge', prompt:'A soft strip along the page.' },
  { key:'corner', title:'Folded corner', prompt:'A small page-corner detail.' }
];

var JOURNAL_UI = {
  chooseStart:'Choose a starting page',
  chooseStartHint:'Use a gentle structure, or begin with a blank page.',
  decorate:'Decorate this page',
  searchLabel:'Search your journal',
  searchPlaceholder:'Search words, moods, or titles',
  searchClear:'Clear journal search',
  allMonths:'All months',
  noMatches:'No entries match that search. Your writing is still here.',
  localVoiceUnavailable:'On-device transcription is not available in this browser. Nothing was sent anywhere.',
  localVoiceReady:'Listening on this device…',
  localVoiceStopped:'Transcription stopped.',
  localVoiceError:'Transcription stopped. You can keep writing.',
  coverPhoto:'Choose a cover photo',
  removeCoverPhoto:'Remove cover photo',
  storageFullTitle:'Storage is full',
  storageFullBody:'This phone’s local storage is out of room — usually photos. Remove a few images and try again. Nothing was lost.',
  manyPhotosWarn:'That is quite a lot of photos for one entry. Saving anyway — remove a few if storage gets tight.'
};

/* Optional journal prompts, offered but never required. */
var JOURNAL_PROMPTS = [
  'What’s taking up the most room in your head right now?',
  'What went better than you expected today?',
  'What are you carrying that isn’t yours to carry?',
  'If today had a colour, what would it be, and why?',
  'What would you say to a friend who’d had your day?',
  'One small thing you’re grateful for.',
  'What do you need that you haven’t asked for?',
  'What did your body feel like today?'
];

/* History-taking — entirely optional, never in the opening questionnaire.
 * The more the user shares, the more specifically SoulCap can adapt. Sensitive
 * fields (trauma, breakups) are last and clearly marked optional. All local. */
var HISTORY_SECTIONS = [
  { key:'status', title:'Relationship status', kind:'choice',
    hint:'However you’d describe it.',
    options:['Single','In a relationship','Married','It’s complicated','Separated / divorced','Widowed','Prefer not to say'] },
  { key:'household', title:'Who you live with', kind:'text',
    hint:'Alone, family, partner, flatmates…', placeholder:'e.g. with my parents and younger sister' },
  { key:'family', title:'Your family', kind:'text',
    hint:'Who’s in it, and how things are with them.', placeholder:'e.g. close to Mum, distant from Dad, one brother abroad' },
  { key:'relatives', title:'Wider relatives & people who matter', kind:'text',
    hint:'Anyone who plays a real part in your life.', placeholder:'e.g. my grandmother, two cousins I grew up with' },
  { key:'work', title:'Work or study', kind:'text',
    hint:'What takes up your days.', placeholder:'e.g. final year of university, part-time job' },
  { key:'habits', title:'Habits & routines', kind:'text',
    hint:'Sleep, exercise, screen time, anything you’re working on.', placeholder:'e.g. late nights, trying to walk daily, too much scrolling' },
  { key:'hobbies', title:'Hobbies & what lifts you', kind:'text',
    hint:'Things that help even a little.', placeholder:'e.g. cricket, cooking, drawing, long drives' },
  { key:'breakups', title:'Past relationships', kind:'text', sensitive:true,
    hint:'Only if it helps to note it. Optional.', placeholder:'e.g. a breakup last year I’m still processing' },
  { key:'trauma', title:'Hard things from your past', kind:'text', sensitive:true,
    hint:'Only what you want to. SoulCap will be gentler with certain exercises if you tell it. It never diagnoses, and this never leaves your phone.',
    placeholder:'Write as much or as little as you like' },
  { key:'notes', title:'Anything else', kind:'text',
    hint:'Whatever you’d want it to know.', placeholder:'' }
];

/* Stanley-Brown safety planning steps. Written when steady, surfaced when not. */
var SAFETY_PLAN_STEPS = [
  { key:'signs',    title:'My warning signs',
    hint:'Thoughts, feelings or situations that tell you things are sliding.',
    placeholder:'e.g. stop replying to messages, stay up past 3am' },
  { key:'coping',   title:'What helps me on my own',
    hint:'Things you can do without anyone else.',
    placeholder:'e.g. walk to the park, cold shower, put music on' },
  { key:'distract', title:'Places and people that take me out of my head',
    hint:'Not for talking about it — just for being somewhere else.',
    placeholder:'e.g. the café on the corner, my brother’s flat' },
  { key:'contacts', title:'People I can tell',
    hint:'Pulled from your Constellation, or add anyone.',
    placeholder:'e.g. Amina' },
  { key:'pros',     title:'Professionals and services',
    hint:'GP, therapist, or a local support service you trust.',
    placeholder:'e.g. Dr. Naveed or a local service I trust' },
  { key:'safer',    title:'Making my space safer',
    hint:'What you would move, lock away, or ask someone to hold.',
    placeholder:'e.g. give spare medication to Bilal' }
];
