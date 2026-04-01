// ─── Types ────────────────────────────────────────────────────────────────────

export type OrgId = "vfa" | "wharton" | "nyc";

export type PathNode = { label: string; sub?: string; initials: string };

export type ContactResult = {
  id: string;
  name: string;
  title: string;
  company: string;
  strength: "WARM" | "MODERATE" | "COLD";
  orgs: OrgId[];
  pathNodes: PathNode[];
  outreachAngle: string;
  whyRelevant: string;
  fullOutreach: string;
  middlemanNote: string;
  graphNodeId: string;
  hubNodeId: string;
};

export type GraphNode = {
  id: string;
  cx: number;
  cy: number;
  r: number;
  orgId: "you" | OrgId;
  label?: string;
  isHub: boolean;
  contactId?: string;
  crossOrg?: boolean;
};

export type GraphEdge = {
  from: string;
  to: string;
  orgId: OrgId;
};

// ─── Constants ────────────────────────────────────────────────────────────────

export const COMMUNITIES = [
  { id: "vfa" as const, name: "VFA Fellowship 2023", connections: 347, bg: "#ede9fe", border: "#7c3aed", text: "#2e1065", dot: "#7c3aed" },
  { id: "wharton" as const, name: "Wharton MBA Program", connections: 521, bg: "#dbeafe", border: "#3b82f6", text: "#1e3a8a", dot: "#3b82f6" },
  { id: "nyc" as const, name: "NYC Founders Network", connections: 189, bg: "#d1fae5", border: "#059669", text: "#064e3b", dot: "#059669" },
];

export const ORG_COLORS: Record<string, { fill: string; stroke: string; fillHub: string }> = {
  you: { fill: "#7c3aed", stroke: "#5b21b6", fillHub: "#7c3aed" },
  vfa: { fill: "#ede9fe", stroke: "#7c3aed", fillHub: "#c4b5fd" },
  wharton: { fill: "#dbeafe", stroke: "#3b82f6", fillHub: "#93c5fd" },
  nyc: { fill: "#d1fae5", stroke: "#059669", fillHub: "#6ee7b7" },
};

export const STRENGTH_CONFIG = {
  WARM: { bg: "#dcfce7", border: "#16a34a", text: "#15803d", label: "Warm" },
  MODERATE: { bg: "#fef9c3", border: "#ca8a04", text: "#92400e", label: "Moderate" },
  COLD: { bg: "#f4f4f5", border: "#a1a1aa", text: "#52525b", label: "Cold" },
};

// ─── Mock Contact Data ─────────────────────────────────────────────────────────

export const VC_RESULTS: ContactResult[] = [
  {
    id: "sarah-chen",
    name: "Sarah Chen",
    title: "Partner",
    company: "Sequoia Capital",
    strength: "WARM",
    orgs: ["vfa"],
    pathNodes: [
      { label: "You", initials: "AC" },
      { label: "Ryan M.", sub: "VFA '23", initials: "RM" },
      { label: "Sarah Chen", initials: "SC" },
    ],
    outreachAngle: "Led 3 Series A deals in developer tools last year. Actively sourcing in B2B SaaS.",
    whyRelevant: "Sequoia's enterprise portfolio includes 12 B2B SaaS companies. Sarah led investments in 3 Series A deals in developer tools last year. She is actively sourcing in the workflow automation and dev infrastructure space.",
    fullOutreach: "Hi Sarah, I'm Alex Chen — a fellow in the VFA 2023 cohort. Ryan M. (also VFA '23, now at Stripe) suggested I reach out. I'm building in the B2B SaaS space and would love 20 minutes to share what we're seeing in the market. Would you be open to a quick call next week?",
    middlemanNote: "Ryan M. was your VFA cohort peer, 2023–24. Ryan is now at Stripe. His connection to Sarah is through Stanford GSB '19.",
    graphNodeId: "sarah-chen",
    hubNodeId: "ryan-m",
  },
  {
    id: "marcus-johnson",
    name: "Marcus Johnson",
    title: "Principal",
    company: "Andreessen Horowitz",
    strength: "WARM",
    orgs: ["wharton"],
    pathNodes: [
      { label: "You", initials: "AC" },
      { label: "Jennifer K.", sub: "Wharton MBA", initials: "JK" },
      { label: "Marcus Johnson", initials: "MJ" },
    ],
    outreachAngle: "a16z enterprise & consumer portfolio. Jennifer K. can provide a warm intro from Wharton.",
    whyRelevant: "Marcus covers enterprise software at a16z and has been vocal about the future of work software stack. Jennifer K. (Wharton MBA, class of '22) has a direct relationship with Marcus from her time at McKinsey.",
    fullOutreach: "Hi Marcus, I'm Alex Chen — Jennifer K. (Wharton MBA '22) thought it would be worth connecting us. I'm working on a product in the enterprise productivity space and a16z's thesis on the software stack really resonates. Would love to get your perspective over a quick call.",
    middlemanNote: "Jennifer K. (Wharton MBA '22) worked alongside Marcus at McKinsey before business school. They have stayed in regular contact.",
    graphNodeId: "marcus-johnson",
    hubNodeId: "jennifer-k",
  },
  {
    id: "priya-patel",
    name: "Priya Patel",
    title: "Partner",
    company: "Lightspeed Venture Partners",
    strength: "MODERATE",
    orgs: ["vfa"],
    pathNodes: [
      { label: "You", initials: "AC" },
      { label: "David L.", sub: "VFA '23", initials: "DL" },
      { label: "Priya Patel", initials: "PP" },
    ],
    outreachAngle: "Deep focus on SaaS infrastructure. Former founder. David L. (VFA) can make the intro.",
    whyRelevant: "Priya leads Lightspeed's SaaS and infrastructure practice. She was previously a founder of a B2B analytics startup acquired in 2022. Strong operator empathy on diligence calls.",
    fullOutreach: "Hi Priya, I'm Alex Chen — David L. from VFA thought we should connect. I'm building in the B2B SaaS space and given your background as a founder and your current focus at Lightspeed, I think there's real overlap. Would you be open to a 20-minute chat?",
    middlemanNote: "David L. (VFA Fellow, 2023) met Priya at a Lightspeed LP event in San Francisco. Professional but not deeply personal — a warm email intro is the right move.",
    graphNodeId: "priya-patel",
    hubNodeId: "david-l",
  },
  {
    id: "tom-richards",
    name: "Tom Richards",
    title: "Associate",
    company: "General Catalyst",
    strength: "COLD",
    orgs: ["nyc"],
    pathNodes: [
      { label: "You", initials: "AC" },
      { label: "Maya R.", sub: "NYC Founders", initials: "MR" },
      { label: "Tom Richards", initials: "TR" },
    ],
    outreachAngle: "General Catalyst's early-stage B2B focus. Reachable via NYC Founders Network.",
    whyRelevant: "Tom covers early-stage B2B at General Catalyst. The path goes through two members of the NYC Founders Network — best approached as a warm handoff request through the network's Slack channel.",
    fullOutreach: "Hi Tom, I was connected to you through the NYC Founders Network. I'm Alex Chen, building in the enterprise space. I know this is a cold intro — I'd love to share a one-pager and see if there's any fit with General Catalyst's early-stage B2B thesis. Happy to keep it brief.",
    middlemanNote: "Two-hop path through NYC Founders Network. First hop: Maya R. (NYC Founders). Second hop: Maya → Tom via a GC portfolio founder meet. Treat this as a cold email.",
    graphNodeId: "tom-richards",
    hubNodeId: "maya-r",
  },
  {
    id: "lisa-wang",
    name: "Lisa Wang",
    title: "GP",
    company: "Homebrew",
    strength: "WARM",
    orgs: ["vfa", "wharton"],
    pathNodes: [
      { label: "You", initials: "AC" },
      { label: "Christine S.", sub: "VFA + Wharton", initials: "CS" },
      { label: "Lisa Wang", initials: "LW" },
    ],
    outreachAngle: "Christine S. is in BOTH your VFA and Wharton networks — the strongest possible intro path.",
    whyRelevant: "Lisa co-founded Homebrew to back founders at the earliest stages. Homebrew's thesis aligns with pre-product B2B SaaS. Christine S. knows Lisa personally and has facilitated intros for VFA alumni before.",
    fullOutreach: "Hi Lisa, I'm Alex Chen — Christine S. (VFA '23 / Wharton MBA) thought we should connect. I'm at the early stages of building something in the workflow automation space. Christine mentioned Homebrew's interest in backing founders before product-market fit, and I'd love to get your perspective. Any chance for a quick call?",
    middlemanNote: "Christine S. is a rare shared connection — she appears in both your VFA Fellowship and Wharton MBA networks. She and Lisa co-presented at a Homebrew LP event last spring. This is the strongest intro path available.",
    graphNodeId: "lisa-wang",
    hubNodeId: "christine-s",
  },
];

export const HEALTHCARE_RESULTS: ContactResult[] = [
  {
    id: "james-okafor",
    name: "James Okafor",
    title: "Head of Product",
    company: "Ro Health",
    strength: "WARM",
    orgs: ["vfa"],
    pathNodes: [
      { label: "You", initials: "AC" },
      { label: "Aisha T.", sub: "VFA '23", initials: "AT" },
      { label: "James Okafor", initials: "JO" },
    ],
    outreachAngle: "Consumer health, fast-growing telehealth. Aisha T. (VFA) has a direct connection.",
    whyRelevant: "James leads product at Ro, one of the fastest-growing telehealth platforms. Deep expertise in consumer health workflows and regulatory navigation.",
    fullOutreach: "Hi James, I'm Alex Chen — Aisha T. from VFA connected us. I'm exploring the healthcare space and would love to hear about the product challenges you're solving at Ro. Would you be open to 20 minutes?",
    middlemanNote: "Aisha T. (VFA '23) worked with James on a health equity panel at SXSW. Strong personal relationship.",
    graphNodeId: "james-okafor",
    hubNodeId: "aisha-t",
  },
  {
    id: "nina-alvarez",
    name: "Nina Alvarez",
    title: "VP Engineering",
    company: "Cityblock Health",
    strength: "WARM",
    orgs: ["wharton"],
    pathNodes: [
      { label: "You", initials: "AC" },
      { label: "Sam L.", sub: "Wharton MBA", initials: "SL" },
      { label: "Nina Alvarez", initials: "NA" },
    ],
    outreachAngle: "Value-based care infrastructure and AI health tools. Sam L. (Wharton) can intro.",
    whyRelevant: "Nina builds the technical infrastructure for Cityblock's at-risk population health programs. Former CTO of a healthcare AI startup acquired in 2022.",
    fullOutreach: "Hi Nina, I'm Alex Chen — Sam L. (Wharton MBA '21) thought we should connect. I've been deep in the healthcare data space and would love to hear about the engineering challenges you're navigating at Cityblock.",
    middlemanNote: "Sam L. (Wharton '21) was Nina's mentor through a healthtech accelerator. Warm, active relationship.",
    graphNodeId: "nina-alvarez",
    hubNodeId: "sam-l",
  },
  {
    id: "derek-huang",
    name: "Derek Huang",
    title: "Co-founder & CEO",
    company: "Notable Health",
    strength: "MODERATE",
    orgs: ["nyc"],
    pathNodes: [
      { label: "You", initials: "AC" },
      { label: "Priya S.", sub: "NYC Founders", initials: "PS" },
      { label: "Derek Huang", initials: "DH" },
    ],
    outreachAngle: "AI-native clinical workflows. Priya S. (NYC Founders) is the bridge.",
    whyRelevant: "Derek co-founded Notable to automate clinical administrative work. Deep perspective on AI applications in the EMR and prior auth space.",
    fullOutreach: "Hi Derek, I'm Alex Chen — Priya S. from NYC Founders Network suggested I reach out. I'm exploring workflow automation in healthcare and would love to hear your take on the space from the founder perspective.",
    middlemanNote: "Priya S. met Derek at a NYC health-tech meetup. Moderate relationship — a brief email intro is sufficient.",
    graphNodeId: "derek-huang",
    hubNodeId: "priya-s",
  },
  {
    id: "rachel-kim",
    name: "Rachel Kim",
    title: "Principal",
    company: "a16z Bio",
    strength: "MODERATE",
    orgs: ["wharton"],
    pathNodes: [
      { label: "You", initials: "AC" },
      { label: "Tom B.", sub: "Wharton MBA", initials: "TB" },
      { label: "Rachel Kim", initials: "RK" },
    ],
    outreachAngle: "Healthcare VC at a16z Bio. Digital health and value-based care focus.",
    whyRelevant: "Rachel invests in digital health at a16z Bio, with a focus on value-based care infrastructure and AI-enabled clinical tools. Tom B. has an active connection from a health + business school panel.",
    fullOutreach: "Hi Rachel, I'm Alex Chen — Tom B. (Wharton MBA) suggested I reach out regarding your work at a16z Bio. I've been exploring the digital health infrastructure space and would love a few minutes of your perspective.",
    middlemanNote: "Tom B. (Wharton '22) and Rachel are LinkedIn connections from a health + business school panel. Treat as a soft warm intro.",
    graphNodeId: "rachel-kim",
    hubNodeId: "tom-b",
  },
];

export const JOB_RESULTS: ContactResult[] = [
  {
    id: "lena-torres",
    name: "Lena Torres",
    title: "Head of Recruiting",
    company: "Linear",
    strength: "WARM",
    orgs: ["vfa"],
    pathNodes: [
      { label: "You", initials: "AC" },
      { label: "Ryan M.", sub: "VFA '23", initials: "RM" },
      { label: "Lena Torres", initials: "LT" },
    ],
    outreachAngle: "Placed 3 VFA alums at Linear in the last year. Actively hiring senior PMs.",
    whyRelevant: "Lena leads recruiting at Linear and has specifically sourced from the VFA network before. She placed three VFA fellows into product and growth roles in the past 12 months and has a standing interest in mission-driven candidates.",
    fullOutreach: "Hi Lena, I'm Alex Chen — Ryan M. (VFA '23, now at Stripe) suggested I reach out. I'm exploring my next move and Linear's approach to product-led growth is something I've followed closely. Ryan mentioned you've worked with VFA folks before. Would you be open to a quick chat about what you're building toward?",
    middlemanNote: "Ryan M. (VFA '23) met Lena at a VFA alumni event in San Francisco last fall. She reached out to him directly about referrals shortly after — this is a warm, active relationship.",
    graphNodeId: "sarah-chen",
    hubNodeId: "ryan-m",
  },
  {
    id: "jordan-kim",
    name: "Jordan Kim",
    title: "Director of Product",
    company: "Notion",
    strength: "WARM",
    orgs: ["wharton"],
    pathNodes: [
      { label: "You", initials: "AC" },
      { label: "Jennifer K.", sub: "Wharton MBA", initials: "JK" },
      { label: "Jordan Kim", initials: "JK" },
    ],
    outreachAngle: "Hiring senior PMs for Notion's enterprise track. Jennifer K. can make the intro from Wharton.",
    whyRelevant: "Jordan runs the enterprise product team at Notion and is actively building out the PM bench for their Series D growth phase. Jennifer K. (Wharton '22) went through a product leadership program with Jordan at Reforge.",
    fullOutreach: "Hi Jordan, I'm Alex Chen — Jennifer K. (Wharton MBA '22) thought we should connect. I've been following Notion's enterprise push closely and the PM challenges at your scale are exactly the kind of work I'm looking for. Jennifer mentioned you're building out the team. Would love to hear more about what you're working on.",
    middlemanNote: "Jennifer K. (Wharton MBA '22) was in the same Reforge cohort as Jordan. They are still in regular contact and Jennifer has made warm referrals to Jordan's team before.",
    graphNodeId: "marcus-johnson",
    hubNodeId: "jennifer-k",
  },
  {
    id: "daniel-osei",
    name: "Daniel Osei",
    title: "VP Product",
    company: "Brex",
    strength: "MODERATE",
    orgs: ["nyc"],
    pathNodes: [
      { label: "You", initials: "AC" },
      { label: "Maya R.", sub: "NYC Founders", initials: "MR" },
      { label: "Daniel Osei", initials: "DO" },
    ],
    outreachAngle: "Brex is scaling its product org. Maya R. (NYC Founders) is the bridge.",
    whyRelevant: "Daniel leads product at Brex across the spend management and corporate card verticals. Brex is in a significant product hiring push for their SMB and enterprise tracks.",
    fullOutreach: "Hi Daniel, I'm Alex Chen — Maya R. from the NYC Founders Network connected us. I've been tracking Brex's product evolution and the challenges at your scale are something I'd love to dig into. I'm exploring my next move and would love 20 minutes to hear about the team you're building.",
    middlemanNote: "Maya R. (NYC Founders) met Daniel at a fintech product roundtable hosted by the NYC Founders Network. Professional connection — a concise intro email is the right approach.",
    graphNodeId: "tom-richards",
    hubNodeId: "maya-r",
  },
  {
    id: "yuki-tanaka",
    name: "Yuki Tanaka",
    title: "Chief of Staff",
    company: "Vercel",
    strength: "WARM",
    orgs: ["vfa", "wharton"],
    pathNodes: [
      { label: "You", initials: "AC" },
      { label: "Christine S.", sub: "VFA + Wharton", initials: "CS" },
      { label: "Yuki Tanaka", initials: "YT" },
    ],
    outreachAngle: "Christine S. is in BOTH your VFA and Wharton networks — the strongest possible intro path.",
    whyRelevant: "Yuki is Chief of Staff at Vercel, working directly with the exec team on hiring and strategic initiatives. She has a direct line to open headcount decisions and is always looking for strong operator profiles from trusted networks.",
    fullOutreach: "Hi Yuki, I'm Alex Chen — Christine S. (VFA '23 / Wharton MBA) suggested we connect. I'm exploring my next move and Vercel's trajectory is something I've followed closely. Christine mentioned you have your ear to the ground on where the team is growing. Would love to find 20 minutes if you're open to it.",
    middlemanNote: "Christine S. is a shared connection across both your VFA and Wharton networks. She and Yuki were in the same startup fellowship cohort in 2022. This is one of the strongest referral paths available to you.",
    graphNodeId: "lisa-wang",
    hubNodeId: "christine-s",
  },
];

export const ALL_RESULTS = [...VC_RESULTS, ...HEALTHCARE_RESULTS, ...JOB_RESULTS];

export const RESULTS_BY_QUERY_ID: Record<string, ContactResult[]> = {
  q1: VC_RESULTS,
  q2: HEALTHCARE_RESULTS,
  q3: VC_RESULTS,
  q4: HEALTHCARE_RESULTS,
  q5: JOB_RESULTS,
};

export const DEMO_QUERIES = [
  { id: "q1", label: "Find warm intros to VCs focused on B2B SaaS" },
  { id: "q2", label: "Who in my network works at healthcare startups?" },
  { id: "q3", label: "Surface contacts who could be beta users for a productivity app" },
  { id: "q4", label: "Find operators who've scaled sales teams at Series A" },
  { id: "q5", label: "Who can refer me to open product roles at growth-stage startups?" },
];

// ─── Knowledge Graph Node & Edge Data ─────────────────────────────────────────

export const GRAPH_NODES: GraphNode[] = [
  // Center
  { id: "you", cx: 300, cy: 210, r: 14, orgId: "you", isHub: false },

  // VFA hubs (upper-left)
  { id: "ryan-m",    cx: 192, cy: 118, r: 8, orgId: "vfa", label: "Ryan M.",    isHub: true },
  { id: "david-l",   cx: 150, cy: 168, r: 8, orgId: "vfa", label: "David L.",   isHub: true },
  { id: "aisha-t",   cx: 196, cy: 162, r: 8, orgId: "vfa", label: "Aisha T.",   isHub: true },

  // VFA named contacts
  { id: "sarah-chen",   cx: 138, cy: 70,  r: 7, orgId: "vfa", label: "Sarah C.",  isHub: false, contactId: "sarah-chen" },
  { id: "priya-patel",  cx: 92,  cy: 136, r: 7, orgId: "vfa", label: "Priya P.",  isHub: false, contactId: "priya-patel" },
  { id: "james-okafor", cx: 168, cy: 108, r: 7, orgId: "vfa", label: "James O.",  isHub: false, contactId: "james-okafor" },

  // VFA leaf nodes
  { id: "vfa-l1",  cx: 108, cy: 82,  r: 5, orgId: "vfa", isHub: false },
  { id: "vfa-l2",  cx: 130, cy: 50,  r: 5, orgId: "vfa", isHub: false },
  { id: "vfa-l3",  cx: 72,  cy: 108, r: 5, orgId: "vfa", isHub: false },
  { id: "vfa-l4",  cx: 68,  cy: 148, r: 5, orgId: "vfa", isHub: false },
  { id: "vfa-l5",  cx: 82,  cy: 185, r: 5, orgId: "vfa", isHub: false },
  { id: "vfa-l6",  cx: 118, cy: 218, r: 5, orgId: "vfa", isHub: false },
  { id: "vfa-l7",  cx: 148, cy: 208, r: 5, orgId: "vfa", isHub: false },
  { id: "vfa-l8",  cx: 175, cy: 195, r: 5, orgId: "vfa", isHub: false },
  { id: "vfa-l9",  cx: 208, cy: 182, r: 5, orgId: "vfa", isHub: false },
  { id: "vfa-l10", cx: 218, cy: 138, r: 5, orgId: "vfa", isHub: false },
  { id: "vfa-l11", cx: 222, cy: 98,  r: 5, orgId: "vfa", isHub: false },

  // Cross-org hub (VFA + Wharton bridge)
  { id: "christine-s", cx: 248, cy: 78, r: 9, orgId: "vfa", label: "Christine S.", isHub: true, crossOrg: true },
  { id: "lisa-wang",   cx: 298, cy: 48, r: 7, orgId: "vfa", label: "Lisa W.",      isHub: false, contactId: "lisa-wang", crossOrg: true },

  // Wharton hubs (upper-right)
  { id: "jennifer-k", cx: 410, cy: 116, r: 8, orgId: "wharton", label: "Jennifer K.", isHub: true },
  { id: "sam-l",      cx: 450, cy: 158, r: 8, orgId: "wharton", label: "Sam L.",      isHub: true },
  { id: "tom-b",      cx: 415, cy: 85,  r: 8, orgId: "wharton", label: "Tom B.",      isHub: true },

  // Wharton named contacts
  { id: "marcus-johnson", cx: 455, cy: 70,  r: 7, orgId: "wharton", label: "Marcus J.",  isHub: false, contactId: "marcus-johnson" },
  { id: "nina-alvarez",   cx: 440, cy: 126, r: 7, orgId: "wharton", label: "Nina A.",    isHub: false, contactId: "nina-alvarez" },
  { id: "rachel-kim",     cx: 480, cy: 100, r: 7, orgId: "wharton", label: "Rachel K.",  isHub: false, contactId: "rachel-kim" },

  // Wharton leaf nodes
  { id: "w-l1",  cx: 492, cy: 68,  r: 5, orgId: "wharton", isHub: false },
  { id: "w-l2",  cx: 516, cy: 90,  r: 5, orgId: "wharton", isHub: false },
  { id: "w-l3",  cx: 528, cy: 120, r: 5, orgId: "wharton", isHub: false },
  { id: "w-l4",  cx: 522, cy: 152, r: 5, orgId: "wharton", isHub: false },
  { id: "w-l5",  cx: 510, cy: 180, r: 5, orgId: "wharton", isHub: false },
  { id: "w-l6",  cx: 490, cy: 205, r: 5, orgId: "wharton", isHub: false },
  { id: "w-l7",  cx: 468, cy: 220, r: 5, orgId: "wharton", isHub: false },
  { id: "w-l8",  cx: 446, cy: 216, r: 5, orgId: "wharton", isHub: false },
  { id: "w-l9",  cx: 382, cy: 128, r: 5, orgId: "wharton", isHub: false },
  { id: "w-l10", cx: 378, cy: 92,  r: 5, orgId: "wharton", isHub: false },
  { id: "w-l11", cx: 392, cy: 68,  r: 5, orgId: "wharton", isHub: false },

  // NYC Founders hubs (bottom)
  { id: "maya-r",  cx: 302, cy: 350, r: 8, orgId: "nyc", label: "Maya R.",  isHub: true },
  { id: "priya-s", cx: 264, cy: 326, r: 8, orgId: "nyc", label: "Priya S.", isHub: true },

  // NYC named contacts
  { id: "tom-richards", cx: 348, cy: 374, r: 7, orgId: "nyc", label: "Tom R.",   isHub: false, contactId: "tom-richards" },
  { id: "derek-huang",  cx: 264, cy: 368, r: 7, orgId: "nyc", label: "Derek H.", isHub: false, contactId: "derek-huang" },

  // NYC leaf nodes
  { id: "nyc-l1", cx: 242, cy: 354, r: 5, orgId: "nyc", isHub: false },
  { id: "nyc-l2", cx: 228, cy: 332, r: 5, orgId: "nyc", isHub: false },
  { id: "nyc-l3", cx: 235, cy: 308, r: 5, orgId: "nyc", isHub: false },
  { id: "nyc-l4", cx: 314, cy: 394, r: 5, orgId: "nyc", isHub: false },
  { id: "nyc-l5", cx: 350, cy: 400, r: 5, orgId: "nyc", isHub: false },
  { id: "nyc-l6", cx: 374, cy: 382, r: 5, orgId: "nyc", isHub: false },
  { id: "nyc-l7", cx: 370, cy: 350, r: 5, orgId: "nyc", isHub: false },
  { id: "nyc-l8", cx: 342, cy: 326, r: 5, orgId: "nyc", isHub: false },
  { id: "nyc-l9", cx: 318, cy: 312, r: 5, orgId: "nyc", isHub: false },
];

export const GRAPH_EDGES: GraphEdge[] = [
  // You → VFA hubs
  { from: "you", to: "ryan-m",      orgId: "vfa" },
  { from: "you", to: "david-l",     orgId: "vfa" },
  { from: "you", to: "aisha-t",     orgId: "vfa" },
  { from: "you", to: "christine-s", orgId: "vfa" },
  // You → Wharton hubs
  { from: "you", to: "jennifer-k",  orgId: "wharton" },
  { from: "you", to: "sam-l",       orgId: "wharton" },
  { from: "you", to: "tom-b",       orgId: "wharton" },
  // You → NYC hubs
  { from: "you", to: "maya-r",      orgId: "nyc" },
  { from: "you", to: "priya-s",     orgId: "nyc" },

  // VFA hub → named contacts
  { from: "ryan-m",      to: "sarah-chen",   orgId: "vfa" },
  { from: "ryan-m",      to: "james-okafor", orgId: "vfa" },
  { from: "david-l",     to: "priya-patel",  orgId: "vfa" },
  { from: "aisha-t",     to: "james-okafor", orgId: "vfa" },
  { from: "christine-s", to: "lisa-wang",    orgId: "vfa" },

  // VFA hub → leaves
  { from: "ryan-m",  to: "vfa-l1",  orgId: "vfa" },
  { from: "ryan-m",  to: "vfa-l2",  orgId: "vfa" },
  { from: "ryan-m",  to: "vfa-l11", orgId: "vfa" },
  { from: "david-l", to: "vfa-l3",  orgId: "vfa" },
  { from: "david-l", to: "vfa-l4",  orgId: "vfa" },
  { from: "david-l", to: "vfa-l5",  orgId: "vfa" },
  { from: "aisha-t", to: "vfa-l6",  orgId: "vfa" },
  { from: "aisha-t", to: "vfa-l7",  orgId: "vfa" },
  { from: "aisha-t", to: "vfa-l8",  orgId: "vfa" },
  { from: "aisha-t", to: "vfa-l9",  orgId: "vfa" },
  { from: "aisha-t", to: "vfa-l10", orgId: "vfa" },

  // Wharton hub → named contacts
  { from: "jennifer-k", to: "marcus-johnson", orgId: "wharton" },
  { from: "sam-l",      to: "nina-alvarez",   orgId: "wharton" },
  { from: "tom-b",      to: "rachel-kim",     orgId: "wharton" },

  // Wharton hub → leaves
  { from: "tom-b",      to: "w-l1",  orgId: "wharton" },
  { from: "tom-b",      to: "w-l2",  orgId: "wharton" },
  { from: "tom-b",      to: "w-l10", orgId: "wharton" },
  { from: "tom-b",      to: "w-l11", orgId: "wharton" },
  { from: "jennifer-k", to: "w-l3",  orgId: "wharton" },
  { from: "jennifer-k", to: "w-l9",  orgId: "wharton" },
  { from: "sam-l",      to: "w-l4",  orgId: "wharton" },
  { from: "sam-l",      to: "w-l5",  orgId: "wharton" },
  { from: "sam-l",      to: "w-l6",  orgId: "wharton" },
  { from: "sam-l",      to: "w-l7",  orgId: "wharton" },
  { from: "sam-l",      to: "w-l8",  orgId: "wharton" },

  // NYC hub → named contacts
  { from: "maya-r",  to: "tom-richards", orgId: "nyc" },
  { from: "priya-s", to: "derek-huang",  orgId: "nyc" },

  // NYC hub → leaves
  { from: "maya-r",  to: "nyc-l4", orgId: "nyc" },
  { from: "maya-r",  to: "nyc-l5", orgId: "nyc" },
  { from: "maya-r",  to: "nyc-l6", orgId: "nyc" },
  { from: "maya-r",  to: "nyc-l7", orgId: "nyc" },
  { from: "priya-s", to: "nyc-l1", orgId: "nyc" },
  { from: "priya-s", to: "nyc-l2", orgId: "nyc" },
  { from: "priya-s", to: "nyc-l3", orgId: "nyc" },
  { from: "priya-s", to: "nyc-l8", orgId: "nyc" },
  { from: "priya-s", to: "nyc-l9", orgId: "nyc" },
];
