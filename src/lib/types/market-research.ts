export type MarketResearchTopic =
  | "market-size"
  | "competitor-landscape"
  | "customer-pain"
  | "existing-solutions";

export interface MarketResearchSource {
  title: string;
  url: string;
  snippet: string;
  score: number;
}

export interface MarketResearchSection {
  topic: MarketResearchTopic;
  query: string;
  synthesis: string;
  sources: MarketResearchSource[];
}

export interface MarketResearchResult {
  generatedAt: string;
  sections: MarketResearchSection[];
}
