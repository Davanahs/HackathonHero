import React, { useState, useRef, useEffect } from 'react';
import { AppState, DashboardTab, RoadmapTask, ChatMessage } from '../types';
import { Button, Card, Input, Textarea, Icons, CatRobot } from '../components/ui';
import { generateCodeForTask, createMentorChat } from '../services/geminiService';
import { Chat } from "@google/genai";

interface DashboardProps {
  state: AppState;
  onReset: () => void;
}

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
      chatSession.current = createMentorChat(state.projectIdea);
      setChatHistory([{
        role: 'model',
        text: `Ready to build "${state.projectIdea.title}"? I'm here to handle the technical heavy lifting. What code do you need?`,
        timestamp: Date.now()
      }]);
    }
  }, [state.projectIdea]);

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
      const code = await generateCodeForTask(task.title, task.description, state.projectIdea);
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
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">TIMEFRAME: {state.hackathonDuration}</p>
        </div>
        <Button variant="outline" className="text-xs px-4 py-2" onClick={onReset}>New Session</Button>
      </header>

      {/* Tabs */}
      <div className="flex bg-white/40 border-b border-slate-100 shrink-0 z-40">
        {[
          { id: DashboardTab.TRACKER, label: 'Roadmap', icon: <Icons.Map /> },
          { id: DashboardTab.MENTOR, label: 'Mentor AI', icon: <Icons.Brain /> },
          { id: DashboardTab.CODE, label: 'Code Gen', icon: <Icons.Code /> },
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
              <div className="bg-[#A696E7] text-white text-[12px] font-black px-8 py-3.5 rounded-full shadow-2xl manual-font uppercase tracking-widest animate-pulse border-4 border-white drop-shadow-xl">
                Start Hackathon
              </div>
              <div className="text-[#A696E7] mt-1 drop-shadow-lg"><Icons.ChevronDown /></div>
            </div>

            <div className="space-y-32 relative">
              {phases.map((phase, pIdx) => (
                <div key={pIdx} className="relative">
                  {/* Phase Connector Line Link */}
                  {pIdx > 0 && (
                    <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-1 h-32 bg-[#A696E7]/30 hidden md:block"></div>
                  )}

                  <div className="flex justify-center mb-16 relative z-10">
                     <div className="bg-white border-2 border-[#A696E7] px-12 py-5 rounded-2xl font-black text-slate-800 shadow-2xl manual-font transform hover:rotate-0 transition-transform cursor-default text-xl">
                        {phase.phaseName}
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {phase.tasks.map((task, tIdx) => {
                      const isLeft = tIdx % 2 === 0;
                      return (
                        <div key={task.id} className={`flex ${isLeft ? 'md:justify-end' : 'md:justify-start'}`}>
                           <div onClick={() => toggleTask(pIdx, task.id)} className={`cursor-pointer group w-full md:max-w-md p-7 bg-white rounded-[2rem] transition-all border border-slate-100 ${task.completed ? 'opacity-50 grayscale bg-slate-50' : 'hover:-translate-y-2 hover:shadow-2xl hover:border-[#A696E7]/40'}`}>
                              <div className="flex items-start gap-6">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black shrink-0 border-2 transition-colors ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                   {tIdx + 1}
                                </div>
                                <div className="flex-1">
                                  <h4 className={`font-black text-xl leading-tight ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</h4>
                                  <p className="text-base text-slate-500 mt-2.5 font-medium leading-relaxed">{task.description}</p>
                                </div>
                                <div className={`w-8 h-8 rounded-xl border-2 shrink-0 flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white group-hover:border-[#A696E7]'}`}>
                                  {task.completed && <Icons.Check />}
                                </div>
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
            {/* Minimal Header */}
            <div className="bg-white border-b border-slate-100 py-3 px-6 flex items-center justify-between shrink-0">
               <div className="flex items-center gap-3">
                 <div className="bg-[#A696E7]/10 p-2 rounded-xl text-[#A696E7]"><Icons.Brain /></div>
                 <div className="manual-font text-slate-700 text-[11px] font-black uppercase tracking-[0.2em]">Senior Dev Mentor</div>
               </div>
               <div className="flex items-center gap-3">
                  <div className="text-[10px] font-bold text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                    Mode: {state.projectIdea?.developerPreferences ? 'Custom Preferences' : 'Standard Stack'}
                  </div>
                  <CatRobot size="compact" />
               </div>
            </div>

            {/* Expanded Chat History */}
            <div className="flex-1 overflow-y-auto p-10 space-y-6">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-3xl px-7 py-5 text-sm font-medium shadow-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#A696E7] text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-slate-200/60'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatting && (
                <div className="flex justify-start animate-pulse">
                   <div className="bg-white rounded-3xl px-6 py-3 text-[10px] font-black uppercase text-slate-400 border border-slate-100 tracking-widest">Mentor is thinking...</div>
                </div>
              )}
              <div ref={chatEndRef}></div>
            </div>

            {/* Optimized Chat Input Section - Efficient Wide Layout */}
            <div className="p-8 bg-white border-t border-slate-100">
              <div className="flex gap-4 max-w-full mx-auto w-full items-center px-4">
                <button className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 shrink-0 transition-all ${isListening ? 'bg-red-500 border-red-500 text-white shadow-lg' : 'border-slate-200 text-slate-400 hover:border-[#A696E7] hover:text-[#A696E7]'}`} onClick={startListening} title="Voice Input">
                  <Icons.Mic />
                </button>
                <div className="flex-1">
                  <Textarea 
                    className="!py-4 !px-6 h-16 !min-h-[64px] text-lg !bg-slate-50 border-0 focus:!bg-white shadow-inner focus:ring-0 focus:shadow-md transition-all resize-none scrollbar-thin overflow-y-auto" 
                    value={chatInput} 
                    onChange={e => setChatInput(e.target.value)} 
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }} 
                    placeholder="Describe a technical roadblock..." 
                  />
                </div>
                <Button onClick={handleSendMessage} disabled={isChatting || !chatInput.trim()} className="h-16 px-12 text-lg uppercase tracking-widest font-black shrink-0">Send</Button>
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
                    <span className={`font-bold ${!selectedTaskForCode ? 'text-slate-400' : ''}`}>
                      {currentTask ? `${currentTask.phase}: ${currentTask.title}` : "-- Select Step --"}
                    </span>
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
                  <div className="absolute right-4 top-4">
                    <Button variant="outline" className="text-xs py-1.5 px-3 h-auto" onClick={() => navigator.clipboard.writeText(generatedCode)}>Copy Snippet</Button>
                  </div>
                  <pre className="bg-[#1E293B] p-8 rounded-2xl overflow-x-auto text-xs font-mono text-emerald-300 shadow-2xl border-4 border-white">
                    {generatedCode}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};