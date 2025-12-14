import React, { useState, useRef, useEffect } from 'react';
import { AppState, DashboardTab, RoadmapTask, ChatMessage } from '../types';
import { Button, Card, Input, Icons, Textarea, CatRobot } from '../components/ui';
import { generateCodeForTask, createMentorChat } from '../services/geminiService';
import { Chat } from "@google/genai";

interface DashboardProps {
  state: AppState;
  onReset: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ state, onReset }) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.TRACKER);
  
  // Roadmap State
  const [phases, setPhases] = useState(state.roadmap);
  
  // Chat State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const chatSession = useRef<Chat | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Code Gen State
  const [selectedTaskForCode, setSelectedTaskForCode] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  
  // Custom Dropdown State
  const [isTaskDropdownOpen, setIsTaskDropdownOpen] = useState(false);

  // Toggle Task Completion
  const toggleTask = (phaseIndex: number, taskId: string) => {
    const newPhases = [...phases];
    const phase = newPhases[phaseIndex];
    const task = phase.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      setPhases(newPhases);
    }
  };

  // Initialize Chat
  useEffect(() => {
    if (state.projectIdea && !chatSession.current) {
      chatSession.current = createMentorChat(state.projectIdea);
      setChatHistory([{
        role: 'model',
        text: `Hi! I'm your mentor for "${state.projectIdea.title}". Ready to build? Ask me anything about tech, bugs, or scope!`,
        timestamp: Date.now()
      }]);
    }
  }, [state.projectIdea]);

  // Scroll Chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, activeTab]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !chatSession.current) return;
    
    const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: Date.now() };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatting(true);

    try {
      const result = await chatSession.current.sendMessage({ message: userMsg.text });
      const responseText = result.text || "I'm thinking... but got no words.";
      
      setChatHistory(prev => [...prev, {
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      }]);
    } catch (error) {
      setChatHistory(prev => [...prev, {
        role: 'model',
        text: "Connection error. Try asking again.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsChatting(false);
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.start();
    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setChatInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
  };

  const handleGenerateCode = async () => {
    if (!selectedTaskForCode || !state.projectIdea) return;
    
    // Find task detail
    let taskTitle = "";
    let taskDesc = "";
    phases.forEach(p => p.tasks.forEach(t => {
      if(t.id === selectedTaskForCode) {
        taskTitle = t.title;
        taskDesc = t.description;
      }
    }));

    setIsCodeLoading(true);
    setGeneratedCode("");
    
    try {
      const code = await generateCodeForTask(taskTitle, taskDesc, state.projectIdea);
      setGeneratedCode(code);
    } catch (e) {
      setGeneratedCode("// Failed to generate code. Please try again.");
    } finally {
      setIsCodeLoading(false);
    }
  };

  // Flatten tasks for dropdown
  const allTasks = phases.flatMap(p => p.tasks.map(t => ({ id: t.id, title: t.title, phase: p.phaseName })));
  
  // Get currently selected task object for label
  const currentTask = allTasks.find(t => t.id === selectedTaskForCode);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] max-w-7xl mx-auto bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white">{state.projectIdea?.title || "Hackathon Project"}</h1>
          <p className="text-xs text-slate-400">Duration: {state.hackathonDuration}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" className="text-xs" onClick={onReset}>New Project</Button>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex bg-slate-800/50 border-b border-slate-700 shrink-0">
        <button 
          onClick={() => setActiveTab(DashboardTab.TRACKER)}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === DashboardTab.TRACKER ? 'border-indigo-500 text-indigo-400 bg-slate-800' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <span className="flex items-center justify-center gap-2"><Icons.Map /> Flow Roadmap</span>
        </button>
        <button 
          onClick={() => setActiveTab(DashboardTab.MENTOR)}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === DashboardTab.MENTOR ? 'border-indigo-500 text-indigo-400 bg-slate-800' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <span className="flex items-center justify-center gap-2"><Icons.Brain /> Mentor AI</span>
        </button>
        <button 
          onClick={() => setActiveTab(DashboardTab.CODE)}
          className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === DashboardTab.CODE ? 'border-indigo-500 text-indigo-400 bg-slate-800' : 'border-transparent text-slate-400 hover:text-white'}`}
        >
          <span className="flex items-center justify-center gap-2"><Icons.Code /> Code Generator</span>
        </button>
      </div>

      {/* Content Area */}
      <main className="flex-1 overflow-hidden relative bg-slate-900/50">
        
        {/* TAB 1: FLOW CHART ROADMAP */}
        {activeTab === DashboardTab.TRACKER && (
          <div className="h-full overflow-y-auto p-8 relative">
            <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-slate-700/50 transform -translate-x-1/2"></div>
            
            <div className="space-y-16 relative mt-6">
              {phases.map((phase, pIdx) => (
                <div key={pIdx} className="relative">
                  
                  {/* START LABEL FOR FIRST STEP */}
                  {pIdx === 0 && (
                     <div className="absolute -top-14 left-0 md:left-1/2 md:transform md:-translate-x-1/2 flex flex-col items-center animate-bounce z-20">
                        <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg mb-1 tracking-wide">START HERE</span>
                        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-emerald-500"></div>
                     </div>
                  )}

                  {/* Phase Node */}
                  <div className="flex items-center justify-center mb-8 relative z-10">
                     <div className="bg-slate-800 border-2 border-indigo-500 text-indigo-300 px-6 py-2 rounded-full font-bold shadow-lg shadow-indigo-500/20">
                        {phase.phaseName}
                     </div>
                  </div>

                  {/* Tasks Flow */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-x-24">
                    {phase.tasks.map((task, tIdx) => {
                      const isLeft = tIdx % 2 === 0;
                      return (
                        <div 
                          key={task.id} 
                          className={`relative flex ${isLeft ? 'md:justify-end' : 'md:justify-start'} md:col-start-${isLeft ? '1' : '2'}`}
                        >
                           {/* Connector Line for Desktop */}
                           <div className={`hidden md:block absolute top-6 h-0.5 w-12 bg-slate-600 ${isLeft ? 'right-[-3rem]' : 'left-[-3rem]'}`}></div>
                           <div className={`hidden md:block absolute top-5 h-3 w-3 rounded-full bg-slate-500 ${isLeft ? 'right-[-3.4rem]' : 'left-[-3.4rem]'}`}></div>

                           <div 
                              onClick={() => toggleTask(pIdx, task.id)}
                              className={`
                                cursor-pointer group w-full md:max-w-md p-4 rounded-xl border transition-all duration-300
                                ${task.completed 
                                  ? 'bg-emerald-900/10 border-emerald-500/30' 
                                  : 'bg-slate-800 border-slate-700 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1'
                                }
                              `}
                           >
                              <div className="flex items-start gap-3">
                                {/* Number Badge for Step Order */}
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 border
                                  ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-700 border-slate-600 text-indigo-300'}`}>
                                   {tIdx + 1}
                                </div>

                                <div className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                  task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-500 bg-transparent'
                                }`}>
                                  {task.completed && <Icons.Check />}
                                </div>
                                <div>
                                  <h4 className={`font-semibold text-sm ${task.completed ? 'text-slate-500 line-through' : 'text-slate-200 group-hover:text-white'}`}>
                                    {task.title}
                                  </h4>
                                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    {task.description}
                                  </p>
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

        {/* TAB 2: MENTOR */}
        {activeTab === DashboardTab.MENTOR && (
          <div className="flex flex-col h-full bg-slate-900">
            {/* Robot Header */}
            <div className="bg-slate-800 border-b border-slate-700 p-4 text-center shrink-0">
               <CatRobot />
               <h3 className="text-indigo-400 font-bold mt-2 text-sm">Robo-Mentor Active</h3>
               <p className="text-slate-500 text-xs">Ask me anything!</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-md ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-br-none' 
                      : 'bg-slate-700 text-slate-200 border border-slate-600 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isChatting && (
                <div className="flex justify-start">
                   <div className="bg-slate-700 px-4 py-3 rounded-2xl rounded-bl-none border border-slate-600 shadow-md">
                     <span className="flex gap-1">
                       <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                       <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                       <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                     </span>
                   </div>
                </div>
              )}
              <div ref={chatEndRef}></div>
            </div>
            <div className="p-4 bg-slate-800 border-t border-slate-700 shrink-0">
              <div className="flex gap-2 items-center">
                <Button 
                  variant="outline" 
                  className={`px-3 py-2 ${isListening ? 'bg-red-500/20 text-red-400 border-red-500' : ''}`}
                  onClick={startListening}
                  title="Speak"
                >
                  <Icons.Mic />
                </Button>
                <Input 
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Ask for help..."
                  disabled={isChatting}
                />
                <Button onClick={handleSendMessage} disabled={isChatting || !chatInput.trim()}>Send</Button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CODE GENERATOR */}
        {activeTab === DashboardTab.CODE && (
          <div className="h-full overflow-y-auto p-6 flex flex-col">
            <div className="max-w-4xl mx-auto w-full space-y-6">
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                <h3 className="text-lg font-bold mb-4">Code Factory</h3>
                <p className="text-slate-400 text-sm mb-6">Select a task from your roadmap to generate a starter snippet or logic implementation.</p>
                
                <div className="flex flex-col gap-4 mb-4">
                  <label className="text-sm font-semibold text-slate-300">Choose a task:</label>
                  
                  {/* Custom Dropdown to force direction DOWN */}
                  <div className="relative">
                    <button 
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-left flex items-center justify-between transition-all"
                      onClick={() => setIsTaskDropdownOpen(!isTaskDropdownOpen)}
                    >
                      <span className={`truncate ${!selectedTaskForCode ? 'text-slate-500' : ''}`}>
                        {currentTask ? `${currentTask.phase}: ${currentTask.title}` : "-- Select a Task --"}
                      </span>
                      <div className={`transition-transform duration-200 ${isTaskDropdownOpen ? 'rotate-180' : ''}`}>
                        <Icons.ChevronDown />
                      </div>
                    </button>

                    {isTaskDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsTaskDropdownOpen(false)}></div>
                        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl z-20 max-h-60 overflow-y-auto">
                           {allTasks.map(task => (
                             <button
                               key={task.id}
                               className="w-full text-left px-4 py-3 hover:bg-slate-700 border-b border-slate-700/50 last:border-0 group"
                               onClick={() => {
                                 setSelectedTaskForCode(task.id);
                                 setIsTaskDropdownOpen(false);
                               }}
                             >
                               <div className="text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">{task.phase}</div>
                               <div className="text-slate-300 group-hover:text-white truncate text-sm">{task.title}</div>
                             </button>
                           ))}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleGenerateCode} 
                    isLoading={isCodeLoading} 
                    disabled={!selectedTaskForCode}
                    className="w-full py-3"
                  >
                    Generate Code
                  </Button>
                </div>
              </div>

              {generatedCode && (
                <div className="relative group animate-fade-in">
                  <div className="absolute right-4 top-4">
                    <Button 
                      variant="outline" 
                      className="text-xs py-1 px-2 h-auto"
                      onClick={() => navigator.clipboard.writeText(generatedCode)}
                    >
                      Copy
                    </Button>
                  </div>
                  <pre className="bg-[#1e1e1e] p-6 rounded-xl overflow-x-auto text-sm font-mono text-emerald-300 border border-slate-700 shadow-2xl">
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