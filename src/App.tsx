import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Server, 
  ShieldCheck, 
  RefreshCw, 
  Plus, 
  Search, 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  Settings, 
  Sparkles,
  Sliders
} from 'lucide-react';
import { SalesforceLead, AwsApiConfig, SalesforceSyncLog, SalesforceEnvConfig } from './types';
import { INITIAL_LEADS } from './data/initialLeads';
import { LeadDashboard } from './components/LeadDashboard';
import { LeadDetail } from './components/LeadDetail';
import { AwsApiSettingsModal } from './components/AwsApiSettingsModal';
import { SalesforceSyncModal } from './components/SalesforceSyncModal';
import { EmailDraftModal } from './components/EmailDraftModal';
import { NewLeadModal } from './components/NewLeadModal';

export default function App() {
  // Load saved leads from localStorage or default to single real lead INITIAL_LEADS
  const [leads, setLeads] = useState<SalesforceLead[]>(() => {
    const saved = localStorage.getItem('salesforce_leads_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If previous cache contained stubbed dummy leads like Marcus Feld, replace with INITIAL_LEADS
          const hasOldDummies = parsed.some((l: any) => l.name === 'Marcus Feld' || l.id === '00QDv00000PtNLHMAN');
          if (!hasOldDummies) {
            return parsed;
          }
        }
      } catch (e) {
        console.error('Failed to parse saved leads:', e);
      }
    }
    return INITIAL_LEADS;
  });

  const [isLoadingLeads, setIsLoadingLeads] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>('00Qf600000EwQoTEAV');
  const [activeNavTab, setActiveNavTab] = useState<'dashboard' | 'leads' | 'analytics' | 'settings'>('leads');
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // Modals state
  const [isAwsModalOpen, setIsAwsModalOpen] = useState(false);
  const [isSfSyncModalOpen, setIsSfSyncModalOpen] = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);

  // Salesforce Environment Config state
  const [sfEnvConfig, setSfEnvConfig] = useState<SalesforceEnvConfig>(() => {
    const saved = localStorage.getItem('salesforce_env_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.instanceUrl && parsed.instanceUrl.includes('tcs41')) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse salesforce env config:', e);
      }
    }
    return {
      environment: 'production',
      instanceUrl: 'https://tcs41.my.salesforce.com',
      apiVersion: 'v66.0',
      bearerToken: '',
      sampleLeadId: '00Qf600000EwQoTEAV',
      orgId: '00Df600000TVeq5',
      clientId: '3MVG9.Houp75EVdbyuMYivXJTWBouR_QTudAJLWpmmh10IOQsfkOj84kGGZv6WhCedr.wBOxnOw0R0KNw8JBO',
      username: 'anish.k_b602068@tcs.com',
      securityToken: '••••••••••••••••••••',
      isConnected: true,
      lastConnectedAt: new Date().toISOString(),
      fetchedLeadsCount: 1,
    };
  });

  // Sync state & logs
  const [isSyncingSf, setIsSyncingSf] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SalesforceSyncLog[]>([
    {
      id: 'log-sf-1',
      timestamp: new Date().toISOString(),
      leadId: '00Qf600000EwQoTEAV',
      leadName: 'Madhushri Manna',
      action: 'LEADS_FETCH',
      status: 'SUCCESS',
      details: 'Connected to tcs41.my.salesforce.com via OAuth2 client_credentials grant type',
      salesforceFieldsUpdated: ['Lead.Id', 'Lead.Name', 'Lead.Company', 'Lead.Status', 'Lead.Email', 'Lead.Phone'],
    },
    {
      id: 'log-sf-2',
      timestamp: new Date().toISOString(),
      leadId: '00Qf600000EwQoTEAV',
      leadName: 'Madhushri Manna',
      action: 'SCORE_PUSH',
      status: 'SUCCESS',
      details: 'Calculated conversion score 63 (WARM) via AWS EC2 Scoring Model (http://3.108.250.41:8001/api/v1/score)',
      salesforceFieldsUpdated: ['Lead.AI_Lead_Score__c', 'Lead.AI_Lead_Temperature__c', 'Lead.AI_Follow_Up_Action__c'],
    },
  ]);

  // AWS Configuration state
  const [awsConfig, setAwsConfig] = useState<AwsApiConfig>(() => {
    const saved = localStorage.getItem('aws_api_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse aws config:', e);
      }
    }
    return {
      endpointUrl: 'http://3.108.250.41:8001/api/v1/score',
      region: 'us-east-1',
      stage: 'production',
      useFallbackAi: true,
    };
  });

  // Fetch leads dynamically from Salesforce API
  const fetchLeadsFromSalesforce = async (showLoadingState = true) => {
    if (showLoadingState) setIsLoadingLeads(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/salesforce/fetch-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          environment: sfEnvConfig.environment,
          instanceUrl: sfEnvConfig.instanceUrl,
          apiVersion: sfEnvConfig.apiVersion,
          bearerToken: sfEnvConfig.bearerToken,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.leads && Array.isArray(data.leads)) {
          setLeads(data.leads);
          setSfEnvConfig((prev) => ({
            ...prev,
            fetchedLeadsCount: data.leads.length,
            lastConnectedAt: new Date().toISOString(),
          }));
          const newLog: SalesforceSyncLog = {
            id: `log-${Date.now()}`,
            timestamp: new Date().toISOString(),
            leadId: 'ALL',
            leadName: `Salesforce SOQL Query`,
            action: 'LEADS_FETCH',
            status: 'SUCCESS',
            details: `Fetched ${data.leads.length} leads directly from Salesforce Lead Object via SOQL query`,
            salesforceFieldsUpdated: ['Lead.Id', 'Lead.Name', 'Lead.LeadSource', 'Lead.Industry', 'Lead.AnnualRevenue', 'Lead.Description'],
          };
          setSyncLogs((prev) => [newLog, ...prev.slice(0, 19)]);
        }
      } else {
        throw new Error(`Failed to fetch leads from Salesforce API (Status: ${res.status})`);
      }
    } catch (err: any) {
      console.error('Error fetching leads from Salesforce:', err);
      setFetchError(err.message || 'Failed to fetch from Salesforce');
    } finally {
      if (showLoadingState) setIsLoadingLeads(false);
    }
  };

  // Initial fetch on mount if no leads or to sync fresh Salesforce records
  useEffect(() => {
    fetchLeadsFromSalesforce(leads.length === 0);
  }, []);

  // Save leads to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('salesforce_leads_data', JSON.stringify(leads));
    } catch (e) {
      console.error('Failed to save leads to localStorage:', e);
    }
  }, [leads]);

  // Save awsConfig to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aws_api_config', JSON.stringify(awsConfig));
    } catch (e) {
      console.error('Failed to save aws config:', e);
    }
  }, [awsConfig]);

  // Save sfEnvConfig to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('salesforce_env_config', JSON.stringify(sfEnvConfig));
    } catch (e) {
      console.error('Failed to save salesforce env config:', e);
    }
  }, [sfEnvConfig]);

  const selectedLead = leads.find((l) => l.id === selectedLeadId);

  const handleUpdateLead = (updatedLead: SalesforceLead) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === updatedLead.id ? updatedLead : l))
    );

    // Log to Salesforce sync audit if AI Score was updated
    if (updatedLead.aiScoreResult) {
      const newLog: SalesforceSyncLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        leadId: updatedLead.id,
        leadName: updatedLead.name,
        action: 'SCORE_PUSH',
        status: 'SUCCESS',
        details: `Updated ML Score: ${updatedLead.aiScoreResult.leadScore}, Temp: ${updatedLead.aiScoreResult.temperatureType}`,
        salesforceFieldsUpdated: [
          'Lead.AI_Lead_Score__c',
          'Lead.AI_Lead_Temperature__c',
          'Lead.AI_Follow_Up_Action__c',
        ],
      };
      setSyncLogs((prev) => [newLog, ...prev.slice(0, 19)]);
    }
  };

  const handleAddLead = (newLead: SalesforceLead) => {
    setLeads((prev) => [newLead, ...prev]);
    setSelectedLeadId(newLead.id);

    const newLog: SalesforceSyncLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      leadId: newLead.id,
      leadName: newLead.name,
      action: 'LEAD_CREATE',
      status: 'SUCCESS',
      details: `Created new Salesforce Lead Record with ID ${newLead.id}`,
      salesforceFieldsUpdated: ['Lead.Id', 'Lead.Name', 'Lead.Company', 'Lead.Status', 'Lead.LeadSource'],
    };
    setSyncLogs((prev) => [newLog, ...prev]);
  };

  const handleFetchLeadsFromSalesforce = (fetchedLeads: SalesforceLead[]) => {
    setLeads(fetchedLeads);
    const newLog: SalesforceSyncLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      leadId: 'ALL',
      leadName: `Salesforce SOQL Query`,
      action: 'LEADS_FETCH',
      status: 'SUCCESS',
      details: `Fetched ${fetchedLeads.length} leads from Salesforce Lead Object via REST API`,
      salesforceFieldsUpdated: ['Lead.Id', 'Lead.Name', 'Lead.LeadSource', 'Lead.Industry', 'Lead.AnnualRevenue', 'Lead.Description'],
    };
    setSyncLogs((prev) => [newLog, ...prev]);
  };

  const handleTriggerFullSync = () => {
    setIsSyncingSf(true);
    setTimeout(() => {
      setIsSyncingSf(false);
      const newLog: SalesforceSyncLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        leadId: 'ALL',
        leadName: `All ${leads.length} Leads`,
        action: 'STATUS_UPDATE',
        status: 'SUCCESS',
        details: `Batch synchronization completed for ${leads.length} leads in Salesforce CRM`,
        salesforceFieldsUpdated: ['Lead.*'],
      };
      setSyncLogs((prev) => [newLog, ...prev]);
    }, 1200);
  };

  return (
    <div className="flex h-screen w-full bg-[#F4F7FB] font-sans text-slate-900 overflow-hidden selection:bg-blue-100 selection:text-blue-900">
      
      {/* Clean Minimalism Navigation Sidebar (#001D3D) */}
      <aside 
        id="app-sidebar-nav" 
        className="w-16 md:w-20 bg-[#001D3D] flex flex-col items-center py-6 gap-6 md:gap-8 shadow-xl shrink-0 z-30 select-none"
      >
        {/* Salesforce Brand Emblem */}
        <div 
          onClick={() => { setSelectedLeadId(null); setActiveNavTab('leads'); }}
          title="Salesforce Lead Intelligence"
          className="w-10 h-10 bg-[#0176D3] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-md hover:bg-blue-500 transition-all cursor-pointer ring-2 ring-white/10"
        >
          S
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-4">
          <button
            id="nav-btn-leads"
            onClick={() => { setSelectedLeadId(null); setActiveNavTab('leads'); }}
            title="Leads Management"
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              activeNavTab === 'leads' && !selectedLeadId
                ? 'bg-white/15 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-5 h-5" />
          </button>

          <button
            id="nav-btn-analytics"
            onClick={() => { setSelectedLeadId(null); setActiveNavTab('analytics'); }}
            title="Pipeline Analytics"
            className={`p-2.5 rounded-xl transition-all cursor-pointer ${
              activeNavTab === 'analytics'
                ? 'bg-white/15 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
          </button>

          <button
            id="nav-btn-aws-config"
            onClick={() => setIsAwsModalOpen(true)}
            title="Scoring API Settings"
            className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer relative"
          >
            <Server className="w-5 h-5 text-amber-400" />
          </button>

          <button
            id="nav-btn-sf-sync"
            onClick={() => setIsSfSyncModalOpen(true)}
            title="Environment & Sync"
            className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
          >
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </button>
        </nav>

        {/* Bottom Settings Button */}
        <div className="mt-auto flex flex-col gap-3">
          <button
            id="nav-btn-settings"
            onClick={() => setIsSfSyncModalOpen(true)}
            title="Settings"
            className="p-2.5 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all cursor-pointer"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Minimalist Top App Header */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between shrink-0 z-20">
          
          {/* Header Title & Status */}
          <div className="flex items-center gap-3.5">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Lead Management
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Salesforce Connected
            </span>
          </div>

          {/* Right Header Actions: Search, Quick Add, Sync & Avatar */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            {/* Quick Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search leads..."
                value={globalSearchTerm}
                onChange={(e) => setGlobalSearchTerm(e.target.value)}
                className="bg-slate-100 hover:bg-slate-100/80 border border-transparent focus:border-blue-400 focus:bg-white rounded-full pl-3.5 pr-8 py-1.5 text-xs w-44 sm:w-60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 placeholder:text-slate-400 transition-all font-medium"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quick Action: New Lead Button */}
            <button
              id="header-btn-new-lead"
              onClick={() => setIsNewLeadModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0176D3] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Add Lead</span>
            </button>

            {/* User Avatar */}
            <div 
              title="Sales Representative Profile"
              className="w-8 h-8 rounded-full bg-[#001D3D] text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-xs select-none"
            >
              SF
            </div>

          </div>
        </header>

        {/* Dynamic Workspace (Dashboard or Detail) with Clean Scroll */}
        <section className="flex-1 overflow-y-auto bg-[#F4F7FB]">
          {selectedLead ? (
            <LeadDetail
              lead={selectedLead}
              allLeads={leads}
              onSelectOtherLead={(id) => setSelectedLeadId(id)}
              onBack={() => setSelectedLeadId(null)}
              onUpdateLead={handleUpdateLead}
              onOpenAwsSettings={() => setIsAwsModalOpen(true)}
              onOpenSalesforceEnv={() => setIsSfSyncModalOpen(true)}
              awsConfig={awsConfig}
            />
          ) : (
            <LeadDashboard
              leads={leads}
              isLoadingLeads={isLoadingLeads}
              onRefreshLeadsFromSalesforce={() => fetchLeadsFromSalesforce(true)}
              globalSearchTerm={globalSearchTerm}
              onSelectLead={(lead) => setSelectedLeadId(lead.id)}
              onOpenNewLeadModal={() => setIsNewLeadModalOpen(true)}
              onOpenAwsSettings={() => setIsAwsModalOpen(true)}
              onOpenSfSyncModal={() => setIsSfSyncModalOpen(true)}
              isSyncingSf={isSyncingSf}
              onManualSfSync={handleTriggerFullSync}
            />
          )}
        </section>

      </main>

      {/* Modals */}
      <AwsApiSettingsModal
        isOpen={isAwsModalOpen}
        onClose={() => setIsAwsModalOpen(false)}
        config={awsConfig}
        onSaveConfig={(newConfig) => setAwsConfig(newConfig)}
      />

      <SalesforceSyncModal
        isOpen={isSfSyncModalOpen}
        onClose={() => setIsSfSyncModalOpen(false)}
        syncLogs={syncLogs}
        onTriggerFullSync={handleTriggerFullSync}
        isSyncing={isSyncingSf}
        envConfig={sfEnvConfig}
        onSaveEnvConfig={(cfg) => setSfEnvConfig(cfg)}
        onFetchLeadsFromSalesforce={handleFetchLeadsFromSalesforce}
      />

      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        onAddLead={handleAddLead}
      />

    </div>
  );
}
