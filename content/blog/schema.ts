export type BlogCategory =
  | "Friendship Advice"
  | "Wellbeing & Connection"
  | "Conversation Skills"
  | "Online Safety"
  | "Chat Platforms"
  | "Cultural Connections";

export interface BlogFAQ {
  question: string;
  answer: string;
}

export interface BlogArticle {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  category: BlogCategory;
  readTime: string;
  publishedDate: string;
  lastUpdated: string;
  author: string;
  targetKeywords: string[];
  searchIntent: "Informational" | "Commercial Investigation" | "Navigational" | "Social Guidance";
  keyTakeaways: string[];
  contentHtml: string;
  faqs: BlogFAQ[];
  relatedSlugs: string[];
  isPublished: boolean;
}

export interface CalendarTopic {
  id: number;
  scheduledDate: string; // YYYY-MM-DD
  title: string;
  slug: string;
  category: BlogCategory;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: string;
  targetAudience: "Adults Worldwide" | "Adults India" | "College / Young Adults" | "Introverts & Remote Workers";
  priority: "High" | "Medium";
  contentAngle: string;
  status: "published" | "scheduled" | "draft" | "held";
}
