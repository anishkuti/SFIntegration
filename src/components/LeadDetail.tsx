import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Flame, 
  SunMedium, 
  Snowflake, 
  Sparkles, 
  Server, 
  CheckCircle2, 
  Copy, 
  Check, 
  ShieldCheck, 
  AlertCircle, 
  Plus, 
  Zap,
  Building2,
  Phone,
  Mail,
  DollarSign,
  Briefcase,
  Layers,
  FileText,
  Tag,
  Code2,
  ChevronDown,
  ChevronUp,
  Globe,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { SalesforceLead, LeadStatus, AiScoreResult, EngagementEvent, AwsApiConfig } from '../types';

interface LeadDetailProps {
  lead: SalesforceLead;
  allLeads?: SalesforceLead[];
  onSelectOtherLead?: (id: string) => void;
  onBack: () => void;
  onUpdateLead: (updatedLead: SalesforceLead) => void;
  onOpenAwsSettings: () => void;
  onOpenSalesforceEnv: () => void;
  awsConfig?: AwsApiConfig;
}

export const LeadDetail: React.FC<LeadDetailProps> = ({
  lead,
  onBack,
  onUpdateLead,
  onOpenAwsSettings,
  onOpenSalesforceEnv,
  awsConfig,
}) => {
  // Rep notes for scoring model are optional and blank by default if not previously set
  const [repNotes, setRepNotes] = useState(lead.repNotes || '');
  const [isLoadingScore, setIsLoadingScore] = useState(false);
  const [scoreError, setScoreError] = useState<string | null>(null);
  const [isCopiedAction, setIsCopiedAction] = useState(false);
  const [isSyncingSf, setIsSyncingSf] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [showPayloadInspector, setShowPayloadInspector] = useState(false);

  // Activity logging state
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventNotes, setNewEventNotes] = useState('');
  const [newEventType, setNewEventType] = useState<EngagementEvent['type']>('call');

  const STAGES: LeadStatus[] = ['New', 'Working', 'Contacted', 'Qualified', 'Unqualified'];

  const handleStageChange = (newStatus: LeadStatus) => {
    const updated: SalesforceLead = {
      ...lead,
      status: newStatus,
      lastSyncedAt: new Date().toISOString(),
    };
    onUpdateLead(updated);
  };

  const handleAddActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;

    const newEvent: EngagementEvent = {
      id: `act-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: newEventType,
      title: newEventTitle.trim(),
      notes: newEventNotes.trim(),
    };

    const updated: SalesforceLead = {
      ...lead,
      engagementHistory: [newEvent, ...(lead.engagementHistory || [])],
      lastActivity: newEventTitle.trim(),
    };

    onUpdateLead(updated);
    setNewEventTitle('');
    setNewEventNotes('');
    setShowAddEvent(false);
  };

  const handleRunAiLeadScore = async () => {
    setIsLoadingScore(true);
    setScoreError(null);
    setSyncSuccessMsg(null);

    try {
      const response = await fetch('/api/lead-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead: { ...lead, repNotes },
          repNotes,
          awsEndpointUrl: awsConfig?.endpointUrl || '',
          apiKey: awsConfig?.apiKey || '',
        }),
      });

      if (!response.ok) {
        throw new Error(`Scoring calculation failed (${response.status})`);
      }

      const scoreResult: AiScoreResult = await response.json();

      const updatedLead: SalesforceLead = {
        ...lead,
        repNotes,
        aiScoreResult: scoreResult,
        lastSyncedAt: new Date().toISOString(),
      };

      onUpdateLead(updatedLead);
    } catch (err: any) {
      console.error('Lead scoring error:', err);
      setScoreError(err.message || 'Failed to calculate lead score.');
    } finally {
      setIsLoadingScore(false);
    }
  };

  const [isFetchingFromSf, setIsFetchingFromSf] = useState(false);

  const handleFetchFromSalesforce = async () => {
    setIsFetchingFromSf(true);
    setSyncSuccessMsg(null);
    try {
      const res = await fetch(`/api/salesforce/lead/${encodeURIComponent(lead.id)}`);
      const data = await res.json();
      if (data.success && data.lead) {
        onUpdateLead({
          ...data.lead,
          aiScoreResult: lead.aiScoreResult,
          repNotes: lead.repNotes || data.lead.repNotes,
          lastSyncedAt: new Date().toISOString(),
        });
        setSyncSuccessMsg(`Fetched latest attributes from Salesforce SObject (Lead ID: ${lead.id})`);
      } else {
        setSyncSuccessMsg(`Salesforce: ${data.message || 'Could not fetch lead'}`);
      }
    } catch (err: any) {
      console.error('SF fetch error:', err);
      setSyncSuccessMsg(`Fetch error: ${err.message}`);
    } finally {
      setIsFetchingFromSf(false);
    }
  };

  const handleSyncToSalesforce = async () => {
    if (!lead.aiScoreResult) return;
    setIsSyncingSf(true);
    setSyncSuccessMsg(null);

    try {
      const res = await fetch('/api/salesforce/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          aiScoreResult: lead.aiScoreResult,
          status: lead.status,
          repNotes: lead.repNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSyncSuccessMsg(`Synchronized with Salesforce CRM (Sync ID: ${data.syncId})`);
        onUpdateLead({
          ...lead,
          lastSyncedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('SF sync error:', err);
    } finally {
      setIsSyncingSf(false);
    }
  };

  const copyActionToClipboard = () => {
    if (lead.aiScoreResult?.recommendedFollowUpAction) {
      navigator.clipboard.writeText(lead.aiScoreResult.recommendedFollowUpAction);
      setIsCopiedAction(true);
      setTimeout(() => setIsCopiedAction(false), 2000);
    }
  };

  const getInitials = (name: string) => {
    return (name || 'SF')
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const renderYesNoBadge = (val?: string | null) => {
    if (val === 'Yes' || val === 'Y') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-3 h-3 text-emerald-600" />
          Yes
        </span>
      );
    }
    if (val === 'No' || val === 'N') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
          <XCircle className="w-3 h-3 text-slate-400" />
          No
        </span>
      );
    }
    if (val === 'Pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          Pending
        </span>
      );
    }
    return (
      <span className="text-[11px] text-slate-400 font-normal italic bg-slate-100/70 px-1.5 py-0.5 rounded border border-slate-200/50" title="Attribute not populated in Salesforce">
        — Not in SF
      </span>
    );
  };

  return (
    <div id="lead-detail-view" className="w-full max-w-7xl mx-auto px-6 sm:px-8 py-8 space-y-6 animate-fade-in">
      
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        
        <div className="flex items-center gap-3">
          <button
            id="btn-back-to-leads"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Leads
          </button>
          
          <div className="text-xs font-mono font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
            Salesforce ID: <span className="text-[#0176D3] font-bold">{lead.id}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {lead.lastSyncedAt && (
            <span className="text-xs text-slate-400">
              Synced: {new Date(lead.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            id="btn-fetch-salesforce-live"
            onClick={handleFetchFromSalesforce}
            disabled={isFetchingFromSf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100/80 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Fetch real-time Lead SObject attributes from Salesforce"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingFromSf ? 'animate-spin' : ''}`} />
            {isFetchingFromSf ? 'Fetching SF...' : 'Fetch from Salesforce'}
          </button>
          <button
            id="btn-connect-salesforce-env"
            onClick={onOpenSalesforceEnv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0176D3] bg-blue-50/80 border border-blue-200 rounded-lg hover:bg-blue-100/70 shadow-xs transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Salesforce Sync
          </button>
          <button
            id="btn-lead-aws-settings"
            onClick={onOpenAwsSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
          >
            <Server className="w-3.5 h-3.5 text-amber-600" />
            Scoring API
          </button>
        </div>

      </div>

      {/* Main Lead Profile Banner */}
      <div id="lead-profile-card" className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 rounded-xl bg-[#0176D3] text-white flex items-center justify-center text-xl font-bold shadow-xs shrink-0 select-none">
              {getInitials(lead.name)}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 id="lead-contact-name" className="text-2xl font-bold text-slate-900 tracking-tight">
                  {lead.name}
                </h1>
                {lead.aiScoreResult && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    lead.aiScoreResult.temperatureType === 'HOT' 
                      ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                      : lead.aiScoreResult.temperatureType === 'WARM'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                    {lead.aiScoreResult.temperatureType === 'HOT' && <Flame className="w-3 h-3 fill-rose-500 text-rose-600" />}
                    {lead.aiScoreResult.temperatureType === 'WARM' && <SunMedium className="w-3 h-3 text-amber-600" />}
                    {lead.aiScoreResult.temperatureType === 'COLD' && <Snowflake className="w-3 h-3 text-slate-500" />}
                    {lead.aiScoreResult.leadScore}% {lead.aiScoreResult.temperatureType}
                  </span>
                )}
                {lead.purchasingAuthority && (
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                    Authority: {lead.purchasingAuthority}
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5">
                {(lead.jobRole || lead.title) ? <span>{lead.jobRole || lead.title} · </span> : null}
                <span className="font-semibold text-slate-800">{lead.company}</span>
                {lead.region ? <span> · {lead.region}</span> : null}
              </p>
            </div>
          </div>

          {/* Quick Stage Status Selector */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-xl border border-slate-200 overflow-x-auto self-start md:self-auto">
            {STAGES.map((s) => {
              const isActive = lead.status === s;
              return (
                <button
                  key={s}
                  id={`btn-stage-${s.toLowerCase()}`}
                  onClick={() => handleStageChange(s)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#001D3D] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Synchronized Banner Notice */}
      {syncSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs font-medium text-emerald-800 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{syncSuccessMsg}</span>
          </div>
          <span className="text-emerald-700 font-semibold text-[11px]">Synced to Salesforce Object</span>
        </div>
      )}

      {/* 2-Column Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: LEAD ATTRIBUTES RECORD (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Card 1: Lead Attributes */}
          <div id="lead-record-card" className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0176D3]" />
                <span className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                  Salesforce Mapped Attributes
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">Live SF Mapping</span>
            </div>

            {/* Category 1: Firmographics & Purchasing Authority */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                <span>Firmographics & Authority</span>
              </div>

              <div className="bg-slate-50/70 rounded-xl p-3 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500 font-medium">Job Title (Title / job_title)</span>
                  <span className="font-semibold text-slate-900">
                    {lead.jobTitle || lead.title || <span className="text-slate-400 font-normal italic">Not in SF</span>}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500 font-medium">Job Role (job_role)</span>
                  <span className="font-semibold text-slate-900">
                    {lead.jobRole || <span className="text-slate-400 font-normal italic">Not in SF</span>}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500 font-medium">Purchasing Authority (purchasing_authority)</span>
                  {lead.purchasingAuthority ? (
                    <span className="font-bold text-[#0176D3] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {lead.purchasingAuthority}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal italic">Not in SF</span>
                  )}
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500 font-medium">Number of Employees (number_of_employees)</span>
                  <span className="font-semibold text-slate-900">
                    {lead.numberOfEmployees != null ? `${lead.numberOfEmployees.toLocaleString()} employees` : <span className="text-slate-400 font-normal italic">Not in SF</span>}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500 font-medium">Industry (industry)</span>
                  <span className="font-semibold text-slate-900">
                    {lead.industry || <span className="text-slate-400 font-normal italic">Not in SF</span>}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500 font-medium">Annual Revenue (annual_revenue)</span>
                  <span className="font-bold text-slate-900">
                    {lead.annualRevenue || <span className="text-slate-400 font-normal italic">Not in SF</span>}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/50">
                  <span className="text-slate-500 font-medium">Revenue Growth / Decline (revenue_growth_decline)</span>
                  {lead.revenueGrowthDecline ? (
                    <span className={`font-bold ${(lead.revenueGrowthDecline || '').startsWith('-') ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {lead.revenueGrowthDecline}
                    </span>
                  ) : (
                    <span className="text-slate-400 font-normal italic">Not in SF</span>
                  )}
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Average Sales Cycle (average_sales_cycle)</span>
                  <span className="font-semibold text-slate-900">
                    {lead.averageSalesCycle || <span className="text-slate-400 font-normal italic">Not in SF</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Category 2: Digital Touchpoints & Web Engagement */}
            <div className="space-y-2.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-emerald-600" />
                <span>Web & Digital Engagement Touchpoints</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Landing Page - View</span>
                  {renderYesNoBadge(lead.landingPageView)}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Landing Page - Conversion</span>
                  {renderYesNoBadge(lead.landingPageConversion)}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Use of Chat Functionality</span>
                  {renderYesNoBadge(lead.useOfChatFunctionality)}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Request for Call Back</span>
                  {renderYesNoBadge(lead.requestForCallBack)}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Viewed Page - Product</span>
                  {renderYesNoBadge(lead.viewedWebPageProduct)}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Viewed Page - Pricing</span>
                  {renderYesNoBadge(lead.viewedWebPagePricing || lead.viewedWebPagePrice)}
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between col-span-2">
                  <span className="text-slate-600 font-medium">Viewed Page - Review</span>
                  {renderYesNoBadge(lead.viewedWebPageReview)}
                </div>
              </div>
            </div>

            {/* Description field */}
            <div className="py-2 border-t border-slate-100 space-y-1">
              <span className="text-slate-500 font-medium block text-xs">Description</span>
              <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed font-medium">
                {lead.description || 'No description recorded.'}
              </p>
            </div>

          </div>

          {/* Activity Timeline Card */}
          <div id="lead-activity-card" className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  ACTIVITY TIMELINE
                </span>
                <p className="text-xs text-slate-400 mt-0.5">Recent interactions log</p>
              </div>
              
              <button
                id="btn-toggle-add-activity"
                onClick={() => setShowAddEvent(!showAddEvent)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#0176D3] hover:text-blue-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Log activity
              </button>
            </div>

            {/* Quick Add Activity Form */}
            {showAddEvent && (
              <form onSubmit={handleAddActivity} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs animate-fade-in">
                <div className="font-bold text-slate-800">Log New Activity</div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value as any)}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
                  >
                    <option value="call">Call</option>
                    <option value="meeting">Meeting</option>
                    <option value="email">Email</option>
                    <option value="demo">Demo</option>
                    <option value="form">Web Form</option>
                    <option value="download">Whitepaper/Doc</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Title (e.g. Discovery Call)"
                    value={newEventTitle}
                    onChange={(e) => setNewEventTitle(e.target.value)}
                    required
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 font-medium"
                  />
                </div>
                <textarea
                  placeholder="Activity notes..."
                  value={newEventNotes}
                  onChange={(e) => setNewEventNotes(e.target.value)}
                  rows={2}
                  className="w-full p-1.5 bg-white border border-slate-200 rounded-lg resize-none text-slate-800 font-medium"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddEvent(false)}
                    className="px-2.5 py-1 text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#0176D3] text-white font-semibold rounded-lg hover:bg-blue-700 cursor-pointer"
                  >
                    Save & Add
                  </button>
                </div>
              </form>
            )}

            {/* Activity items */}
            <div className="space-y-3 pt-1">
              {lead.engagementHistory && lead.engagementHistory.length > 0 ? (
                lead.engagementHistory.map((item, idx) => (
                  <div key={item.id || idx} className="relative pl-5 pb-3 border-l-2 border-slate-200 last:border-transparent last:pb-0">
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-[#0176D3] ring-2 ring-white"></div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-mono">{item.date}</span>
                      <span className="uppercase font-bold text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                        {item.type}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">{item.title}</div>
                    {item.notes && (
                      <div className="text-xs text-slate-600 mt-0.5 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {item.notes}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 py-2">No activity logged yet.</div>
              )}
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: QUALIFICATION & ML SCORING (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          
          <div id="qualification-panel" className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
            
            {/* Scoring & Prediction header */}
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0176D3]" />
                <span className="text-xs font-bold tracking-wider text-slate-800 uppercase">
                  Lead Scoring & Prediction
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowPayloadInspector(!showPayloadInspector)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer shrink-0"
              >
                <Code2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Payload Inspector</span>
                {showPayloadInspector ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Expandable Record Attributes POST Payload Inspector */}
            {showPayloadInspector && (
              <div className="p-3.5 bg-slate-900 text-slate-200 border border-slate-700 rounded-xl space-y-2.5 text-xs animate-fade-in font-mono">
                <div className="text-[11px] font-bold text-slate-300 flex flex-wrap justify-between items-center pb-2 border-b border-slate-800 gap-2">
                  <span className="text-emerald-400 font-bold">POST BODY: 15 SCORING ATTRIBUTES</span>
                  <span className="text-[10px] text-amber-400 font-normal">{awsConfig?.endpointUrl || 'http://3.108.250.41:8001/api/v1/score'}</span>
                </div>
                
                <div className="text-[10px] text-slate-400 font-sans">
                  Payload sent to scoring service:
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                  <div><span className="text-slate-400">1. number_of_employees:</span> <span className="font-bold text-amber-300">{lead.numberOfEmployees || lead.employees || 250}</span></div>
                  <div><span className="text-slate-400">2. annual_revenue:</span> <span className="font-bold text-emerald-300">{parseFloat(String(lead.annualRevenue).replace(/[^0-9.]/g, '')) || 48000000}</span></div>
                  <div><span className="text-slate-400">3. revenue_growth_decline:</span> <span className="font-bold text-blue-300">{lead.revenueGrowthDecline ? (parseFloat(lead.revenueGrowthDecline.replace(/[^0-9.-]/g, '')) / 100) : 0.185}</span></div>
                  <div><span className="text-slate-400">4. average_sales_cycle:</span> <span className="font-bold text-purple-300">{parseInt(String(lead.averageSalesCycle).replace(/[^0-9]/g, '')) || 45}</span></div>
                  <div><span className="text-slate-400">5. job_title:</span> <span className="font-bold text-blue-300">"{lead.title || lead.jobTitle || 'Director of IT Infrastructure'}"</span></div>
                  <div><span className="text-slate-400">6. job_role:</span> <span className="font-bold text-blue-300">"{lead.jobRole || lead.purchasingAuthority || 'Decision Maker'}"</span></div>
                  <div><span className="text-slate-400">7. purchasing_authority:</span> <span className="font-bold text-emerald-300">"{lead.purchasingAuthority || 'Decision Maker'}"</span></div>
                  <div><span className="text-slate-400">8. industry:</span> <span className="font-bold text-slate-200">"{lead.industry || 'Technology'}"</span></div>
                  <div><span className="text-slate-400">9. landing_page_view:</span> <span className="font-bold text-emerald-300">"{lead.landingPageView || (lead.landingPageConversion === 'No' ? 'N' : 'Y')}"</span></div>
                  <div><span className="text-slate-400">10. landing_page_conversion:</span> <span className="font-bold text-emerald-300">"{lead.landingPageConversion === 'No' ? 'N' : 'Y'}"</span></div>
                  <div><span className="text-slate-400">11. use_of_chat_functionality:</span> <span className="font-bold text-emerald-300">"{lead.useOfChatFunctionality === 'Yes' || lead.useOfChatFunctionality === 'Y' ? 'Y' : 'N'}"</span></div>
                  <div><span className="text-slate-400">12. request_for_call_back:</span> <span className="font-bold text-emerald-300">"{lead.requestForCallBack === 'Yes' || lead.requestForCallBack === 'Y' ? 'Y' : 'N'}"</span></div>
                  <div><span className="text-slate-400">13. viewed_web_page_product:</span> <span className="font-bold text-blue-300">"{lead.viewedWebPageProduct === 'No' ? 'N' : 'Y'}"</span></div>
                  <div><span className="text-slate-400">14. viewed_web_page_pricing:</span> <span className="font-bold text-blue-300">"{lead.viewedWebPagePricing === 'No' || lead.viewedWebPagePrice === 'No' ? 'N' : 'Y'}"</span></div>
                  <div><span className="text-slate-400">15. viewed_web_page_review:</span> <span className="font-bold text-blue-300">"{lead.viewedWebPageReview === 'Yes' || lead.viewedWebPageReview === 'Y' ? 'Y' : 'N'}"</span></div>
                </div>
              </div>
            )}

            {/* Rep notes input - Optional and blank by default */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="rep-notes-textarea" className="block text-xs font-bold text-slate-800">
                  Rep notes for the scoring model <span className="font-normal text-slate-400">(Optional)</span>
                </label>
                {repNotes && (
                  <button
                    onClick={() => setRepNotes('')}
                    className="text-[11px] font-medium text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              <textarea
                id="rep-notes-textarea"
                rows={3}
                value={repNotes}
                onChange={(e) => setRepNotes(e.target.value)}
                placeholder="Optional qualification notes (e.g., budget approval, decision maker details)..."
                className="w-full p-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 resize-y font-medium leading-relaxed"
              />
            </div>

            {/* Run AI/ML Scoring Button */}
            <div className="pt-1">
              <button
                id="btn-run-ai-lead-scoring"
                onClick={handleRunAiLeadScore}
                disabled={isLoadingScore}
                className="w-full py-3.5 px-4 rounded-xl bg-[#0176D3] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-sm transition-all disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoadingScore ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Invoking AWS EC2 REST scoring service (15 attributes)...</span>
                  </>
                ) : (
                  <>
                    <Server className="w-4 h-4 text-blue-200" />
                    <span>Run Lead Scoring on AWS EC2 REST Service</span>
                  </>
                )}
              </button>
            </div>

            {scoreError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{scoreError}</span>
              </div>
            )}

          </div>

          {/* ML Result Card Display - Clean & Deterministic */}
          {lead.aiScoreResult && (
            <div id="ai-lead-score-result-card" className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden animate-fade-in space-y-0">
              
              {/* Card Header with Score & Temperature Badge */}
              <div className="p-5 sm:p-6 bg-[#001D3D] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <span>Lead Scoring Result</span>
                    <span>·</span>
                    <span className="text-blue-300 font-mono text-[11px]">{lead.aiScoreResult.scoredByApi}</span>
                  </div>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white">
                      {lead.aiScoreResult.leadScore}
                      <span className="text-lg text-slate-400 font-normal"> / 100</span>
                    </span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                      {lead.aiScoreResult.conversionProbability}% Conversion Probability
                    </span>
                  </div>
                </div>

                {/* Temperature Pill Badge */}
                <div>
                  {lead.aiScoreResult.temperatureType === 'HOT' && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-xs sm:text-sm">
                      <Flame className="w-4 h-4 fill-rose-400 text-rose-400" />
                      <span>HOT LEAD (≥ 75)</span>
                    </div>
                  )}
                  {lead.aiScoreResult.temperatureType === 'WARM' && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs sm:text-sm">
                      <SunMedium className="w-4 h-4 text-amber-400" />
                      <span>WARM LEAD (50 - 74)</span>
                    </div>
                  )}
                  {lead.aiScoreResult.temperatureType === 'COLD' && (
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-700 border border-slate-600 text-slate-300 font-bold text-xs sm:text-sm">
                      <Snowflake className="w-4 h-4 text-slate-400" />
                      <span>COLD LEAD (&lt; 50)</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                
                {/* Deterministic Recommended Follow-up Action Box */}
                <div className="p-4 sm:p-5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#001D3D]">
                      <Zap className="w-4 h-4 text-[#0176D3]" />
                      <span>RECOMMENDED FOLLOW-UP ACTION (DETERMINISTIC RULE)</span>
                    </div>
                    <button
                      onClick={copyActionToClipboard}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0176D3] hover:text-blue-900 cursor-pointer"
                    >
                      {isCopiedAction ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy action</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-slate-900 leading-relaxed">
                    {lead.aiScoreResult.recommendedFollowUpAction}
                  </p>
                </div>

                {/* Action Bar: Sync to Salesforce, Mark Qualified */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  
                  <button
                    id="btn-sync-score-sf"
                    onClick={handleSyncToSalesforce}
                    disabled={isSyncingSf}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0176D3] hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {isSyncingSf ? 'Syncing to Salesforce...' : 'Sync Score to Salesforce'}
                  </button>

                  {lead.status !== 'Qualified' && (
                    <button
                      id="btn-convert-qualified"
                      onClick={() => handleStageChange('Qualified')}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Mark as Qualified
                    </button>
                  )}

                </div>

                {/* Footnote metadata */}
                <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between pt-2 border-t border-slate-100">
                  <span>Scored: {lead.aiScoreResult.scoredAt ? new Date(lead.aiScoreResult.scoredAt).toLocaleString() : 'Just now'}</span>
                  <span>AWS Request ID: {lead.aiScoreResult.awsRequestId || 'aws-req-internal'}</span>
                </div>

              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  );
};
