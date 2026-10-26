// About, sponsors, passes, contacts and timeline.
// Structure and live links match meraz.iitbhilai.ac.in; copy is rewritten for The Great Indian Reverie theme.

export const about = {
  text: "Meraz 7.0, the pulsating heart of IIT Bhilai, is where technology, art and imagination unite to create an unforgettable celebration of innovation and culture. Evolving with each edition, Meraz has grown into a grand stage for talent, collaboration and creative exploration. At its core, Meraz is a tribute to curiosity and expression: a space where minds ignite, ideas take shape, and every participant becomes part of something larger than themselves. From cutting-edge tech showcases and coding battles to captivating performances, fashion artistry and culinary flair, Meraz embraces every shade of human creativity. More than an event, it is an experience that bridges disciplines, builds friendships and inspires new possibilities. Whether you come to compete, perform or simply be inspired, Meraz invites you to discover your potential and paint your own story on its vibrant canvas.",
  theme:
    "Close your eyes and India begins to hum: a projector flickering in the village square, a truck rolling past with Horn OK Please painted on its back, a transistor radio crackling from a windowsill. This year, Meraz 7.0 steps into The Great Indian Reverie, a waking dream of colour, music and wonder where every festival feels like a blockbuster release. Roll the reels, lose yourself in the show, and let creativity, technology and nostalgia drift together into something pure paisa vasool.",
  stats: [
    { value: "100+", label: "Events" },
    { value: "4000+", label: "Participants" },
    { value: "2500+", label: "Online audience" },
  ] as const,
};

// false: every sponsor frame shows the "coming soon" image and caption instead of the logo and name (the logos below are
// kept for when the Meraz 7.0 sponsors are confirmed; set true then).
export const SPONSORS_REVEALED = false;
export type SponsorTier = { tier: string; hindi: string; level: "title" | "platinum" | "gold"; sponsors: { name: string; logo: string; dark?: boolean }[] }; // dark: a light logo, shown on a dark ground
export const sponsorTiers: SponsorTier[] = [
  { tier: "Title Sponsor", hindi: "मुख्य प्रायोजक", level: "title", sponsors: [{ name: "SBI", logo: "/sponsors/sbi.jpg" }] },
  { tier: "Co-Title Sponsor", hindi: "सह-प्रायोजक", level: "title", sponsors: [{ name: "CBI", logo: "/sponsors/cbi.png" }] },
  {
    tier: "Platinum Sponsors",
    hindi: "प्लैटिनम",
    level: "platinum",
    sponsors: [
      { name: "PNB", logo: "/sponsors/pnb.webp" },
      { name: "Steel Intech", logo: "/sponsors/steel-intech.jpg" },
      { name: "Riveria", logo: "/sponsors/riveria.jpg" },
      { name: "Blued Studio", logo: "/sponsors/blued-studio.webp", dark: true },
      { name: "Carro Rental", logo: "/sponsors/carro-rental.png" },
    ],
  },
  {
    tier: "Gold Sponsors",
    hindi: "गोल्ड",
    level: "gold",
    sponsors: [
      { name: "Union Bank of India", logo: "/sponsors/union-bank.jpg" },
      { name: "Bhatia", logo: "/sponsors/bhatia.jpg" },
      { name: "Herbalife International", logo: "/sponsors/herbalife.jpg" },
      { name: "Festee", logo: "/sponsors/festee.png" },
      { name: "Manish Sports", logo: "/sponsors/manish-sports.png" },
      { name: "Safexpress", logo: "/sponsors/safexpress.png" },
      { name: "CDO Securities", logo: "/sponsors/cdo-securities.jpg" },
      { name: "Swiggy", logo: "/sponsors/swiggy.jpg" },
    ],
  },
];

export type Pass = { name: string; title: string; discountCategories: { type: string; discounts: string[] }[]; formLink: string };
export const passes: Pass[] = [
  {
    name: "Access Pass",
    title: "Single-Day Entry Pass: A single-day access pass for students to attend MERAZ events on any one day of the fest, excluding Pronites. A valid student ID card is mandatory for entry.",
    discountCategories: [
      {
        type: "Pricing",
        discounts: ["Individual price: ₹99", "Group price: ₹99/person", "No group concession"],
      },
    ],
    formLink: "https://script.google.com/a/macros/iitbhilai.ac.in/s/AKfycbyNIKZ9qv5jyLxOxxDYCFA5z89O3lncR0jhphYQiVQLDNSGYdTCAz7E2xJF2FSkxaHG/exec",
  },
  {
    name: "Pronites Pass Day 2",
    title: "Full Day-2 Access + Day 2 Pronite: Enjoy all MERAZ events on Day 2 as an audience member, including the much-awaited Day 2 Pronite with JYOTIRMAYEE & BAND.",
    discountCategories: [
      {
        type: "Pricing",
        discounts: ["Individual price: ₹299", "Group price (10+ people): ₹249/person", "Save ₹50 per person in a group of 10 or more."],
      },
    ],
    formLink: "https://script.google.com/a/macros/iitbhilai.ac.in/s/AKfycbyNIKZ9qv5jyLxOxxDYCFA5z89O3lncR0jhphYQiVQLDNSGYdTCAz7E2xJF2FSkxaHG/exec",
  },
  {
    name: "Pronites Pass Day 3",
    title: "Full Day-3 Access + Day 3 Pronite: Experience all MERAZ events on Day 3 as an audience member, along with access to the spectacular Day 3 Pronite with NAKASH AZIZ & QAFILA- THE BAND & D.J. PRERAK.",
    discountCategories: [
      {
        type: "Pricing",
        discounts: ["Individual price: ₹499", "Group price (10+ people): ₹449/person", "Save ₹50 per person in a group of 10 or more."],
      },
    ],
    formLink: "https://script.google.com/a/macros/iitbhilai.ac.in/s/AKfycbyNIKZ9qv5jyLxOxxDYCFA5z89O3lncR0jhphYQiVQLDNSGYdTCAz7E2xJF2FSkxaHG/exec",
  },
  {
    name: "Accommodation Pass",
    title: "3-Day Complete Experience: Make the most of MERAZ with three-day accommodation, food, access to all events, and entry to all Pronites throughout the fest.",
    discountCategories: [
      {
        type: "Pricing",
        discounts: ["Individual price: ₹3,499", "Group price (10+ people): ₹2,999/person", "Save ₹500 per person in a group of 10 or more."],
      },
    ],
    formLink: "https://script.google.com/a/macros/iitbhilai.ac.in/s/AKfycbyNIKZ9qv5jyLxOxxDYCFA5z89O3lncR0jhphYQiVQLDNSGYdTCAz7E2xJF2FSkxaHG/exec",
  },
];

export type ContactCard = { title: string; kind: "mail" | "phone"; details: { label: string; value?: string }[] };
export const contacts: ContactCard[] = [
  {
    title: "Email & Address",
    kind: "mail",
    details: [{ label: "Email", value: "meraz@iitbhilai.ac.in" }, { label: "Indian Institute of Technology, Bhilai" }, { label: "Durg, Chhattisgarh" }, { label: "India - 491002" }],
  },
  { title: "Fest Head", kind: "phone", details: [{ label: "Fest Head - Arush Ranjan", value: "+91 7780070550" }] },
  { title: "Fest Convener", kind: "phone", details: [{ label: "Fest Convener - Kumar Utkarsh", value: "+91 7667416430" }] },
  { title: "Finance", kind: "phone", details: [{ label: "Convener - Varshitha", value: "+91 6281521833" }, { label: "Convener - Ankan Mondal", value: "+91 9064825588" }] },
  { title: "Cultural", kind: "phone", details: [{ label: "Convener - Andiyappan Rohan", value: "+91 6303011550" }, { label: "Convener - Tancia Boro", value: "+91 7002108549" }] },
  { title: "Management", kind: "phone", details: [{ label: "Convener - Banotu Santhosh", value: "+91 7013751880" }] },
  { title: "Sci-Tech", kind: "phone", details: [{ label: "Convener - Aditya Girish Seoker", value: "+91 9511629108" }, { label: "Convener - Kanad Bajpai", value: "+91 9302860795" }] },
  { title: "Outreach", kind: "phone", details: [{ label: "Convener - Stuti Jain", value: "+91 7440779990" }, { label: "Convener - Lanka Devi Satwika", value: "+91 9177926758" }] },
  { title: "Sports & Informals", kind: "phone", details: [{ label: "Convener - Shubham Jha", value: "+91 8797717222" }, { label: "Convener - Harsh Vardhan Singh", value: "+91 8400281102" }] },
  { title: "Media & Design", kind: "phone", details: [{ label: "Convener - Manjot Singh", value: "+91 7003603365" }, { label: "Convener - Amit Patel", value: "+91 8602275578" }] },
];

// Outreach page: the campus ambassadors, partnered cafés and influencers, each with its programme's rulebook
// (public/outreach/*.pdf, the team's Canva rulebooks as page images, ~3 MB each). Add people and cafés to the lists
// as they are confirmed; an empty list shows "To be announced". The lists come from the PR team's form responses (the
// "PR EA 2026-27" sheet): the ambassadors that have been given a MERAZ code (from other colleges only, never IIT
// Bhilai's own students), the cafés that registered, and the influencers who signed the MOU. Only names, colleges,
// café names and Instagram handles go on the site, never phone numbers or emails.
export const outreach = {
  ambassadors: {
    people: [
      { name: "Ranjan Kumar", college: "Rungta International Skills University" },
      { name: "Harsh Kumar", college: "Rungta International Skills University" },
      { name: "Mohmmad Noman Haque", college: "Bhilai Institute of Technology, Durg" },
      { name: "Anshu Kedia", college: "Rungta University" },
      { name: "Roman Bharti", college: "NIT Raipur" },
      { name: "Bhavesh Prasad Mahilang", college: "MSME Technology Centre, Durg" },
      { name: "Arpita Hota", college: "Shri Shankaracharya Technical Campus, Bhilai" },
      { name: "Aman Saraf", college: "Chhattisgarh Institute of Technology, Raipur" },
      { name: "Manish Bisai", college: "Bhilai Institute of Technology, Durg" },
      { name: "Aishwarya Suhane", college: "Bhilai Institute of Technology, Durg" },
      { name: "Muskan Verma", college: "Shri Shankaracharya Technical Campus, Bhilai" },
      { name: "Suryanshi Verma", college: "Manipal University Jaipur" },
      { name: "Domendra Kumar Sahu", college: "Shri Shankaracharya Technical Campus, Bhilai" },
      { name: "Anmol Singh", college: "IIT Patna" },
      { name: "Doneshwar", college: "MSME Technology Centre, Durg" },
      { name: "Omkar", college: "MSME Technology Centre, Durg" },
      { name: "Ayush", college: "MSME Technology Centre, Durg" },
      { name: "Vedprakash", college: "MSME Technology Centre, Durg" },
      { name: "Pratyush Ranjan Barik", college: "MSME Technology Centre, Durg" },
      { name: "Harishchandra", college: "MSME Technology Centre, Durg" },
      { name: "Shishir Shukla", college: "Shri Shankaracharya Technical Campus, Bhilai" },
      { name: "Rupesh Sahu", college: "MSME Technology Centre, Durg" },
      { name: "Kushal", college: "MSME Technology Centre, Durg" },
      { name: "Nitesh Yadav", college: "MSME Technology Centre, Durg" },
      { name: "Arin Kumar", college: "MSME Technology Centre, Durg" },
      { name: "Tikendra Dewangan", college: "MSME Technology Centre, Durg" },
      { name: "Dev Prakash Chandrakar", college: "MSME Technology Centre, Durg" },
      { name: "Peeyush Ratre", college: "MSME Technology Centre, Durg" },
      { name: "Mohit", college: "MSME Technology Centre, Durg" },
      { name: "Rustam Chanap", college: "MSME Technology Centre, Durg" },
      { name: "Deepanshu", college: "NIT Raipur" },
    ] as { name: string; college: string }[],
    // the contributor benefits, by referrals (from the CA rulebook)
    perks: [
      { referrals: "10+", items: ["1 free CA pass (Day 3 concert only)", "2 stall-wise discount coupons (1 meal + 1 drink)", "Custom Meraz merch", "CA certificate"] },
      { referrals: "25+", items: ["1 official 2-day pass (both concert nights)", "4 stall-wise coupons (2 meals + 2 drinks)", "Custom Meraz merch", "CA certificate", "Instagram shoutout"] },
      {
        referrals: "50+",
        items: ["2 official 2-day passes (CA + friend)", "8 stall-wise combo coupons (4 meals + 4 drinks)", "Custom Meraz merch", "CA certificate", "Instagram shoutout", "Gift hamper", "Artist autograph", "Bus pool subsidy"],
      },
      {
        referrals: "75+",
        items: [
          "2 official 2-day passes (backstage crew pass)",
          "16 stall-wise combo coupons (8 meals + 8 drinks)",
          "Custom Meraz merch",
          "CA certificate and leadership certificate",
          "Memento on the main stage",
          "Gift hamper",
          "Artist autograph",
          "Bus pool subsidy",
        ],
      },
    ],
    contact: { name: "Harsh", role: "Outreach Lead", phone: "+91 93275 96343" },
    applyUrl: "https://docs.google.com/forms/d/e/1FAIpQLScbwVAaplUFtDwifJ1RGvQPMY4_3Qb06jbkJ_3x6pWoR3pwDQ/viewform",
    rulebook: "/outreach/ca-rulebook.pdf",
  },
  // applyUrl: the café partner registration form
  cafes: {
    list: [{ name: "Karavas Cafe" }, { name: "Filtr Coffee" }, { name: "Fast N Fresh Cafe" }] as { name: string }[],
    applyUrl: "https://docs.google.com/forms/d/e/1FAIpQLSdVk5sxy07L6akivpbik3RMD4CBR09rGcNCnVz3EeQAFXdheQ/viewform" as string | undefined,
    rulebook: "/outreach/cafe-rulebook.pdf",
  },
  // instagram: the handle without the @. applyUrl: the Google Form's link (the rulebook's QR, qrco.de/bgzNgZ, is
  // disabled)
  influencers: {
    list: [
      { name: "Shriya Diwan", instagram: "style_with_shriya" },
      { name: "Yash Pandey", instagram: "ig.yash_pandey" },
      { name: "Md Adil Khan", instagram: "aadil.xn" },
      { name: "Jiya Chandrakar", instagram: "jiya_____.1" },
      { name: "Soumya Sinha", instagram: "ft.soumzposting" },
      { name: "Krishna Anand", instagram: "krishnaanand1808" },
      { name: "Karan Bagga", instagram: "the_shredded_medico_" },
      { name: "Jitendra Singh Bagri", instagram: "jitendrabagri55" },
      { name: "Jyoti Parwani", instagram: "jyotiparwani_" },
    ] as { name: string; instagram: string }[],
    applyUrl: undefined as string | undefined,
    rulebook: "/outreach/influencer-rulebook.pdf",
  },
};

// Same placeholder timeline as the reference site's /timeline route. PLACEHOLDER dates.
export type TimelineDay = { date: string; time: string; events: { time: string; title: string; location: string }[] };
export const timeline: TimelineDay[] = [
  {
    date: "Day 1 - March 15",
    time: "9:00 AM - 6:00 PM",
    events: [
      { time: "9:00 AM", title: "Registration Opens", location: "Main Campus" },
      { time: "10:30 AM", title: "Inauguration Ceremony", location: "Auditorium" },
      { time: "12:00 PM", title: "Technical Events Begin", location: "Various Venues" },
      { time: "2:00 PM", title: "Cultural Events Kick-off", location: "Open Stage" },
    ],
  },
  {
    date: "Day 2 - March 16",
    time: "9:00 AM - 11:00 PM",
    events: [
      { time: "9:00 AM", title: "Workshop Sessions", location: "Seminar Halls" },
      { time: "12:00 PM", title: "Hackathon Continues", location: "Lab Complex" },
      { time: "6:00 PM", title: "Evening Performances", location: "Main Stage" },
      { time: "9:00 PM", title: "Celebrity Night", location: "Open Amphitheatre" },
    ],
  },
  {
    date: "Day 3 - March 17",
    time: "9:00 AM - 10:00 PM",
    events: [
      { time: "9:00 AM", title: "Finals Begin", location: "Various Venues" },
      { time: "3:00 PM", title: "Prize Distribution", location: "Auditorium" },
      { time: "6:00 PM", title: "Closing Ceremony", location: "Main Stage" },
      { time: "8:00 PM", title: "Grand Finale Performance", location: "Open Amphitheatre" },
    ],
  },
];

// Home road scene models: [what, author, link]. CC BY 4.0 unless noted, so the credit has to stay on the site.
export const modelCredits: [string, string, string][] = [
  ["Barricade", "InnoFrame", "https://sketchfab.com/3d-models/delhi-police-security-barricade-3d-model-f17ecc171f3441ceb0e9effd90f31c1f"],
  ["Runner", "As7 3d models", "https://sketchfab.com/3d-models/spiderman-india-pavitr-prabhakar-ed5f6c5ba8a94c98aee68b5b6ed1f29b"],
  ["Man", "pankhkhan", "https://sketchfab.com/3d-models/indian-man-with-red-clothes-23b1805e473d4e5cb3e439b576ca39a9"],
  ["Old man", "anandmohan662", "https://sketchfab.com/3d-models/indian-old-man-walking-e70a140ad4334c2e8648ac78d61545b3"],
  [
    "Woman",
    "Pixel_Monster (Sketchfab Standard licence)",
    "https://sketchfab.com/3d-models/indian-woman-in-saree-b5965a93b03440dea65160f7cbac1fc7",
  ],
  ["Stall", "Cyril43", "https://sketchfab.com/3d-models/medieval-stall-4a5a40e78e4b481bafbb576303f992cd"],
  ["Auto", "rSquare", "https://sketchfab.com/3d-models/auto-rickshaw-44776bcb34e04c1a8b9c18a70376304e"],
  ["Tree", "farhad.Guli", "https://sketchfab.com/3d-models/tree-7016d1d32fe748f0a8b3f5eb39374bc4"],
  ["Pine", "evolveduk", "https://sketchfab.com/3d-models/pine-tree-d45218a3fab349e5b1de040f29e7b6f9"],
  ["Birch", "evolveduk", "https://sketchfab.com/3d-models/birch-tree-aa842dffd9654d33b8b91170ce83c172"],
];
