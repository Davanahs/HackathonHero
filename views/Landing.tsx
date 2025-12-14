import React from 'react';
import { Button, Icons } from '../components/ui';

interface LandingProps {
  onStart: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <div className="mb-8 p-4 bg-indigo-500/10 rounded-full ring-1 ring-indigo-500/50 animate-pulse">
        <Icons.Rocket />
      </div>
      <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 mb-6">
        HackathonHero
      </h1>
      <p className="max-w-2xl text-lg text-slate-400 mb-10 leading-relaxed">
        Ready to win? Let's turn that spark into a shipping product. 
        I'll guide you from zero to demo in record time with an AI-powered roadmap, team planner, and mentor.
      </p>
      <div className="flex gap-4">
        <Button onClick={onStart} className="text-lg px-8 py-4">
          Start Your Hackathon
        </Button>
      </div>
      
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-4xl w-full">
        <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
          <div className="text-indigo-400 mb-3"><Icons.Brain /></div>
          <h3 className="font-semibold text-white mb-2">Smart Ideation</h3>
          <p className="text-sm text-slate-400">Stuck? Generate a winning idea or refine your rough concept instantly.</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
          <div className="text-emerald-400 mb-3"><Icons.Map /></div>
          <h3 className="font-semibold text-white mb-2">Adaptive Roadmap</h3>
          <p className="text-sm text-slate-400">Get a 24h or 48h hour-by-hour schedule tailored to your features.</p>
        </div>
        <div className="p-6 rounded-2xl bg-slate-800/30 border border-slate-700/50">
          <div className="text-purple-400 mb-3"><Icons.Mic /></div>
          <h3 className="font-semibold text-white mb-2">Pitch Perfect</h3>
          <p className="text-sm text-slate-400">Generate a demo script and pitch outline to wow the judges.</p>
        </div>
      </div>
    </div>
  );
};