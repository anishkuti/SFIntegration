import { SalesforceLead } from '../types';

export const INITIAL_LEADS: SalesforceLead[] = [
  {
    id: '00Qf600000EwQoTEAV',
    name: 'Madhushri Manna',
    title: null,
    jobTitle: null,
    jobRole: null,
    company: 'tcs',
    street: 'Near Lahabazar, Kamarpukur-Joyrambati Rd',
    city: 'Kamarpukur',
    state: 'West Bengal',
    postalCode: '712612',
    country: 'IN',
    region: 'Kamarpukur, West Bengal, IN',
    website: 'tcs.com',
    status: 'New',
    leadSource: null,
    industry: null,
    annualRevenue: null,
    annualRevenueMusd: null,
    description: null,
    rating: null,
    
    // Scoring Attributes & Firmographics from Salesforce (null until populated in SF)
    purchasingAuthority: null,
    numberOfEmployees: null,
    employees: null,
    revenueGrowthDecline: null,
    averageSalesCycle: null,
    
    // Digital Engagement Touchpoints from Salesforce (null until populated in SF)
    landingPageView: null,
    landingPageConversion: null,
    useOfChatFunctionality: null,
    requestForCallBack: null,
    viewedWebPageProduct: null,
    viewedWebPagePrice: null,
    viewedWebPagePricing: null,
    viewedWebPageReview: null,

    productInterest: null,
    estimatedMrr: null,
    linesOrSeats: null,
    currentProvider: null,
    contractEndsIn: null,
    lastActivity: null,
    email: 'madhushri.manna@gmail.com',
    phone: null,
    createdAt: '2026-08-28T03:21:14.000Z',
    lastSyncedAt: new Date().toISOString(),
    repNotes: '',
    engagementHistory: [
      {
        id: 'eng-sf-real-1',
        date: '2026-08-28',
        type: 'web',
        title: 'Salesforce Lead Record Created',
        notes: 'Lead SObject created on tcs41.my.salesforce.com (ID: 00Qf600000EwQoTEAV, Email: madhushri.manna@gmail.com)'
      },
      {
        id: 'eng-sf-real-2',
        date: '2026-08-28',
        type: 'web',
        title: 'Salesforce REST API Connected',
        notes: 'Connected to Salesforce REST API v66.0 via OAuth2 client credentials grant.'
      }
    ]
  }
];

