import React, { useState } from 'react';
import { Button, Card, Icons, Input, Textarea } from '../components/ui';
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
  
  // Finder State
  const [mySkills, setMySkills] = useState('');
  const [generatedPost, setGeneratedPost] = useState('');
  const [finderLoading, setFinderLoading] = useState(false);

  const handleSelect = async (isSolo: boolean) => {
    setLoading(true);
    try {
      const plan = await generateTeamRoles(isSolo, idea, isSolo ? 1 : 3);
      onNext(plan);
    } catch (e) {
      console.error(e);
      // Fallback
      onNext({
        isSolo,
        roles: [{ roleName: "Hacker", responsibilities: ["Build MVP"], skills: ["Coding"] }]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePost = async () => {
    if(!mySkills) return;
    setFinderLoading(true);
    try {
      const post = await generateTeammatePost(mySkills, idea.title, idea.problem);
      setGeneratedPost(post);
    } catch (e) {
      setGeneratedPost("Error generating post.");
    } finally {
      setFinderLoading(false);
    }
  };

  if (showFinder) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button variant="ghost" onClick={() => setShowFinder(false)}>&larr; Back to Role Selection</Button>
        <Card title="Find a Teammate">
          <p className="text-slate-400 mb-6">Enter your details, and I'll write a perfect "Looking for Team" message you can paste into Discord or Slack.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">My Skills</label>
              <Input placeholder="e.g. React, Design, Python..." value={mySkills} onChange={e => setMySkills(e.target.value)} />
            </div>
            
            <Button onClick={handleGeneratePost} isLoading={finderLoading} className="w-full">
              Generate Recruitment Post
            </Button>

            {generatedPost && (
              <div className="mt-6 bg-slate-900 p-4 rounded-lg border border-slate-700">
                <pre className="whitespace-pre-wrap text-sm text-slate-300 font-sans">{generatedPost}</pre>
                <Button 
                  variant="outline" 
                  className="mt-4 w-full text-xs" 
                  onClick={() => navigator.clipboard.writeText(generatedPost)}
                >
                  Copy to Clipboard
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="flex items-center">
         <Button variant="ghost" onClick={onBack} className="text-slate-400 hover:text-white">&larr; Back to Idea</Button>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Assemble your Squad</h2>
        <p className="text-slate-400">Project: <span className="text-indigo-400 font-semibold">{idea.title}</span></p>
      </div>

      {/* Educational Section for Beginners */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { name: 'Frontend', desc: 'Builds the UI/UX' },
          { name: 'Backend', desc: 'Logic & Database' },
          { name: 'Design', desc: 'Look & Feel' },
          { name: 'Pitch', desc: 'Story & Demo' }
        ].map((r, i) => (
          <div key={i} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 text-center">
            <div className="font-bold text-indigo-300 text-sm">{r.name}</div>
            <div className="text-xs text-slate-500">{r.desc}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Solo Path */}
        <div className="space-y-4">
          <button 
            onClick={() => handleSelect(true)} 
            disabled={loading}
            className="w-full relative group p-8 rounded-2xl bg-slate-800 border border-slate-700 hover:border-indigo-500 hover:bg-slate-800/80 transition-all text-left disabled:opacity-50"
          >
            <div className="absolute top-6 right-6 text-slate-600 group-hover:text-indigo-400 transition-colors">
              <Icons.Rocket />
            </div>
            <h3 className="text-xl font-bold mb-2">Solo Hacker</h3>
            <p className="text-slate-400 text-sm">I am the team. I'll need a plan that balances speed and scope for one person.</p>
          </button>
          
          <div className="text-center">
            <span className="text-xs text-slate-500 uppercase tracking-widest">or</span>
            <button 
              onClick={() => setShowFinder(true)}
              className="mt-2 text-sm text-indigo-400 hover:text-indigo-300 underline underline-offset-4"
            >
              Help me find a teammate &rarr;
            </button>
          </div>
        </div>

        {/* Team Path */}
        <div className="space-y-4">
          <button 
            onClick={() => handleSelect(false)}
            disabled={loading}
            className="w-full relative group p-8 rounded-2xl bg-slate-800 border border-slate-700 hover:border-emerald-500 hover:bg-slate-800/80 transition-all text-left disabled:opacity-50"
          >
            <div className="absolute top-6 right-6 text-slate-600 group-hover:text-emerald-400 transition-colors">
              <Icons.Users />
            </div>
            <h3 className="text-xl font-bold mb-2">Squad Mode</h3>
            <p className="text-slate-400 text-sm">I have a team (2-4 people). We need to split roles efficiently.</p>
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12 animate-fade-in">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Designing the perfect workload...</p>
        </div>
      )}
    </div>
  );
};