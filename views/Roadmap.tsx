
import React, { useState } from 'react';
import { Button, Card, Icons, BackButton } from '../components/ui';
import { ProjectIdea, RoadmapPhase, TeamPlan } from '../types';
import { generateRoadmap } from '../services/geminiService';

interface RoadmapProps {
  idea: ProjectIdea;
  teamPlan: TeamPlan;
  onNext: (roadmap: RoadmapPhase[], duration: '24h' | '48h') => void;
  onBack: () => void;
}

export const Roadmap: React.FC<RoadmapProps> = ({ idea, teamPlan, onNext, onBack }) => {
  const [loading, setLoading] = useState(false);

  const handleSelect = async (duration: '24h' | '48h') => {
    setLoading(true);
    try {
      const phases = await generateRoadmap(duration, idea, teamPlan);
      onNext(phases, duration);
    } catch (e) {
      alert("Consultation failed. Re-initiating roadmap generation.");
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 text-center">
      <div className="text-left">
        <BackButton onClick={onBack} />
      </div>

      <div className="mb-12">
        <h2 className="text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">Timeline Execution</h2>
        <p className="text-slate-500 font-medium text-lg leading-relaxed">Select your operational timeframe. I'll engineer a high-velocity roadmap for success.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <button
          onClick={() => handleSelect('24h')}
          disabled={loading}
          className="p-12 rounded-3xl glass-surface border-b-8 border-indigo-400 hover:ring-2 hover:ring-indigo-400 transition-all hover:scale-[1.02] shadow-xl group"
        >
          <div className="text-[#8B7EDC] mb-2 font-black text-xs uppercase tracking-[0.3em]">Phase 1</div>
          <h3 className="text-5xl font-black text-slate-800 mb-2">24h</h3>
          <span className="text-slate-400 uppercase text-[10px] font-black tracking-widest group-hover:text-indigo-500">Rapid Prototyping</span>
        </button>

        <button
          onClick={() => handleSelect('48h')}
          disabled={loading}
          className="p-12 rounded-3xl glass-surface border-b-8 border-[#A696E7] hover:ring-2 hover:ring-[#A696E7] transition-all hover:scale-[1.02] shadow-xl group"
        >
          <div className="text-[#A696E7] mb-2 font-black text-xs uppercase tracking-[0.3em]">Phase 2</div>
          <h3 className="text-5xl font-black text-slate-800 mb-2">48h</h3>
          <span className="text-slate-400 uppercase text-[10px] font-black tracking-widest group-hover:text-[#A696E7]">Advanced Buildout</span>
        </button>
      </div>

      {loading && (
        <div className="mt-16 flex flex-col items-center">
           <div className="h-1.5 w-48 bg-white/30 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-[#A696E7] animate-[shimmer_2s_infinite]"></div>
           </div>
           <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Engineering Technical Phases...</p>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
};
