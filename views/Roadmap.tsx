import React, { useState } from 'react';
import { Button, Card, Icons } from '../components/ui';
import { ProjectIdea, RoadmapPhase } from '../types';
import { generateRoadmap } from '../services/geminiService';

interface RoadmapProps {
  idea: ProjectIdea;
  onNext: (roadmap: RoadmapPhase[], duration: '24h' | '48h') => void;
  onBack: () => void;
}

export const Roadmap: React.FC<RoadmapProps> = ({ idea, onNext, onBack }) => {
  const [loading, setLoading] = useState(false);

  const handleSelect = async (duration: '24h' | '48h') => {
    setLoading(true);
    try {
      const phases = await generateRoadmap(duration, idea);
      onNext(phases, duration);
    } catch (e) {
      console.error(e);
      alert("Failed to generate roadmap. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 text-center">
      <div className="flex justify-start">
         <Button variant="ghost" onClick={onBack} className="text-slate-400 hover:text-white">&larr; Back to Team</Button>
      </div>

      <div className="mb-8">
        <h2 className="text-3xl font-bold">Time is Ticking</h2>
        <p className="text-slate-400">Choose your hackathon duration. I'll build a realistic survival schedule.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <button
          onClick={() => handleSelect('24h')}
          disabled={loading}
          className="p-8 rounded-xl bg-gradient-to-br from-indigo-900/50 to-slate-900 border border-indigo-500/30 hover:border-indigo-500 transition-all hover:scale-105"
        >
          <h3 className="text-4xl font-extrabold text-white mb-2">24h</h3>
          <span className="text-indigo-300 uppercase text-xs font-bold tracking-wider">Sprint</span>
        </button>

        <button
          onClick={() => handleSelect('48h')}
          disabled={loading}
          className="p-8 rounded-xl bg-gradient-to-br from-emerald-900/50 to-slate-900 border border-emerald-500/30 hover:border-emerald-500 transition-all hover:scale-105"
        >
          <h3 className="text-4xl font-extrabold text-white mb-2">48h</h3>
          <span className="text-emerald-300 uppercase text-xs font-bold tracking-wider">Marathon</span>
        </button>
      </div>

      {loading && (
        <div className="mt-8">
           <p className="text-slate-400 animate-pulse">Consulting the timeline gods...</p>
        </div>
      )}
    </div>
  );
};