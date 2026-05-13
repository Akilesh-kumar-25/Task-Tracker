'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Calendar as CalendarIcon, Plus, Trash2, GraduationCap, CheckSquare, Clock, History, Edit3 } from 'lucide-react';
import { Todo, Event } from '@/types';
import { formatDate } from '@/lib/calendar';

import { useAuth } from '@/context/AuthContext';
import { getUserTodos, saveTodo, deleteTodo, getUserExamGroups, saveExamGroup } from '@/lib/academic';

interface ActionCenterProps {
  onQuestXPUpdate?: (xp: number) => void;
  viewMode?: 'missions' | 'exams' | 'all';
}

export default function ActionCenter({ onQuestXPUpdate, viewMode = 'all' }: ActionCenterProps) {
  const { user } = useAuth();
  const [todos, setTodos] = useState<(Todo & { xp: number })[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [newTodo, setNewTodo] = useState('');
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '', type: 'exam' as 'exam' | 'reminder' | 'other' });
  const [isLoaded, setIsLoaded] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [historyPage, setHistoryPage] = useState(1);
  const [examGroups, setExamGroups] = useState<{id: string, name: string, subjects: any[], archived: boolean}[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<any | null>(null);
  const [showExamGroupModal, setShowExamGroupModal] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [newSubject, setNewSubject] = useState({ title: '', date: '', time: 'FN', syllabus: '' });
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [toast, setToast] = useState<{message: string, xp: number} | null>(null);
  const HISTORY_PER_PAGE = 12;

  // Load from Firestore
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [fetchedTodos, fetchedGroups] = await Promise.all([
          getUserTodos(user.uid),
          getUserExamGroups(user.uid)
        ]);
        
        if (fetchedTodos.length > 0) setTodos(fetchedTodos as any);
        
        if (fetchedGroups.length > 0) {
          setExamGroups(fetchedGroups as any);
        } else {
          const defaultGroups = [
            { 
              id: '1', 
              name: 'Semester Finals', 
              archived: false,
              subjects: [
                { id: 's1', title: 'OOSE', date: '2026-05-18', time: 'FN', syllabus: 'Modules 1-5: UML Diagrams, Design Patterns, Testing Strategies.' },
                { id: 's2', title: 'E&IOT', date: '2026-05-20', time: 'FN', syllabus: 'Embedded Systems, Sensors, Network Protocols, Cloud Integration.' }
              ]
            }
          ];
          setExamGroups(defaultGroups);
          // Save default to firestore
          await saveExamGroup(user.uid, defaultGroups[0]);
        }
        setIsLoaded(true);
      } catch (e) {
        console.error("Firestore Load Error:", e);
      }
    };
    loadData();
  }, [user]);

  // Sync back to Firestore (Debounced or individual calls are better but keeping logic similar for now)
  useEffect(() => {
    if (isLoaded && user) {
      if (onQuestXPUpdate) {
        const earnedXP = todos.filter(t => t.completed).reduce((sum, t) => sum + (t.xp || 5), 0);
        onQuestXPUpdate(earnedXP);
      }
      // Note: In a real app, we should save on individual actions, which I'll add to the handlers below.
    }
  }, [todos, examGroups, isLoaded, onQuestXPUpdate, user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowHistory(false);
        setSelectedSubject(null);
        setShowExamGroupModal(false);
        setShowAddSubjectModal(null);
        setIsEditingSubject(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddTodo = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTodo.trim() && user) {
      const id = Date.now().toString();
      const todo = {
        id,
        userId: user.uid,
        text: newTodo.trim(),
        completed: false,
        createdAt: new Date(),
        xp: Math.floor(Math.random() * 10) + 1
      };
      setTodos([...todos, todo]);
      setNewTodo('');
      await saveTodo(user.uid, todo);
    }
  };

  const toggleTodo = async (id: string) => {
    if (!user) return;
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    const isNowCompleted = !todo.completed;
    const xpGained = todo.xp || (Math.floor(Math.random() * 10) + 1);

    const updatedTodo = { 
      ...todo, 
      completed: isNowCompleted,
      completedAt: isNowCompleted ? new Date() : undefined 
    };

    setTodos(todos.map(t => t.id === id ? updatedTodo : t));
    await saveTodo(user.uid, updatedTodo);

    if (isNowCompleted) {
      setToast({ message: 'Quest Complete!', xp: xpGained });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const removeTodo = async (id: string) => {
    if (!user) return;
    setTodos(todos.filter(t => t.id !== id));
    await deleteTodo(user.uid, id);
  };

  const todoProgress = todos.length > 0 ? (todos.filter(t => t.completed).length / todos.length) * 100 : 0;

  return (
    <div className="space-y-8 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700 relative">
      
      {/* ACADEMIC HUB & MOMENTUM BAR */}
      <div className="bg-[#5c544d] rounded-[32px] p-8 shadow-2xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden text-white">
          <div className="absolute right-0 top-0 opacity-10 translate-x-8 -translate-y-8 rotate-12">
             <GraduationCap size={180} />
          </div>
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
              <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={276.46} strokeDashoffset={276.46 - (276.46 * todoProgress) / 100} className="text-white transition-all duration-1000" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-heading italic">{Math.round(todoProgress)}%</span>
              <span className="text-[7px] font-black uppercase tracking-widest opacity-60">Tasks</span>
            </div>
          </div>
          <div className="flex-1 text-center md:text-left relative z-10">
             <h2 className="text-3xl font-heading italic mb-1">Academic Hub</h2>
             <p className="text-sm text-white/70 leading-relaxed max-w-xl">
               Consolidated tactical center for exams and daily micro-missions. Synchronize your efforts to maintain peak academic performance.
             </p>
          </div>
      </div>

      <div className={`grid grid-cols-1 ${viewMode === 'all' ? 'lg:grid-cols-2' : ''} gap-8 relative`}>
        {/* QUEST TOAST */}
        {toast && (
          <div className="fixed top-8 right-8 z-[1000] bg-[#5c544d] text-white px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-right-10 duration-500 flex items-center gap-4 border border-white/20">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
              +{toast.xp}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Victory!</p>
              <p className="text-sm font-bold">{toast.message}</p>
            </div>
          </div>
        )}

        {/* TO-DO LIST */}
        {(viewMode === 'all' || viewMode === 'missions') && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-[32px] p-8 shadow-2xl border border-white dark:border-slate-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#5c544d] p-2 rounded-xl shadow-lg">
                <CheckSquare className="text-white w-5 h-5" />
              </div>
              <div>
                <h2 className="text-2xl font-heading italic text-[#5c544d] dark:text-white">Micro-Missions</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b7f74] opacity-60">Earn XP • Quick Quests</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  onKeyDown={handleAddTodo}
                  placeholder="e.g. Search for gifts, Project research..."
                  className="flex-1 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#8b7f74]/20 transition-all"
                />
                <button onClick={() => setShowHistory(!showHistory)} className={`p-3 rounded-xl transition-all ${showHistory ? 'bg-[#5c544d] text-white' : 'bg-gray-100 text-gray-500'}`} title="View History">
                  <History size={18} />
                </button>
                <button onClick={() => handleAddTodo({ key: 'Enter' } as any)} className="bg-[#5c544d] text-white px-4 rounded-xl hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest shadow-md">
                  Add Quest
                </button>
              </div>
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#8b7f74]/20">
                {todos.filter(t => !t.completed).map(todo => (
                  <div key={todo.id} className="group flex items-center justify-between p-3 rounded-xl border bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 shadow-sm transition-all hover:border-[#8b7f74]">
                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                      <button onClick={() => toggleTodo(todo.id)} className="w-5 h-5 rounded-full flex items-center justify-center transition-all border-2 border-[#8b7f74]/40 hover:border-[#8b7f74]">
                        {todo.completed && <CheckCircle2 size={12} />}
                      </button>
                      <span className="text-sm font-bold text-[#5c544d] dark:text-slate-200">
                        {todo.text}
                      </span>
                    </label>
                    <button onClick={() => removeTodo(todo.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {showHistory && (
              <div className="mt-8 pt-8 border-t border-[#5c544d]/10 animate-in fade-in slide-in-from-top-4 duration-500">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-[#8b7f74] mb-4">Quest History</h3>
                <div className="grid grid-cols-2 gap-3">
                  {todos.filter(t => t.completed).map(todo => (
                    <div key={todo.id} className="p-3 bg-gray-50 dark:bg-slate-900/30 rounded-xl text-center">
                      <h4 className="text-[11px] font-bold text-[#5c544d] dark:text-gray-300 truncate line-through opacity-60">{todo.text}</h4>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* EXAM CALENDAR & EVENTS */}
        {(viewMode === 'all' || viewMode === 'exams') && (
          <div id="exam-hub" className="bg-[#f0ebe6]/50 dark:bg-slate-900/50 backdrop-blur-md rounded-[32px] p-8 shadow-2xl border border-white dark:border-slate-700 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-[#8b7f74] p-2 rounded-xl shadow-lg">
                  <GraduationCap className="text-white w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-heading italic text-[#5c544d] dark:text-white">Exam Batches</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8b7f74] opacity-60">Grouped Timetables</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowArchived(!showArchived)} className={`p-2.5 rounded-xl transition-all shadow-sm ${showArchived ? 'bg-[#8b7f74] text-white' : 'bg-gray-100 text-gray-500'}`} title={showArchived ? "View Active Batches" : "View Archived Batches"}>
                  <History size={18} />
                </button>
                <button onClick={() => setShowExamGroupModal(true)} className="bg-[#5c544d] text-white p-2.5 rounded-xl hover:scale-110 transition-all shadow-md">
                  <Plus size={18} />
                </button>
              </div>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#8b7f74]/20">
              {examGroups.filter(g => g.archived === showArchived).map(group => (
                <div key={group.id} className="bg-white/80 dark:bg-slate-800/80 rounded-[24px] p-6 border border-white/40 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-slate-700 pb-3">
                    <h3 className="font-heading italic text-lg text-[#5c544d] dark:text-white">{group.name} {group.archived && <span className="text-[10px] opacity-40 ml-2">(Archived)</span>}</h3>
                    <div className="flex gap-3 items-center">
                      {!group.archived ? (
                        <>
                          <button onClick={() => setShowAddSubjectModal(group.id)} className="text-[10px] font-bold text-[#5c544d] hover:underline">+ Subject</button>
                          <button onClick={async () => {
                            const updated = examGroups.map(g => g.id === group.id ? {...g, archived: true} : g);
                            setExamGroups(updated);
                            const target = updated.find(g => g.id === group.id);
                            if (target && user) await saveExamGroup(user.uid, target);
                          }} className="text-[9px] font-black uppercase tracking-widest text-[#8b7f74] hover:text-rose-500 transition-colors">Archive</button>
                        </>
                      ) : (
                        <button onClick={async () => {
                          const updated = examGroups.map(g => g.id === group.id ? {...g, archived: false} : g);
                          setExamGroups(updated);
                          const target = updated.find(g => g.id === group.id);
                          if (target && user) await saveExamGroup(user.uid, target);
                        }} className="text-[9px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-500 transition-colors font-bold">Unarchive</button>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {group.subjects.map(subj => {
                       const eventDate = new Date(subj.date);
                       const isToday = eventDate.toDateString() === new Date().toDateString();
                       return (
                         <div key={subj.id} onClick={() => setSelectedSubject({...subj, groupName: group.name})} className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${isToday ? 'border-[#8b7f74] bg-[#8b7f74]/5' : 'border-gray-50 bg-gray-50/50 dark:bg-slate-900/30 dark:border-slate-800 hover:border-[#8b7f74]/30'}`}>
                           <div className="flex items-center gap-3">
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black ${isToday ? 'bg-[#5c544d] text-white' : 'bg-gray-100 text-gray-500'}`}>{eventDate.getDate()}</div>
                             <div>
                               <p className="text-xs font-bold text-[#5c544d] dark:text-white">{subj.title}</p>
                               <p className="text-[8px] font-black text-[#8b7f74] uppercase tracking-widest">{subj.time}</p>
                             </div>
                           </div>
                           <div className="text-[9px] font-black text-[#8b7f74] uppercase">Details</div>
                         </div>
                       );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SYLLABUS POPUP */}
      {selectedSubject && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" onClick={() => setSelectedSubject(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8b7f74]">{selectedSubject.groupName}</span>
                <h2 className="text-3xl font-heading italic text-[#5c544d] dark:text-white mt-1">{selectedSubject.title}</h2>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditingSubject(!isEditingSubject)} 
                  className={`p-2 rounded-full transition-all ${isEditingSubject ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-[#5c544d]'}`}
                >
                  {isEditingSubject ? <CheckSquare size={18} /> : <Edit3 size={18} />} 
                </button>
                <button onClick={() => { setSelectedSubject(null); setIsEditingSubject(false); }} className="p-2 bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-rose-500 rounded-full transition-all" title="Close"><Plus size={20} className="rotate-45" /></button>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-950/50 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 mb-6">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-[#8b7f74] mb-3">Preparation Syllabus</h4>
              {isEditingSubject ? (
                <textarea 
                  value={selectedSubject.syllabus}
                  onChange={(e) => setSelectedSubject({...selectedSubject, syllabus: e.target.value})}
                  className="w-full min-h-[150px] bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-sm font-medium outline-none focus:ring-2 ring-[#5c544d]/20 resize-none"
                  placeholder="Update topics to cover..."
                />
              ) : (
                <p className="text-sm font-medium leading-relaxed text-[#5c544d] dark:text-gray-300 whitespace-pre-line">
                  {selectedSubject.syllabus || 'No syllabus added yet.'}
                </p>
              )}
            </div>
            {isEditingSubject ? (
              <button 
                onClick={async () => {
                  if (!user) return;
                  const updatedGroups = examGroups.map(g => {
                    const groupSubjects = g.subjects.map(s => s.id === selectedSubject.id ? { ...s, syllabus: selectedSubject.syllabus } : s);
                    return { ...g, subjects: groupSubjects };
                  });
                  setExamGroups(updatedGroups);
                  
                  const targetGroup = updatedGroups.find(g => g.name === selectedSubject.groupName);
                  if (targetGroup) await saveExamGroup(user.uid, targetGroup);

                  setIsEditingSubject(false);
                  setToast({ message: 'Syllabus Updated!', xp: 5 });
                  setTimeout(() => setToast(null), 3000);
                }}
                className="w-full h-12 rounded-xl bg-[#5c544d] text-white font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg"
              >
                Save Changes
              </button>
            ) : (
              <div className="flex items-center gap-4 text-xs font-bold text-[#8b7f74]">
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm"><CalendarIcon size={14}/> {selectedSubject.date}</div>
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-sm"><Clock size={14}/> {selectedSubject.time} Session</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW EXAM GROUP MODAL */}
      {showExamGroupModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" onClick={() => setShowExamGroupModal(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 border border-white/20" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-heading italic text-[#5c544d] dark:text-white mb-6">New Exam Batch</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-[#8b7f74] uppercase tracking-widest mb-1">Batch Name</label>
                <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="e.g. CAT 1, Final Semester" className="w-full h-12 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 px-4 text-sm font-bold outline-none" />
              </div>
              <button 
                onClick={async () => {
                  if (newGroupName.trim() && user) {
                    const newGroup = { id: Date.now().toString(), name: newGroupName.trim(), subjects: [], archived: false };
                    setExamGroups([...examGroups, newGroup]);
                    setNewGroupName('');
                    setShowExamGroupModal(false);
                    await saveExamGroup(user.uid, newGroup);
                  }
                }}
                className="w-full h-12 rounded-xl bg-[#5c544d] text-white font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg"
              >
                Create Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW SUBJECT MODAL */}
      {showAddSubjectModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4" onClick={() => setShowAddSubjectModal(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-300 border border-white/20" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-heading italic text-[#5c544d] dark:text-white mb-6">Add Subject</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-[#8b7f74] uppercase tracking-widest mb-1">Subject Title</label>
                <input type="text" value={newSubject.title} onChange={e => setNewSubject({...newSubject, title: e.target.value})} placeholder="e.g. Mathematics" className="w-full h-12 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 px-4 text-sm font-bold outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-[#8b7f74] uppercase tracking-widest mb-1">Date</label>
                  <input type="date" value={newSubject.date} onChange={e => setNewSubject({...newSubject, date: e.target.value})} className="w-full h-12 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 px-3 text-xs font-bold outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-[#8b7f74] uppercase tracking-widest mb-1">Session</label>
                  <select value={newSubject.time} onChange={e => setNewSubject({...newSubject, time: e.target.value})} className="w-full h-12 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 px-3 text-xs font-bold outline-none">
                    <option value="FN">FN (Morning)</option>
                    <option value="AN">AN (Afternoon)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#8b7f74] uppercase tracking-widest mb-1">Syllabus / Notes</label>
                <textarea value={newSubject.syllabus} onChange={e => setNewSubject({...newSubject, syllabus: e.target.value})} placeholder="Topics to cover..." className="w-full min-h-[100px] p-4 bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#5c544d]/20 resize-none" />
              </div>
              <button 
                onClick={async () => {
                  if (newSubject.title && user) {
                    const updatedGroups = examGroups.map(g => g.id === showAddSubjectModal ? {
                      ...g,
                      subjects: [...(g.subjects || []), { 
                        ...newSubject, 
                        id: Date.now().toString(),
                        date: newSubject.date || formatDate(new Date()) 
                      }]
                    } : g);
                    setExamGroups(updatedGroups);
                    
                    const targetGroup = updatedGroups.find(g => g.id === showAddSubjectModal);
                    if (targetGroup) await saveExamGroup(user.uid, targetGroup);

                    setNewSubject({ title: '', date: '', time: 'FN', syllabus: '' });
                    setShowAddSubjectModal(null);
                  }
                }}
                className="w-full h-12 rounded-xl bg-[#5c544d] text-white font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-lg active:scale-95"
              >
                Add to Batch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MASTER HISTORY MODAL */}
      {showHistory && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-[#5c544d]/95 backdrop-blur-xl animate-in fade-in duration-500" onClick={() => setShowHistory(false)}></div>
          <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-full max-h-[90vh] rounded-[48px] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-in zoom-in-95 duration-500 border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="p-8 md:p-12 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-4xl font-heading italic text-[#5c544d] dark:text-white mb-2">Mastery Archive</h2>
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#8b7f74]">History of Quest & Academic Milestones</p>
              </div>
              <button onClick={() => setShowHistory(false)} className="w-14 h-14 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center hover:rotate-90 transition-all duration-300">
                <Plus size={28} className="rotate-45" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* QUEST HISTORY */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-heading italic text-[#5c544d] dark:text-white border-b border-gray-100 pb-4">Quest History</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {todos.filter(t => t.completed).map((todo) => (
                      <div key={todo.id} className="p-4 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700 text-center">
                         <h4 className="text-xs font-bold text-[#5c544d] dark:text-white truncate mb-1">{todo.text}</h4>
                         <p className="text-[8px] font-black uppercase tracking-widest text-[#8b7f74]">{new Date(todo.completedAt || todo.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* EXAM ARCHIVE */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-heading italic text-[#5c544d] dark:text-white border-b border-gray-100 pb-4">Exam Archive</h3>
                  <div className="space-y-4">
                    {examGroups.filter(g => g.archived).map(group => (
                      <div key={group.id} className="p-6 bg-gray-50 dark:bg-slate-800/50 rounded-[32px] border border-gray-100 dark:border-slate-700 group/archive">
                        <div className="flex justify-between items-center mb-4">
                           <div>
                             <h4 className="font-heading italic text-[#5c544d] dark:text-white">{group.name}</h4>
                             <span className="text-[9px] font-black uppercase tracking-widest text-[#8b7f74]">ARCHIVED</span>
                           </div>
                           <button 
                             onClick={() => setExamGroups(prev => prev.map(g => g.id === group.id ? {...g, archived: false} : g))}
                             className="px-3 py-1 bg-white dark:bg-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest text-[#5c544d] border border-gray-200 dark:border-slate-700 hover:bg-[#5c544d] hover:text-white transition-all opacity-0 group-hover/archive:opacity-100"
                           >
                             Unarchive
                           </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {group.subjects.map(s => <span key={s.id} className="px-3 py-1 bg-white dark:bg-slate-900 rounded-lg text-[10px] font-bold text-[#8b7f74] border border-gray-100 dark:border-slate-800">{s.title}</span>)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
