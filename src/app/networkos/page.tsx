"use client";

import { useState, useMemo, useRef } from "react";
import { Search, Network, Copy, Check, Sparkles, Zap, Plus, X, BoxSelect, MousePointer2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const COMMUNITIES = [
  { id: "vfa" as const, name: "VFA Fellowship 2023", connections: 347, bg: "#ede9fe", border: "#7c3aed", text: "#2e1065", dot: "#7c3aed" },
  { id: "wharton" as const, name: "Wharton MBA Program", connections: 521, bg: "#dbeafe", border: "#3b82f6", text: "#1e3a8a", dot: "#3b82f6" },
  { id: "nyc" as const, name: "NYC Founders Network", connections: 189, bg: "#d1fae5", border: "#059669", text: "#064e3b", dot: "#059669" },
];

type OrgId = "vfa" | "wharton" | "nyc";

const ORG_COLORS: Record<string, { fill: string; stroke: string; fillHub: string }> = {
  you: { fill: "#7c3aed", stroke: "#5b21b6", fillHub: "#7c3aed" },
  vfa: { fill: "#ede9fe", stroke: "#7c3aed", fillHub: "#c4b5fd" },
  wharton: { fill: "#dbeafe", stroke: "#3b82f6", fillHub: "#93c5fd" },
  nyc: { fill: "#d1fae5", stroke: "#059669", fillHub: "#6ee7b7" },
};

const STRENGTH_CONFIG = {
  WARM: { bg: "#dcfce7", border: "#16a34a", text: "#15803d", label: "Warm" },
  MODERATE: { bg: "#fef9c3", border: "#ca8a04", text: "#92400e", label: "Moderate" },
  COLD: { bg: "#f4f4f5", border: "#a1a1aa", text: "#52525b", label: "Cold" },
};

// ─── Mock Contact Data ─────────────────────────────────────────────────────────

type PathNode = { label: string; sub?: string; initials: string };
type ContactResult = {
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

const VC_RESULTS: ContactResult[] = [
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

const HEALTHCARE_RESULTS: ContactResult[] = [
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

const JOB_RESULTS: ContactResult[] = [
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

const ALL_RESULTS = [...VC_RESULTS, ...HEALTHCARE_RESULTS, ...JOB_RESULTS];

const RESULTS_BY_QUERY_ID: Record<string, ContactResult[]> = {
  q1: VC_RESULTS,
  q2: HEALTHCARE_RESULTS,
  q3: VC_RESULTS,
  q4: HEALTHCARE_RESULTS,
  q5: JOB_RESULTS,
};

const DEMO_QUERIES = [
  { id: "q1", label: "Find warm intros to VCs focused on B2B SaaS" },
  { id: "q2", label: "Who in my network works at healthcare startups?" },
  { id: "q3", label: "Surface contacts who could be beta users for a productivity app" },
  { id: "q4", label: "Find operators who've scaled sales teams at Series A" },
  { id: "q5", label: "Who can refer me to open product roles at growth-stage startups?" },
];

// ─── Knowledge Graph Node Data ─────────────────────────────────────────────────

type GraphNode = {
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

type GraphEdge = {
  from: string;
  to: string;
  orgId: OrgId;
};

const GRAPH_NODES: GraphNode[] = [
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

const GRAPH_EDGES: GraphEdge[] = [
  // You → VFA hubs
  { from: "you", to: "ryan-m",    orgId: "vfa" },
  { from: "you", to: "david-l",   orgId: "vfa" },
  { from: "you", to: "aisha-t",   orgId: "vfa" },
  { from: "you", to: "christine-s", orgId: "vfa" },
  // You → Wharton hubs
  { from: "you", to: "jennifer-k", orgId: "wharton" },
  { from: "you", to: "sam-l",      orgId: "wharton" },
  { from: "you", to: "tom-b",      orgId: "wharton" },
  // You → NYC hubs
  { from: "you", to: "maya-r",  orgId: "nyc" },
  { from: "you", to: "priya-s", orgId: "nyc" },

  // VFA hub → named contacts
  { from: "ryan-m",    to: "sarah-chen",   orgId: "vfa" },
  { from: "ryan-m",    to: "james-okafor", orgId: "vfa" },
  { from: "david-l",   to: "priya-patel",  orgId: "vfa" },
  { from: "aisha-t",   to: "james-okafor", orgId: "vfa" },
  { from: "christine-s", to: "lisa-wang",  orgId: "vfa" },

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

// ─── Sub-components ────────────────────────────────────────────────────────────

function OrgBadge({ orgId }: { orgId: OrgId }) {
  const community = COMMUNITIES.find((c) => c.id === orgId)!;
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
      style={{ background: community.bg, border: `1px solid ${community.border}`, color: community.text }}
    >
      {community.name}
    </span>
  );
}

function StrengthBadge({ strength }: { strength: "WARM" | "MODERATE" | "COLD" }) {
  const cfg = STRENGTH_CONFIG[strength];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text }}
    >
      {cfg.label}
    </span>
  );
}

function PathVisualization({ nodes }: { nodes: PathNode[] }) {
  return (
    <div className="flex items-start gap-1">
      {nodes.map((node, i) => (
        <div key={i} className="flex items-center gap-1">
          {i > 0 && (
            <div className="h-px w-4 mt-3.5 border-t border-dashed border-zinc-300 shrink-0" />
          )}
          <div className="flex flex-col items-center gap-0.5 min-w-0">
            <div
              className={cn(
                "h-7 w-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0",
                i === 0
                  ? "bg-violet-100 text-violet-700 ring-1 ring-violet-400"
                  : i === nodes.length - 1
                  ? "bg-zinc-800 text-white"
                  : "bg-zinc-100 text-zinc-600"
              )}
            >
              {node.initials}
            </div>
            <span className="text-[8px] text-zinc-500 text-center w-14 truncate leading-tight">
              {node.label}
            </span>
            {node.sub && (
              <span className="text-[7px] text-zinc-400 text-center leading-tight">{node.sub}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultCard({
  contact,
  isSelected,
  isHovered,
  onSelect,
  onHover,
  onLeave,
}: {
  contact: ContactResult;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onHover: () => void;
  onLeave: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={cn(
        "w-full rounded-lg border px-4 py-3 text-left transition-colors cursor-pointer",
        isSelected
          ? "border-violet-500 bg-violet-50/40 ring-1 ring-violet-500"
          : isHovered
          ? "border-zinc-300 bg-zinc-50"
          : "border-zinc-200 bg-white hover:bg-zinc-50"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900 truncate">{contact.name}</p>
          <p className="text-xs text-zinc-500">{contact.title} · {contact.company}</p>
        </div>
        <StrengthBadge strength={contact.strength} />
      </div>
      <div className="mb-2">
        <PathVisualization nodes={contact.pathNodes} />
      </div>
      <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
        {contact.orgs.map((orgId) => (
          <OrgBadge key={orgId} orgId={orgId} />
        ))}
      </div>
      <p className="text-[11px] text-zinc-500 leading-snug line-clamp-2">{contact.outreachAngle}</p>
    </button>
  );
}

function ContactDetailPanel({
  contact,
  copiedMessage,
  onCopy,
  onClose,
}: {
  contact: ContactResult;
  copiedMessage: boolean;
  onCopy: (text: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="shrink-0 flex items-start justify-between px-4 py-3 border-b border-zinc-200">
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h2 className="text-base font-semibold text-zinc-900">{contact.name}</h2>
            <StrengthBadge strength={contact.strength} />
          </div>
          <p className="text-sm text-zinc-500">{contact.title} · {contact.company}</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors mt-0.5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-4 py-3 space-y-4">
          {/* Connection path */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">Connection Path</h3>
            <div className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
              <PathVisualization nodes={contact.pathNodes} />
            </div>
          </div>

          {/* Org source */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Source Communities</h3>
            <div className="flex flex-wrap gap-1.5">
              {contact.orgs.map((orgId) => (
                <OrgBadge key={orgId} orgId={orgId} />
              ))}
            </div>
            {contact.orgs.length > 1 && (
              <div className="mt-2 flex items-start gap-1.5 rounded-md bg-violet-50 border border-violet-200 px-3 py-2 text-xs text-violet-700">
                <Sparkles className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>Reachable through {contact.orgs.length} of your communities — stronger introduction</span>
              </div>
            )}
          </div>

          {/* How connected */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">How You&apos;re Connected</h3>
            <p className="text-xs text-zinc-600 leading-relaxed rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              {contact.middlemanNote}
            </p>
          </div>

          {/* Why this person */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Why This Person</h3>
            <p className="text-xs text-zinc-600 leading-relaxed rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              {contact.whyRelevant}
            </p>
          </div>

          {/* Outreach draft */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Outreach Draft</h3>
              <button
                onClick={() => onCopy(contact.fullOutreach)}
                className={cn(
                  "flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors",
                  copiedMessage
                    ? "bg-green-100 text-green-700"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                )}
              >
                {copiedMessage ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copiedMessage ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 leading-relaxed whitespace-pre-wrap italic">
              {contact.fullOutreach}
            </div>
          </div>

          {/* CTA */}
          <Button className="w-full bg-violet-600 hover:bg-violet-700 text-white text-sm">
            Request Intro through {contact.pathNodes[1]?.label ?? "Connection"}
          </Button>
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Knowledge Graph SVG ───────────────────────────────────────────────────────

type DragRect = { x1: number; y1: number; x2: number; y2: number } | null;
type GraphSelection = {
  rect: { minX: number; minY: number; maxX: number; maxY: number };
  nodeIds: string[];
  contactIds: string[];
  prompt: string;
  analysis: string | null;
} | null;

function generateSubsetAnalysis(contactIds: string[], nodeIds: string[], query: string): string {
  const contacts = ALL_RESULTS.filter((c) => contactIds.includes(c.id));
  const total = nodeIds.length;
  const q = query.toLowerCase();

  if (contacts.length === 0) {
    return `This cluster of ${total} node${total !== 1 ? "s" : ""} contains hub connectors and leaf nodes — bridges in your network without named profiles. They enable introductions but won't surface in queries. Try running a search to find named contacts adjacent to this cluster.`;
  }

  const names = contacts.map((c) => `${c.name} (${c.company})`).join(", ");
  const crossOrg = contacts.filter((c) => c.orgs.length > 1);

  if (q.includes("warm") || q.includes("intro") || q.includes("best") || q.includes("start")) {
    const sorted = [...contacts].sort((a, b) =>
      (a.strength === "WARM" ? 0 : a.strength === "MODERATE" ? 1 : 2) -
      (b.strength === "WARM" ? 0 : b.strength === "MODERATE" ? 1 : 2)
    );
    const top = sorted[0];
    return `Best entry point in this selection: ${top.name} at ${top.company} (${top.strength} connection via ${top.pathNodes[1]?.label ?? "your network"}). ${sorted.length > 1 ? `Once that conversation opens, the remaining ${sorted.length - 1} contact${sorted.length - 1 > 1 ? "s" : ""} — ${sorted.slice(1).map((c) => c.name).join(", ")} — can be sequenced naturally.` : ""}`;
  }

  if (q.includes("common") || q.includes("overlap") || q.includes("share") || q.includes("connect")) {
    return `The ${total} nodes in this selection share overlapping community ties. ${crossOrg.length > 0 ? `${crossOrg[0].name} bridges multiple communities — an intro from them carries implicit endorsement from the whole cluster.` : `An intro from any of these ${contacts.length} contact${contacts.length > 1 ? "s" : ""} would carry context from the surrounding connections.`}`;
  }

  if (crossOrg.length > 0) {
    const c = crossOrg[0];
    return `This selection captures ${total} nodes including ${contacts.length} named contact${contacts.length > 1 ? "s" : ""}: ${names}. ${c.name} is a cross-community bridge — reachable through both ${c.orgs.map((o) => COMMUNITIES.find((cm) => cm.id === o)?.name).join(" and ")}. Introductions from this cluster carry compounded social capital.`;
  }

  return `This selection captures ${total} nodes including ${contacts.length} named contact${contacts.length > 1 ? "s" : ""}: ${names}. All are reachable within 2 hops. ${contacts[0]?.strength === "WARM" ? `${contacts[0].name} is your strongest entry point — a warm connection through ${contacts[0].pathNodes[1]?.label}.` : "Consider warming up these connections through your community channels before a cold reach-out."}`;
}

function KnowledgeGraph({
  queryState,
  resultContactIds,
  selectedContactId,
  hoveredCardId,
  onContactClick,
}: {
  queryState: "idle" | "loading" | "results";
  resultContactIds: string[];
  selectedContactId: string | null;
  hoveredCardId: string | null;
  onContactClick: (contactId: string) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const nodeMap = useMemo(() => new Map(GRAPH_NODES.map((n) => [n.id, n])), []);

  const [mode, setMode] = useState<"interact" | "select">("interact");
  const [drag, setDrag] = useState<DragRect>(null);
  const [selection, setSelection] = useState<GraphSelection>(null);

  const highlightPath = useMemo((): string | null => {
    if (!selectedContactId) return null;
    const contact = ALL_RESULTS.find((c) => c.id === selectedContactId);
    if (!contact) return null;
    const youNode = nodeMap.get("you");
    const hubNode = nodeMap.get(contact.hubNodeId);
    const contactNode = nodeMap.get(contact.graphNodeId);
    if (!youNode || !hubNode || !contactNode) return null;
    return `${youNode.cx},${youNode.cy} ${hubNode.cx},${hubNode.cy} ${contactNode.cx},${contactNode.cy}`;
  }, [selectedContactId, nodeMap]);

  function toSVG(e: React.MouseEvent): { x: number; y: number } {
    const svg = svgRef.current!;
    const r = svg.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * 600, y: ((e.clientY - r.top) / r.height) * 420 };
  }

  function handleMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if (mode !== "select") return;
    const p = toSVG(e);
    setDrag({ x1: p.x, y1: p.y, x2: p.x, y2: p.y });
    setSelection(null);
  }

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!drag) return;
    const p = toSVG(e);
    setDrag((d) => (d ? { ...d, x2: p.x, y2: p.y } : null));
  }

  function handleMouseUp() {
    if (!drag) return;
    const minX = Math.min(drag.x1, drag.x2);
    const maxX = Math.max(drag.x1, drag.x2);
    const minY = Math.min(drag.y1, drag.y2);
    const maxY = Math.max(drag.y1, drag.y2);
    setDrag(null);
    if (maxX - minX < 8 || maxY - minY < 8) return;
    const inRect = GRAPH_NODES.filter(
      (n) => n.cx >= minX && n.cx <= maxX && n.cy >= minY && n.cy <= maxY
    );
    if (inRect.length === 0) return;
    setSelection({
      rect: { minX, minY, maxX, maxY },
      nodeIds: inRect.map((n) => n.id),
      contactIds: inRect.filter((n) => n.contactId).map((n) => n.contactId!),
      prompt: "",
      analysis: null,
    });
  }

  function handleAnalyze() {
    if (!selection?.prompt.trim()) return;
    const result = generateSubsetAnalysis(selection.contactIds, selection.nodeIds, selection.prompt);
    setSelection((s) => (s ? { ...s, analysis: result } : null));
  }

  function getNodeOpacity(node: GraphNode): number {
    if (queryState === "idle") return 0.82;
    if (queryState === "loading") return 0.2;
    if (node.id === "you") return 1;
    if (node.contactId && resultContactIds.includes(node.contactId)) return 1;
    if (node.isHub) {
      const feedsResult = GRAPH_EDGES.some((e) => {
        if (e.from !== node.id) return false;
        const target = nodeMap.get(e.to);
        return target?.contactId && resultContactIds.includes(target.contactId);
      });
      if (feedsResult) return 0.6;
    }
    return 0.1;
  }

  function getNodeFilter(node: GraphNode): string {
    if (selection?.nodeIds.includes(node.id)) return "drop-shadow(0 0 4px rgba(124,58,237,0.5))";
    if (node.contactId === selectedContactId) return "drop-shadow(0 0 5px #7c3aed)";
    if (node.contactId === hoveredCardId) return "drop-shadow(0 0 4px #a78bfa)";
    return "none";
  }

  function getNodeFill(node: GraphNode): string {
    if (node.id === "you") return "#7c3aed";
    if (node.crossOrg) return node.isHub ? "#c4b5fd" : "url(#crossorg-grad)";
    const colors = ORG_COLORS[node.orgId] ?? ORG_COLORS.vfa;
    return node.isHub ? colors.fillHub : colors.fill;
  }

  function getNodeStroke(node: GraphNode): string {
    if (selection?.nodeIds.includes(node.id)) return "#7c3aed";
    if (node.contactId === selectedContactId) return "#7c3aed";
    if (node.crossOrg) return "#7c3aed";
    const colors = ORG_COLORS[node.orgId] ?? ORG_COLORS.vfa;
    return colors.stroke;
  }

  function getEdgeOpacity(edge: GraphEdge): number {
    if (queryState === "idle") return 0.28;
    if (queryState === "loading") return 0.08;
    const toNode = nodeMap.get(edge.to);
    if (toNode?.contactId && resultContactIds.includes(toNode.contactId)) return 0.55;
    if (edge.from === "you") return 0.18;
    return 0.05;
  }

  // Popup position as CSS percentages of the container
  const popupLeft = selection
    ? Math.min((selection.rect.maxX / 600) * 100, 62)
    : 0;
  const popupTop = selection
    ? (((selection.rect.minY + selection.rect.maxY) / 2) / 420) * 100
    : 0;

  return (
    <div className="relative w-full select-none">
      <style>{`
        @keyframes draw-path { to { stroke-dashoffset: 0; } }
        @keyframes pulse-you { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadein-popup { from { opacity:0; transform:translateY(calc(-50% - 4px)); } to { opacity:1; transform:translateY(-50%); } }
      `}</style>

      {/* Mode toggle — top-right of graph */}
      <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-lg border border-zinc-200 bg-white/90 backdrop-blur-sm p-1 shadow-sm">
        <button
          onClick={() => { setMode("interact"); setSelection(null); setDrag(null); }}
          title="Interact mode"
          className={cn(
            "rounded p-1.5 transition-colors",
            mode === "interact"
              ? "bg-violet-600 text-white"
              : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          )}
        >
          <MousePointer2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => { setMode("select"); setSelection(null); }}
          title="Select region"
          className={cn(
            "rounded p-1.5 transition-colors",
            mode === "select"
              ? "bg-violet-600 text-white"
              : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
          )}
        >
          <BoxSelect className="h-3.5 w-3.5" />
        </button>
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 600 420"
        style={{
          width: "100%",
          height: "auto",
          display: "block",
          cursor: mode === "select" ? "crosshair" : "default",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <defs>
          <radialGradient id="bg-vfa" cx="25%" cy="30%" r="40%">
            <stop offset="0%" stopColor="#ede9fe" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bg-wharton" cx="75%" cy="30%" r="40%">
            <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bg-nyc" cx="50%" cy="85%" r="40%">
            <stop offset="0%" stopColor="#d1fae5" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="crossorg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ede9fe" />
            <stop offset="100%" stopColor="#dbeafe" />
          </linearGradient>
        </defs>

        {/* Cluster background blobs */}
        <ellipse cx="180" cy="160" rx="160" ry="120" fill="url(#bg-vfa)" />
        <ellipse cx="420" cy="160" rx="160" ry="120" fill="url(#bg-wharton)" />
        <ellipse cx="300" cy="360" rx="130" ry="90"  fill="url(#bg-nyc)" />

        {/* Edges */}
        {GRAPH_EDGES.map((edge, i) => {
          const from = nodeMap.get(edge.from);
          const to = nodeMap.get(edge.to);
          if (!from || !to) return null;
          const colors = ORG_COLORS[edge.orgId];
          return (
            <line
              key={i}
              x1={from.cx} y1={from.cy}
              x2={to.cx}   y2={to.cy}
              stroke={colors.stroke}
              strokeWidth={edge.from === "you" ? 1.25 : 0.7}
              opacity={getEdgeOpacity(edge)}
              style={{ transition: "opacity 0.45s ease" }}
            />
          );
        })}

        {/* Animated highlight path */}
        {highlightPath && (
          <polyline
            key={selectedContactId}
            points={highlightPath}
            fill="none"
            stroke="#7c3aed"
            strokeWidth={2.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="700"
            strokeDashoffset="700"
            opacity={0.85}
            style={{ animation: "draw-path 0.65s ease forwards" }}
          />
        )}

        {/* Nodes */}
        {GRAPH_NODES.map((node) => {
          const opacity = getNodeOpacity(node);
          const fill = getNodeFill(node);
          const stroke = getNodeStroke(node);
          const filter = getNodeFilter(node);
          const isInSelection = selection?.nodeIds.includes(node.id);
          const strokeWidth = isInSelection ? 2 : node.contactId === selectedContactId ? 2.5 : node.id === "you" ? 2.5 : 1.2;
          const isClickable =
            mode === "interact" &&
            !!node.contactId &&
            queryState === "results" &&
            resultContactIds.includes(node.contactId);

          return (
            <g
              key={node.id}
              style={{
                opacity,
                filter,
                transition: "opacity 0.45s ease, filter 0.2s ease",
                cursor: isClickable ? "pointer" : "inherit",
                animation:
                  queryState === "loading" && node.id === "you"
                    ? "pulse-you 1.2s ease-in-out infinite"
                    : undefined,
              }}
              onClick={(e) => {
                if (mode === "select") return;
                e.stopPropagation();
                if (isClickable && node.contactId) onContactClick(node.contactId);
              }}
            >
              <circle cx={node.cx} cy={node.cy} r={node.r} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
              {node.id === "you" && (
                <text x={node.cx} y={node.cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={6.5} fontWeight={700} fill="white" style={{ pointerEvents: "none", userSelect: "none" }}>
                  You
                </text>
              )}
              {node.label && node.id !== "you" && (
                <text x={node.cx} y={node.cy + node.r + 8} textAnchor="middle" dominantBaseline="auto" fontSize={6.5} fill={node.contactId ? "#52525b" : "#a1a1aa"} fontWeight={node.contactId ? 600 : 400} style={{ pointerEvents: "none", userSelect: "none" }}>
                  {node.label.split(" ")[0]}
                </text>
              )}
            </g>
          );
        })}

        {/* Live drag rectangle */}
        {drag && (
          <rect
            x={Math.min(drag.x1, drag.x2)}
            y={Math.min(drag.y1, drag.y2)}
            width={Math.abs(drag.x2 - drag.x1)}
            height={Math.abs(drag.y2 - drag.y1)}
            fill="rgba(124,58,237,0.05)"
            stroke="#7c3aed"
            strokeWidth={1.5}
            strokeDasharray="5 3"
            rx={2}
            style={{ pointerEvents: "none" }}
          />
        )}

        {/* Committed selection rectangle */}
        {selection && (
          <rect
            x={selection.rect.minX}
            y={selection.rect.minY}
            width={selection.rect.maxX - selection.rect.minX}
            height={selection.rect.maxY - selection.rect.minY}
            fill="rgba(124,58,237,0.04)"
            stroke="#7c3aed"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            rx={3}
            style={{ pointerEvents: "none" }}
          />
        )}
      </svg>

      {/* Selection prompt popup — absolutely positioned over graph */}
      {selection && (
        <div
          className="absolute z-20 w-64 rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden"
          style={{
            left: `${popupLeft}%`,
            top: `${popupTop}%`,
            transform: "translateY(-50%)",
            animation: "fadein-popup 0.18s ease forwards",
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-100 bg-zinc-50">
            <div className="flex items-center gap-1.5">
              <BoxSelect className="h-3.5 w-3.5 text-violet-500" />
              <span className="text-xs font-semibold text-zinc-700">
                {selection.nodeIds.length} node{selection.nodeIds.length !== 1 ? "s" : ""} selected
              </span>
              {selection.contactIds.length > 0 && (
                <span className="text-[10px] text-zinc-400">
                  · {selection.contactIds.length} contact{selection.contactIds.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <button
              onClick={() => setSelection(null)}
              className="rounded p-0.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Prompt input */}
          <div className="px-3 pt-2.5 pb-2">
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                type="text"
                value={selection.prompt}
                onChange={(e) =>
                  setSelection((s) => (s ? { ...s, prompt: e.target.value, analysis: null } : null))
                }
                onKeyDown={(e) => { if (e.key === "Enter") handleAnalyze(); }}
                placeholder="Ask about this selection..."
                className="flex-1 min-w-0 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400"
              />
              <button
                onClick={handleAnalyze}
                disabled={!selection.prompt.trim()}
                className="shrink-0 rounded-lg bg-violet-600 p-1.5 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Analysis result */}
          {selection.analysis && (
            <div className="px-3 pb-3">
              <div className="rounded-lg border border-violet-100 bg-violet-50 p-2.5 text-[11px] text-violet-900 leading-relaxed">
                {selection.analysis}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function NetworkOSPage() {
  const [queryState, setQueryState] = useState<"idle" | "loading" | "results">("idle");
  const [activeQuery, setActiveQuery] = useState("");
  const [activeQueryId, setActiveQueryId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const currentResults = useMemo(
    () => (activeQueryId ? (RESULTS_BY_QUERY_ID[activeQueryId] ?? VC_RESULTS) : VC_RESULTS),
    [activeQueryId]
  );

  const resultContactIds = useMemo(() => currentResults.map((c) => c.id), [currentResults]);

  const selectedContact = useMemo(
    () => (selectedContactId ? currentResults.find((c) => c.id === selectedContactId) ?? null : null),
    [selectedContactId, currentResults]
  );

  function handleQuery(text: string, queryId?: string) {
    if (text === activeQuery && queryState === "results") return;
    const qid = queryId ?? DEMO_QUERIES.find((q) => q.label === text)?.id ?? null;
    setActiveQuery(text);
    setInputValue(text);
    setActiveQueryId(qid);
    setQueryState("loading");
    setSelectedContactId(null);
    setTimeout(() => setQueryState("results"), 800);
  }

  function handleCopy(text: string) {
    try { navigator.clipboard.writeText(text); } catch (_) { /* no-op */ }
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  }

  function handleClear() {
    setQueryState("idle");
    setActiveQuery("");
    setActiveQueryId(null);
    setSelectedContactId(null);
    setHoveredCardId(null);
    setInputValue("");
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* Header */}
      <header className="shrink-0 h-12 flex items-center px-4 border-b border-zinc-200 bg-white justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center h-7 w-7 rounded-lg bg-violet-600">
            <Network className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-bold text-zinc-900 tracking-tight">NetworkOS</span>
          <span className="text-zinc-300 text-sm">|</span>
          <span className="text-xs text-zinc-400 hidden sm:block">Pool your network. Query everything.</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-white">
            AC
          </div>
          <span className="text-sm font-medium text-zinc-700">Alex Chen</span>
        </div>
      </header>

      {/* Three panels */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Left panel */}
        <aside
          style={{ width: 256, minWidth: 256 }}
          className="flex flex-col border-r border-zinc-200 bg-white overflow-y-auto"
        >
          <div className="px-3.5 pt-4 pb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Your Communities</p>
            <div className="space-y-1">
              {COMMUNITIES.map((community) => (
                <div
                  key={community.id}
                  className="flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-zinc-50 cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="h-2 w-2 rounded-full shrink-0" style={{ background: community.dot }} />
                    <span className="text-xs font-medium text-zinc-700 truncate">{community.name}</span>
                  </div>
                  <span
                    className="text-[10px] font-semibold rounded-full px-2 py-0.5 shrink-0 ml-1"
                    style={{ background: community.bg, color: community.text }}
                  >
                    {community.connections.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Separator className="my-2" />

          <div className="px-3.5 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">Network Stats</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-zinc-50 border border-zinc-100 p-2.5 text-center">
                <p className="text-2xl font-bold text-zinc-900 tabular-nums">892</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">connections</p>
              </div>
              <div className="rounded-lg bg-violet-50 border border-violet-100 p-2.5 text-center">
                <p className="text-2xl font-bold text-violet-700 tabular-nums">234</p>
                <p className="text-[10px] text-violet-500 mt-0.5">warm paths</p>
              </div>
            </div>
          </div>

          <Separator className="my-2" />

          <div className="px-3.5 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">Coverage by Industry</p>
            <div className="flex flex-wrap gap-1.5">
              {["B2B SaaS", "Healthcare", "Fintech", "Consumer", "Climate", "DevTools"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium border border-zinc-200 bg-white text-zinc-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-auto px-3.5 pb-4 pt-2">
            <div className="rounded-lg bg-violet-50 border border-violet-200 p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Zap className="h-3.5 w-3.5 text-violet-600 shrink-0" />
                <p className="text-xs font-semibold text-violet-800">Expand your reach</p>
              </div>
              <p className="text-[11px] text-violet-700 leading-snug mb-2">
                Join 2 more communities → unlock ~400 more connections
              </p>
              <button className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-800 transition-colors">
                <Plus className="h-3 w-3" />
                Browse communities
              </button>
            </div>
          </div>
        </aside>

        {/* Center panel */}
        <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {/* Search */}
          <div className="shrink-0 border-b border-zinc-100 bg-white px-4 py-3">
            <div className="relative mb-2.5">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && inputValue.trim()) handleQuery(inputValue.trim());
                }}
                placeholder="Search across 892 connections... (press Enter)"
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 pl-9 pr-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-violet-400 focus:border-violet-400 transition-colors"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {DEMO_QUERIES.map((query) => (
                <button
                  key={query.id}
                  onClick={() => handleQuery(query.label, query.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors cursor-pointer",
                    activeQuery === query.label && queryState === "results"
                      ? "border-violet-500 bg-violet-100 text-violet-700 font-medium"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700"
                  )}
                >
                  {query.label}
                </button>
              ))}
              {queryState !== "idle" && (
                <button
                  onClick={handleClear}
                  className="ml-1 flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 transition-colors cursor-pointer"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Graph + results */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* Knowledge graph — always visible */}
            <div className="border-b border-zinc-100 bg-white px-3 pt-2 pb-0">
              <div className="flex items-center justify-between px-1 mb-0.5">
                <p className="text-[9px] font-semibold uppercase tracking-wider text-zinc-300">Network Graph</p>
                <div className="flex items-center gap-3">
                  {COMMUNITIES.map((c) => (
                    <div key={c.id} className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full" style={{ background: c.dot }} />
                      <span className="text-[9px] text-zinc-400">{c.name.split(" ")[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
              <KnowledgeGraph
                queryState={queryState}
                resultContactIds={resultContactIds}
                selectedContactId={selectedContactId}
                hoveredCardId={hoveredCardId}
                onContactClick={(id) =>
                  setSelectedContactId(id === selectedContactId ? null : id)
                }
              />
            </div>

            {/* Idle state */}
            {queryState === "idle" && (
              <div className="flex flex-col items-center justify-center py-6 px-6 text-center">
                <p className="text-xs text-zinc-400">
                  Click a demo query above to surface warm intro paths across your communities
                </p>
              </div>
            )}

            {/* Loading */}
            {queryState === "loading" && (
              <div className="p-4 space-y-2">
                <p className="text-xs text-zinc-400 animate-pulse">Searching across 3 communities...</p>
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-lg" />
                ))}
              </div>
            )}

            {/* Results */}
            {queryState === "results" && (
              <div className="p-4">
                <p className="text-xs text-zinc-500 mb-3">
                  <span className="font-semibold text-zinc-700">{currentResults.length} results</span>
                  {" "}across {COMMUNITIES.length} communities
                  {activeQuery && (
                    <span className="text-zinc-400"> for &ldquo;{activeQuery}&rdquo;</span>
                  )}
                </p>
                <div className="space-y-2">
                  {currentResults.map((contact) => (
                    <ResultCard
                      key={contact.id}
                      contact={contact}
                      isSelected={selectedContactId === contact.id}
                      isHovered={hoveredCardId === contact.id}
                      onSelect={() =>
                        setSelectedContactId(
                          contact.id === selectedContactId ? null : contact.id
                        )
                      }
                      onHover={() => setHoveredCardId(contact.id)}
                      onLeave={() => setHoveredCardId(null)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Right panel — contact detail */}
        {selectedContact && (
          <aside
            style={{ width: 460, minWidth: 460 }}
            className="flex flex-col border-l border-zinc-200 bg-white overflow-hidden"
          >
            <ContactDetailPanel
              contact={selectedContact}
              copiedMessage={copiedMessage}
              onCopy={handleCopy}
              onClose={() => setSelectedContactId(null)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
