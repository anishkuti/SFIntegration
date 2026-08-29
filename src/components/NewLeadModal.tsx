import React, { useState } from 'react';
import { UserPlus, X, Building2, Phone, Mail, DollarSign, Layers, Globe, Activity } from 'lucide-react';
import { SalesforceLead, LeadStatus } from '../types';

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLead: (lead: SalesforceLead) => void;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({
  isOpen,
  onClose,
  onAddLead,
}) => {
  // 18 Core Salesforce Attributes
  const [name, setName] = useState('');
  const [jobRole, setJobRole] = useState('VP of IT Infrastructure');
  const [purchasingAuthority, setPurchasingAuthority] = useState('Decision Maker');
  const [company, setCompany] = useState('');
  const [numberOfEmployees, setNumberOfEmployees] = useState('450');
  const [industry, setIndustry] = useState('Retail & Consumer Goods');
  const [annualRevenue, setAnnualRevenue] = useState('$35,000,000');
  const [revenueGrowthDecline, setRevenueGrowthDecline] = useState('+14.5% YoY');
  const [averageSalesCycle, setAverageSalesCycle] = useState('45 days');

  // Digital & Web Engagement Touchpoints
  const [landingPageConversion, setLandingPageConversion] = useState<'Yes' | 'No'>('Yes');
  const [useOfChatFunctionality, setUseOfChatFunctionality] = useState<'Yes' | 'No'>('Yes');
  const [requestForCallBack, setRequestForCallBack] = useState<'Yes' | 'No'>('Yes');
  const [viewedWebPageProduct, setViewedWebPageProduct] = useState<'Yes' | 'No'>('Yes');
  const [viewedWebPagePrice, setViewedWebPagePrice] = useState<'Yes' | 'No'>('Yes');
  const [viewedWebPageReview, setViewedWebPageReview] = useState<'Yes' | 'No'>('Yes');

  // Additional fields
  const [region, setRegion] = useState('Midwest / US');
  const [leadSource, setLeadSource] = useState('Inbound — Pricing page');
  const [status, setStatus] = useState<LeadStatus>('Working');
  const [description, setDescription] = useState('');
  const [productInterest, setProductInterest] = useState('SD-WAN + Business Broadband');
  const [estimatedMrr, setEstimatedMrr] = useState('18500');
  const [linesOrSeats, setLinesOrSeats] = useState('320');
  const [currentProvider, setCurrentProvider] = useState('Comcast Business');
  const [contractEndsIn, setContractEndsIn] = useState('6 months');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [repNotes, setRepNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !company.trim()) return;

    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const newLead: SalesforceLead = {
      id: `00Q5G00000${randomSuffix}`,
      name: name.trim(),
      title: jobRole.trim() || 'Director of IT',
      jobRole: jobRole.trim() || 'Director of IT',
      company: company.trim(),
      region,
      status,
      leadSource,
      industry,
      annualRevenue: annualRevenue.trim() || '$10,000,000',
      description: description.trim() || `Inbound lead for ${productInterest}. Evaluating solutions for ${linesOrSeats} locations.`,
      rating: 'Warm',
      
      // Scoring Attributes
      purchasingAuthority,
      numberOfEmployees: Number(numberOfEmployees) || 250,
      employees: Number(numberOfEmployees) || 250,
      revenueGrowthDecline,
      averageSalesCycle,
      landingPageConversion,
      useOfChatFunctionality,
      requestForCallBack,
      viewedWebPageProduct,
      viewedWebPagePrice,
      viewedWebPageReview,

      // Telecom & Deal fields
      productInterest,
      estimatedMrr: Number(estimatedMrr) || 15000,
      linesOrSeats: Number(linesOrSeats) || 100,
      currentProvider,
      contractEndsIn,
      lastActivity: 'Lead created in Salesforce CRM',
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@${company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      phone: phone.trim() || '+1 (555) 019-2834',
      createdAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
      repNotes: repNotes.trim(),
      engagementHistory: [
        {
          id: `act-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          type: 'form',
          title: 'Lead Created in Salesforce CRM',
          notes: `Created via Salesforce with scoring attributes. Product: ${productInterest}`,
        }
      ]
    };

    onAddLead(newLead);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-[#0176D3]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Create Salesforce Lead Record</h2>
              <p className="text-xs text-slate-500">Includes all 18 attributes for Salesforce CRM and AWS EC2 lead scoring</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs">
          
          {/* Section 1: Firmographics & Purchasing Authority */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-[#0176D3]" />
              <span>1. Firmographics & Purchasing Authority</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Contact Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Feld"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Halden Retail Group"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Job Role / Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Director of IT Infrastructure"
                  value={jobRole}
                  onChange={(e) => setJobRole(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Purchasing Authority *
                </label>
                <select
                  value={purchasingAuthority}
                  onChange={(e) => setPurchasingAuthority(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 text-xs font-medium"
                >
                  <option value="Decision Maker">Decision Maker / Budget Holder</option>
                  <option value="Yes">Yes (Direct Authority)</option>
                  <option value="Influencer">Influencer / Champion</option>
                  <option value="No">No (End User / Gatekeeper)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Number of Employees *
                </label>
                <input
                  type="number"
                  placeholder="450"
                  value={numberOfEmployees}
                  onChange={(e) => setNumberOfEmployees(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 text-xs font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Industry
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 text-xs font-medium"
                >
                  <option value="Retail & Consumer Goods">Retail & Consumer Goods</option>
                  <option value="Healthcare & Life Sciences">Healthcare & Life Sciences</option>
                  <option value="Transportation & Logistics">Transportation & Logistics</option>
                  <option value="Financial Services">Financial Services</option>
                  <option value="Supply Chain & Warehousing">Supply Chain & Warehousing</option>
                  <option value="Hospitality & Leisure">Hospitality & Leisure</option>
                  <option value="Manufacturing">Manufacturing</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Annual Revenue
                </label>
                <input
                  type="text"
                  placeholder="$48,000,000"
                  value={annualRevenue}
                  onChange={(e) => setAnnualRevenue(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Revenue Growth / Decline
                </label>
                <input
                  type="text"
                  placeholder="+18.5% YoY"
                  value={revenueGrowthDecline}
                  onChange={(e) => setRevenueGrowthDecline(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Average Sales Cycle
              </label>
              <input
                type="text"
                placeholder="45 days"
                value={averageSalesCycle}
                onChange={(e) => setAverageSalesCycle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900 text-xs font-medium"
              />
            </div>
          </div>

          {/* Section 2: Digital Touchpoints & Web Engagement */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Globe className="w-4 h-4 text-emerald-600" />
              <span>2. Web & Digital Engagement Touchpoints</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Landing Page - Conversion
                </label>
                <select
                  value={landingPageConversion}
                  onChange={(e) => setLandingPageConversion(e.target.value as 'Yes' | 'No')}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Use of Chat Functionality
                </label>
                <select
                  value={useOfChatFunctionality}
                  onChange={(e) => setUseOfChatFunctionality(e.target.value as 'Yes' | 'No')}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Request for Call Back
                </label>
                <select
                  value={requestForCallBack}
                  onChange={(e) => setRequestForCallBack(e.target.value as 'Yes' | 'No')}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Viewed Page - Product
                </label>
                <select
                  value={viewedWebPageProduct}
                  onChange={(e) => setViewedWebPageProduct(e.target.value as 'Yes' | 'No')}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Viewed Page - Price
                </label>
                <select
                  value={viewedWebPagePrice}
                  onChange={(e) => setViewedWebPagePrice(e.target.value as 'Yes' | 'No')}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Viewed Page - Review
                </label>
                <select
                  value={viewedWebPageReview}
                  onChange={(e) => setViewedWebPageReview(e.target.value as 'Yes' | 'No')}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Telecom Solution Scope & Contact */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-slate-100 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-amber-600" />
              <span>3. Telecom Solution Scope & Contact</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Product Scope
                </label>
                <input
                  type="text"
                  placeholder="e.g. SD-WAN + Business Broadband"
                  value={productInterest}
                  onChange={(e) => setProductInterest(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Current Provider
                </label>
                <input
                  type="text"
                  placeholder="e.g. Comcast Business"
                  value={currentProvider}
                  onChange={(e) => setCurrentProvider(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Estimated MRR ($)
                </label>
                <input
                  type="number"
                  placeholder="18500"
                  value={estimatedMrr}
                  onChange={(e) => setEstimatedMrr(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lines / Seats
                </label>
                <input
                  type="number"
                  placeholder="320"
                  value={linesOrSeats}
                  onChange={(e) => setLinesOrSeats(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Contract Ends In
                </label>
                <input
                  type="text"
                  placeholder="6 months"
                  value={contractEndsIn}
                  onChange={(e) => setContractEndsIn(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="contact@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+1 (555) 012-3456"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2 sticky bottom-0 bg-white">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-[#0176D3] hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
            >
              Save Salesforce Lead
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
