import React, { useState, useRef, useEffect } from 'react';
import { AppState, DashboardTab, RoadmapTask, ChatMessage } from '../types';
import { Button, Card, Input, Textarea, Icons, CatRobot } from '../components/ui';
import { generateCodeForTask, createMentorChat } from '../services/geminiService';
import { Chat } from "@google/genai";

interface DashboardProps {
  state: AppState;
  onReset: () => void;
}

const SURVIVAL_TIPS = [
  { icon: "⚡", title: "The 80/20 Rule", text: "80% of your score comes from 20% of your features. Make the 'Core Loop' perfect, ignore the rest." },
  { icon: "🛠️", title: "Fake it 'til you make it", text: "If a feature is too hard to code in 2 hours, use a static image or hardcoded data for the demo." },
  { icon: "🌊", title: "Flow over Perfection", text: "A buggy app that is finished is better than a perfect app that isn't deployed." }
];

const BEGINNER_STEPS = [
  {
    title: "1. The 'Vite' Launchpad",
    desc: "Don't set up a complex backend yet. Use Vite + React. It gives you a hot-reloading environment in seconds.",
    hack: "Run 'npm create vite@latest' and choose 'React' + 'TypeScript'.",
    tip: "Vite is 10x faster than Create-React-App."
  },
  {
    title: "2. The 'Lego' UI",
    desc: "Use Tailwind CSS. Don't write custom CSS files. Use utility classes to build your layout directly in HTML.",
    hack: "Copy-paste component skeletons from sites like 'TailwindUI' or 'Flowbite' to save hours.",
    tip: "Focus on 'Mobile First'—judges often view demos on small screens."
  },
  {
    title: "3. Component 'Atomic' Thinking",
    desc: "Break your app into Header, Footer, and MainContent. This prevents your code from becoming a 'spaghetti' mess.",
    hack: "Create a 'components' folder immediately and put your reusable buttons there.",
    tip: "If a file is longer than 200 lines, break it up!"
  },
  {
    title: "4. State: The App's Brain",
    desc: "Use 'useState' for simple things (toggles, inputs) and 'useEffect' for fetching data from Gemini.",
    hack: "Log your state to the console often: 'console.log(myData)' is your best friend.",
    tip: "Don't use Redux or complex state managers for a 24h hack."
  },
  {
    title: "5. Gemini API Integration",
    desc: "Hook up the 'Brain'. Send your prompt to Gemini and display the response text in a pretty card.",
    hack: "Use a loading spinner! Users hate waiting for AI without seeing progress.",
    tip: "Keep prompts short and specific for faster responses."
  },
  {
    title: "6. Forms & Input Logic",
    desc: "Capture what the user wants. Validate that they actually typed something before calling the AI.",
    hack: "Use a simple '<form>' and 'onSubmit' to handle enter-key presses automatically.",
    tip: "Less typing = Better UX. Use dropdowns where possible."
  },
  {
    title: "7. The 'Magic' Polish",
    desc: "Add shadows, rounded corners (2xl), and a nice font like 'Inter'. Visuals win hackathons.",
    hack: "Add a simple 'transition' class to buttons to make them feel premium.",
    tip: "Use a consistent color palette (e.g., all Purples and Slates)."
  },
  {
    title: "8. Catching the Crashes",
    desc: "Wrap your API calls in 'try...catch'. If the AI fails, show a friendly message, not a white screen.",
    hack: "Show a 'Try Again' button if an error occurs.",
    tip: "Never let a user see a console error."
  },
  {
    title: "9. The 'Pitch-Ready' Demo",
    desc: "Record a 2-minute video of your app working. Loom is great for this. Don't rely on a 'live' demo if wifi is bad.",
    hack: "Clear your browser cache and start from a fresh state for the recording.",
    tip: "Script your demo: Problem -> Solution -> Demo -> Impact."
  },
  {
    title: "10. Vercel: The Finish Line",
    desc: "Push to GitHub and connect to Vercel. It will give you a public URL in seconds.",
    hack: "Set your API_KEY in the Vercel Dashboard 'Environment Variables'.",
    tip: "Deploy early (Hour 12) just to make sure the link works!"
  }
];

export const Dashboard: React.FC<DashboardProps> = ({ state, onReset }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.TRACKER);
  const [phases, setPhases] = useState(state.roadmap);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatSession = useRef<Chat | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [selectedTaskForCode, setSelectedTaskForCode] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(false);

  const toggleTask = (phaseIndex: number, taskId: string) => {
    const newPhases = [...phases];
    const phase = newPhases[phaseIndex];
    const task = phase.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      setPhases(newPhases);
    }
  };

  useEffect(() => {
    if (state.projectIdea && !chatSession.current) {
      chatSession.current = createMentorChat(state.projectIdea, state.customApiKey);
      setChatHistory([{
        role: 'model',
        text: `Ready to build "${state.projectIdea.title}"? I'm here to handle the technical heavy lifting. What code do you need?`,
        timestamp: Date.now()
      }]);
    }
  }, [state.projectIdea, state.customApiKey]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, activeTab]);

  const handleSendMessage = () => {
    if (!chatInput.trim() || !chatSession.current) return;
    const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatting(true);
    chatSession.current.sendMessage({ message: userMsg.text }).then(result => {
      setChatHistory(prev => [...prev, { role: 'model', text: result.text || "...", timestamp: Date.now() }]);
    }).catch(e => {
      setChatHistory(prev => [...prev, { role: 'model', text: "Connection error. Let's try again.", timestamp: Date.now() }]);
    }).finally(() => {
      setIsChatting(false);
    });
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitRecognition;
    if (!SpeechRecognition) return alert("Microphone access is not supported in this browser.");
    const recognition = new SpeechRecognition();
    recognition.start();
    setIsListening(true);
    recognition.onresult = (event: any) => {
      setChatInput(event.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
  };

  const handleGenerateCode = async () => {
    if (!selectedTaskForCode || !state.projectIdea) return;
    let task = phases.flatMap(p => p.tasks).find(t => t.id === selectedTaskForCode);
    if(!task) return;
    setIsCodeLoading(true);
    setGeneratedCode("");
    try {
      const code = await generateCodeForTask(task.title, task.description, state.projectIdea, state.customApiKey);
      setGeneratedCode(code);
    } catch (e) { setGeneratedCode("// Technical error during generation."); }
    finally { setIsCodeLoading(false); }
  };

  const allTasks = phases.flatMap(p => p.tasks.map(t => ({ id: t.id, title: t.title, phase: p.phaseName })));
  const currentTask = allTasks.find(t => t.id === selectedTaskForCode);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto glass-surface rounded-3xl overflow-hidden shadow-2xl relative">
      {/* Header */}
      <header className="flex items-center justify-between p-6 bg-white border-b border-slate-100 shrink-0 z-[60] shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-800 manual-font tracking-tight">{state.projectIdea?.title}</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">TIMEFRAME: {state.hackathonDuration}</p>
            <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
            <p className="text-xs font-bold text-[#A696E7] uppercase tracking-widest">TEAM: {state.teamPlan?.isSolo ? 'SOLO' : 'SQUAD'}</p>
          </div>
        </div>
        <Button variant="outline" className="text-xs px-4 py-2" onClick={onReset}>New Session</Button>
      </header>

      {/* Tabs */}
      <div className="flex bg-white/40 border-b border-slate-100 shrink-0 z-40">
        {[
          { id: DashboardTab.TRACKER, label: 'Roadmap', icon: <Icons.Map /> },
          { id: DashboardTab.MENTOR, label: 'Mentor AI', icon: <Icons.Brain /> },
          { id: DashboardTab.CODE, label: 'Code Gen', icon: <Icons.Code /> },
          { id: DashboardTab.GUIDE, label: 'Beginner Guide', icon: <Icons.Rocket /> },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as DashboardTab)} 
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white text-[#8B7EDC] border-b-4 border-[#A696E7]' : 'text-slate-400 hover:text-slate-700 hover:bg-white/50'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-hidden relative">
        {/* ROADMAP TRACKER */}
        {activeTab === DashboardTab.TRACKER && (
          <div className="h-full overflow-y-auto p-12 relative bg-[#F4F1FE]/50 pt-36">
            <div className="absolute left-1/2 top-0 bottom-0 w-[4px] bg-[#A696E7]/20 transform -translate-x-1/2 hidden md:block"></div>
            <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-[70] pointer-events-none">
              <div className="bg-[#A696E7] text-white text-[12px] font-black px-8 py-3.5 rounded-full shadow-2xl manual-font uppercase tracking-widest animate-pulse border-4 border-white drop-shadow-xl">Start Hackathon</div>
              <div className="text-[#A696E7] mt-1 drop-shadow-lg"><Icons.ChevronDown /></div>
            </div>
            <div className="space-y-32 relative">
              {phases.map((phase, pIdx) => (
                <div key={pIdx} className="relative">
                  {pIdx > 0 && <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-1 h-32 bg-[#A696E7]/30 hidden md:block"></div>}
                  <div className="flex justify-center mb-16 relative z-10">
                     <div className="bg-white border-2 border-[#A696E7] px-12 py-5 rounded-2xl font-black text-slate-800 shadow-2xl manual-font text-xl">{phase.phaseName}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {phase.tasks.map((task, tIdx) => {
                      const isLeft = tIdx % 2 === 0;
                      return (
                        <div key={task.id} className={`flex ${isLeft ? 'md:justify-end' : 'md:justify-start'}`}>
                           <div onClick={() => toggleTask(pIdx, task.id)} className={`cursor-pointer group w-full md:max-w-md p-7 bg-white rounded-[2rem] transition-all border border-slate-100 ${task.completed ? 'opacity-50 grayscale bg-slate-50' : 'hover:-translate-y-2 hover:shadow-2xl hover:border-[#A696E7]/40'}`}>
                              <div className="flex flex-col h-full">
                                <div className="flex items-start gap-6">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black shrink-0 border-2 transition-colors ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>{tIdx + 1}</div>
                                  <div className="flex-1">
                                    <h4 className={`font-black text-xl leading-tight ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</h4>
                                    <p className="text-sm text-slate-500 mt-2.5 font-medium leading-relaxed">{task.description}</p>
                                  </div>
                                  <div className={`w-8 h-8 rounded-xl border-2 shrink-0 flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white group-hover:border-[#A696E7]'}`}>
                                    {task.completed && <Icons.Check />}
                                  </div>
                                </div>
                                
                                {/* Work Distribution Badges */}
                                {task.assignedRoles && task.assignedRoles.length > 0 && (
                                  <div className="mt-6 pt-6 border-t border-slate-50 flex flex-wrap gap-2">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest w-full mb-1">Assigned To:</span>
                                    {task.assignedRoles.map((role, rIdx) => (
                                      <span key={rIdx} className="bg-[#A696E7]/10 text-[#8B7EDC] px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-[#A696E7]/20">
                                        {role}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                           </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MENTOR AI */}
        {activeTab === DashboardTab.MENTOR && (
          <div className="flex flex-col h-full bg-slate-50">
            <div className="bg-white border-b border-slate-100 py-3 px-6 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-3">
                 <div className="bg-[#A696E7]/10 p-2 rounded-xl text-[#A696E7]"><Icons.Brain /></div>
                 <div className="manual-font text-slate-700 text-[11px] font-black uppercase tracking-[0.2em]">Senior Dev Mentor</div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">Mode: {state.projectIdea?.developerPreferences ? 'Custom Preferences' : 'Standard Stack'}</div>
                  <CatRobot size="compact" />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-6">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-3xl px-7 py-5 text-sm font-medium shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#A696E7] text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-slate-200/60'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatting && <div className="flex justify-start animate-pulse"><div className="bg-white rounded-3xl px-6 py-3 text-[10px] font-black uppercase text-slate-400 border border-slate-100 tracking-widest">Mentor is thinking...</div></div>}
              <div ref={chatEndRef}></div>
            </div>
            <div className="p-8 bg-white border-t border-slate-100">
              <div className="flex gap-4 max-w-full mx-auto w-full items-center px-4">
                <button className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 shrink-0 transition-all ${isListening ? 'bg-red-500 border-red-500 text-white shadow-lg' : 'border-slate-200 text-slate-400 hover:border-[#A696E7] hover:text-[#A696E7]'}`} onClick={startListening}><Icons.Mic /></button>
                <div className="flex-1">
                  <Textarea className="!py-4 !px-6 h-16 !min-h-[64px] text-lg !bg-slate-50 border-0 focus:!bg-white shadow-inner resize-none w-full" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder="Describe a technical roadblock..." />
                </div>
                <Button onClick={handleSendMessage} disabled={isChatting || !chatInput.trim()} className="h-16 px-12 text-lg uppercase font-black">Send</Button>
              </div>
            </div>
          </div>
        )}

        {/* CODE GENERATOR */}
        {activeTab === DashboardTab.CODE && (
          <div className="h-full overflow-y-auto p-12 flex flex-col items-center bg-[#F4F1FE]/30">
            <div className="max-w-4xl w-full space-y-8">
              <Card title="Practical Code Gen">
                <p className="text-slate-600 mb-8 font-medium">Select a technical step from your manual checklist to get executable code snippets.</p>
                <div className="relative">
                  <button onClick={() => setIsTaskDropdownOpen(!isTaskDropdownOpen)} className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-slate-800 text-left flex items-center justify-between shadow-sm focus:border-[#A696E7] transition-all">
                    <span className={`font-bold ${!selectedTaskForCode ? 'text-slate-400' : ''}`}>{currentTask ? `${currentTask.phase}: ${currentTask.title}` : "-- Select Step --"}</span>
                    <Icons.ChevronDown />
                  </button>
                  {isTaskDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setIsTaskDropdownOpen(false)}></div>
                      <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl z-20 max-h-72 overflow-y-auto border border-slate-100">
                         {allTasks.map(task => (
                           <button key={task.id} className="w-full text-left px-6 py-4 hover:bg-[#F4F1FE] border-b border-slate-50 last:border-0" onClick={() => { setSelectedTaskForCode(task.id); setIsTaskDropdownOpen(false); }}>
                             <div className="text-[#A696E7] font-black text-[10px] uppercase mb-1">{task.phase}</div>
                             <div className="text-slate-800 font-bold text-sm">{task.title}</div>
                           </button>
                         ))}
                      </div>
                    </>
                  )}
                </div>
                <Button onClick={handleGenerateCode} isLoading={isCodeLoading} disabled={!selectedTaskForCode} className="w-full py-4 mt-8 shadow-lg">Generate Execution Code</Button>
              </Card>
              {generatedCode && (
                <div className="animate-fade-in relative">
                  <div className="absolute right-4 top-4"><Button variant="outline" className="text-xs py-1.5 px-3 h-auto" onClick={() => navigator.clipboard.writeText(generatedCode)}>Copy Snippet</Button></div>
                  <pre className="bg-[#1E293B] p-8 rounded-2xl overflow-x-auto text-xs font-mono text-emerald-300 shadow-2xl border-4 border-white">{generatedCode}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* BEGINNER GUIDE */}
        {activeTab === DashboardTab.GUIDE && (
          <div className="h-full overflow-y-auto p-12 bg-[#F4F1FE]/30">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <div className="bg-[#A696E7] text-white px-6 py-2 rounded-full inline-block font-black text-[10px] uppercase tracking-widest mb-4">Level Up</div>
                <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">The Beginner's Genesis Guide</h2>
                <p className="text-slate-500 font-medium">A universal blueprint for building high-quality prototypes with speed.</p>
              </div>

              {/* Survival Mindset Section */}
              <div className="mb-20">
                <h3 className="text-xs font-black text-[#A696E7] uppercase tracking-[0.2em] mb-6 text-center">Survival Mindset</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   {SURVIVAL_TIPS.map((tip, i) => (
                     <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="text-2xl mb-3">{tip.icon}</div>
                        <h4 className="font-bold text-slate-800 mb-1">{tip.title}</h4>
                        <p className="text-slate-500 text-xs leading-relaxed font-medium">{tip.text}</p>
                     </div>
                   ))}
                </div>
              </div>

              <div className="space-y-8 relative">
                <div className="absolute left-[39px] top-0 bottom-0 w-0.5 bg-slate-200 z-0"></div>

                {BEGINNER_STEPS.map((step, idx) => (
                  <div key={idx} className="relative z-10 flex gap-10 group">
                    <div className="w-20 h-20 rounded-3xl bg-white border-2 border-slate-100 flex items-center justify-center shrink-0 shadow-sm group-hover:border-[#A696E7] transition-all">
                       <span className="text-2xl font-black text-[#A696E7]">{idx + 1}</span>
                    </div>
                    <div className="flex-1 py-4">
                      <div className="p-8 rounded-[2.5rem] bg-white shadow-xl shadow-indigo-100/30 border border-white hover:ring-2 hover:ring-[#A696E7] transition-all">
                        <h3 className="text-xl font-bold text-slate-800 mb-3">{step.title}</h3>
                        <p className="text-slate-500 font-medium leading-relaxed mb-6">{step.desc}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                              <p className="text-[10px] font-black text-emerald-600 uppercase mb-1 tracking-wider">🔥 Hackathon Hack</p>
                              <p className="text-xs font-bold text-emerald-800 leading-tight">{step.hack}</p>
                           </div>
                           <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                              <p className="text-[10px] font-black text-indigo-600 uppercase mb-1 tracking-wider">💡 Pro Tip</p>
                              <p className="text-xs font-bold text-indigo-800 leading-tight">{step.tip}</p>
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-20 p-12 rounded-[3.5rem] bg-gradient-to-br from-slate-900 to-slate-800 text-center text-white shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-[#A696E7]/10 blur-[100px] rounded-full"></div>
                 <h4 className="text-3xl font-black mb-6 relative z-10">You're Ready to Win</h4>
                 <p className="text-slate-400 mb-10 max-w-xl mx-auto relative z-10">Building a prototype is about momentum. Don't stop for the small stuff. Keep building, keep shipping.</p>
                 <Button className="mx-auto relative z-10 shadow-indigo-500/20" onClick={() => setActiveTab(DashboardTab.TRACKER)}>Jump to my Tasks</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};