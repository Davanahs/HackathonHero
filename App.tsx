import React, { useState } from 'react';
import { AppState, AppStep, ProjectIdea, TeamPlan, RoadmapPhase } from './types';
import { Landing } from './views/Landing';
import { IdeaStage } from './views/IdeaStage';
import { TeamPlanning } from './views/TeamPlanning';
import { Roadmap } from './views/Roadmap';
import { Dashboard } from './views/Dashboard';

const INITIAL_STATE: AppState = {
  currentStep: AppStep.LANDING,
  projectIdea: null,
  teamPlan: null,
  roadmap: [],
  hackathonDuration: '24h'
};

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const nextStep = (step: AppStep) => {
    updateState({ currentStep: step });
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
            onNext={(roadmap, duration) => updateState({ roadmap, hackathonDuration: duration, currentStep: AppStep.DASHBOARD })} 
            onBack={prevStep} 
          />
        );
      case AppStep.DASHBOARD:
        return <Dashboard state={state} onReset={() => setState(INITIAL_STATE)} />;
      default:
        return <div>Error: Invalid step</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#DCD6F7] text-slate-800 flex flex-col relative overflow-x-hidden">
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