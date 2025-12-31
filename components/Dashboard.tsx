
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, Info, Apple, Moon, Timer, 
  CheckCircle2, HelpCircle, Heart, 
  ShieldCheck, AlertCircle, Star, ChevronDown, ChevronUp,
  MessageSquare, Lightbulb, Stethoscope, Loader2, Sparkles, TrendingDown
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, LabelList
} from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { AnalysisResult, Biomarker, HealthStatus } from '../types';

interface DashboardProps {
  analysis: AnalysisResult;
  latestName: string;
  onTermClick: (term: string) => void;
}

const MedicalDisclaimer: React.FC = () => (
  <div className="max-w-7xl w-full mx-auto mb-10 bg-[#e8f5e9]/80 backdrop-blur-md border-l-[4px] border-[#2e7d32] p-6 rounded-r-2xl shadow-sm">
    <div className="flex items-start gap-4">
      <div className="w-10 h-10 bg-[#2e7d32] rounded-xl flex items-center justify-center shrink-0 shadow-sm mt-1">
        <ShieldCheck className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="text-[#1b5e20] font-black uppercase tracking-tight text-lg mb-1">MEDICAL INTERPRETATION NOTICE</h3>
        <p className="text-[#1b5e20] text-sm font-medium leading-relaxed opacity-90">
          LabLens is a translation tool to help you understand your reports. This is <strong>not</strong> medical advice or a diagnosis. Always talk to your doctor about these results.
        </p>
      </div>
    </div>
  </div>
);

const Dashboard = forwardRef((props: DashboardProps, ref) => {
  const { analysis, latestName, onTermClick } = props;
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const isTrendAnalysis = analysis.biomarkers.some(b => b.previousValue !== undefined);

  useImperativeHandle(ref, () => ({
    handleDownloadPDF: async () => {
      if (!dashboardRef.current) return;
      setIsDownloading(true);
      
      try {
        await new Promise(resolve => setTimeout(resolve, 800));
        const element = dashboardRef.current;
        const canvas = await html2canvas(element, {
          scale: 2, 
          useCORS: true,
          logging: false,
          backgroundColor: '#f8fafc',
          scrollX: 0,
          scrollY: 0,
          windowWidth: element.offsetWidth,
          windowHeight: element.scrollHeight,
          onclone: (clonedDoc) => {
            const animations = clonedDoc.querySelectorAll('.animate-spin, .animate-pulse');
            animations.forEach(a => (a as HTMLElement).style.display = 'none');
          }
        });
        
        const imgData = canvas.toDataURL('image/png');
        const pdfWidth = canvas.width / 2;
        const pdfHeight = canvas.height / 2;
        
        const pdf = new jsPDF({
          orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
          unit: 'px',
          format: [pdfWidth, pdfHeight]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`LabLens_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      } catch (error) {
        console.error('PDF Error:', error);
        alert('Failed to generate PDF.');
      } finally {
        setIsDownloading(false);
      }
    }
  }));

  const cleanText = (text: any) => {
    if (!text) return '';
    return String(text)
      .replace(/[\*\#]/g, '')
      .replace(/^["']|["']$/g, '')
      .replace(/["']/g, '')
      .trim();
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <div className="pb-0 overflow-visible">
      {isDownloading && (
        <div className="fixed inset-0 z-[200] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center no-print text-center">
          <Loader2 className="w-12 h-12 text-[#1A237E] animate-spin mb-4" />
          <h2 className="text-2xl font-black text-[#1A237E] uppercase tracking-widest px-4">Preparing High-Fidelity PDF...</h2>
        </div>
      )}

      <motion.div 
        ref={dashboardRef}
        variants={container} initial="hidden" animate="show" 
        className="max-w-7xl mx-auto space-y-12 pb-2"
      >
        <motion.div variants={item}>
          <MedicalDisclaimer />
          
          <div className="py-6 mb-8 border-b border-[#1A237E]/10 flex flex-col md:flex-row justify-between items-baseline gap-4">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-5xl font-black text-[#1A237E] tracking-tighter">
                {isTrendAnalysis ? "Health Evolution: " : "Clinical Summary: "} 
                {cleanText(analysis.patientName || latestName.split('.')[0] || "Patient Record")}
              </h2>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <p className="text-gray-400 font-black text-[10px] md:text-xs uppercase tracking-widest">
                  Report Date: {analysis.collectionDate || new Date().toLocaleDateString()}
                </p>
                {analysis.hospitalName && (
                  <p className="text-[#1A237E]/60 font-black text-[10px] md:text-xs uppercase tracking-widest">
                    Source: {cleanText(analysis.hospitalName)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* 1. Intelligence Verdict - 2 Sentence Focus */}
        <motion.div variants={item} className="max-w-7xl mx-auto p-8 md:p-12 rounded-[40px] bg-gradient-to-br from-[#1A237E] to-[#283593] text-white relative overflow-hidden shadow-2xl border border-white/10">
          <div className="relative z-10 w-full text-center">
            <div className="flex items-center justify-center gap-2 mb-4 opacity-70 uppercase tracking-[0.2em] text-[10px] font-black">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Intelligence Verdict
            </div>
            <h2 className="text-2xl md:text-3xl font-semibold mb-6 tracking-tight leading-tight">
              {cleanText(analysis.summary || 'Clinical Overview')}
            </h2>
            <div className="text-lg md:text-xl font-medium opacity-95 leading-relaxed">
              <p className="m-0">{cleanText(analysis.executiveSummary)}</p>
            </div>
          </div>
          <ActivityBackground />
        </motion.div>

        {/* 2. Key Observations */}
        <motion.div variants={item} className="glass p-1 rounded-[32px] shadow-xl">
          <div className="bg-white p-8 md:p-10 rounded-[28px] border border-white shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
              </div>
              <h3 className="text-2xl font-black text-[#1A237E] tracking-tighter uppercase">Vital Insights</h3>
            </div>
            
            <div className="space-y-8">
              <div className="bg-[#1A237E]/5 p-8 rounded-[24px] border border-[#1A237E]/10">
                <p className="text-xl font-bold text-[#1A237E] leading-relaxed">
                  {cleanText(analysis.bottomLine.main)}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <div className="space-y-4">
                  <span className="text-emerald-600 font-black uppercase tracking-[0.1em] text-[10px] px-1">Success Areas</span>
                  <div className="space-y-3">
                    {analysis.bottomLine.good.map((msg, i) => (
                      <div key={i} className="flex items-start gap-3 text-[#1A237E] font-semibold bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100/50">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-base">{cleanText(msg)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <span className="text-amber-600 font-black uppercase tracking-[0.1em] text-[10px] px-1">Next Goals</span>
                  <div className="space-y-3">
                    {analysis.bottomLine.watch.map((msg, i) => (
                      <div key={i} className="flex items-start gap-3 text-[#1A237E] font-semibold bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50">
                        <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                        <span className="text-base">{cleanText(msg)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 3. Marker Evolution - Independent Expansion via items-start */}
        <motion.div variants={item} className="space-y-8">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-3xl font-black text-[#1A237E] flex items-center gap-3 tracking-tighter uppercase">
              <Heart className="w-8 h-8 text-rose-500" /> 
              {isTrendAnalysis ? "Marker Evolution" : "Vital Metrics"}
            </h3>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{analysis.biomarkers.length} Markers</span>
          </div>
          <div className="biomarker-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            {analysis.biomarkers.map((bio, idx) => (
              <BiomarkerCard key={idx} bio={bio} onTermClick={onTermClick} isDownloading={isDownloading} />
            ))}
          </div>
        </motion.div>

        {/* 4. Protocols */}
        <motion.div variants={item} className="space-y-8 pt-12 border-t border-[#1A237E]/10">
          <h3 className="text-3xl font-black text-[#1A237E] flex items-center gap-3 px-2 tracking-tighter uppercase">
            <Info className="w-8 h-8 text-blue-500" /> Daily Habits
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            <LifestyleCard icon={<Apple className="w-6 h-6 text-emerald-600" />} title="Food & Diet" desc={cleanText(analysis.lifestyle.diet)} color="bg-emerald-50" />
            <LifestyleCard icon={<Moon className="w-6 h-6 text-indigo-600" />} title="Rest & Recovery" desc={cleanText(analysis.lifestyle.sleep)} color="bg-indigo-50" />
            <LifestyleCard icon={<Timer className="w-6 h-6 text-amber-600" />} title="Body Movement" desc={cleanText(analysis.lifestyle.exercise)} color="bg-amber-50" />
          </div>
        </motion.div>

        {/* 5. Prep for my Visit - Independent High-Contrast Capsules */}
        <motion.div variants={item} className="space-y-8 mt-12 pt-12 border-t border-[#1A237E]/10">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 bg-[#1A237E] rounded-xl flex items-center justify-center shadow-lg">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-3xl font-black text-[#1A237E] uppercase tracking-tighter">Prep for my Visit</h3>
          </div>

          <div className="flex flex-col gap-4">
            {analysis.doctorQuestions.map((q, idx) => (
              <div key={idx} className="bg-white rounded-[28px] border border-indigo-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row divide-y md:divide-y-0 overflow-hidden [page-break-inside:avoid]">
                {/* Left: Conversational Question */}
                <div className="p-8 flex-1 flex items-center gap-6">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                    <MessageSquare className="w-6 h-6 text-[#1A237E]" />
                  </div>
                  <p className="text-[#1A237E] font-black text-xl leading-tight">
                    {cleanText(q.question)}
                  </p>
                </div>
                
                {/* Right: Why this helps (High Contrast) */}
                <div className="p-8 md:w-[40%] bg-slate-50 flex items-center md:border-l border-indigo-100">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                      <Lightbulb className="w-4 h-4 text-[#1A237E]" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-1">Why this helps</span>
                      <p className="text-sm text-slate-700 font-medium italic leading-relaxed">
                        {cleanText(q.why)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
        
        <div className="h-2 no-print"></div>
      </motion.div>
    </div>
  );
});

const BiomarkerCard: React.FC<{bio: Biomarker, onTermClick: (t: string) => void, isDownloading: boolean}> = ({ bio, onTermClick, isDownloading }) => {
  // Independent isExpanded state per card
  const [isExpanded, setIsExpanded] = useState(false);
  const hasHistory = bio.previousValue !== undefined;
  
  const rangeValues = bio.range.split('-').map(v => parseFloat(v.trim().replace(/[^0-9.]/g, '')));
  const chartData = [{ name: 'Results', Previous: bio.previousValue || 0, Current: bio.currentValue }];

  const percentChange = hasHistory && bio.previousValue !== 0 ? ((bio.currentValue - bio.previousValue!) / bio.previousValue!) * 100 : null;

  const getStatusDisplay = () => {
    switch(bio.status) {
      case HealthStatus.NORMAL: return { label: 'Optimal', bg: 'bg-emerald-100', text: 'text-emerald-700' };
      case HealthStatus.HIGH: return { label: 'Above Range', bg: 'bg-amber-100', text: 'text-amber-700' };
      case HealthStatus.LOW: return { label: 'Below Range', bg: 'bg-sky-100', text: 'text-sky-700' };
      default: return { label: 'Focus Area', bg: 'bg-rose-100', text: 'text-rose-700' };
    }
  };

  const status = getStatusDisplay();
  const cleanText = (text: any) => String(text || '').replace(/[\*\#]/g, '').replace(/^["']|["']$/g, '').replace(/["']/g, '').trim();

  return (
    <div 
      className={`biomarker-card glass rounded-[32px] shadow-lg border-l-[12px] relative transition-all duration-300 overflow-hidden bg-white h-auto flex flex-col self-start [page-break-inside:avoid] ${
        bio.status === HealthStatus.HIGH ? 'border-amber-400' : 
        bio.status === HealthStatus.LOW ? 'border-sky-400' : 
        'border-emerald-400'
      }`}
    >
      <div className="p-6 flex flex-col h-full">
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="min-w-0 flex-1">
            <h4 className="text-xl font-black text-[#1A237E] leading-tight uppercase tracking-tighter truncate mb-1">{bio.name}</h4>
            <div className="flex flex-wrap gap-2">
               <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${status.bg} ${status.text}`}>
                {status.label}
              </span>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter self-center">
                Ref: {bio.range}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
             <div className="text-3xl font-black text-gray-900 tracking-tighter leading-none">{bio.currentValue}</div>
             <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{bio.unit}</div>
             {percentChange !== null && (
                <div className={`mt-1 flex items-center justify-end gap-1 text-[9px] font-black uppercase tracking-wider ${percentChange >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {percentChange >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {Math.abs(percentChange).toFixed(1)}% {percentChange >= 0 ? 'Increase' : 'Decrease'}
                </div>
              )}
          </div>
        </div>

        <div className="h-40 w-full bg-[#F8FAFC] rounded-[20px] p-4 mb-4 border border-gray-100 relative">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barGap={12} margin={{ top: 20, right: 10, left: -30, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" hide />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 700, fill: '#94A3B8'}} domain={['auto', 'auto']} />
              <Tooltip cursor={{fill: 'rgba(0,0,0,0.02)'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontSize: '10px'}} />
              {rangeValues.length === 2 && !isNaN(rangeValues[0]) && !isNaN(rangeValues[1]) && (
                <ReferenceArea y1={rangeValues[0]} y2={rangeValues[1]} fill="rgba(16, 185, 129, 0.05)" stroke="none" />
              )}
              {hasHistory && (
                <Bar name="Past" dataKey="Previous" fill="#94A3B8" radius={[4, 4, 0, 0]} barSize={25}>
                  <LabelList dataKey="Previous" position="top" offset={5} style={{ fill: '#94A3B8', fontSize: '8px', fontWeight: '800' }} />
                </Bar>
              )}
              <Bar name="Current" dataKey="Current" fill="#1A237E" radius={[4, 4, 0, 0]} barSize={25}>
                <LabelList dataKey="Current" position="top" offset={5} style={{ fill: '#1A237E', fontSize: '8px', fontWeight: '800' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-50/80 p-3 rounded-[16px] border border-gray-100 mb-4 flex-grow">
          <div className="text-[#1A237E] font-bold italic text-[13px] leading-relaxed">
            <span className="text-[#1A237E]/40 font-black uppercase text-[8px] block mb-1 tracking-[0.1em]">Simple Analogy</span>
            {cleanText(bio.analogy)}
          </div>
        </div>

        <div className="no-print mt-auto">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] bg-[#1A237E]/5 text-[#1A237E] hover:bg-[#1A237E]/10 transition-colors flex items-center justify-center gap-2 border border-[#1A237E]/5"
          >
            {isExpanded ? <>Close Detail <ChevronUp size={14} /></> : <>Read More <ChevronDown size={14} /></>}
          </button>
        </div>

        <AnimatePresence>
          {(isExpanded || isDownloading) && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }} 
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="mt-4 pt-4 border-t border-gray-100 space-y-4"
            >
              <p className="text-sm text-gray-700 leading-relaxed font-medium">{cleanText(bio.explanation)}</p>
              <div className="no-print">
                <button onClick={() => onTermClick(bio.name)} className="text-[9px] font-black text-indigo-500 hover:text-[#1A237E] flex items-center gap-2 transition-colors uppercase tracking-[0.1em]">
                  <HelpCircle size={14} /> Explain Mechanism
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const LifestyleCard: React.FC<{icon: React.ReactNode, title: string, desc: string, color: string}> = ({ icon, title, desc, color }) => (
  <div className={`p-8 rounded-[32px] ${color} flex gap-6 items-start border border-black/5 hover:shadow-xl transition-all duration-300 group h-auto self-start [page-break-inside:avoid]`}>
    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-md group-hover:scale-105 transition-transform">
      {icon}
    </div>
    <div className="flex-1">
      <h4 className="text-xl font-black text-[#1A237E] mb-2 leading-none tracking-tighter">{String(title)}</h4>
      <p className="text-sm text-gray-700 leading-relaxed font-semibold">{String(desc)}</p>
    </div>
  </div>
);

const ActivityBackground = () => (
  <div className="absolute top-0 right-0 w-2/3 h-full opacity-10 pointer-events-none no-print">
    <svg viewBox="0 0 400 200" className="w-full h-full">
      <path d="M0,120 L40,120 L50,40 L70,160 L85,120 L130,120 L140,90 L155,140 L170,120 L240,120 L255,20 L280,180 L300,120 L400,120" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round"/>
    </svg>
  </div>
);

export default Dashboard;
