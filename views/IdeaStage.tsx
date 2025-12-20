import React, { useState } from 'react';
import { Button, Card, Input, Textarea, Icons, BackButton } from '../components/ui';
import { generateIdeaOptions, refineProjectIdea } from '../services/geminiService';
import { ProjectIdea } from '../types';

interface IdeaStageProps {
  onNext: (idea: ProjectIdea) => void;
  onBack: () => void;
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

  const handleGen = async () => {
    setLoading(true);
    try {
      const ideas = await generateIdeaOptions(interests, tech, frustration);
      setOptions(ideas.map(i => ({ ...i, developerPreferences: devPrefs })));
      setStep('CHOOSE_IDEA');
    } finally { setLoading(false); }
  };

  const handleRefine = async () => {
    setLoading(true);
    try {
      const idea = await refineProjectIdea(rawInput, devPrefs);
      onNext(idea);
    } finally { setLoading(false); }
  };

  if (step === 'SELECT_MODE') return (
    <div className="max-w-4xl mx-auto py-12">
      <BackButton onClick={onBack} />
      <h2 className="text-4xl font-black text-slate-800 mb-12 tracking-tight manual-font">How shall we begin <span className="text-[#A696E7]">?</span></h2>
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
      <Card title="Sketch your world">
        <div className="space-y-6">
          <div><label className="text-[10px] font-black text-[#A696E7] uppercase tracking-widest block mb-2">My Interests</label><Input value={interests} onChange={e => setInterests(e.target.value)} placeholder="e.g. AI, Music, Social Good" /></div>
          <div><label className="text-[10px] font-black text-[#A696E7] uppercase tracking-widest block mb-2">Primary Tech</label><Input value={tech} onChange={e => setTech(e.target.value)} placeholder="e.g. React, Tailwind, Python" /></div>
          <div><label className="text-[10px] font-black text-[#A696E7] uppercase tracking-widest block mb-2">A Frustration</label><Input value={frustration} onChange={e => setFrustration(e.target.value)} placeholder="e.g. Can't track local library books" /></div>
          
          <div className="pt-2">
            <button onClick={() => setShowExpert(!showExpert)} className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-[#A696E7] transition-all">
              <Icons.Settings /> {showExpert ? 'Hide Expert Preferences' : 'Add Expert Preferences'}
            </button>
            {showExpert && (
              <div className="mt-4 animate-fade-in">
                <label className="text-[10px] font-black text-[#A696E7] uppercase tracking-widest block mb-2">Custom Preferences</label>
                <Input value={devPrefs} onChange={e => setDevPrefs(e.target.value)} placeholder="e.g. Clean architecture, use TypeScript..." />
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
                {idea.coreFeatures.slice(0, 2).map((f, idx) => (
                  <span key={idx} className="bg-white/50 px-2 py-1 rounded text-[10px] border border-slate-100">{f}</span>
                ))}
              </div>
              <Button onClick={(e) => { e.stopPropagation(); onNext(idea); }} className="w-full">Select Project</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-[1200px] mx-auto py-12">
      <BackButton onClick={setStep.bind(null, 'SELECT_MODE')} />
      <Card title="The Masterplan" className="!px-12 py-10">
        <p className="text-sm text-slate-500 mb-6 font-medium">Dump your idea here. Features, goals, vibe... I'll analyze the scope and help you polish it into a technical build plan.</p>
        <Textarea 
          className="font-medium text-slate-700 !min-h-[140px] w-full !bg-white shadow-xl border-slate-200 text-lg p-8 scrollbar-thin" 
          value={rawInput} 
          onChange={e => setRawInput(e.target.value)} 
          placeholder="Prompt 1: Problem-Solution Clarity “I have an idea for a hackathon project...”" 
        />
        
        <div className="mt-8 flex items-center justify-between">
          <button onClick={() => setShowExpert(!showExpert)} className="flex items-center gap-2 text-[11px] font-black text-slate-400 hover:text-[#A696E7] transition-all uppercase tracking-widest">
            <Icons.Settings /> {showExpert ? 'Hide Preferences' : 'Add Tech Style (TypeScript, UI Library, etc)'}
          </button>
          {showExpert && (
            <div className="flex-1 ml-6 animate-fade-in">
              <Input 
                value={devPrefs} 
                onChange={e => setDevPrefs(e.target.value)} 
                placeholder="Style preferences (e.g. Tailwind + Framer Motion)..." 
                className="py-2 text-xs"
              />
            </div>
          )}
        </div>

        <Button onClick={handleRefine} isLoading={loading} className="w-full mt-10 py-5 shadow-2xl text-xl uppercase tracking-widest font-black">Refine Into Technical Steps</Button>
      </Card>
    </div>
  );
};