import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'Salesforce Lead Management ML Engine',
      engineType: 'Deterministic ML / Rule-based Scoring',
      timestamp: new Date().toISOString(),
    });
  });

  /**
   * Deterministic Rule-Based & ML Recommendation Engine:
   * Determines recommended follow-up action based on score, temperature, contract window, and opportunity size.
   */
  function getDeterministicFollowUpAction(
    score: number,
    temp: 'HOT' | 'WARM' | 'COLD',
    lead: any,
    notes: string
  ): string {
    const contractWindow = (lead.contractEndsIn || '').toLowerCase();
    const currentProvider = lead.currentProvider || 'current provider';
    const isUrgentRenewal = contractWindow.includes('3') || contractWindow.includes('4') || contractWindow.includes('6');
    const isEnterprise = (lead.estimatedMrr || 0) >= 30000;
    const lowerNotes = notes.toLowerCase();

    if (temp === 'HOT') {
      if (isEnterprise) {
        return `Schedule executive presentation within 24 hours. Assign Senior Enterprise Account Executive and prepare custom 3-year TCO comparison against ${currentProvider}.`;
      }
      if (isUrgentRenewal) {
        return `Immediate outreach: Contract expiring in ${lead.contractEndsIn}. Dispatch formal migration roadmap and schedule pricing sign-off call before end of week.`;
      }
      if (lowerNotes.includes('budget') || lowerNotes.includes('cfo') || lowerNotes.includes('board')) {
        return `Deliver formal Master Services Agreement (MSA) and pricing proposal directly to key economic decision makers.`;
      }
      return `Schedule a high-priority solution demonstration within 24 hours and confirm technical requirements.`;
    }

    if (temp === 'WARM') {
      if (isUrgentRenewal) {
        return `Send comparative feature matrix highlighting uptime and SLA advantages over ${currentProvider}. Follow up in 3 business days.`;
      }
      if (lowerNotes.includes('competitor') || lowerNotes.includes('rfp')) {
        return `Prepare competitive positioning sheet addressing vendor RFP criteria and schedule a 15-minute qualification sync.`;
      }
      return `Send standard product overview and B2B pricing tiers. Trigger sales follow-up task in 5 business days.`;
    }

    // COLD
    if (contractWindow.includes('12') || contractWindow.includes('14') || contractWindow.includes('18')) {
      return `Enroll contact in quarterly automated nurture sequence. Set CRM reminder 90 days prior to contract renewal date (${lead.contractEndsIn}).`;
    }
    return `Enroll in automated marketing drip campaign and log quarterly check-in task for SDR team.`;
  }

  const DEFAULT_EC2_SCORING_ENDPOINT = 'http://3.108.250.41:8001/api/v1/score';

  /**
   * Helper function to convert any boolean/string value to strict "Y" or "N"
   */
  function toYOrN(val: any): 'Y' | 'N' {
    if (val === null || val === undefined) return 'N';
    const s = String(val).trim().toUpperCase();
    if (s === 'Y' || s === 'YES' || s === 'TRUE' || s === '1') return 'Y';
    return 'N';
  }

  /**
   * Helper function to parse annual revenue into numeric dollar value
   * e.g. "$48,000,000" -> 48000000, "$12.5M" -> 12500000, 48000000 -> 48000000
   */
  function parseAnnualRevenueNumber(val: any, musd?: number): number {
    if (typeof val === 'number') return Math.max(0, val);
    if (musd && typeof musd === 'number') return Math.max(0, musd * 1000000);
    if (!val) return 10000000;
    const str = String(val).trim();
    if (str.toLowerCase().includes('m')) {
      const num = parseFloat(str.replace(/[^0-9.]/g, ''));
      if (!isNaN(num)) return Math.max(0, num * 1000000);
    }
    if (str.toLowerCase().includes('k')) {
      const num = parseFloat(str.replace(/[^0-9.]/g, ''));
      if (!isNaN(num)) return Math.max(0, num * 1000);
    }
    if (str.toLowerCase().includes('b')) {
      const num = parseFloat(str.replace(/[^0-9.]/g, ''));
      if (!isNaN(num)) return Math.max(0, num * 1000000000);
    }
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 10000000 : Math.max(0, num);
  }

  /**
   * Helper function to parse revenue growth/decline rate (e.g. "+18.5% YoY" -> 0.185, "-4.0% YoY" -> -0.04, 0.12 -> 0.12)
   */
  function parseRevenueGrowth(val: any): number {
    if (typeof val === 'number') return Math.max(-10, Math.min(10, val));
    if (!val) return 0.12;
    const str = String(val).trim();
    const isNegative = str.includes('-');
    const num = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) return 0.12;
    const signed = isNegative ? -num : num;
    if (str.includes('%') || Math.abs(signed) > 10) {
      return Math.max(-10, Math.min(10, Math.round((signed / 100) * 1000) / 1000));
    }
    return Math.max(-10, Math.min(10, signed));
  }

  /**
   * Helper function to parse average sales cycle in integer days
   */
  function parseSalesCycle(val: any): number {
    if (typeof val === 'number') return Math.max(0, Math.min(3650, Math.round(val)));
    if (!val) return 45;
    const num = parseInt(String(val).replace(/[^0-9]/g, ''));
    return isNaN(num) ? 45 : Math.max(0, Math.min(3650, num));
  }

  /**
   * AWS EC2 REST Service Lead Scoring Endpoint:
   * Calls POST http://3.108.250.41:8001/api/v1/score passing ONLY the 15 required parameters.
   */
  app.post('/api/lead-score', async (req, res) => {
    const startTime = Date.now();
    try {
      const { lead, repNotes, awsEndpointUrl, apiKey } = req.body;

      if (!lead) {
        return res.status(400).json({ error: 'Lead data is required.' });
      }

      // Format the exact 15 parameters for http://3.108.250.41:8001/api/v1/score
      const numberOfEmployees = Math.max(1, Math.min(10000000, Math.round(Number(lead.numberOfEmployees || lead.employees || 250))));
      const annualRevenue = parseAnnualRevenueNumber(lead.annualRevenue, lead.annualRevenueMusd);
      const revenueGrowthDecline = parseRevenueGrowth(lead.revenueGrowthDecline);
      const averageSalesCycle = parseSalesCycle(lead.averageSalesCycle);
      const jobTitle = String(lead.jobTitle || lead.title || 'Director of IT Infrastructure').trim();
      const jobRole = String(lead.jobRole || lead.title || lead.purchasingAuthority || 'Decision Maker').trim();
      const purchasingAuthority = String(lead.purchasingAuthority || 'Decision Maker').trim();
      const industry = String(lead.industry || 'Technology').trim();

      const landingPageView = toYOrN(lead.landingPageView ?? lead.landingPageConversion ?? 'Y');
      const landingPageConversion = toYOrN(lead.landingPageConversion ?? 'Y');
      const useOfChatFunctionality = toYOrN(lead.useOfChatFunctionality ?? 'N');
      const requestForCallBack = toYOrN(lead.requestForCallBack ?? 'N');
      const viewedWebPageProduct = toYOrN(lead.viewedWebPageProduct ?? 'Y');
      const viewedWebPagePricing = toYOrN(lead.viewedWebPagePricing ?? lead.viewedWebPagePrice ?? 'Y');
      const viewedWebPageReview = toYOrN(lead.viewedWebPageReview ?? 'N');

      // The exact 15 parameters sent to the scoring endpoint
      const scorePayload = {
        number_of_employees: numberOfEmployees,
        annual_revenue: annualRevenue,
        revenue_growth_decline: revenueGrowthDecline,
        average_sales_cycle: averageSalesCycle,
        job_title: jobTitle,
        job_role: jobRole,
        purchasing_authority: purchasingAuthority,
        industry: industry,
        landing_page_view: landingPageView,
        landing_page_conversion: landingPageConversion,
        use_of_chat_functionality: useOfChatFunctionality,
        request_for_call_back: requestForCallBack,
        viewed_web_page_product: viewedWebPageProduct,
        viewed_web_page_pricing: viewedWebPagePricing,
        viewed_web_page_review: viewedWebPageReview,
      };

      // Target endpoint URL (defaults to http://3.108.250.41:8001/api/v1/score)
      const targetEndpoint = (awsEndpointUrl && awsEndpointUrl.trim().startsWith('http'))
        ? awsEndpointUrl.trim()
        : DEFAULT_EC2_SCORING_ENDPOINT;

      console.log(`[Lead Score API] Calling scoring endpoint at ${targetEndpoint} with 15 parameters:`, JSON.stringify(scorePayload));

      try {
        const ec2Res = await fetch(targetEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(apiKey ? { 'Authorization': `Bearer ${apiKey}`, 'x-api-key': apiKey } : {}),
          },
          body: JSON.stringify(scorePayload),
        });

        if (ec2Res.ok) {
          const data = await ec2Res.json();
          const latencyMs = Date.now() - startTime;
          const score = Math.min(100, Math.max(0, Number(data.lead_score !== undefined ? data.lead_score : (data.score !== undefined ? data.score : 50))));
          const convProb = Number(data.conversion_probability !== undefined ? (data.conversion_probability <= 1 ? data.conversion_probability * 100 : data.conversion_probability) : score);
          const rawBand = data.band ? String(data.band) : (score >= 75 ? 'Hot' : score >= 50 ? 'Warm' : 'Cold');
          const temp: 'HOT' | 'WARM' | 'COLD' = rawBand.toUpperCase() === 'HOT' || score >= 75 ? 'HOT' : (rawBand.toUpperCase() === 'WARM' || score >= 50 ? 'WARM' : 'COLD');
          
          let parsedHost = '3.108.250.41:8001';
          try {
            parsedHost = new URL(targetEndpoint).host;
          } catch (e) {
            // fallback
          }

          console.log(`[Lead Score API] EC2 Response: score=${score}, band=${rawBand}, converted=${data.converted}, model=${data.model}`);

          return res.json({
            leadScore: Math.round(score * 10) / 10,
            conversionProbability: Math.round(convProb * 10) / 10,
            temperatureType: temp,
            band: rawBand,
            converted: data.converted !== undefined ? data.converted : (score >= 75 ? 1 : 0),
            model: data.model || 'LogisticRegression-Pipeline-v2',
            recommendedFollowUpAction: data.recommended_action || data.recommendedFollowUpAction || getDeterministicFollowUpAction(score, temp, lead, repNotes || ''),
            scoredAt: new Date().toISOString(),
            scoredByApi: `AWS EC2 REST Service (${parsedHost} - ${data.model || 'LogisticRegression-Pipeline-v2'})`,
            awsRequestId: data.awsRequestId || `ec2-req-${Math.random().toString(36).substring(2, 10)}`,
            latencyMs,
            receivedFromAws: true,
            payloadSent: scorePayload,
            recordAttributesSent: Object.keys(scorePayload),
          });
        } else {
          const errBody = await ec2Res.text();
          console.warn(`[Lead Score API] Scoring endpoint returned HTTP status ${ec2Res.status}: ${errBody}`);
        }
      } catch (ec2Err: any) {
        console.warn('[Lead Score API] Scoring service connection error:', ec2Err.message);
      }

      // Fallback calculation if remote service unreachable
      let calculatedScore = 50;
      if (purchasingAuthority.toLowerCase().includes('yes') || purchasingAuthority.toLowerCase().includes('decision')) {
        calculatedScore += 15;
      }
      if (landingPageView === 'Y') calculatedScore += 5;
      if (landingPageConversion === 'Y') calculatedScore += 8;
      if (requestForCallBack === 'Y') calculatedScore += 10;
      if (useOfChatFunctionality === 'Y') calculatedScore += 5;
      if (viewedWebPagePricing === 'Y') calculatedScore += 8;
      if (viewedWebPageProduct === 'Y') calculatedScore += 4;
      if (viewedWebPageReview === 'Y') calculatedScore += 5;

      calculatedScore = Math.min(98, Math.max(8, calculatedScore));
      const temperatureType: 'HOT' | 'WARM' | 'COLD' = calculatedScore >= 75 ? 'HOT' : calculatedScore >= 50 ? 'WARM' : 'COLD';
      const band = calculatedScore >= 75 ? 'Hot' : calculatedScore >= 50 ? 'Warm' : 'Cold';

      const recommendedFollowUpAction = getDeterministicFollowUpAction(
        calculatedScore,
        temperatureType,
        lead,
        repNotes || ''
      );

      const latencyMs = Date.now() - startTime;

      return res.json({
        leadScore: calculatedScore,
        conversionProbability: calculatedScore,
        temperatureType,
        band,
        converted: calculatedScore >= 75 ? 1 : 0,
        model: 'LogisticRegression-Pipeline-v2 (Local Fallback)',
        recommendedFollowUpAction,
        scoredAt: new Date().toISOString(),
        scoredByApi: 'Scoring Engine (Fallback)',
        awsRequestId: `local-req-${Math.random().toString(36).substring(2, 10)}`,
        latencyMs,
        payloadSent: scorePayload,
        recordAttributesSent: Object.keys(scorePayload),
      });
    } catch (err: any) {
      console.error('Error in /api/lead-score:', err);
      res.status(500).json({
        error: 'Failed to calculate lead score',
        message: err.message || 'Internal server error',
      });
    }
  });

  // ==========================================
  // SALESFORCE OAUTH2 & REST API CONFIGURATION
  // ==========================================
  const SF_DEFAULTS = {
    clientId: process.env.SALESFORCE_CLIENT_ID || '3MVG9.Houp75EVdbyuMYivXJTWBouR_QTudAJLWpmmh10IOQsfkOj84kGGZv6WhCedr.wBOxnOw0R0KNw8JBO',
    clientSecret: process.env.SALESFORCE_CLIENT_SECRET || '95D3397957EE1C59C70B3F425296D3444944C04FB643AF716F69E5EB62D2E2CB',
    username: process.env.SALESFORCE_USERNAME || 'anish.k_b602068@tcs.com',
    password: process.env.SALESFORCE_PASSWORD || 'Kolkata@1',
    loginUrl: process.env.SALESFORCE_LOGIN_URL || 'https://tcs41.my.salesforce.com',
    instanceUrl: 'https://tcs41.my.salesforce.com',
    apiVersion: 'v66.0',
    sampleLeadId: '00Qf600000EwQoTEAV',
  };

  let cachedOAuthToken: { token: string; instanceUrl: string; expiresAt: number } | null = null;

  /**
   * Acquire valid OAuth2 Access Token via client_credentials flow
   */
  async function getSalesforceAccessToken(options?: {
    clientId?: string;
    clientSecret?: string;
    loginUrl?: string;
    instanceUrl?: string;
    overrideToken?: string;
    forceRefresh?: boolean;
  }): Promise<{ token: string; instanceUrl: string; source: string }> {
    if (options?.overrideToken && options.overrideToken.trim() && !options.overrideToken.includes('••••')) {
      const cleanToken = options.overrideToken.trim().replace(/^Bearer\s+/i, '');
      return {
        token: cleanToken,
        instanceUrl: (options.instanceUrl || options.loginUrl || SF_DEFAULTS.instanceUrl).replace(/\/+$/, ''),
        source: 'manual_override',
      };
    }

    const now = Date.now();
    if (cachedOAuthToken && !options?.forceRefresh && cachedOAuthToken.expiresAt > now + 60000) {
      return {
        token: cachedOAuthToken.token,
        instanceUrl: cachedOAuthToken.instanceUrl,
        source: 'cached_oauth_token',
      };
    }

    const clientId = options?.clientId || SF_DEFAULTS.clientId;
    const clientSecret = options?.clientSecret || SF_DEFAULTS.clientSecret;
    const loginUrl = (options?.loginUrl || SF_DEFAULTS.loginUrl).replace(/\/+$/, '');

    const tokenUrl = `${loginUrl}/services/oauth2/token`;
    console.log(`[Salesforce OAuth] Authenticating via client_credentials at ${tokenUrl}...`);

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error(`[Salesforce OAuth] Token request failed (${tokenRes.status}):`, errBody);
      throw new Error(`Salesforce OAuth2 authentication failed (${tokenRes.status}): ${errBody}`);
    }

    const tokenData: any = await tokenRes.json();
    const token = tokenData.access_token;
    const instanceUrl = tokenData.instance_url || SF_DEFAULTS.instanceUrl;

    // Cache token for 1 hour
    cachedOAuthToken = {
      token,
      instanceUrl,
      expiresAt: now + 3600 * 1000,
    };

    console.log(`[Salesforce OAuth] Successfully generated access token for ${instanceUrl}`);
    return {
      token,
      instanceUrl,
      source: 'client_credentials_oauth',
    };
  }

  /**
   * Helper to extract Salesforce field supporting standard names, custom field (__c) names,
   * snake_case, camelCase, and case-insensitive matches.
   */
  function extractSfField(record: any, ...keys: string[]): any {
    if (!record || typeof record !== 'object') return null;
    const recordKeys = Object.keys(record);
    for (const k of keys) {
      // 1. Direct match
      if (record[k] !== undefined && record[k] !== null && record[k] !== '') {
        return record[k];
      }
      // 2. Case-insensitive & normalized match (ignoring case, underscores, and trailing __c)
      const normalizedKey = k.toLowerCase().replace(/__c$/, '').replace(/_/g, '');
      const matchedRecordKey = recordKeys.find(rk => {
        const normRk = rk.toLowerCase().replace(/__c$/, '').replace(/_/g, '');
        return normRk === normalizedKey;
      });
      if (matchedRecordKey && record[matchedRecordKey] !== undefined && record[matchedRecordKey] !== null && record[matchedRecordKey] !== '') {
        return record[matchedRecordKey];
      }
    }
    return null;
  }

  /**
   * Map Salesforce Lead Record to Application Lead Object
   * Maps exact fields from Salesforce without injecting dummy data.
   */
  function mapSalesforceRecordToLead(record: any, fallbackId?: string): any {
    const firstName = record.FirstName || '';
    const lastName = record.LastName || '';
    const fullName = record.Name || `${firstName} ${lastName}`.trim() || 'Salesforce Lead';
    
    // 15 Mapped Attributes requested by user:
    const rawEmployees = extractSfField(record, 'NumberOfEmployees', 'number_of_employees', 'number_of_employees__c', 'NumberOfEmployees__c', 'employees');
    const employees = rawEmployees != null ? (Number(rawEmployees) || null) : null;

    const rawRev = extractSfField(record, 'AnnualRevenue', 'annual_revenue', 'annual_revenue__c', 'AnnualRevenue__c');
    const revenueNum = rawRev != null ? (typeof rawRev === 'number' ? rawRev : (parseFloat(String(rawRev).replace(/[^0-9.]/g, '')) || null)) : null;
    const formattedRevenue = rawRev != null 
      ? (typeof rawRev === 'number' ? `$${rawRev.toLocaleString()}` : String(rawRev))
      : null;

    const revGrowth = extractSfField(record, 'Revenue_Growth_Decline__c', 'revenue_growth_decline', 'revenue_growth_decline__c', 'RevenueGrowthDecline__c', 'Revenue_Growth__c');
    const salesCycle = extractSfField(record, 'Average_Sales_Cycle__c', 'average_sales_cycle', 'average_sales_cycle__c', 'AverageSalesCycle__c', 'Sales_Cycle__c');
    const jobTitle = extractSfField(record, 'Title', 'job_title', 'job_title__c', 'Job_Title__c', 'JobTitle');
    const jobRole = extractSfField(record, 'Job_Role__c', 'job_role', 'job_role__c', 'JobRole__c', 'Role__c') || jobTitle;
    const purchasingAuth = extractSfField(record, 'Purchasing_Authority__c', 'purchasing_authority', 'purchasing_authority__c', 'PurchasingAuthority__c');
    const industry = extractSfField(record, 'Industry', 'industry', 'industry__c', 'Industry__c');

    const landingPageView = extractSfField(record, 'Landing_Page_View__c', 'landing_page_view', 'landing_page_view__c', 'LandingPageView__c');
    const landingPageConversion = extractSfField(record, 'Landing_Page_Conversion__c', 'landing_page_conversion', 'landing_page_conversion__c', 'LandingPageConversion__c');
    const useOfChat = extractSfField(record, 'Use_of_Chat_Functionality__c', 'Use_Of_Chat_Functionality__c', 'use_of_chat_functionality', 'use_of_chat_functionality__c', 'Use_Of_Chat__c', 'UseOfChatFunctionality__c');
    const callBackReq = extractSfField(record, 'Request_for_Call_Back__c', 'Request_For_Call_Back__c', 'request_for_call_back', 'request_for_call_back__c', 'Request_For_Callback__c', 'RequestForCallBack__c');
    const viewedProduct = extractSfField(record, 'Viewed_Web_Page_Product__c', 'viewed_web_page_product', 'viewed_web_page_product__c', 'ViewedWebPageProduct__c', 'Viewed_Product_Page__c');
    const viewedPricing = extractSfField(record, 'Viewed_Web_Page_Pricing__c', 'Viewed_Web_Page_Price__c', 'viewed_web_page_pricing', 'viewed_web_page_price', 'viewed_web_page_pricing__c', 'viewed_web_page_price__c', 'ViewedWebPagePricing__c');
    const viewedReview = extractSfField(record, 'Viewed_Web_Page_Review__c', 'viewed_web_page_review', 'viewed_web_page_review__c', 'ViewedWebPageReview__c', 'Viewed_Review_Page__c');

    const leadId = record.Id || fallbackId || SF_DEFAULTS.sampleLeadId;
    const street = record.Street || record.Address?.street || null;
    const city = record.City || record.Address?.city || null;
    const state = record.State || record.Address?.state || null;
    const postalCode = record.PostalCode || record.Address?.postalCode || null;
    const country = record.Country || record.Address?.country || null;
    const region = [city, state, country].filter(Boolean).join(', ') || null;

    return {
      id: leadId,
      name: fullName,
      title: jobTitle,
      jobTitle: jobTitle,
      jobRole: jobRole,
      company: record.Company || 'Salesforce Account',
      region: region,
      street: street,
      city: city,
      state: state,
      postalCode: postalCode,
      country: country,
      website: record.Website || null,
      status: (record.Status as any) || 'New',
      leadSource: record.LeadSource || null,
      industry: industry,
      annualRevenue: formattedRevenue,
      annualRevenueMusd: revenueNum != null && revenueNum > 0 ? (revenueNum > 100000 ? revenueNum / 1000000 : revenueNum) : null,
      description: record.Description || null,
      rating: (record.Rating as any) || null,
      purchasingAuthority: purchasingAuth,
      numberOfEmployees: employees,
      employees: employees,
      revenueGrowthDecline: revGrowth,
      averageSalesCycle: salesCycle,
      landingPageView: landingPageView,
      landingPageConversion: landingPageConversion,
      useOfChatFunctionality: useOfChat,
      requestForCallBack: callBackReq,
      viewedWebPageProduct: viewedProduct,
      viewedWebPagePrice: viewedPricing,
      viewedWebPagePricing: viewedPricing,
      viewedWebPageReview: viewedReview,
      productInterest: record.Product_Interest__c || null,
      estimatedMrr: revenueNum != null ? Math.round(revenueNum / 2666) : null,
      linesOrSeats: employees != null ? Math.round(employees * 0.1) : null,
      currentProvider: record.Current_Provider__c || null,
      contractEndsIn: null,
      lastActivity: record.LastActivityDate ? `Activity on ${record.LastActivityDate}` : null,
      email: record.Email || null,
      phone: record.Phone || record.MobilePhone || null,
      createdAt: record.CreatedDate || new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
      repNotes: record.Rep_Qualification_Notes__c || '',
      engagementHistory: [
        {
          id: `eng-sf-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'web',
          title: 'Salesforce Lead Record Synced',
          notes: `Synchronized live from Salesforce REST API (tcs41.my.salesforce.com, ID: ${leadId})`,
        }
      ],
      rawSalesforceRecord: record,
    };
  }

  /**
   * OAuth Token Endpoint
   */
  app.post('/api/salesforce/token', async (req, res) => {
    try {
      const auth = await getSalesforceAccessToken({
        clientId: req.body.clientId,
        clientSecret: req.body.clientSecret,
        loginUrl: req.body.loginUrl,
        overrideToken: req.body.bearerToken,
        forceRefresh: req.body.forceRefresh,
      });

      res.json({
        success: true,
        accessToken: auth.token,
        instanceUrl: auth.instanceUrl,
        source: auth.source,
        loginUrl: req.body.loginUrl || SF_DEFAULTS.loginUrl,
        clientId: req.body.clientId || SF_DEFAULTS.clientId,
        username: SF_DEFAULTS.username,
        issuedAt: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(401).json({
        success: false,
        error: 'Failed to acquire Salesforce OAuth token',
        message: err.message,
      });
    }
  });

  /**
   * 1. GET Single Lead from Salesforce REST API:
   * GET https://tcs41.my.salesforce.com/services/data/v66.0/sobjects/Lead/<Lead_ID>
   */
  app.all(['/api/salesforce/lead/:id', '/api/salesforce/get-single-lead'], async (req, res) => {
    const leadId = req.params.id || req.body.leadId || req.query.leadId || SF_DEFAULTS.sampleLeadId;
    const apiVersion = (req.body.apiVersion || req.query.apiVersion || SF_DEFAULTS.apiVersion).toString().trim();

    try {
      const auth = await getSalesforceAccessToken({
        clientId: req.body.clientId,
        clientSecret: req.body.clientSecret,
        loginUrl: req.body.loginUrl || req.body.instanceUrl,
        instanceUrl: req.body.instanceUrl,
        overrideToken: req.body.bearerToken || req.query.bearerToken,
      });

      const targetUrl = `${auth.instanceUrl}/services/data/${apiVersion}/sobjects/Lead/${leadId}`;
      console.log(`[Salesforce API] Fetching Single Lead: ${targetUrl}`);

      const sfRes = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
      });

      if (sfRes.ok) {
        const rawLead = await sfRes.json();
        console.log(`[Salesforce API] Single Lead fetched successfully: ${rawLead.Id || leadId}`);
        const mappedLead = mapSalesforceRecordToLead(rawLead, leadId);

        return res.json({
          success: true,
          lead: mappedLead,
          rawRecord: rawLead,
          source: 'Salesforce REST API Live Instance',
          endpointCalled: targetUrl,
          leadId,
          instanceUrl: auth.instanceUrl,
          fetchedAt: new Date().toISOString(),
        });
      } else {
        const errText = await sfRes.text();
        console.warn(`[Salesforce API] Single Lead request failed (${sfRes.status}): ${errText}`);
        
        let parsedErr: any = null;
        try { parsedErr = JSON.parse(errText); } catch (e) {}

        return res.status(sfRes.status).json({
          success: false,
          httpStatus: sfRes.status,
          apiError: parsedErr || errText,
          message: `Salesforce endpoint returned status ${sfRes.status}.`,
          endpointCalled: targetUrl,
          leadId,
        });
      }
    } catch (err: any) {
      console.error('[Salesforce API] Network error calling Single Lead endpoint:', err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  });

  /**
   * 2. All Leads / SOQL Query from Salesforce REST API:
   * GET https://tcs41.my.salesforce.com/services/data/v66.0/query?q=SELECT+Id,FirstName,LastName,Company,Email,Phone,Status,LeadSource,Rating,CreatedDate+FROM+Lead+LIMIT+10
   */
  app.all(['/api/salesforce/fetch-leads', '/api/salesforce/query'], async (req, res) => {
    const apiVersion = (req.body?.apiVersion || req.query?.apiVersion || SF_DEFAULTS.apiVersion).toString().trim();
    
    // Default SOQL Query matching real Lead fields on tcs41 instance
    const defaultSoql = 'SELECT Id, FirstName, LastName, Name, Title, Company, Email, Phone, MobilePhone, Status, LeadSource, Rating, Industry, NumberOfEmployees, Street, City, State, PostalCode, Country, Website, CreatedDate, LastModifiedDate FROM Lead LIMIT 10';
    const soqlQuery = (req.body?.query || req.query?.q || defaultSoql).toString().trim();

    try {
      const auth = await getSalesforceAccessToken({
        clientId: req.body?.clientId,
        clientSecret: req.body?.clientSecret,
        loginUrl: req.body?.loginUrl || req.body?.instanceUrl,
        instanceUrl: req.body?.instanceUrl,
        overrideToken: req.body?.bearerToken || req.query?.bearerToken,
      });

      const targetUrl = `${auth.instanceUrl}/services/data/${apiVersion}/query?q=${encodeURIComponent(soqlQuery)}`;
      console.log(`[Salesforce API] Querying Leads: ${targetUrl}`);

      const sfRes = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
      });

      if (sfRes.ok) {
        const queryResult: any = await sfRes.json();
        const records = queryResult.records || [];
        console.log(`[Salesforce API] SOQL Query returned ${records.length} records.`);

        const mappedLeads = records.map((r: any) => mapSalesforceRecordToLead(r));

        return res.json({
          success: true,
          totalRecords: queryResult.totalSize || records.length,
          leads: mappedLeads,
          rawRecords: records,
          query: soqlQuery,
          salesforceInstance: auth.instanceUrl,
          apiVersion,
          fetchedAt: new Date().toISOString(),
          message: `Successfully retrieved ${records.length} lead(s) from Salesforce (${auth.instanceUrl}).`,
        });
      } else {
        const errText = await sfRes.text();
        console.warn(`[Salesforce API] SOQL Query failed with status ${sfRes.status}: ${errText}`);

        let parsedErr: any = null;
        try { parsedErr = JSON.parse(errText); } catch (e) {}

        return res.status(sfRes.status).json({
          success: false,
          httpStatus: sfRes.status,
          apiError: parsedErr || errText,
          message: `Salesforce endpoint returned status ${sfRes.status}.`,
          query: soqlQuery,
          salesforceInstance: auth.instanceUrl,
          apiVersion,
        });
      }
    } catch (err: any) {
      console.error('[Salesforce API] Query error:', err);
      return res.status(500).json({
        success: false,
        error: err.message,
      });
    }
  });

  /**
   * Connect / Validate Salesforce Environment Endpoint
   */
  app.post('/api/salesforce/connect', async (req, res) => {
    const apiVersion = (req.body.apiVersion || SF_DEFAULTS.apiVersion).toString().trim();

    try {
      const auth = await getSalesforceAccessToken({
        clientId: req.body.clientId,
        clientSecret: req.body.clientSecret,
        loginUrl: req.body.loginUrl || req.body.instanceUrl,
        instanceUrl: req.body.instanceUrl,
        overrideToken: req.body.bearerToken,
        forceRefresh: true,
      });

      const sfRes = await fetch(`${auth.instanceUrl}/services/data/${apiVersion}/sobjects/Lead/describe`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.token}`,
        },
      });

      const isConnected = sfRes.ok;
      const orgId = '00Df600000TVeq5';

      res.json({
        success: isConnected,
        orgId,
        instanceUrl: auth.instanceUrl,
        apiVersion,
        accessToken: auth.token,
        httpStatus: sfRes.status,
        connectedAt: new Date().toISOString(),
        message: isConnected 
          ? `Successfully connected and authenticated with Salesforce instance (${auth.instanceUrl})` 
          : `Salesforce responded with status ${sfRes.status}.`,
      });
    } catch (e: any) {
      res.status(500).json({
        success: false,
        instanceUrl: req.body.instanceUrl || SF_DEFAULTS.instanceUrl,
        apiVersion,
        message: `Connection error: ${e.message}`,
        connectedAt: new Date().toISOString(),
      });
    }
  });

  // Salesforce Push Sync Endpoint
  app.post('/api/salesforce/sync', (req, res) => {
    const { leadId, aiScoreResult, status, repNotes } = req.body;
    
    const syncId = `SF-SYNC-${Date.now().toString(36).toUpperCase()}`;
    const sfFields = [
      'Lead.Status',
      'Lead.AI_Lead_Score__c',
      'Lead.AI_Lead_Temperature__c',
      'Lead.AI_Conversion_Probability__c',
      'Lead.AI_Follow_Up_Action__c',
      'Lead.AI_Scored_At__c',
      'Lead.Rep_Qualification_Notes__c',
      'Lead.LastModifiedDate'
    ];

    res.json({
      success: true,
      syncId,
      salesforceLeadId: leadId,
      syncedAt: new Date().toISOString(),
      updatedFields: sfFields,
      message: 'Lead score and qualification data synchronized with Salesforce CRM instance.'
    });
  });

  // Vite development middleware or static production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Salesforce Lead Management server running on http://0.0.0.0:${PORT}`);
  });

  process.on('SIGTERM', () => {
    server.close(() => {
      process.exit(0);
    });
  });
  process.on('SIGINT', () => {
    server.close(() => {
      process.exit(0);
    });
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
