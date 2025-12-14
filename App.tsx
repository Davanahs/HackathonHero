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
      case AppStep.IDEA:
        nextStep(AppStep.LANDING);
        break;
      case AppStep.TEAM:
        nextStep(AppStep.IDEA);
        break;
      case AppStep.ROADMAP:
        nextStep(AppStep.TEAM);
        break;
      default:
        break;
    }
  };

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case AppStep.LANDING:
        return <Landing onStart={() => nextStep(AppStep.IDEA)} />;
      
      case AppStep.IDEA:
        return (
          <IdeaStage 
            onNext={(idea) => {
              updateState({ projectIdea: idea });
              nextStep(AppStep.TEAM);
            }}
            onBack={prevStep}
          />
        );

      case AppStep.TEAM:
        return (
          <TeamPlanning 
            idea={state.projectIdea!} 
            onNext={(plan) => {
              updateState({ teamPlan: plan });
              nextStep(AppStep.ROADMAP);
            }}
            onBack={prevStep}
          />
        );

      case AppStep.ROADMAP:
        return (
          <Roadmap 
            idea={state.projectIdea!}
            onNext={(roadmap, duration) => {
              updateState({ roadmap, hackathonDuration: duration });
              nextStep(AppStep.DASHBOARD);
            }}
            onBack={prevStep}
          />
        );

      case AppStep.DASHBOARD:
        return <Dashboard state={state} onReset={() => setState(INITIAL_STATE)} />;
      
      default:
        return <div>Error: Unknown step</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[100px] rounded-full"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="relative z-10 flex-1 p-4 md:p-8">
        {state.currentStep !== AppStep.DASHBOARD && state.currentStep !== AppStep.LANDING && (
          <div className="max-w-xl mx-auto mb-8">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
              <span>Setup Progress</span>
              <span>{state.currentStep === AppStep.IDEA ? '1/3' : state.currentStep === AppStep.TEAM ? '2/3' : '3/3'}</span>
            </div>
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-500 ease-out"
                style={{ 
                  width: state.currentStep === AppStep.IDEA ? '33%' : state.currentStep === AppStep.TEAM ? '66%' : '100%' 
                }}
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