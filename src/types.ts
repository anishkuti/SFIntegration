export type LeadStatus = 'New' | 'Working' | 'Contacted' | 'Qualified' | 'Unqualified';
export type LeadTemperature = 'HOT' | 'WARM' | 'COLD';
export type LeadRating = 'Hot' | 'Warm' | 'Cold' | 'Unrated';

export interface EngagementEvent {
  id: string;
  date: string;
  type: 'email' | 'call' | 'web' | 'form' | 'demo' | 'download' | 'meeting';
  title: string;
  notes: string;
}

export interface AiScoreResult {
  leadScore: number; // 0 to 100
  conversionProbability: number; // 0 to 100%
  temperatureType: LeadTemperature;
  band?: string; // e.g. "Hot", "Warm", "Nurture", "Cold"
  model?: string; // e.g. "LogisticRegression-Pipeline-v2"
  converted?: number; // 1 or 0
  recommendedFollowUpAction: string; // Follow-up action
  scoredAt: string;
  scoredByApi: string;
  awsRequestId?: string;
  latencyMs?: number;
}

export interface SalesforceLead {
  id: string; // Salesforce CRM ID e.g. "00Qf600000EwQoTEAV"
  name: string;
  title?: string | null; // Job Title
  jobTitle?: string | null; // Job Title
  jobRole?: string | null; // Job Role
  company: string;
  region?: string | null;
  status: LeadStatus;
  leadSource?: string | null;
  industry?: string | null;
  annualRevenue?: string | null;
  annualRevenueMusd?: number | null;
  description?: string | null;
  rating?: LeadRating | null;
  
  // 15 Scoring Attributes & Firmographics from Salesforce:
  purchasingAuthority?: 'Yes' | 'No' | 'Decision Maker' | 'Influencer' | 'Budget Holder' | string | null;
  numberOfEmployees?: number | null;
  employees?: number | null;
  revenueGrowthDecline?: string | null;
  averageSalesCycle?: string | null;
  
  // Web & Digital Engagement Touchpoints from Salesforce:
  landingPageView?: 'Yes' | 'No' | 'Y' | 'N' | string | null;
  landingPageConversion?: 'Yes' | 'No' | 'Y' | 'N' | string | null;
  useOfChatFunctionality?: 'Yes' | 'No' | 'Y' | 'N' | string | null;
  requestForCallBack?: 'Yes' | 'No' | 'Y' | 'N' | string | null;
  viewedWebPageProduct?: 'Yes' | 'No' | 'Y' | 'N' | string | null;
  viewedWebPagePrice?: 'Yes' | 'No' | 'Y' | 'N' | string | null;
  viewedWebPagePricing?: 'Yes' | 'No' | 'Y' | 'N' | string | null;
  viewedWebPageReview?: 'Yes' | 'No' | 'Y' | 'N' | string | null;
  
  // Opportunity & Conversion Outcomes (Optional):
  leadConvertedToOpportunity?: 'Y' | 'N' | 'Yes' | 'No' | string | null;
  leadToOpportunityTat?: string | null;
  opportunityWon?: 'Y' | 'N' | 'Yes' | 'No' | 'Pending' | string | null;
  opportunityWonTat?: string | null;
  opportunityValue?: string | null;

  // Product & Solution fields:
  productInterest?: string | null;
  estimatedMrr?: number | null;
  linesOrSeats?: number | null;
  currentProvider?: string | null;
  contractEndsIn?: string | null;
  lastActivity?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
  createdAt?: string | null;
  lastSyncedAt?: string | null;
  repNotes?: string | null;
  engagementHistory?: EngagementEvent[];
  aiScoreResult?: AiScoreResult;
  rawSalesforceRecord?: any;
}

export interface AwsApiConfig {
  endpointUrl: string; // e.g. http://ec2-54-210-45-12.compute-1.amazonaws.com:8000/predict or http://10.0.1.45:5000/score
  instanceId?: string; // e.g. i-0a8f921bc4e29e81
  port?: string; // e.g. 8000, 5000
  apiKey?: string; // Optional Bearer token or x-api-key
  region: string;
  stage: string;
  useFallbackAi?: boolean;
}

export interface SalesforceEnvConfig {
  environment: 'production' | 'sandbox' | 'custom';
  instanceUrl: string; // e.g. https://industries--comsaforg.sandbox.my.salesforce.com
  apiVersion?: string; // e.g. v66.0
  bearerToken?: string; // Bearer token
  sampleLeadId?: string; // e.g. 00QDv00000PtNLHMAN
  orgId: string;
  clientId: string;
  username: string;
  securityToken: string;
  isConnected: boolean;
  lastConnectedAt?: string;
  lastFetchAt?: string;
  fetchedLeadsCount?: number;
  lastSoqlQuery?: string;
  lastRawResponse?: any;
}

export interface SalesforceSyncLog {
  id: string;
  timestamp: string;
  leadId: string;
  leadName: string;
  action: 'SCORE_PUSH' | 'STATUS_UPDATE' | 'LEAD_CREATE' | 'LEADS_FETCH' | 'ACTIVITY_LOG';
  status: 'SUCCESS' | 'FAILED';
  details: string;
  salesforceFieldsUpdated: string[];
}
