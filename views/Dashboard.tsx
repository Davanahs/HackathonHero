
import React, { useState, useRef, useEffect } from 'react';
import { AppState, DashboardTab, RoadmapTask, ChatMessage } from '../types';
import { Button, Card, Input, Textarea, Icons, CatRobot } from '../components/ui';
import { generateCodeForTask, createMentorChat } from '../services/geminiService';
import { Chat } from "@google/genai";

interface DashboardProps {
  state: AppState;
  onUpdateState: (updates: Partial<AppState>) => void;
  onReset: () => void;
}

const MessageContent = ({ text }: { text: string }) => {
  const segments = text.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-4">
      {segments.map((segment, i) => {
        if (segment.startsWith('```')) {
          const code = segment.replace(/```(\w+)?\n?/, '').replace(/```$/, '');
          return (
            <pre key={i} className="bg-slate-900 text-emerald-400 p-5 rounded-xl text-xs font-mono overflow-x-auto my-3 border border-slate-700 shadow-inner">
              <code>{code.trim()}</code>
            </pre>
          );
        }
        const lines = segment.split('\n');
        return (
          <div key={i} className="space-y-2">
            {lines.map((line, j) => {
              if (!line.trim()) return <div key={j} className="h-2"></div>;
              const boldSegments = line.split(/(\*\*.*?\*\*)/g);
              return (
                <div key={j} className="leading-relaxed">
                  {boldSegments.map((part, k) => {
                    if (part.startsWith('**') && part.endsWith('**')) {
                      return <strong key={k} className="font-black text-slate-900 bg-indigo-50/50 px-1 rounded">{part.slice(2, -2)}</strong>;
                    }
                    return part;
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ state, onUpdateState, onReset }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.TRACKER);
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
    const newRoadmap = [...state.roadmap];
    const phase = newRoadmap[phaseIndex];
    const task = phase.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      onUpdateState({ roadmap: newRoadmap });
    }
  };

  useEffect(() => {
    if (state.projectIdea && !chatSession.current) {
      try {
        chatSession.current = createMentorChat(state.projectIdea);
        if (state.chatHistory.length === 0) {
          const initialMsg: ChatMessage = {
            role: 'model',
            text: `**Session Initialized.**\n\nReady to build **${state.projectIdea.title}**? I'm synced with your roadmap. Describe a technical blocker or request a code skeleton below.`,
            timestamp: Date.now()
          };
          onUpdateState({ chatHistory: [initialMsg] });
        }
      } catch (e: any) {
        console.error("Chat init error", e);
      }
    }
  }, [state.projectIdea]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.chatHistory, activeTab]);

  const handleSendMessage = () => {
    if (!chatInput.trim() || !chatSession.current) return;
    const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: Date.now() };
    const newHistory = [...state.chatHistory, userMsg];
    onUpdateState({ chatHistory: newHistory });
    setChatInput('');
    setIsChatting(true);
    
    chatSession.current.sendMessage({ message: userMsg.text }).then(result => {
      onUpdateState({ 
        chatHistory: [...newHistory, { role: 'model', text: result.text || "...", timestamp: Date.now() }] 
      });
    }).catch((e: any) => {
      onUpdateState({ 
        chatHistory: [...newHistory, { role: 'model', text: "Connection error. Let's try again.", timestamp: Date.now() }] 
      });
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
    let task = state.roadmap.flatMap(p => p.tasks).find(t => t.id === selectedTaskForCode);
    if(!task) return;
    setIsCodeLoading(true);
    setGeneratedCode("");
    try {
      let code = await generateCodeForTask(task.title, task.description, state.projectIdea);
      code = code.replace(/^```[\w]*\n/, '').replace(/\n```$/, '');
      setGeneratedCode(code);
    } catch (e: any) { 
      setGeneratedCode("// Technical error during generation."); 
    }
    finally { setIsCodeLoading(false); }
  };

  const allTasks = state.roadmap.flatMap(p => p.tasks.map(t => ({ id: t.id, title: t.title, phase: p.phaseName })));
  const currentTask = allTasks.find(t => t.id === selectedTaskForCode);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-6xl mx-auto glass-surface rounded-3xl overflow-hidden shadow-2xl relative">
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
        {activeTab === DashboardTab.TRACKER && (
          <div className="h-full overflow-y-auto p-12 relative bg-[#F4F1FE]/50 pt-36">
            <div className="absolute left-1/2 top-0 bottom-0 w-[4px] bg-[#A696E7]/20 transform -translate-x-1/2 hidden md:block"></div>
            <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-[70] pointer-events-none">
              <div className="bg-[#A696E7] text-white text-[12px] font-black px-8 py-3.5 rounded-full shadow-2xl manual-font uppercase tracking-widest animate-pulse border-4 border-white drop-shadow-xl">Start Hackathon</div>
              <div className="text-[#A696E7] mt-1 drop-shadow-lg"><Icons.ChevronDown /></div>
            </div>
            <div className="space-y-32 relative">
              {state.roadmap.map((phase, pIdx) => (
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

        {activeTab === DashboardTab.MENTOR && (
          <div className="flex flex-col h-full bg-slate-50">
            <div className="bg-white border-b border-slate-100 py-3 px-6 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-3">
                 <div className="bg-[#A696E7]/10 p-2 rounded-xl text-[#A696E7]"><Icons.Brain /></div>
                 <div className="manual-font text-slate-700 text-[11px] font-black uppercase tracking-[0.2em]">Senior Dev Mentor</div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">AI Context Active</div>
                  <CatRobot size="compact" />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              {state.chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-[2rem] px-8 py-6 text-sm font-medium shadow-sm ${msg.role === 'user' ? 'bg-[#A696E7] text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-slate-200/60'}`}>
                    {msg.role === 'model' ? <MessageContent text={msg.text} /> : msg.text}
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

        {activeTab === DashboardTab.CODE && (
          <div className="h-full overflow-y-auto p-12 flex flex-col items-center bg-[#F4F1FE]/30">
            <div className="max-w-4xl w-full space-y-8">
              <Card title="Practical Code Gen">
                <p className="text-slate-600 mb-8 font-medium">Select a technical step from your roadmap to get executable code snippets.</p>
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
                  <pre className="bg-[#1E293B] p-8 rounded-2xl overflow-x-auto text-xs font-mono text-emerald-300 shadow-2xl border-4 border-white leading-relaxed">{generatedCode}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === DashboardTab.GUIDE && (
          <div className="h-full overflow-y-auto p-12 bg-white/40 backdrop-blur-xl">
            <div className="max-w-5xl mx-auto pb-32">
              <div className="text-center mb-16">
                <div className="bg-[#A696E7] text-white px-8 py-2.5 rounded-full inline-block font-black text-[10px] uppercase tracking-[0.3em] mb-6 shadow-xl shadow-indigo-100">Level Up</div>
                <h2 className="text-5xl font-black text-slate-800 mb-4 tracking-tight manual-font">The Beginner's Genesis Guide</h2>
                <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">A universal blueprint for building high-quality prototypes with speed.</p>
              </div>

              {/* Survival Mindset Row */}
              <div className="mb-20">
                <h4 className="text-[10px] font-black text-[#A696E7] uppercase tracking-[0.4em] text-center mb-10">Survival Mindset</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 flex flex-col items-start hover:-translate-y-1 transition-transform">
                    <div className="text-orange-400 mb-6"><Icons.Sparkles /></div>
                    <h5 className="font-black text-slate-800 mb-3 text-lg">The 80/20 Rule</h5>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">80% of your score comes from 20% of your features. Make the 'Core Loop' perfect, ignore the rest.</p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 flex flex-col items-start hover:-translate-y-1 transition-transform">
                    <div className="text-[#A696E7] mb-6"><Icons.Settings /></div>
                    <h5 className="font-black text-slate-800 mb-3 text-lg">Fake it 'til you make it</h5>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">If a feature is too hard to code in 2 hours, use a static image or hardcoded data for the demo.</p>
                  </div>
                  <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 flex flex-col items-start hover:-translate-y-1 transition-transform">
                    <div className="text-indigo-400 mb-6"><Icons.Rocket /></div>
                    <h5 className="font-black text-slate-800 mb-3 text-lg">Flow over Perfection</h5>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">A buggy app that is finished is better than a perfect app that isn't deployed.</p>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Guide Roadmap */}
              <div className="relative pl-12 md:pl-20 border-l-4 border-slate-100 ml-4 md:ml-10 space-y-16">
                {[
                  {
                    num: 1,
                    title: "Ideation & Validating the Pain",
                    desc: "Spend no more than 1 hour deciding. Solve a problem that either you have, or someone in the room has. Validate it by asking 3 people 'Would you use this?'",
                    hack: "Don't build for 1 million users. Build for 1 user.",
                    tip: "If you can't explain it in 15 seconds, it's too complex."
                  },
                  {
                    num: 2,
                    title: "Tech Stack & Boilerplate",
                    desc: "Use what you know. A hackathon is the worst time to learn a new language. Get your 'Hello World' deployed to a live URL in the first 2 hours.",
                    hack: "Use Vite + Tailwind for instant UI speed.",
                    tip: "Github Copilot is your co-founder. Use it for everything."
                  },
                  {
                    num: 3,
                    title: "Designing the 'Hero' View",
                    desc: "Design only the screens that will be in your demo. Focus on the 'Happy Path' – the exact steps you will show the judges.",
                    hack: "Use high-quality placeholder icons and fonts.",
                    tip: "Keep it simple. White space is your friend."
                  },
                  {
                    num: 4,
                    title: "MVP Implementation",
                    desc: "Build the minimum. If it's a food app, just show the menu and the 'Order' button. Don't build the 'Profile Settings' page.",
                    hack: "Log your state to the console often: 'console.log(myData)' is your best friend.",
                    tip: "Don't use Redux or complex state managers for a 24h hack."
                  },
                  {
                    num: 5,
                    title: "Gemini API Integration",
                    desc: "Hook up the 'Brain'. Send your prompt to Gemini and display the response text in a pretty card.",
                    hack: "Use a loading spinner! Users hate waiting for AI without seeing progress.",
                    tip: "Keep prompts short and specific for faster responses."
                  }
                ].map((step, idx) => (
                  <div key={idx} className="relative group">
                    <div className="absolute -left-[54px] md:-left-[74px] top-0 w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white border-2 border-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:border-[#A696E7] group-hover:text-[#A696E7] transition-all shadow-sm">
                      {step.num}
                    </div>
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-50">
                      <h4 className="text-2xl font-black text-slate-800 mb-4 manual-font">{step.num}. {step.title}</h4>
                      <p className="text-slate-500 font-medium mb-8 leading-relaxed">{step.desc}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3">
                          <span className="text-emerald-500 shrink-0 mt-0.5">🔥</span>
                          <div>
                            <div className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Hackathon Hack</div>
                            <div className="text-xs text-slate-600 font-bold">{step.hack}</div>
                          </div>
                        </div>
                        <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-2xl flex items-start gap-3">
                          <span className="text-indigo-500 shrink-0 mt-0.5">⚡</span>
                          <div>
                            <div className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Pro Tip</div>
                            <div className="text-xs text-slate-600 font-bold">{step.tip}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-20 flex justify-center">
                <Button className="px-12 py-5 text-xl shadow-2xl" onClick={() => setActiveTab(DashboardTab.TRACKER)}>Jump to my Tasks</Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
