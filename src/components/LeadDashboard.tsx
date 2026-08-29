import React, { useState } from 'react';
import { 
   Building2, 
   DollarSign, 
   Users, 
   CheckCircle2, 
   Flame, 
   SunMedium, 
   Snowflake, 
   Search, 
   Plus, 
   ArrowUpRight, 
   RefreshCw, 
   SlidersHorizontal,
   Server,
   ChevronRight,
   Sparkles,
   ExternalLink,
   Phone,
   Mail,
   ShieldCheck,
   TrendingUp,
   LayoutGrid,
   Table as TableIcon,
   CheckCircle,
   XCircle,
   Clock
} from 'lucide-react';
import { SalesforceLead, LeadTemperature } from '../types';

interface LeadDashboardProps {
  leads: SalesforceLead[];
  isLoadingLeads?: boolean;
  onRefreshLeadsFromSalesforce?: () => void;
  globalSearchTerm?: string;
  onSelectLead: (lead: SalesforceLead) => void;
  onOpenNewLeadModal: () => void;
  onOpenAwsSettings: () => void;
  onOpenSfSyncModal: () => void;
  isSyncingSf: boolean;
  onManualSfSync: () => void;
}

export const LeadDashboard: React.FC<LeadDashboardProps> = ({
  leads,
  isLoadingLeads = false,
  onRefreshLeadsFromSalesforce,
  globalSearchTerm = '',
  onSelectLead,
  onOpenNewLeadModal,
  onOpenAwsSettings,
  onOpenSfSyncModal,
  isSyncingSf,
  onManualSfSync,
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [tempFilter, setTempFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const effectiveSearch = globalSearchTerm || localSearch;

  // Compute metrics
  const openLeadsCount = leads.filter(l => l.status !== 'Unqualified').length;
  const totalPipelineMrr = leads.reduce((acc, l) => acc + (l.estimatedMrr || 0), 0);
  const qualifiedCount = leads.filter(l => l.status === 'Qualified').length;
  const totalEmployees = leads.reduce((acc, l) => acc + (l.numberOfEmployees || l.employees || 0), 0);

  // Filter leads
  const filteredLeads = leads.filter(lead => {
    const term = effectiveSearch.toLowerCase().trim();
    const matchesSearch = !term || 
      (lead.name && lead.name.toLowerCase().includes(term)) ||
      (lead.company && lead.company.toLowerCase().includes(term)) ||
      (lead.jobRole && lead.jobRole.toLowerCase().includes(term)) ||
      (lead.jobTitle && lead.jobTitle.toLowerCase().includes(term)) ||
      (lead.title && lead.title.toLowerCase().includes(term)) ||
      (lead.industry && lead.industry.toLowerCase().includes(term)) ||
      (lead.purchasingAuthority && lead.purchasingAuthority.toLowerCase().includes(term)) ||
      (lead.productInterest && lead.productInterest.toLowerCase().includes(term)) ||
      (lead.id && lead.id.toLowerCase().includes(term)) ||
      (lead.region && lead.region.toLowerCase().includes(term));
    
    const matchesStatus = statusFilter === 'ALL' || lead.status === statusFilter;
    
    const matchesTemp = 
      tempFilter === 'ALL' ||
      (tempFilter === 'HOT' && lead.aiScoreResult?.temperatureType === 'HOT') ||
      (tempFilter === 'WARM' && lead.aiScoreResult?.temperatureType === 'WARM') ||
      (tempFilter === 'COLD' && lead.aiScoreResult?.temperatureType === 'COLD') ||
      (tempFilter === 'UNSCORED' && !lead.aiScoreResult);

    return matchesSearch && matchesStatus && matchesTemp;
  });

  const getTemperatureBadge = (temp?: LeadTemperature, score?: number) => {
    if (!temp || score === undefined) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
          <Sparkles className="w-3 h-3 text-slate-400" />
          Ready to score
        </span>
      );
    }

    if (temp === 'HOT') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <Flame className="w-3.5 h-3.5 text-rose-600 fill-rose-500" />
          {score}% HOT
        </span>
      );
    }

    if (temp === 'WARM') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <SunMedium className="w-3.5 h-3.5 text-amber-600" />
          {score}% WARM
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <Snowflake className="w-3.5 h-3.5 text-slate-500" />
        {score}% COLD
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'New':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">New</span>;
      case 'Working':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">Working</span>;
      case 'Contacted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Contacted</span>;
      case 'Qualified':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">Qualified</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">{status}</span>;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const renderYesNoBadge = (val?: string) => {
    if (val === 'Yes' || val === 'Y') {
      return <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded text-[11px] border border-emerald-200">Yes</span>;
    }
    if (val === 'No' || val === 'N') {
      return <span className="text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">No</span>;
    }
    if (val === 'Pending') {
      return <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded text-[11px] border border-amber-200">Pending</span>;
    }
    return <span className="text-slate-400 text-xs">{val || '—'}</span>;
  };

  return (
    <div id="lead-dashboard-container" className="w-full max-w-7xl mx-auto px-6 sm:px-8 py-8 space-y-6 animate-fade-in">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Leads Dashboard</h2>
          <span className="text-xs text-slate-400 font-medium">({leads.length} total)</span>
        </div>
        
        <div className="flex items-center gap-2.5 flex-wrap">
          {onRefreshLeadsFromSalesforce && (
            <button
              id="btn-fetch-sf-leads"
              onClick={onRefreshLeadsFromSalesforce}
              disabled={isLoadingLeads}
              title="Refresh lead records"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#0176D3] ${isLoadingLeads ? 'animate-spin' : ''}`} />
              {isLoadingLeads ? 'Refreshing...' : 'Refresh'}
            </button>
          )}

          <button
            id="btn-aws-api-settings"
            onClick={onOpenAwsSettings}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
          >
            <Server className="w-3.5 h-3.5 text-amber-600" />
            Scoring API
          </button>

          <button
            id="btn-sf-sync-status"
            onClick={onOpenSfSyncModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#0176D3]" />
            Live Sync
          </button>

          <button
            id="btn-add-new-lead"
            onClick={onOpenNewLeadModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-white bg-[#0176D3] hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Lead
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div id="metric-open-leads" className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            ACTIVE LEADS
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {openLeadsCount}
            </span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              {qualifiedCount} Qualified
            </span>
          </div>
        </div>

        <div id="metric-pipeline-mrr" className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            PIPELINE VALUE
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              ${(totalPipelineMrr * 12).toLocaleString()}
            </span>
            <span className="text-xs font-medium text-slate-500">
              ${totalPipelineMrr.toLocaleString()} / mo
            </span>
          </div>
        </div>

        <div id="metric-hot-leads" className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            HOT LEADS
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-rose-600">
              {leads.filter(l => l.aiScoreResult?.temperatureType === 'HOT').length}
            </span>
            <span className="text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
              High Priority
            </span>
          </div>
        </div>

        <div id="metric-total-employees" className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
            TOTAL EMPLOYEES
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">
              {totalEmployees.toLocaleString()}
            </span>
            <span className="text-xs font-medium text-slate-500">
              Across Accounts
            </span>
          </div>
        </div>

      </div>

      {/* Filter, Search, and View Mode Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="input-lead-search"
              type="text"
              placeholder="Search by contact, company, role, authority, industry, or ID..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all text-slate-900 placeholder:text-slate-400 font-medium"
            />
          </div>

          {/* Quick Temperature Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'ALL', label: 'All Leads' },
              { key: 'HOT', label: '🔥 Hot' },
              { key: 'WARM', label: '🌤️ Warm' },
              { key: 'COLD', label: '❄️ Cold' },
              { key: 'UNSCORED', label: 'Unscored' },
            ].map(tab => (
              <button
                key={tab.key}
                id={`tab-filter-${tab.key.toLowerCase()}`}
                onClick={() => setTempFilter(tab.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
                  tempFilter === tab.key
                    ? 'bg-[#001D3D] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Status Dropdown Filter & View Toggle */}
          <div className="flex items-center gap-2">
            <select
              id="select-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            >
              <option value="ALL">All Stages</option>
              <option value="New">Stage: New</option>
              <option value="Working">Stage: Working</option>
              <option value="Contacted">Stage: Contacted</option>
              <option value="Qualified">Stage: Qualified</option>
              <option value="Unqualified">Stage: Unqualified</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-[#0176D3] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Lead Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-[#0176D3] shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Leads List / Table Display */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
          <div className="flex items-center gap-2">
            <span>LEADS QUEUE ({filteredLeads.length})</span>
          </div>
          <span className="text-[11px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
            {viewMode === 'table' ? 'Table View' : 'Card View'}
          </span>
        </div>

        {isLoadingLeads ? (
          <div className="bg-white rounded-xl border border-slate-200 p-10 text-center space-y-4">
            <RefreshCw className="w-8 h-8 text-[#0176D3] animate-spin mx-auto" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Fetching Leads from Salesforce</h3>
              <p className="text-xs text-slate-500 mt-1">Executing SOQL query to retrieve all active Lead records and CRM attributes...</p>
            </div>
            <div className="space-y-2 max-w-md mx-auto pt-2">
              <div className="h-4 bg-slate-100 rounded animate-pulse w-full"></div>
              <div className="h-4 bg-slate-100 rounded animate-pulse w-5/6 mx-auto"></div>
              <div className="h-4 bg-slate-100 rounded animate-pulse w-2/3 mx-auto"></div>
            </div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">No leads found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No Salesforce leads currently in the qualification queue.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              {onRefreshLeadsFromSalesforce && (
                <button
                  onClick={onRefreshLeadsFromSalesforce}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#0176D3] hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                >
                  Fetch Leads from Salesforce
                </button>
              )}
              <button
                onClick={() => { setLocalSearch(''); setStatusFilter('ALL'); setTempFilter('ALL'); }}
                className="px-4 py-1.5 text-xs font-semibold text-[#0176D3] hover:text-blue-800 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
              >
                Clear all filters
              </button>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          /* FULL 18-ATTRIBUTE DATA GRID TABLE */
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#001D3D] text-white text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
                    <th className="p-3 sticky left-0 bg-[#001D3D] z-10">Contact & Company</th>
                    <th className="p-3">Job Role</th>
                    <th className="p-3">Purchasing Authority</th>
                    <th className="p-3"># Employees</th>
                    <th className="p-3">Industry</th>
                    <th className="p-3">Annual Revenue</th>
                    <th className="p-3">Revenue Growth/Decline</th>
                    <th className="p-3">Avg Sales Cycle</th>
                    <th className="p-3 text-center">Landing Page Conv.</th>
                    <th className="p-3 text-center">Use of Chat</th>
                    <th className="p-3 text-center">Request Callback</th>
                    <th className="p-3 text-center">Viewed Product</th>
                    <th className="p-3 text-center">Viewed Price</th>
                    <th className="p-3 text-center">Viewed Review</th>
                    <th className="p-3 text-right">Lead Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => onSelectLead(lead)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors whitespace-nowrap text-slate-800"
                    >
                      <td className="p-3 font-semibold sticky left-0 bg-white hover:bg-blue-50/50 z-10 border-r border-slate-200 shadow-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#0176D3] flex items-center justify-center font-bold text-xs">
                            {getInitials(lead.name)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 hover:text-[#0176D3]">{lead.name}</div>
                            <div className="text-[11px] text-slate-500 font-normal">{lead.company}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-medium text-slate-700">{lead.jobRole || lead.title || '—'}</td>
                      <td className="p-3">
                        {lead.purchasingAuthority ? (
                          <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded text-[11px] border border-blue-100">
                            {lead.purchasingAuthority}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">—</span>
                        )}
                      </td>
                      <td className="p-3 font-medium">
                        {lead.numberOfEmployees != null ? lead.numberOfEmployees.toLocaleString() : (lead.employees != null ? lead.employees.toLocaleString() : '—')}
                      </td>
                      <td className="p-3 font-medium text-slate-600">{lead.industry || '—'}</td>
                      <td className="p-3 font-bold text-slate-900">{lead.annualRevenue || '—'}</td>
                      <td className="p-3">
                        {lead.revenueGrowthDecline ? (
                          <span className={`font-bold ${lead.revenueGrowthDecline.startsWith('-') ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {lead.revenueGrowthDecline}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="p-3 font-medium text-slate-600">{lead.averageSalesCycle || '—'}</td>
                      <td className="p-3 text-center">{renderYesNoBadge(lead.landingPageConversion)}</td>
                      <td className="p-3 text-center">{renderYesNoBadge(lead.useOfChatFunctionality)}</td>
                      <td className="p-3 text-center">{renderYesNoBadge(lead.requestForCallBack)}</td>
                      <td className="p-3 text-center">{renderYesNoBadge(lead.viewedWebPageProduct)}</td>
                      <td className="p-3 text-center">{renderYesNoBadge(lead.viewedWebPagePricing || lead.viewedWebPagePrice)}</td>
                      <td className="p-3 text-center">{renderYesNoBadge(lead.viewedWebPageReview)}</td>
                      <td className="p-3 text-right">
                        {getTemperatureBadge(lead.aiScoreResult?.temperatureType, lead.aiScoreResult?.leadScore)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* RICH CARD VIEW */
          <div id="leads-list-container" className="space-y-2.5">
            {filteredLeads.map((lead) => (
              <div
                key={lead.id}
                id={`lead-card-${lead.id}`}
                onClick={() => onSelectLead(lead)}
                className="group relative bg-white hover:bg-slate-50/70 border border-slate-200 hover:border-blue-300 rounded-xl p-4 sm:p-5 transition-all shadow-xs hover:shadow-sm cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left: Contact & Company Info with Avatar chip & 18-Attribute summary badges */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-[#0176D3] font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-[#0176D3] group-hover:text-white transition-all shadow-xs">
                    {getInitials(lead.name)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-sm sm:text-base font-bold text-slate-900 group-hover:text-[#0176D3] transition-colors">
                        {lead.name}
                      </span>
                      {getStatusBadge(lead.status)}
                      {getTemperatureBadge(lead.aiScoreResult?.temperatureType, lead.aiScoreResult?.leadScore)}
                      <span className="text-[11px] font-mono text-slate-400">
                        {lead.id}
                      </span>
                    </div>
                    
                    <div className="text-xs text-slate-600 font-medium">
                      {(lead.jobRole || lead.title) ? <span>{lead.jobRole || lead.title} · </span> : null}
                      <span className="text-slate-900 font-semibold">{lead.company}</span>
                      {lead.industry ? <span> · {lead.industry}</span> : null}
                    </div>

                    {/* Key Attributes Pills */}
                    <div className="flex items-center gap-2 flex-wrap text-[11px] pt-1">
                      {lead.purchasingAuthority && (
                        <span className="bg-blue-50 text-[#0176D3] font-semibold px-2 py-0.5 rounded border border-blue-100">
                          Auth: {lead.purchasingAuthority}
                        </span>
                      )}
                      {(lead.numberOfEmployees != null || lead.employees != null) && (
                        <span className="bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200">
                          {(lead.numberOfEmployees || lead.employees)?.toLocaleString()} emp
                        </span>
                      )}
                      {(lead.requestForCallBack === 'Yes' || lead.requestForCallBack === 'Y') && (
                        <span className="bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200">
                          📞 Callback Requested
                        </span>
                      )}
                      {(lead.useOfChatFunctionality === 'Yes' || lead.useOfChatFunctionality === 'Y') && (
                        <span className="bg-purple-50 text-purple-700 font-medium px-2 py-0.5 rounded border border-purple-200">
                          💬 Used Chat
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Product & Connectivity Info */}
                <div className="flex flex-row md:flex-col items-start md:items-end justify-between md:justify-center gap-1.5 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 min-w-[200px]">
                  <div className="text-xs sm:text-sm font-semibold text-slate-900 text-left md:text-right">
                    {lead.productInterest || lead.industry || 'Salesforce Opportunity'}
                  </div>
                  <div className="text-xs text-slate-500 font-medium text-left md:text-right">
                    {lead.linesOrSeats != null ? `${lead.linesOrSeats.toLocaleString()} lines · ` : ''}{lead.region || 'Region not set'}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-900">
                      {lead.estimatedMrr != null ? `$${lead.estimatedMrr.toLocaleString()} / mo` : (lead.annualRevenue || '$0 Pipeline')}
                    </span>
                    {lead.contractEndsIn && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500 font-medium">{lead.contractEndsIn} left</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Chevron right */}
                <div className="hidden lg:flex items-center pl-1 text-slate-300 group-hover:text-[#0176D3] transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
