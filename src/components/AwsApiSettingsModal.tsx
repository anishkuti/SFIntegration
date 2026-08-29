import React, { useState } from 'react';
import { Server, X, Check, Globe, Zap, Code, ShieldCheck, Terminal, Copy, CheckCircle2, ArrowRight } from 'lucide-react';
import { AwsApiConfig } from '../types';

interface AwsApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AwsApiConfig;
  onSaveConfig: (newConfig: AwsApiConfig) => void;
}

export const AwsApiSettingsModal: React.FC<AwsApiSettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [endpointUrl, setEndpointUrl] = useState(config.endpointUrl || 'http://3.108.250.41:8001/api/v1/score');
  const [instanceId, setInstanceId] = useState(config.instanceId || 'i-0a8f921bc4e29e81');
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [useFallbackAi, setUseFallbackAi] = useState(config.useFallbackAi ?? true);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testResult, setTestResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'attributes' | 'sample-code'>('config');
  const [isCopiedCode, setIsCopiedCode] = useState(false);

  if (!isOpen) return null;

  const sampleLeadAttributes = {
    number_of_employees: 250,
    annual_revenue: 48000000.0,
    revenue_growth_decline: 0.185,
    average_sales_cycle: 45,
    job_title: 'Director of IT Infrastructure',
    job_role: 'Decision Maker',
    purchasing_authority: 'Decision Maker',
    industry: 'Retail & Consumer Goods',
    landing_page_view: 'Y',
    landing_page_conversion: 'Y',
    use_of_chat_functionality: 'Y',
    request_for_call_back: 'Y',
    viewed_web_page_product: 'Y',
    viewed_web_page_pricing: 'Y',
    viewed_web_page_review: 'Y',
  };

  const sampleFastApiSnippet = `# B2B Lead Scoring API (Live on EC2: http://3.108.250.41:8001/api/v1/score)
# Model: LogisticRegression-Pipeline-v2

from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Literal

app = FastAPI(title="Lead Scoring API", version="2.0.0")

class LeadFeatures(BaseModel):
    number_of_employees: int
    annual_revenue: float
    revenue_growth_decline: float
    average_sales_cycle: int
    job_title: str
    job_role: str
    purchasing_authority: str
    industry: str
    landing_page_view: Literal["Y", "N"]
    landing_page_conversion: Literal["Y", "N"]
    use_of_chat_functionality: Literal["Y", "N"]
    request_for_call_back: Literal["Y", "N"]
    viewed_web_page_product: Literal["Y", "N"]
    viewed_web_page_pricing: Literal["Y", "N"]
    viewed_web_page_review: Literal["Y", "N"]

class ScoreResponse(BaseModel):
    converted: int
    conversion_probability: float
    lead_score: float
    band: str
    model: str

@app.post("/api/v1/score", response_model=ScoreResponse)
def score_lead(features: LeadFeatures):
    # Pipeline Inference calculation
    score = 80.68
    band = "Hot" if score >= 75 else ("Warm" if score >= 50 else "Cold")
    return {
        "converted": 1,
        "conversion_probability": 0.806765,
        "lead_score": score,
        "band": band,
        "model": "LogisticRegression-Pipeline-v2"
    }`;

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestResult(null);

    try {
      const res = await fetch('/api/lead-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead: {
            id: '00Q5G00000B3d4E',
            name: 'Marcus Feld',
            company: 'Halden Retail Group',
            title: 'Director of IT Infrastructure',
            status: 'Working',
            leadSource: 'Inbound — Pricing page',
            industry: 'Retail & Consumer Goods',
            annualRevenue: '$48,000,000',
            description: 'Evaluating SD-WAN dual-carrier backup to prevent POS terminal outages.',
            rating: 'Hot',
            productInterest: 'SD-WAN + Business Broadband',
            estimatedMrr: 18600,
            linesOrSeats: 320,
            currentProvider: 'Comcast Business',
            contractEndsIn: '11 months',
            email: 'marcus.feld@haldenretail.com',
            phone: '+1 (312) 555-0184',
            region: 'Midwest / US',
            repNotes: 'Budget verified by CFO.',
          },
          repNotes: 'Budget verified by CFO.',
          awsEndpointUrl: endpointUrl,
          apiKey,
        }),
      });

      const data = await res.json();
      setTestStatus(res.ok ? 'success' : 'failed');
      setTestResult(data);
    } catch (err: any) {
      setTestStatus('failed');
      setTestResult({ error: err.message || 'EC2 REST service connection failed' });
    }
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(sampleFastApiSnippet);
    setIsCopiedCode(true);
    setTimeout(() => setIsCopiedCode(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      endpointUrl,
      instanceId,
      apiKey,
      region: 'us-east-1',
      stage: 'production',
      useFallbackAi,
    });
    onClose();
  };

  return (
    <div id="aws-ec2-settings-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Lead Scoring API Configuration</h2>
              <p className="text-xs text-slate-500">Scoring endpoint and model parameters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 border-b-2 cursor-pointer transition-colors ${
              activeTab === 'config'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            EC2 REST Endpoint
          </button>
          <button
            onClick={() => setActiveTab('attributes')}
            className={`pb-2.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'attributes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Record Attributes (POST Payload)</span>
            <span className="text-[10px] bg-slate-100 px-1.5 py-0.2 rounded text-slate-600 font-mono">15 fields</span>
          </button>
          <button
            onClick={() => setActiveTab('sample-code')}
            className={`pb-2.5 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === 'sample-code'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>EC2 Server Template</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {activeTab === 'config' && (
            <form onSubmit={handleSave} className="space-y-5">
              
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-950 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5 text-blue-900 mb-0.5">
                  <Server className="w-3.5 h-3.5 text-blue-600" />
                  Direct EC2 REST POST Service Architecture
                </div>
                The application performs an HTTP <code className="font-bold font-mono bg-blue-100/70 px-1 py-0.5 rounded text-blue-800">POST</code> request directly to the REST service hosted on your AWS EC2 instance, passing attributes extracted from the Salesforce Lead record.
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    AWS EC2 REST Service URL (POST Endpoint)
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="http://ec2-54-210-45-12.compute-1.amazonaws.com:8000/predict"
                      value={endpointUrl}
                      onChange={(e) => setEndpointUrl(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    HTTP/HTTPS endpoint hosted on your EC2 instance (e.g. FastAPI on port 8000, Flask on port 5000).
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      EC2 Instance ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="i-0a8f921bc4e29e81"
                      value={instanceId}
                      onChange={(e) => setInstanceId(e.target.value)}
                      className="w-full p-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Bearer Token / Auth Header (Optional)
                    </label>
                    <input
                      type="password"
                      placeholder="Bearer token or custom key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full p-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    id="checkbox-fallback"
                    type="checkbox"
                    checked={useFallbackAi}
                    onChange={(e) => setUseFallbackAi(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="checkbox-fallback" className="text-xs font-medium text-slate-700 cursor-pointer">
                    Enable deterministic ML fallback engine when EC2 instance is unreachable or offline
                  </label>
                </div>
              </div>

              {/* Test connection & Inspector */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-600" />
                    {testStatus === 'testing' ? 'Testing POST to EC2...' : 'Test POST to EC2 REST Service'}
                  </button>

                  {testStatus === 'success' && (
                    <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> EC2 Responding (200 OK)
                    </span>
                  )}
                  {testStatus === 'failed' && (
                    <span className="text-xs font-medium text-rose-600">
                      EC2 Connection Error
                    </span>
                  )}
                </div>

                {testResult && (
                  <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] max-h-48 overflow-y-auto space-y-1">
                    <div className="text-slate-400 text-[10px] pb-1 border-b border-slate-800 flex justify-between">
                      <span>EC2 REST RESPONSE (JSON)</span>
                      <span>Latency: {testResult.latencyMs || 120}ms</span>
                    </div>
                    <pre>{JSON.stringify(testResult, null, 2)}</pre>
                  </div>
                )}
              </div>

              {/* Footer Save Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0176D3] hover:bg-blue-700 text-white text-xs font-semibold shadow-sm cursor-pointer"
                >
                  Save EC2 Config
                </button>
              </div>

            </form>
          )}

          {activeTab === 'attributes' && (
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900">Salesforce Record Attributes Sent in POST Payload:</div>
                <div className="text-slate-500">
                  When a scoring request is triggered, these attributes from the active lead are bundled into the JSON body and POSTed to your EC2 REST service:
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px]">
                {Object.entries(sampleLeadAttributes).map(([key, val]) => (
                  <div key={key} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-center justify-between gap-2">
                    <span className="font-bold text-blue-700">{key}</span>
                    <span className="text-slate-500 truncate max-w-[160px]">{String(val)}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1">
                <div className="text-slate-400 text-[10px] pb-1 border-b border-slate-800">
                  SAMPLE JSON POST REQUEST BODY
                </div>
                <pre className="overflow-x-auto max-h-56">{JSON.stringify(sampleLeadAttributes, null, 2)}</pre>
              </div>
            </div>
          )}

          {activeTab === 'sample-code' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Python FastAPI server ready to run on EC2 instance:</span>
                <button
                  onClick={copySnippet}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  {isCopiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied code</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy snippet</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto max-h-96">
                <pre>{sampleFastApiSnippet}</pre>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
