import React, { useState } from 'react';
import { Button, Card, Input, Textarea, Icons, BackButton } from '../components/ui';
import { generateIdeaOptions, refineProjectIdea } from '../services/geminiService';
import { ProjectIdea, AppState } from '../types';

interface IdeaStageProps {
  onNext: (idea: ProjectIdea) => void;
  onBack: () => void;
  state?: AppState;
}

export const IdeaStage: React.FC<IdeaStageProps> = ({ onNext, onBack }) => {
  const [step, setStep] = useState<'SELECT_MODE' | 'INPUT_INTERESTS' | 'CHOOSE_IDEA' | 'INPUT_RAW'>('SELECT_MODE');
  const [interests, setInterests] = useState('');
  const [tech, setTech] = useState('');
  const [frustration, setFrustration] = useState('');
  const [options, setOptions] = useState<ProjectIdea[]>([]);
  const [rawInput, setRawInput] = useState('');
  const [devPrefs, setDevPrefs] = useState('');
  const [showExpert, setShowExpert] = useState(false);
  const [loading, setLoading] = useState(false);

  const customKey = localStorage.getItem('hackerhero_apikey');

  const handleError = (e: any, context: string) => {
    console.error(`Gemini API Error (${context}):`, e);
    const msg = e.message || "";
    if (msg.includes("API_KEY_MISSING")) {
      alert("API Key is missing. Please set it in the Settings (top right gear icon).");
    } else if (msg.includes("API key not valid")) {
      alert("The API Key provided is invalid. Please double-check it in Netlify or your settings.");
    } else {
      alert(`Error during ${context}: ${msg || "Unknown error"}. Check the browser console (F12) for details.`);
    }
  };

  const handleGen = async () => {
    setLoading(true);
    try {
      const ideas = await generateIdeaOptions(interests, tech, frustration, customKey);
      setOptions(ideas.map(i => ({ ...i, developerPreferences: devPrefs })));
      setStep('CHOOSE_IDEA');
    } catch (e: any) {
      handleError(e, "generating ideas");
    } finally { setLoading(false); }
  };

  const handleRefine = async () => {
    setLoading(true);
    try {
      const idea = await refineProjectIdea(rawInput, devPrefs, customKey);
      onNext(idea);
    } catch (e: any) {
      handleError(e, "refining idea");
    } finally { setLoading(false); }
  };

  if (step === 'SELECT_MODE') return (
    <div className="max-w-4xl mx-auto py-12">
      <BackButton onClick={onBack} />
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight manual-font">How shall we begin <span className="text-[#A696E7]">?</span></h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <button onClick={() => setStep('INPUT_INTERESTS')} className="p-10 rounded-3xl glass-surface text-left group transition-all hover:ring-2 hover:ring-[#A696E7] hover:bg-white shadow-xl">
          <div className="p-4 bg-indigo-50 rounded-xl w-fit mb-6 text-[#A696E7] shadow-sm"><Icons.Sparkles /></div>
          <h3 className="text-2xl font-bold mb-3 text-slate-800 manual-font">I need a spark</h3>
          <p className="text-slate-500 font-medium text-sm leading-relaxed">I'll brainstorm 3 unique, practical concepts based on your favorite tech stack.</p>
        </button>
        <button onClick={() => setStep('INPUT_RAW')} className="p-10 rounded-3xl glass-surface text-left group transition-all hover:ring-2 hover:ring-indigo-300 hover:bg-white shadow-xl">
          <div className="p-4 bg-indigo-50 rounded-xl w-fit mb-6 text-[#A696E7] shadow-sm"><Icons.Brain /></div>
          <h3 className="text-2xl font-bold mb-3 text-slate-800 manual-font">I have the vision</h3>
          <p className="text-slate-500 font-medium text-sm leading-relaxed">Paste your rough draft or bullet points. I'll transform it into a professional build plan.</p>
        </button>
      </div>
    </div>
  );

  if (step === 'INPUT_INTERESTS') return (
    <div className="max-w-xl mx-auto py-12">
      <BackButton onClick={setStep.bind(null, 'SELECT_MODE')} />
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-slate-800 tracking-tight manual-font">Sketch your <span className="text-[#A696E7]">world</span></h2>
      </div>
      <Card>
        <div className="space-y-6">
          <div><label className="text-[10px] font-black text-[#A696E7] uppercase tracking-widest block mb-2">My Interests</label><Input value={interests} onChange={(e: any) => setInterests(e.target.value)} placeholder="e.g. AI, Music, Social Good" /></div>
          <div><label className="text-[10px] font-black text-[#A696E7] uppercase tracking-widest block mb-2">Primary Tech</label><Input value={tech} onChange={(e: any) => setTech(e.target.value)} placeholder="e.g. React, Tailwind, Python" /></div>
          <div><label className="text-[10px] font-black text-[#A696E7] uppercase tracking-widest block mb-2">A Frustration</label><Input value={frustration} onChange={(e: any) => setFrustration(e.target.value)} placeholder="e.g. Can't track local library books" /></div>
          
          <div className="pt-2">
            <button onClick={() => setShowExpert(!showExpert)} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-[#A696E7] transition-all">
              <Icons.Settings /> {showExpert ? 'Hide Expert Preferences' : 'Add Expert Preferences'}
            </button>
            {showExpert && (
              <div className="mt-4 animate-fade-in">
                <label className="text-[10px] font-black text-[#A696E7] uppercase tracking-widest block mb-2">Custom Preferences</label>
                <Input value={devPrefs} onChange={(e: any) => setDevPrefs(e.target.value)} placeholder="e.g. Clean architecture, use TypeScript..." />
              </div>
            )}
          </div>

          <Button onClick={handleGen} isLoading={loading} className="w-full mt-4 py-4">Draft Ideas</Button>
        </div>
      </Card>
    </div>
  );

  if (step === 'CHOOSE_IDEA') return (
    <div className="max-w-6xl mx-auto py-12">
      <BackButton onClick={setStep.bind(null, 'INPUT_INTERESTS')} />
      <h2 className="text-3xl font-black text-slate-800 mb-10 tracking-tight text-center manual-font">Pick your Path</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {options.map((idea, i) => (
          <Card key={i} className="flex flex-col h-full hover:ring-2 hover:ring-[#A696E7] transition-all cursor-pointer">
            <h3 className="text-xl font-bold mb-4 text-[#8B7EDC] leading-tight manual-font">{idea.title}</h3>
            <p className="text-sm font-medium text-slate-500 mb-10 flex-1 leading-relaxed">{idea.problem}</p>
            <div className="mt-auto">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#A696E7] mb-2 block">Key Features</span>
              <div className="flex flex-wrap gap-2 mb-6">
                {idea.coreFeatures.slice(0, 3).map((f, idx) => (
                  <span key={idx} className="bg-[#A696E7]/5 text-[#8B7EDC] px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-[#A696E7]/10">{f}</span>
                ))}
              </div>
              <Button onClick={(e: any) => { e.stopPropagation(); onNext(idea); }} className="w-full">Select Project</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-12">
      <div className="mb-4">
        <BackButton onClick={setStep.bind(null, 'SELECT_MODE')} />
      </div>
      
      <div className="text-center mb-10">
        <h2 className="text-5xl font-black text-slate-800 tracking-tight manual-font">
          The <span className="text-[#A696E7]">Masterplan</span>
        </h2>
      </div>

      <Card className="!p-0 overflow-hidden shadow-2xl border-white/80">
        <div className="p-12 pb-6">
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 p-4 mb-8">
            <Textarea 
              className="!border-0 !bg-transparent !shadow-none !min-h-[300px] text-xl font-medium text-slate-700 placeholder:text-slate-200 focus:ring-0 leading-relaxed" 
              value={rawInput} 
              onChange={(e: any) => setRawInput(e.target.value)} 
              placeholder="Example: I want to build a real-time collaborative code editor..." 
            />
          </div>
          
          <div className="flex items-center gap-4 mb-10">
            <button onClick={() => setShowExpert(!showExpert)} className="flex items-center gap-2 text-[11px] font-black text-[#A696E7] hover:text-[#8B7EDC] transition-all uppercase tracking-widest">
              <Icons.Settings /> {showExpert ? 'Hide Tech Style' : 'Add Tech Style'}
            </button>
            {showExpert && (
              <div className="flex-1 animate-fade-in">
                <Input 
                  value={devPrefs} 
                  onChange={(e: any) => setDevPrefs(e.target.value)} 
                  placeholder="e.g. Tailwind + Framer Motion..." 
                  className="!py-2 !px-4 text-xs h-10"
                />
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={handleRefine} 
          disabled={loading || !rawInput.trim()}
          className="w-full py-10 bg-gradient-to-r from-[#A696E7] to-[#8B7EDC] text-white font-black text-3xl uppercase tracking-[0.25em] hover:brightness-105 transition-all disabled:opacity-50 flex items-center justify-center gap-4 shadow-2xl"
        >
          {loading ? "Architecting..." : "Refine Technical Steps"}
        </button>
      </Card>
    </div>
  );
};