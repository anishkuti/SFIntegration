import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  RefreshCw, 
  Database, 
  Server, 
  ArrowRight, 
  Key, 
  User, 
  Globe, 
  Download, 
  Upload, 
  AlertCircle,
  Check,
  Code,
  FileText,
  Search,
  ExternalLink,
  Copy
} from 'lucide-react';
import { SalesforceSyncLog, SalesforceEnvConfig, SalesforceLead } from '../types';

interface SalesforceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  syncLogs: SalesforceSyncLog[];
  onTriggerFullSync: () => void;
  isSyncing: boolean;
  envConfig: SalesforceEnvConfig;
  onSaveEnvConfig: (config: SalesforceEnvConfig) => void;
  onFetchLeadsFromSalesforce: (leads: SalesforceLead[]) => void;
}

export const SalesforceSyncModal: React.FC<SalesforceSyncModalProps> = ({
  isOpen,
  onClose,
  syncLogs,
  onTriggerFullSync,
  isSyncing,
  envConfig,
  onSaveEnvConfig,
  onFetchLeadsFromSalesforce,
}) => {
  const [activeTab, setActiveTab] = useState<'single-lead' | 'all-leads' | 'environment' | 'field-mappings' | 'audit-log'>('single-lead');
  
  // Local environment form state
  const [environment, setEnvironment] = useState<'production' | 'sandbox' | 'custom'>(envConfig.environment || 'production');
  const [instanceUrl, setInstanceUrl] = useState(envConfig.instanceUrl || 'https://tcs41.my.salesforce.com');
  const [apiVersion, setApiVersion] = useState(envConfig.apiVersion || 'v66.0');
  const [bearerToken, setBearerToken] = useState(
    envConfig.bearerToken || ''
  );
  const [singleLeadId, setSingleLeadId] = useState(envConfig.sampleLeadId || '00Qf600000EwQoTEAV');
  
  // SOQL Query state
  const [soqlQuery, setSoqlQuery] = useState(
    'SELECT Id, FirstName, LastName, Name, Title, Company, Email, Phone, Status, LeadSource, Rating, CreatedDate FROM Lead LIMIT 10'
  );

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [isFetchingSingle, setIsFetchingSingle] = useState(false);
  const [isFetchingAll, setIsFetchingAll] = useState(false);
  
  const [singleLeadResult, setSingleLeadResult] = useState<any | null>(null);
  const [queryResultLeads, setQueryResultLeads] = useState<SalesforceLead[] | null>(null);
  
  const [connectionSuccess, setConnectionSuccess] = useState<string | null>(null);
  const [fetchSuccessMsg, setFetchSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedHeader, setCopiedHeader] = useState(false);

  if (!isOpen) return null;

  const SF_FIELDS_MAPPING = [
    { sfField: 'Lead.Id', appField: 'id', type: 'ID', isStandard: true },
    { sfField: 'Lead.FirstName / LastName', appField: 'name', type: 'Text', isStandard: true },
    { sfField: 'Lead.Company', appField: 'company', type: 'Text', isStandard: true },
    { sfField: 'Lead.Status', appField: 'status', type: 'Picklist (New, Working, Qualified)', isStandard: true },
    { sfField: 'Lead.LeadSource', appField: 'leadSource', type: 'Picklist', isStandard: true },
    { sfField: 'Lead.Landing_Page_View__c', appField: 'landingPageView', type: 'Picklist (Y / N)', isStandard: false },
    { sfField: 'Lead.Landing_Page_Conversion__c', appField: 'landingPageConversion', type: 'Picklist (Y / N)', isStandard: false },
    { sfField: 'Lead.Use_of_Chat_Functionality__c', appField: 'useOfChatFunctionality', type: 'Picklist (Y / N)', isStandard: false },
    { sfField: 'Lead.Request_for_Call_Back__c', appField: 'requestForCallBack', type: 'Picklist (Y / N)', isStandard: false },
    { sfField: 'Lead.Viewed_Web_Page_Product__c', appField: 'viewedWebPageProduct', type: 'Picklist (Y / N)', isStandard: false },
    { sfField: 'Lead.Viewed_Web_Page_Pricing__c', appField: 'viewedWebPagePricing / Price', type: 'Picklist (Y / N)', isStandard: false },
    { sfField: 'Lead.Viewed_Web_Page_Review__c', appField: 'viewedWebPageReview', type: 'Picklist (Y / N)', isStandard: false },
    { sfField: 'Lead.NumberOfEmployees', appField: 'numberOfEmployees', type: 'Number', isStandard: true },
    { sfField: 'Lead.AnnualRevenue', appField: 'annualRevenue', type: 'Currency', isStandard: true },
    { sfField: 'Lead.Industry', appField: 'industry', type: 'Picklist', isStandard: true },
    { sfField: 'Lead.Job_Role__c / Title', appField: 'jobRole / title', type: 'Text', isStandard: true },
    { sfField: 'Lead.Purchasing_Authority__c', appField: 'purchasingAuthority', type: 'Picklist', isStandard: false },
    { sfField: 'Lead.Average_Sales_Cycle__c', appField: 'averageSalesCycle', type: 'Number / Days', isStandard: false },
    { sfField: 'Lead.Revenue_Growth_Decline__c', appField: 'revenueGrowthDecline', type: 'Percent', isStandard: false },
  ];

  const handleCopyAuth = () => {
    navigator.clipboard.writeText(`Content-Type: application/json\nAuthorization: Bearer ${bearerToken}`);
    setCopiedHeader(true);
    setTimeout(() => setCopiedHeader(false), 2000);
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setErrorMessage(null);
    setConnectionSuccess(null);

    try {
      const res = await fetch('/api/salesforce/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environment,
          instanceUrl,
          apiVersion,
          bearerToken,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const updatedConfig: SalesforceEnvConfig = {
          ...envConfig,
          environment,
          instanceUrl,
          apiVersion,
          bearerToken,
          orgId: data.orgId,
          isConnected: true,
          lastConnectedAt: new Date().toISOString(),
        };
        onSaveEnvConfig(updatedConfig);
        setConnectionSuccess(`Connected successfully to Salesforce Sandbox (${instanceUrl})`);
      } else {
        setConnectionSuccess(`Connected to proxy. Salesforce response: ${data.message}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to establish Salesforce connection.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  // 1. Single Lead Fetch: GET /services/data/v66.0/sobjects/Lead/<<id>>
  const handleFetchSingleLead = async () => {
    if (!singleLeadId.trim()) return;
    setIsFetchingSingle(true);
    setErrorMessage(null);
    setFetchSuccessMsg(null);
    setSingleLeadResult(null);

    try {
      const res = await fetch('/api/salesforce/get-single-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: singleLeadId.trim(),
          instanceUrl,
          apiVersion,
          bearerToken,
        }),
      });

      const data = await res.json();
      if (data.lead) {
        setSingleLeadResult(data);
        setFetchSuccessMsg(`Retrieved single lead '${data.lead.name}' (${data.lead.id}) from Salesforce sandbox.`);
      } else {
        throw new Error(data.message || 'Failed to retrieve single lead object.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error executing Single Lead GET request.');
    } finally {
      setIsFetchingSingle(false);
    }
  };

  const handleImportSingleLead = () => {
    if (singleLeadResult?.lead) {
      onFetchLeadsFromSalesforce([singleLeadResult.lead]);
      setFetchSuccessMsg(`Imported lead '${singleLeadResult.lead.name}' into active lead pipeline.`);
    }
  };

  // 2. All Leads Fetch: GET /services/data/v66.0/query?q=...
  const handleFetchAllLeads = async () => {
    setIsFetchingAll(true);
    setErrorMessage(null);
    setFetchSuccessMsg(null);

    try {
      const res = await fetch('/api/salesforce/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: soqlQuery,
          instanceUrl,
          apiVersion,
          bearerToken,
        }),
      });

      const data = await res.json();
      if (data.leads && Array.isArray(data.leads)) {
        setQueryResultLeads(data.leads);
        onFetchLeadsFromSalesforce(data.leads);
        setFetchSuccessMsg(`Successfully queried ${data.totalRecords || data.leads.length} leads via Salesforce SOQL.`);
        
        onSaveEnvConfig({
          ...envConfig,
          instanceUrl,
          apiVersion,
          bearerToken,
          lastFetchAt: new Date().toISOString(),
          fetchedLeadsCount: data.leads.length,
          lastSoqlQuery: soqlQuery,
          isConnected: true,
        });
      } else {
        throw new Error(data.message || 'Failed to query leads from Salesforce.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error executing Salesforce SOQL query.');
    } finally {
      setIsFetchingAll(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0176D3] flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">Salesforce REST API Integration</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-[#0176D3]">
                  {apiVersion}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Live Sandbox
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                {instanceUrl}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-2 border-b border-slate-200 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('single-lead')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'single-lead'
                ? 'border-[#0176D3] text-[#0176D3]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            1. Single Lead GET
          </button>
          <button
            onClick={() => setActiveTab('all-leads')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'all-leads'
                ? 'border-[#0176D3] text-[#0176D3]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            2. All Leads SOQL Query
          </button>
          <button
            onClick={() => setActiveTab('environment')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'environment'
                ? 'border-[#0176D3] text-[#0176D3]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Instance & Headers
          </button>
          <button
            onClick={() => setActiveTab('field-mappings')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'field-mappings'
                ? 'border-[#0176D3] text-[#0176D3]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Field Mappings
          </button>
          <button
            onClick={() => setActiveTab('audit-log')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'audit-log'
                ? 'border-[#0176D3] text-[#0176D3]'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Sync Logs ({syncLogs.length})
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* Notifications */}
          {connectionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-medium text-emerald-800 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{connectionSuccess}</span>
            </div>
          )}

          {fetchSuccessMsg && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-2 text-xs font-medium text-blue-800 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-[#0176D3] shrink-0" />
              <span>{fetchSuccessMsg}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: SINGLE LEAD GET */}
          {activeTab === 'single-lead' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0176D3] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[10px] font-mono">GET</span>
                    Single Lead SObject API
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">API Version {apiVersion}</span>
                </div>

                <div className="p-2.5 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono break-all space-y-1">
                  <div className="text-slate-400 text-[10px]"># Endpoint URL:</div>
                  <div className="text-emerald-400">
                    GET {instanceUrl}/services/data/{apiVersion}/sobjects/Lead/<span className="text-amber-300 font-bold">{singleLeadId || '&lt;&lt;00QDv00000PtNLHMAN&gt;&gt;'}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5 items-end">
                  <div className="flex-1 w-full space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Salesforce Lead ID</label>
                    <input
                      type="text"
                      value={singleLeadId}
                      onChange={(e) => setSingleLeadId(e.target.value)}
                      placeholder="00QDv00000PtNLHMAN"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono text-xs font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchSingleLead}
                    disabled={isFetchingSingle}
                    className="w-full sm:w-auto px-4 py-2 bg-[#0176D3] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetchingSingle ? 'animate-spin' : ''}`} />
                    {isFetchingSingle ? 'Fetching Single Lead...' : 'Fetch Lead from Salesforce'}
                  </button>
                </div>
              </div>

              {/* Result Preview */}
              {singleLeadResult && (
                <div className="border border-slate-200 rounded-xl overflow-hidden animate-fade-in bg-white">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-slate-800">
                        Fetched Lead: {singleLeadResult.lead.name} ({singleLeadResult.lead.company})
                      </span>
                    </div>
                    <button
                      onClick={handleImportSingleLead}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Load into Pipeline Dashboard
                    </button>
                  </div>

                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div><span className="text-slate-500">ID:</span> <span className="font-mono font-bold text-slate-900">{singleLeadResult.lead.id}</span></div>
                    <div><span className="text-slate-500">Status:</span> <span className="font-bold text-blue-600">{singleLeadResult.lead.status}</span></div>
                    <div><span className="text-slate-500">Industry:</span> <span className="font-bold text-slate-900">{singleLeadResult.lead.industry}</span></div>
                    <div><span className="text-slate-500">Annual Revenue:</span> <span className="font-bold text-emerald-600">{singleLeadResult.lead.annualRevenue}</span></div>
                    <div><span className="text-slate-500">Employees:</span> <span className="font-bold text-slate-900">{singleLeadResult.lead.numberOfEmployees}</span></div>
                    <div><span className="text-slate-500">Lead Source:</span> <span className="font-bold text-slate-900">{singleLeadResult.lead.leadSource}</span></div>
                  </div>

                  <details className="border-t border-slate-200 p-3 bg-slate-950 text-slate-300 font-mono text-[11px]">
                    <summary className="cursor-pointer font-bold text-emerald-400">View Raw SObject Payload</summary>
                    <pre className="mt-2 overflow-x-auto p-2 bg-black/50 rounded max-h-48 text-[10px]">
                      {JSON.stringify(singleLeadResult.rawRecord || singleLeadResult.lead, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ALL LEADS SOQL QUERY */}
          {activeTab === 'all-leads' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0176D3] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-[10px] font-mono">GET</span>
                    Salesforce SOQL Query API
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">/services/data/{apiVersion}/query</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">SOQL Query String</label>
                  <textarea
                    rows={3}
                    value={soqlQuery}
                    onChange={(e) => setSoqlQuery(e.target.value)}
                    className="w-full p-2.5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg border border-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-slate-500">
                    Includes: <code className="font-bold text-slate-700">Id, Name, Status, LeadSource, Landing_Page_View__c, Landing_Page_Conversion__c</code>
                  </div>
                  <button
                    type="button"
                    onClick={handleFetchAllLeads}
                    disabled={isFetchingAll}
                    className="px-4 py-2 bg-[#0176D3] hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Download className={`w-3.5 h-3.5 ${isFetchingAll ? 'animate-bounce' : ''}`} />
                    {isFetchingAll ? 'Executing SOQL Query...' : 'Execute SOQL & Fetch All Leads'}
                  </button>
                </div>
              </div>

              {queryResultLeads && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                  <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-800 flex justify-between items-center">
                    <span>Query Results ({queryResultLeads.length} records imported)</span>
                    <span className="text-[11px] text-emerald-600 font-semibold">Active in Dashboard</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
                    {queryResultLeads.map((lead) => (
                      <div key={lead.id} className="p-2.5 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <span className="font-bold text-slate-900">{lead.name}</span>
                          <span className="text-slate-500 text-[11px] ml-2">({lead.company})</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] text-slate-400">{lead.id}</span>
                          <span className="font-bold text-blue-600">{lead.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INSTANCE & HEADERS */}
          {activeTab === 'environment' && (
            <div className="space-y-4 text-xs">
              
              {/* Header Specification Box */}
              <div className="p-4 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 space-y-2.5 font-mono text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">Required HTTP Headers</span>
                  <button
                    onClick={handleCopyAuth}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedHeader ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedHeader ? 'Copied!' : 'Copy Headers'}
                  </button>
                </div>
                <div>
                  <span className="text-slate-400">Content-Type:</span> <span className="text-white">application/json</span>
                </div>
                <div className="break-all">
                  <span className="text-slate-400">Authorization:</span> <span className="text-amber-300 font-bold">Bearer {bearerToken}</span>
                </div>
              </div>

              {/* Form settings */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Salesforce Instance Base URL</label>
                  <input
                    type="text"
                    value={instanceUrl}
                    onChange={(e) => setInstanceUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 block">API Version</label>
                    <input
                      type="text"
                      value={apiVersion}
                      onChange={(e) => setApiVersion(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-800 block">Environment Type</label>
                    <select
                      value={environment}
                      onChange={(e) => setEnvironment(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="sandbox">Sandbox (My Domain)</option>
                      <option value="production">Production</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 block">Bearer Authorization Token</label>
                  <textarea
                    rows={3}
                    value={bearerToken}
                    onChange={(e) => setBearerToken(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-[11px] focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 break-all"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0176D3] hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingConnection ? 'animate-spin' : ''}`} />
                  {isTestingConnection ? 'Testing Connection...' : 'Save & Test Salesforce Connection'}
                </button>
              </div>

            </div>
          )}

          {/* TAB 4: FIELD MAPPINGS */}
          {activeTab === 'field-mappings' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  SALESFORCE OBJECT FIELD MAPPINGS
                </div>
                <div className="text-xs text-slate-500">
                  Standard & Custom Object Fields
                </div>
              </div>
              
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <tr>
                      <th className="p-2.5">Salesforce API Name</th>
                      <th className="p-2.5">Application Field</th>
                      <th className="p-2.5">Field Type</th>
                      <th className="p-2.5">Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {SF_FIELDS_MAPPING.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2.5 font-mono font-semibold text-[#0176D3]">{m.sfField}</td>
                        <td className="p-2.5 text-slate-800 font-medium">{m.appField}</td>
                        <td className="p-2.5 text-slate-500 text-[11px]">{m.type}</td>
                        <td className="p-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            m.isStandard ? 'bg-slate-100 text-slate-700' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {m.isStandard ? 'Standard' : 'Custom Field'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: AUDIT LOG */}
          {activeTab === 'audit-log' && (
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                RECENT SALESFORCE SYNC AUDIT LOG
              </div>

              <div className="space-y-2 font-mono text-[11px]">
                {syncLogs.length === 0 ? (
                  <div className="text-xs text-slate-400 py-6 text-center">No recent sync actions recorded yet.</div>
                ) : (
                  syncLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[#0176D3] font-bold">[{log.action}]</span> {log.leadName} ({log.leadId})
                        <div className="text-[11px] text-slate-600 mt-0.5">{log.details}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-emerald-600 font-semibold flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {log.status}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5 block">{new Date(log.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="text-xs text-slate-500 font-mono">
            {instanceUrl} ({apiVersion})
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
