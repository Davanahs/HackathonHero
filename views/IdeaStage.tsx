import React, { useState } from 'react';
import { Button, Card, Input, Textarea, Icons } from '../components/ui';
import { generateIdeaOptions, refineProjectIdea } from '../services/geminiService';
import { ProjectIdea } from '../types';

interface IdeaStageProps {
  onNext: (idea: ProjectIdea) => void;
  onBack: () => void;
}

type WizardStep = 'SELECT_MODE' | 'INPUT_INTERESTS' | 'CHOOSE_IDEA' | 'INPUT_RAW';

export const IdeaStage: React.FC<IdeaStageProps> = ({ onNext, onBack }) => {
  const [step, setStep] = useState<WizardStep>('SELECT_MODE');
  
  // State for "Help Me" flow
  const [interests, setInterests] = useState('');
  const [tech, setTech] = useState('');
  const [frustration, setFrustration] = useState('');
  const [generatedOptions, setGeneratedOptions] = useState<ProjectIdea[]>([]);

  // State for "Refine" flow
  const [rawInput, setRawInput] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Generate Options Flow
  const handleGenerateOptions = async () => {
    if (!interests || !tech) return;
    setLoading(true);
    setError('');
    try {
      const ideas = await generateIdeaOptions(interests, tech, frustration);
      setGeneratedOptions(ideas);
      setStep('CHOOSE_IDEA');
    } catch (e) {
      setError("Failed to generate ideas. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Refine Single Idea Flow
  const handleRefine = async () => {
    if (!rawInput.trim()) return;
    setLoading(true);
    setError('');
    try {
      const idea = await refineProjectIdea(rawInput);
      onNext(idea);
    } catch (e) {
      setError("Failed to refine idea. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // --- RENDERERS ---

  if (step === 'SELECT_MODE') {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
        <Button variant="ghost" onClick={onBack} className="mb-4 text-slate-400 hover:text-white">&larr; Back</Button>
        <h2 className="text-3xl font-bold text-center mb-8">Let's find your mission</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:border-indigo-500 cursor-pointer transition-colors group h-full" title="">
             <div onClick={() => setStep('INPUT_INTERESTS')} className="h-full flex flex-col items-center text-center p-6">
                <div className="bg-indigo-500/20 p-6 rounded-full text-indigo-400 mb-6 group-hover:scale-110 transition-transform">
                  <Icons.Sparkles />
                </div>
                <h3 className="text-2xl font-bold mb-3">Help me find an idea</h3>
                <p className="text-slate-400">Answer 3 simple questions and I'll give you 3 winning concepts.</p>
             </div>
          </Card>
          <Card className="hover:border-emerald-500 cursor-pointer transition-colors group h-full" title="">
             <div onClick={() => setStep('INPUT_RAW')} className="h-full flex flex-col items-center text-center p-6">
                <div className="bg-emerald-500/20 p-6 rounded-full text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                  <Icons.Brain />
                </div>
                <h3 className="text-2xl font-bold mb-3">I have an idea</h3>
                <p className="text-slate-400">Paste your rough concept. I'll structure it into a buildable plan.</p>
             </div>
          </Card>
        </div>
      </div>
    );
  }

  if (step === 'INPUT_INTERESTS') {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => setStep('SELECT_MODE')}>&larr; Back</Button>
        <Card>
          <h2 className="text-2xl font-bold mb-6">Tell me about you</h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">1. What interests you?</label>
              <Input 
                value={interests} 
                onChange={(e) => setInterests(e.target.value)} 
                placeholder="e.g. Gaming, Environment, Finance, Music..." 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">2. What tech do you love?</label>
              <Input 
                value={tech} 
                onChange={(e) => setTech(e.target.value)} 
                placeholder="e.g. React, Python, ThreeJS, Blockchain..." 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">3. What real-world problem frustrates you?</label>
              <Input 
                value={frustration} 
                onChange={(e) => setFrustration(e.target.value)} 
                placeholder="e.g. Finding parking, keeping plants alive..." 
              />
            </div>
            <Button className="w-full mt-4" onClick={handleGenerateOptions} isLoading={loading}>
              Generate 3 Ideas
            </Button>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'CHOOSE_IDEA') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
           <Button variant="ghost" onClick={() => setStep('INPUT_INTERESTS')}>&larr; Edit Inputs</Button>
           <h2 className="text-xl font-bold">Pick your winner</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {generatedOptions.map((idea, idx) => (
            <Card key={idx} className="flex flex-col h-full hover:border-indigo-500 transition-colors">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-indigo-400 mb-3">{idea.title}</h3>
                <p className="text-sm text-slate-300 mb-4 font-medium">{idea.problem}</p>
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Key Features</p>
                  <ul className="text-sm text-slate-400 list-disc list-inside">
                    {idea.coreFeatures.slice(0, 3).map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              </div>
              <Button className="w-full mt-6" onClick={() => onNext(idea)}>
                Select this Idea
              </Button>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Refine Mode (Raw Input)
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" onClick={() => setStep('SELECT_MODE')}>&larr; Back</Button>
      </div>
      
      <Card className="p-8 border-emerald-500/30">
        <h2 className="text-3xl font-extrabold mb-8 text-emerald-400">Pitch your raw idea</h2>
        
        <div className="space-y-6">
          <label className="block text-2xl font-extrabold text-white tracking-tight">
            Describe what you want to build...
          </label>
          <Textarea 
            value={rawInput} 
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="Don't hold back. Tell me about the features, the user, the vibe.
Example: 'I want to build a real-time collaborative code editor for kids that uses blocks but exports to Python. It needs a dark mode and badges for achievements...'"
            className="min-h-[350px] text-lg p-6 leading-relaxed bg-slate-900/50 border-slate-600 focus:border-emerald-500 transition-all rounded-xl w-full"
          />
          
          {error && <p className="text-red-400 text-sm">{error}</p>}
          
          <Button 
            className="w-full text-lg py-4 font-bold" 
            onClick={handleRefine}
            isLoading={loading}
            variant="secondary"
          >
            Structure My Plan
          </Button>
        </div>
      </Card>
    </div>
  );
};