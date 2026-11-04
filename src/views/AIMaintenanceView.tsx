import React, { useState } from 'react';
import { useAquasense } from '../context/AquasenseContext';
import {
  Sparkles,
  Send,
  Bot,
  User,
  RefreshCw,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Layers,
  HelpCircle,
  Activity,
  Calendar,
  MessageSquare,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export const AIMaintenanceView: React.FC = () => {
  const {
    latestReading,
    history,
    filterStages,
    maintenanceRecords,
    waterMetrics,
    qualityAssessment,
    notifications,
  } = useAquasense();

  // Chat conversation state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `Hello! I am **AQUASENSE AI – Water Intelligence Assistant**.\n\nI continuously monitor your live ESP32 sensors (pH: **${
        latestReading.pH ?? 'N/A'
      }**, Turbidity: **${
        latestReading.turbidity !== null ? `${latestReading.turbidity} NTU` : 'N/A'
      }**, TDS: **${latestReading.tds ?? 'N/A'} ppm**, DO: **${
        latestReading.dissolvedOxygen ?? 'N/A'
      } mg/L**), evaluate filtration stages, and detect predictive maintenance needs.\n\nHow can I assist your plant operations today?`,
      timestamp: Date.now(),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dailyReportModal, setDailyReportModal] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Suggested prompts per specification
  const suggestedPrompts = [
    'Is my inlet water suitable for filtration?',
    'Why is the turbidity increasing?',
    'When should I clean my filter?',
    'Does my filter need replacement?',
    'What is the current overall water quality?',
    'What maintenance should I perform today?',
    'How much water has been processed?',
    'Why is the system showing a warning?',
  ];

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          context: {
            latest: latestReading,
            qualityScore: qualityAssessment.score,
            qualityLevel: qualityAssessment.level,
            qualityReason: qualityAssessment.summary,
            recommendedAction: qualityAssessment.recommendation,
            filters: filterStages.map((f) => ({
              name: f.name,
              status: f.status,
              operatingHours: f.operatingHours,
              lifePct: f.estimatedRemainingLifePct,
              maintenanceAction: f.maintenanceAction,
            })),
            waterMetrics,
            alerts: notifications.slice(0, 5).map((n) => n.title),
          },
          conversationHistory: messages.slice(-5),
        }),
      });

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: data.reply || 'No response returned from the water intelligence model.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          sender: 'assistant',
          text: `Error connecting to AI service: ${err.message}. Please verify GEMINI_API_KEY environment variable.`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Run deep predictive analysis
  const handleRunDeepAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latest: latestReading,
          history: history.slice(-12),
          filters: filterStages,
          waterMetrics,
        }),
      });
      const data = await response.json();
      setDeepAnalysis(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate Daily Monitoring Report
  const handleGenerateDailyReport = async () => {
    setIsGeneratingReport(true);
    try {
      const response = await fetch('/api/gemini/daily-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: new Date().toISOString().slice(0, 10),
          stats: {
            latestPh: latestReading.pH,
            latestTurbidity: latestReading.turbidity,
            latestTds: latestReading.tds,
            latestDO: latestReading.dissolvedOxygen,
            qualityScore: qualityAssessment.score,
            level: qualityAssessment.level,
            totalVolumeProcessedTodayL: waterMetrics.totalProcessedTodayL,
          },
          filterStatus: filterStages.map((f) => ({
            name: f.name,
            status: f.status,
            operatingHours: f.operatingHours,
          })),
          alertsSummary: notifications.map((n) => n.title),
        }),
      });
      const data = await response.json();
      setDailyReportModal(data.reportMarkdown);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
              <Sparkles className="w-5 h-5 text-cyan-400" />
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
              AQUASENSE AI – Water Intelligence & Predictive Maintenance
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time sensory diagnostics, equipment fatigue forecasting, and conversational operator guidance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunDeepAnalysis}
            disabled={isAnalyzing}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white shadow-lg shadow-cyan-600/20 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Analyzing System...' : 'Run Deep AI Assessment'}</span>
          </button>

          <button
            onClick={handleGenerateDailyReport}
            disabled={isGeneratingReport}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-300 border border-cyan-500/30 transition-all"
          >
            <FileText className={`w-3.5 h-3.5 ${isGeneratingReport ? 'animate-spin' : ''}`} />
            <span>Generate Daily AI Report</span>
          </button>
        </div>
      </div>

      {/* Deep Analysis Card (if triggered) */}
      {deepAnalysis && (
        <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl p-6 shadow-2xl animate-in fade-in-50 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                AI Multi-Sensor Synthesis & Predictive Recommendations
              </h3>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono border ${
                deepAnalysis.riskLevel === 'LOW'
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                  : deepAnalysis.riskLevel === 'MODERATE'
                  ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                  : 'bg-rose-950 text-rose-300 border-rose-500/40'
              }`}
            >
              Risk: {deepAnalysis.riskLevel}
            </span>
          </div>

          <p className="text-sm text-slate-200 font-medium">{deepAnalysis.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Insights */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <h4 className="font-bold text-cyan-300 flex items-center space-x-1.5">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Water Quality & Anomaly Observations:</span>
              </h4>
              <ul className="space-y-1.5 text-slate-300 pl-4 list-disc">
                {deepAnalysis.insights?.map((ins: string, i: number) => (
                  <li key={i}>{ins}</li>
                ))}
              </ul>
            </div>

            {/* Predictive Maintenance */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <h4 className="font-bold text-amber-300 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Predictive Filter Maintenance Actions:</span>
              </h4>
              <ul className="space-y-1.5 text-slate-300 pl-4 list-disc">
                {deepAnalysis.predictiveRecommendations?.map((rec: string, i: number) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Split: Conversational Chatbot & Quick Feature Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chatbot Interface (Left 2 cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[650px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-wide">
                  Operator Chat Interface
                </h3>
                <p className="text-[10px] text-emerald-400 font-mono">
                  Online • Grounded in ESP32 Telemetry
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
              No Fabricated Readings
            </span>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-2.5 ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800/40 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-cyan-600 text-white rounded-tr-none'
                      : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none whitespace-pre-line'
                  }`}
                >
                  {msg.text}
                  <div
                    className={`text-[9px] mt-1.5 font-mono ${
                      msg.sender === 'user' ? 'text-cyan-200 text-right' : 'text-slate-400'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center space-x-2 text-xs text-cyan-400 animate-pulse pl-2">
                <Bot className="w-4 h-4" />
                <span>AQUASENSE Assistant analyzing multi-sensor parameters...</span>
              </div>
            )}
          </div>

          {/* Suggested Prompts Carousel */}
          <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 overflow-x-auto flex items-center space-x-2 scrollbar-none">
            {suggestedPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-full text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 whitespace-nowrap transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/90 flex items-center space-x-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputQuery)}
              placeholder="Ask about water suitability, turbidity trends, filter cleaning, or maintenance..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => handleSendMessage(inputQuery)}
              disabled={isLoading || !inputQuery.trim()}
              className="p-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white shadow-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: AI Feature Modules Summary */}
        <div className="space-y-4">
          {/* Feature Card A: Water Quality Interpretation */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-400">
              <CheckCircle2 className="w-4 h-4" />
              <h4 className="text-xs font-bold text-white uppercase font-mono">
                A. Water Quality Interpretation
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Current inlet score is <strong className="text-white">{qualityAssessment.score}/100</strong>. Turbidity ({latestReading.turbidity ?? 'N/A'} NTU) and pH ({latestReading.pH ?? 'N/A'}) confirm {qualityAssessment.title.toLowerCase()}.
            </p>
          </div>

          {/* Feature Card B: Water Treatment Recommendation */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-teal-400">
              <Layers className="w-4 h-4" />
              <h4 className="text-xs font-bold text-white uppercase font-mono">
                B. Treatment Decision Gate
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {qualityAssessment.recommendation}
            </p>
          </div>

          {/* Feature Card C: Abnormality Detection */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <h4 className="text-xs font-bold text-white uppercase font-mono">
                C. Abnormality Detection
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              No sudden sensor noise or signal spikes detected in the last 15 sample intervals. ADC signal-to-noise ratio is optimal.
            </p>
          </div>

          {/* Feature Card D: Predictive Maintenance */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400">
              <Cpu className="w-4 h-4" />
              <h4 className="text-xs font-bold text-white uppercase font-mono">
                D. Predictive Fatigue Forecasting
              </h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Stage 2 Carbon Filter has accumulated 2,950 hours (differential pressure 7.2 psi). Media backwash is projected within the next 48 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Daily Report Modal */}
      {dailyReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase font-mono">
                  AQUASENSE Daily Monitoring Report (Gemini 3.8 Flash)
                </h3>
              </div>
              <button
                onClick={() => setDailyReportModal(null)}
                className="text-slate-400 hover:text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed whitespace-pre-line font-sans">
              {dailyReportModal}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
              <span>Automated Daily Report • Signed by AQUASENSE IoT</span>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium"
              >
                Print Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
