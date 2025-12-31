
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Brain, Sparkles, ArrowRight, FileSearch, ChartBar, MessageSquareQuote, Plus, Download, RefreshCw } from 'lucide-react';
import { analyzeReports } from './geminiService';
import { AnalysisResult, FileData } from './types';
import Dashboard from './components/Dashboard';
import ChatWindow from './components/ChatWindow';
import Uploader from './components/Uploader';

const FeatureCard: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
  <motion.div 
    whileHover={{ y: -5, backgroundColor: "rgba(255,255,255,0.8)" }}
    className="glass p-8 rounded-[32px] flex flex-col items-center text-center gap-4 transition-all shadow-sm border border-white/40"
  >
    <div className="w-12 h-12 bg-[#1A237E]/5 text-[#1A237E] rounded-2xl flex items-center justify-center">
      {icon}
    </div>
    <div className="space-y-1">
      <h4 className="font-black text-[#1A237E] text-lg tracking-tight leading-tight">{title}</h4>
      <p className="text-xs text-gray-500 font-semibold leading-relaxed">{desc}</p>
    </div>
  </motion.div>
);

const App: React.FC = () => {
  const [latestReport, setLatestReport] = useState<FileData | null>(null);
  const [previousReport, setPreviousReport] = useState<FileData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [explanationRequest, setExplanationRequest] = useState<string | null>(null);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  const dashboardRef = useRef<any>(null);

  useEffect(() => {
    if (analysisResult) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [analysisResult]);

  const handleStartAnalysis = async () => {
    if (!latestReport) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeReports(latestReport, previousReport || undefined);
      setAnalysisResult(result);
    } catch (error) {
      console.error("Analysis failed", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setLatestReport(null);
    setPreviousReport(null);
    setAnalysisResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExplain = (term: string) => {
    setExplanationRequest(`Can you explain what "${term}" means for my health?`);
  };

  const triggerExport = () => {
    if (dashboardRef.current?.handleDownloadPDF) {
      dashboardRef.current.handleDownloadPDF();
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col selection:bg-indigo-100 relative"
      onDragOver={(e) => { e.preventDefault(); setIsGlobalDragging(true); }}
      onDragLeave={() => setIsGlobalDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsGlobalDragging(false); }}
    >
      <div className="mesh-gradient" />
      
      <header className="fixed top-0 left-0 w-full px-6 md:px-10 py-4 bg-white/80 backdrop-blur-md shadow-[0_1px_3px_rgba(0,0,0,0.05)] flex justify-between items-center z-[100] no-print">
        <div className="flex items-center gap-3">
          <div className="bg-[#1A237E] p-2 rounded-xl shadow-lg">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tighter text-[#1A237E]">LabLens</h1>
        </div>

        <AnimatePresence>
          {analysisResult && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 md:gap-5"
            >
              <button 
                onClick={reset}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-[#1A237E] font-black text-[10px] uppercase tracking-widest border border-slate-200 hover:bg-slate-100 transition-all active:scale-95"
              >
                <RefreshCw className="w-3 h-3" />
                New Check
              </button>
              <button 
                onClick={triggerExport}
                className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[#1A237E] text-white font-black text-[10px] uppercase tracking-widest shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
              >
                <Download className="w-3 h-3" />
                Save Report
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence>
        {isGlobalDragging && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-[#1A237E]/40 backdrop-blur-lg flex items-center justify-center pointer-events-none"
          >
            <div className="text-center text-white space-y-6">
              <div className="w-24 h-24 md:w-32 md:h-32 bg-white/20 rounded-full flex items-center justify-center mx-auto border-4 border-dashed border-white/50 animate-pulse">
                <Plus size={48} />
              </div>
              <h2 className="text-2xl md:text-4xl font-black px-4">Drop to read your labs</h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 pt-16 pb-10">
        <AnimatePresence mode="wait">
          {!analysisResult ? (
            <motion.div 
              key="landing"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto px-6 py-2 md:py-6 flex flex-col items-center text-center"
            >
              <div className="space-y-1 mb-4">
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-[#1A237E]/10 shadow-sm mb-1"
                >
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#1A237E]">Personal Health Assistant</span>
                </motion.div>
                <h2 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter text-gradient">
                  Your Health, Decoded.
                </h2>
                <p className="text-xl md:text-2xl text-gray-500 font-medium max-w-2xl leading-relaxed mx-auto">
                  Upload your results to see the human story behind your numbers. 
                </p>
              </div>

              <div className="w-full max-w-5xl space-y-4 mb-8">
                <div className={`grid grid-cols-1 ${latestReport ? 'md:grid-cols-2' : 'max-w-xl mx-auto'} gap-4 items-stretch transition-all duration-700`}>
                  <div className="flex flex-col h-full">
                    <Uploader 
                      label="Upload Latest Report" 
                      onFileSelect={setLatestReport} 
                      selectedFile={latestReport}
                      isProcessing={isAnalyzing && !!latestReport}
                      variant="primary"
                    />
                  </div>
                  
                  {latestReport && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex flex-col h-full"
                    >
                      <Uploader 
                        label="Add a Past Checkup (Optional)" 
                        onFileSelect={setPreviousReport} 
                        selectedFile={previousReport}
                        isProcessing={isAnalyzing && !!previousReport}
                        glow={!previousReport}
                        variant="comparison"
                      />
                    </motion.div>
                  )}
                </div>

                <AnimatePresence>
                  {latestReport && !isAnalyzing && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center"
                    >
                      <button
                        onClick={handleStartAnalysis}
                        className="w-full max-w-lg py-4 rounded-[28px] md:rounded-[32px] text-lg font-black uppercase tracking-widest shadow-2xl flex items-center justify-center gap-4 transition-all bg-[#1A237E] text-white breathe-animation active:scale-95"
                      >
                        <Brain className="w-6 h-6" />
                        {previousReport ? 'See My Progress' : 'Read My Results'}
                        <ArrowRight className="w-6 h-6" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full opacity-90 scale-95 md:scale-100">
                <FeatureCard icon={<FileSearch size={24} />} title="Plain English" desc="Jargon-free translations into analogies you'll actually understand." />
                <FeatureCard icon={<ChartBar size={24} />} title="Progress Checks" desc="See how your health is changing over time." />
                <FeatureCard icon={<MessageSquareQuote size={24} />} title="Clear Answers" desc="Simple breakdowns of what your lab numbers mean for you." />
              </div>
            </motion.div>
          ) : (
            <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-4 md:px-8">
              <Dashboard ref={dashboardRef} analysis={analysisResult} latestName={latestReport?.name || ''} onTermClick={handleExplain} />
            </motion.div>
          )}
        </AnimatePresence>

        {analysisResult && (
          <ChatWindow 
            context={analysisResult} 
            externalRequest={explanationRequest}
            onClearRequest={() => setExplanationRequest(null)}
          />
        )}
      </main>
    </div>
  );
};

export default App;
