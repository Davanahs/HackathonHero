
import React, { useState, useEffect } from 'react';
import { AppState, AppStep, ProjectIdea, TeamPlan, RoadmapPhase } from './types';
import { Landing } from './views/Landing';
import { IdeaStage } from './views/IdeaStage';
import { TeamPlanning } from './views/TeamPlanning';
import { Roadmap } from './views/Roadmap';
import { Dashboard } from './views/Dashboard';
import { Card, Input, Button, Icons } from './components/ui';

const STORAGE_KEY = 'hackerhero_persisted_state';

const INITIAL_STATE: AppState = {
  currentStep: AppStep.LANDING,
  projectIdea: null,
  teamPlan: null,
  roadmap: [],
  hackathonDuration: '24h',
  chatHistory: []
};

const SettingsModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [key, setKey] = useState(localStorage.getItem('hackerhero_custom_key') || '');
  
  if (!isOpen) return null;

  const handleSave = () => {
    if (key.trim()) {
      localStorage.setItem('hackerhero_custom_key', key.trim());
      alert("Custom API Key saved! You now have unlimited requests. Your session will resume exactly where you left off.");
    } else {
      localStorage.removeItem('hackerhero_custom_key');
      alert("Custom key cleared. Returning to shared usage limit.");
    }
    onClose();
    window.location.reload(); 
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-10 relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
        <h3 className="text-2xl font-black text-slate-800 mb-2 manual-font">Judge/Bypass Settings</h3>
        <p className="text-sm text-slate-500 mb-8 font-medium">If the daily shared limit is exhausted, enter your own free Gemini API key here.</p>
        
        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-[#A696E7] uppercase tracking-widest block mb-2">Your Gemini API Key</label>
            <Input 
              type="password" 
              value={key} 
              onChange={(e: any) => setKey(e.target.value)} 
              placeholder="Paste AI key here..." 
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={handleSave} className="flex-1">Save Key</Button>
            {localStorage.getItem('hackerhero_custom_key') && (
              <Button variant="outline" onClick={() => { setKey(''); localStorage.removeItem('hackerhero_custom_key'); window.location.reload(); }}>Clear</Button>
            )}
          </div>
          <p className="text-[10px] text-center text-slate-400 font-bold uppercase tracking-wider">Your key is stored locally in your browser.</p>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // Initialize state from localStorage if it exists
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_STATE;
      }
    }
    return INITIAL_STATE;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Sync state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const nextStep = (step: AppStep) => {
    updateState({ currentStep: step });
  };

  const resetSession = () => {
    if (window.confirm("Are you sure? This will clear your current project and roadmap progress.")) {
      localStorage.removeItem(STORAGE_KEY);
      setState(INITIAL_STATE);
    }
  };

  const prevStep = () => {
    switch (state.currentStep) {
      case AppStep.IDEA: nextStep(AppStep.LANDING); break;
      case AppStep.TEAM: nextStep(AppStep.IDEA); break;
      case AppStep.ROADMAP: nextStep(AppStep.TEAM); break;
      default: break;
    }
  };

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case AppStep.LANDING:
        return <Landing onStart={() => nextStep(AppStep.IDEA)} />;
      case AppStep.IDEA:
        return (
          <IdeaStage 
            onNext={(idea) => updateState({ projectIdea: idea, currentStep: AppStep.TEAM })} 
            onBack={prevStep} 
            state={state}
          />
        );
      case AppStep.TEAM:
        return (
          <TeamPlanning 
            idea={state.projectIdea!} 
            onNext={(plan) => updateState({ teamPlan: plan, currentStep: AppStep.ROADMAP })} 
            onBack={prevStep} 
          />
        );
      case AppStep.ROADMAP:
        return (
          <Roadmap 
            idea={state.projectIdea!} 
            teamPlan={state.teamPlan!}
            onNext={(roadmap, duration) => updateState({ roadmap, hackathonDuration: duration, currentStep: AppStep.DASHBOARD })} 
            onBack={prevStep} 
          />
        );
      case AppStep.DASHBOARD:
        return <Dashboard state={state} onUpdateState={updateState} onReset={resetSession} />;
      default:
        return <div>Error: Invalid step</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#DCD6F7] text-slate-800 flex flex-col relative overflow-x-hidden">
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      
      {/* Floating Gear Icon */}
      <button 
        onClick={() => setIsSettingsOpen(true)}
        className="fixed top-6 right-6 z-[100] p-3 bg-white/60 hover:bg-white backdrop-blur-md rounded-2xl shadow-xl text-slate-400 hover:text-[#A696E7] transition-all group"
      >
        <div className="group-hover:rotate-90 transition-transform duration-500">
          <Icons.Settings />
        </div>
      </button>

      {/* Dynamic Background Accents */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-15%] right-[-10%] w-[50%] h-[50%] bg-white/40 blur-[120px] rounded-full"></div>
         <div className="absolute bottom-[-15%] left-[-10%] w-[50%] h-[50%] bg-[#A696E7]/30 blur-[120px] rounded-full"></div>
      </div>

      <div className="relative z-10 flex-1 p-4 md:p-12">
        {state.currentStep !== AppStep.DASHBOARD && state.currentStep !== AppStep.LANDING && (
          <div className="max-w-xl mx-auto mb-12">
            <div className="flex items-center justify-between text-[10px] font-black text-[#8B7EDC] uppercase tracking-[0.2em] mb-3 manual-font">
              <span>Mission Phase</span>
              <span>
                {state.currentStep === AppStep.IDEA ? '1/3' : 
                 state.currentStep === AppStep.TEAM ? '2/3' : '3/3'}
              </span>
            </div>
            <div className="h-2 w-full bg-white/30 rounded-full overflow-hidden border border-white/40 shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-[#A696E7] to-indigo-400 transition-all duration-700 ease-in-out"
                style={{ width: state.currentStep === AppStep.IDEA ? '33%' : state.currentStep === AppStep.TEAM ? '66%' : '100%' }}
              ></div>
            </div>
          </div>
        )}
        
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default App;
