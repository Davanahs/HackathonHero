import React, { useState } from 'react';
import { Button, Card, Icons, Input, BackButton } from '../components/ui';
import { ProjectIdea, TeamPlan } from '../types';
import { generateTeamRoles, generateTeammatePost } from '../services/geminiService';

interface TeamPlanningProps {
  idea: ProjectIdea;
  onNext: (plan: TeamPlan) => void;
  onBack: () => void;
}

export const TeamPlanning: React.FC<TeamPlanningProps> = ({ idea, onNext, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showFinder, setShowFinder] = useState(false);
  
  const [mySkills, setMySkills] = useState('');
  const [generatedPost, setGeneratedPost] = useState('');
  const [finderLoading, setFinderLoading] = useState(false);

  const handleSelect = async (isSolo: boolean) => {
    setLoading(true);
    try {
      const plan = await generateTeamRoles(isSolo, idea, isSolo ? 1 : 3);
      onNext(plan);
    } catch (e) {
      onNext({
        isSolo,
        roles: [{ roleName: "Fullstack Developer", responsibilities: ["End-to-end development", "MVP logic"], skills: ["Fullstack"] }]
      });
    } finally { setLoading(false); }
  };

  const handleGeneratePost = async () => {
    if(!mySkills) return;
    setFinderLoading(true);
    try {
      const post = await generateTeammatePost(mySkills, idea.title, idea.problem);
      setGeneratedPost(post);
    } finally { setFinderLoading(false); }
  };

  if (showFinder) return (
    <div className="max-w-2xl mx-auto py-12">
      <BackButton onClick={() => setShowFinder(false)} />
      <Card title="Talent Acquisition Post">
        <p className="text-slate-500 mb-8 font-medium">Provide your skills, and I'll draft a professional recruitment post for your Discord or Slack channel.</p>
        <div className="space-y-6">
          <div><label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">My Skillset</label><Input placeholder="e.g. React Native, UI Design, AWS" value={mySkills} onChange={e => setMySkills(e.target.value)} /></div>
          <Button onClick={handleGeneratePost} isLoading={finderLoading} className="w-full py-4">Generate Recruitment Content</Button>
          {generatedPost && (
            <div className="mt-8 bg-white/40 border border-slate-100 p-6 rounded-2xl shadow-inner">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed italic">"{generatedPost}"</pre>
              <Button variant="secondary" className="mt-6 w-full text-xs font-bold" onClick={() => navigator.clipboard.writeText(generatedPost)}>Copy Snippet</Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-12">
      <BackButton onClick={onBack} />
      <div className="text-center mb-12">
        <h2 className="text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">Resource Allocation</h2>
        <p className="text-slate-500 font-medium">Project: <span className="text-[#A696E7] font-bold">{idea.title}</span></p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {['Frontend', 'Backend', 'UI/UX', 'Product'].map((r, i) => (
          <div key={i} className="bg-white/40 p-4 rounded-2xl border border-white/50 text-center shadow-sm">
            <div className="font-bold text-[#8B7EDC] text-xs uppercase tracking-widest">{r}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <button onClick={() => handleSelect(true)} disabled={loading} className="p-12 rounded-3xl glass-surface text-left hover:ring-2 hover:ring-[#A696E7] transition-all group shadow-xl">
          <div className="text-slate-400 group-hover:text-[#A696E7] mb-6"><Icons.Rocket /></div>
          <h3 className="text-2xl font-bold mb-3 text-slate-800">Solo Architect</h3>
          <p className="text-slate-500 text-sm font-medium leading-relaxed">Design a streamlined workflow optimized for a single developer. Focus on high-leverage tools.</p>
        </button>
        <div className="space-y-4">
          <button onClick={() => handleSelect(false)} disabled={loading} className="w-full p-12 rounded-3xl glass-surface text-left hover:ring-2 hover:ring-[#A696E7] transition-all group shadow-xl h-full">
            <div className="text-slate-400 group-hover:text-[#A696E7] mb-6"><Icons.Users /></div>
            <h3 className="text-2xl font-bold mb-3 text-slate-800">Collaborative Squad</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">Distribute responsibilities across multiple members to ensure parallel development paths.</p>
          </button>
        </div>
      </div>
      
      <div className="mt-12 text-center">
        <button onClick={() => setShowFinder(true)} className="text-sm font-bold text-[#A696E7] hover:underline underline-offset-8 decoration-2 transition-all">
          Looking for talent? Generate a team post &rarr;
        </button>
      </div>

      {loading && <div className="mt-12 text-center animate-pulse text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Calibrating Role Matrix...</div>}
    </div>
  );
};