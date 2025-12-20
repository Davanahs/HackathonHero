import React from 'react';
import { Button, Icons } from '../components/ui';

interface LandingProps {
  onStart: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-4 max-w-5xl mx-auto">
      <div className="mb-10 p-5 bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-white">
        <div className="text-[#A696E7] animate-bounce">
          <Icons.Rocket />
        </div>
      </div>
      
      <h1 className="text-6xl md:text-8xl font-extrabold text-[#1E293B] mb-8 tracking-tighter leading-none">
        Hackathon<span className="text-[#A696E7]">Hero</span>
      </h1>
      
      <p className="max-w-2xl text-xl text-slate-600 mb-12 leading-relaxed font-medium">
        The professional co-pilot for high-stakes hackathons. 
        Accelerate from <span className="bg-[#A696E7]/10 px-2 py-1 rounded text-[#8B7EDC] font-bold">concept</span> to <span className="bg-[#A696E7]/10 px-2 py-1 rounded text-[#8B7EDC] font-bold">shipping code</span> with AI precision.
      </p>
      
      <Button onClick={onStart} className="text-xl px-14 py-5 shadow-2xl hover:scale-105 transition-transform">
        Start My Journey
      </Button>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full">
        <div className="p-8 rounded-3xl glass-surface transition-transform hover:-translate-y-2">
          <div className="mb-4 text-[#A696E7]"><Icons.Brain /></div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Technical Scoping</h3>
          <p className="text-slate-500 text-sm leading-relaxed">Turn high-level ideas into granular build tasks and specific implementation steps.</p>
        </div>
        <div className="p-8 rounded-3xl glass-surface transition-transform hover:-translate-y-2">
          <div className="mb-4 text-[#A696E7]"><Icons.Map /></div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Execution Roadmap</h3>
          <p className="text-slate-500 text-sm leading-relaxed">A professional timeline optimized for the 24/48 hour hackathon pressure cooker.</p>
        </div>
        <div className="p-8 rounded-3xl glass-surface transition-transform hover:-translate-y-2">
          <div className="mb-4 text-[#A696E7]"><Icons.Code /></div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Senior Mentorship</h3>
          <p className="text-slate-500 text-sm leading-relaxed">Context-aware AI mentor that generates shippable code and architectural advice.</p>
        </div>
      </div>
    </div>
  );
};