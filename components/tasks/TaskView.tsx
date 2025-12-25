
import React, { useState, useEffect, useMemo } from 'react';
import { Task, Module, Team, TeamMember, Assignment } from '../../types';
import { 
  Plus, Search, Calendar, Clock, Edit2, Save, X, Link2, Target, ChevronRight, 
  AlertCircle, Loader2, Lock, FileSearch, User, Users as UsersIcon,
  Timer, HardHat, Info
} from 'lucide-react';
import TaskAnalysis from './TaskAnalysis';

interface TaskViewProps {
  tasks: Task[];
  modules: Module[];
  teams: Team[];
  members: TeamMember[];
  assignments: Assignment[];
  onAddTask: (task: Omit<Task, 'id' | 'created_at'>) => Promise<any>;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => Promise<any>;
  onUpdateStatus: (taskId: string, status: string) => void;
}

const TaskView: React.FC<TaskViewProps> = ({ tasks = [], modules = [], teams = [], members = [], onAddTask, onUpdateTask, onUpdateStatus }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTaskForAnalysis, setSelectedTaskForAnalysis] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [taskData, setTaskData] = useState<Omit<Task, 'id' | 'created_at'>>({
    title: '',
    description: '',
    module_id: '',
    priority: 'Medium',
    requested_by: 'Product',
    start_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    teams_involved: [], 
    team_work: {},     
    status: 'PLANNING'
  });

  const allowedStatuses = [
    "PLANNING",
    "ON_HOLD",
    "COMPLETED",
    "CANCELLED"
  ];

  useEffect(() => {
    if (!taskData.module_id && modules?.length > 0 && !editingTask) {
      setTaskData(prev => ({ ...prev, module_id: modules[0].id }));
    }
  }, [modules, editingTask]);

  const handleOpenCreate = () => {
    setEditingTask(null);
    setTaskData({
      title: '',
      description: '',
      module_id: modules?.[0]?.id || '',
      priority: 'Medium',
      requested_by: 'Product',
      start_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      teams_involved: [],
      team_work: {},
      status: 'PLANNING'
    });
    setShowForm(true);
  };

  const handleOpenEdit = (task: Task) => {
    setEditingTask(task);
    setTaskData({
      title: task.title || '',
      description: task.description || '',
      module_id: task.module_id || '',
      priority: task.priority || 'Medium',
      requested_by: task.requested_by || 'Product',
      start_date: task.start_date ? task.start_date.split('T')[0] : '',
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      teams_involved: [...(task.teams_involved || [])],
      team_work: { ...(task.team_work || {}) },
      status: task.status
    });
    setShowForm(true);
  };

  const toggleTeam = (teamId: string) => {
    if (editingTask && editingTask.status === 'COMMITTED') return;
    
    setTaskData(prev => {
      const isAdding = !prev.teams_involved.includes(teamId);
      const nextTeams = isAdding ? [...prev.teams_involved, teamId] : prev.teams_involved.filter(id => id !== teamId);
      const nextTeamWork = { ...prev.team_work };
      if (isAdding) {
        nextTeamWork[teamId] = { effort_hours: 8, depends_on: [] };
      } else {
        delete nextTeamWork[teamId];
        Object.keys(nextTeamWork).forEach(key => {
          if (nextTeamWork[key].depends_on) {
            nextTeamWork[key].depends_on = nextTeamWork[key].depends_on?.filter(id => id !== teamId);
          }
        });
      }
      return { ...prev, teams_involved: nextTeams, team_work: nextTeamWork };
    });
  };

  const toggleDependency = (targetTeamId: string, dependsOnId: string) => {
    if (editingTask && editingTask.status === 'COMMITTED') return;

    setTaskData(prev => {
      const currentDeps = prev.team_work[targetTeamId]?.depends_on || [];
      const nextDeps = currentDeps.includes(dependsOnId)
        ? currentDeps.filter(id => id !== dependsOnId)
        : [...currentDeps, dependsOnId];
      return {
        ...prev,
        team_work: {
          ...prev.team_work,
          [targetTeamId]: { ...prev.team_work[targetTeamId], depends_on: nextDeps }
        }
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskData.module_id || taskData.teams_involved.length === 0) {
      alert("Select a module and at least one team.");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingTask) {
        const { status, ...metadata } = taskData;
        await onUpdateTask(editingTask.id, metadata);
      } else {
        await onAddTask(taskData);
      }
      setShowForm(false);
    } catch (err: any) {
      alert(`Sync Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTasks = useMemo(() => {
    const arr = Array.isArray(tasks) ? tasks : [];
    if (!searchQuery) return arr;
    const q = searchQuery.toLowerCase();
    return arr.filter(t => (t?.title || '').toLowerCase().includes(q));
  }, [tasks, searchQuery]);

  const formatDateShort = (dateStr: string | undefined) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800';
      case 'High': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800';
      case 'Medium': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Low': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusStyles = (status: string) => {
    const s = (status || '').toUpperCase();
    switch (s) {
      case 'PLANNING': return 'bg-slate-500 text-white';
      case 'COMMITTED': return 'bg-[#0052CC] text-white shadow-blue-500/20';
      case 'COMPLETED': return 'bg-[#36B37E] text-white';
      case 'BLOCKED': return 'bg-[#FF5630] text-white';
      case 'ON_HOLD': return 'bg-amber-500 text-white';
      case 'CANCELLED': return 'bg-red-700 text-white';
      default: return 'bg-slate-400 text-white';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B778C]" size={16} />
          <input 
            type="text" 
            placeholder="Search work orders..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1D2125] border border-[#DFE1E6] dark:border-[#333C4B] rounded text-sm outline-none transition-all focus:ring-2 focus:ring-[#0052CC]/20" 
          />
        </div>
        <button onClick={handleOpenCreate} className="bg-[#0052CC] text-white px-4 py-2 rounded font-bold text-sm hover:bg-[#0747A6] flex items-center space-x-2 shadow-sm transition-all active:scale-95">
          <Plus size={16} />
          <span>Create Task</span>
        </button>
      </div>

      {filteredTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTasks.map(task => {
            const status = (task.status || '').toUpperCase();
            const moduleName = modules.find(m => m.id === task.module_id)?.name || 'General';
            const totalHours = Object.values(task.team_work || {}).reduce((acc, curr: any) => acc + (curr.effort_hours || 0), 0);
            
            return (
              <div key={task.id} className="bg-white dark:bg-[#1D2125] border border-[#DFE1E6] dark:border-[#333C4B] rounded-lg p-5 flex flex-col hover:shadow-xl hover:-translate-y-0.5 transition-all group h-full shadow-sm relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 ${status === 'COMMITTED' ? 'bg-[#0052CC]' : status === 'COMPLETED' ? 'bg-[#36B37E]' : status === 'CANCELLED' ? 'bg-red-700' : 'bg-slate-400'}`}></div>
                
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    {/* Status Select outside edit screen - Styled as in image */}
                    <div className="relative inline-block mb-3 group/status">
                      <select 
                        value={status}
                        onChange={(e) => onUpdateStatus(task.id, e.target.value)}
                        className={`appearance-none text-[10px] font-black uppercase tracking-wider px-3 py-1.5 pr-7 rounded-full inline-block shadow-sm border-none cursor-pointer outline-none transition-all ${getStatusStyles(status)}`}
                      >
                        {status === 'COMMITTED' && <option value="COMMITTED">COMMITTED</option>}
                        {allowedStatuses.map(s => (
                          <option key={s} value={s} className="bg-white text-slate-900 dark:bg-[#1D2125] dark:text-[#E2E8F0]">
                            {s}
                          </option>
                        ))}
                      </select>
                      <ChevronRight size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 text-white pointer-events-none opacity-80" />
                    </div>

                    <h3 className="text-xl font-bold text-[#0052CC] dark:text-[#4C9AFF] truncate transition-colors" title={task.title}>{task.title}</h3>
                    
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-[11px] text-[#172B4D] dark:text-[#E2E8F0] font-bold uppercase tracking-tight">{moduleName}</p>
                      <span className="text-gray-300 dark:text-gray-700 text-xs">•</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${getPriorityStyles(task.priority)}`}>
                        {task.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Edit icon (pen) only available when Task status is in PLANNING */}
                  {status === 'PLANNING' && (
                    <button onClick={() => handleOpenEdit(task)} className="p-2 text-[#6B778C] hover:text-[#0052CC] hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all flex-shrink-0">
                      <Edit2 size={16} />
                    </button>
                  )}
                </div>

                <p className="text-sm text-[#42526E] dark:text-[#B3BAC5] line-clamp-2 mb-6 leading-relaxed">
                  {task.description || 'No detailed specifications provided.'}
                </p>

                <div className="space-y-4 mb-5 flex-1">
                  <div className="p-3 bg-slate-50 dark:bg-[#161B22] rounded-lg border dark:border-[#333C4B] space-y-2 shadow-sm">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#6B778C] font-bold uppercase tracking-tighter">Planned Start</span>
                      <span className="text-[#172B4D] dark:text-[#E2E8F0] font-bold">{formatDateShort(task.start_date)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-[#6B778C] font-bold uppercase tracking-tighter">Final Deadline</span>
                      <span className="text-[#BF2600] font-bold">{formatDateShort(task.due_date)}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-[#6B778C] uppercase tracking-widest">Involved Teams</span>
                      <div className="flex items-center text-[11px] font-bold text-[#172B4D] dark:text-[#E2E8F0]">
                        <Clock size={14} className="mr-1 text-[#0052CC]" /> {totalHours}h Total
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {task.teams_involved?.map(tid => {
                        const team = teams.find(t => t.id === tid);
                        const work = task.team_work?.[tid];
                        return (
                          <div key={tid} className="flex flex-col items-center">
                            <span className="text-[10px] px-2.5 py-1 bg-[#DEEBFF] dark:bg-[#0747A6]/30 text-[#0052CC] dark:text-[#4C9AFF] rounded-md font-bold uppercase border border-[#B3D4FF] dark:border-[#0747A6]/50 shadow-sm">
                              {team?.name || tid}
                              {work && <span className="ml-1 opacity-60">({work.effort_hours}h)</span>}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-5 border-t dark:border-[#333C4B] flex justify-between items-center">
                  <div className="flex items-center text-[11px] font-bold text-[#6B778C] dark:text-[#B3BAC5]">
                    <User size={14} className="mr-2" /> 
                    <span className="truncate max-w-[100px]">Req by: {task.requested_by}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {status === 'PLANNING' && (
                      <button 
                        onClick={() => setSelectedTaskForAnalysis(task)} 
                        className="text-[10px] font-black text-[#0052CC] dark:text-[#4C9AFF] uppercase tracking-widest hover:bg-[#DEEBFF] dark:hover:bg-blue-900/40 border border-[#0052CC] dark:border-[#4C9AFF] px-3.5 py-2 rounded-md transition-all shadow-sm flex items-center"
                      >
                        <Target size={14} className="mr-2" />
                        Analyze
                      </button>
                    )}
                    {status === 'COMMITTED' && (
                      <div className="flex items-center text-[10px] font-bold text-[#006644] bg-[#E3FCEF] dark:bg-green-900/20 px-3 py-1.5 rounded-md border border-[#ABF5D1] dark:border-[#134D2E]">
                        <HardHat size={14} className="mr-2" /> ACTIVE
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed rounded-xl dark:border-[#333C4B] bg-white/50 dark:bg-[#1D2125]/50">
          <FileSearch size={64} className="text-[#6B778C] mb-4 opacity-20" />
          <p className="text-xl font-bold text-[#172B4D] dark:text-[#E2E8F0]">Grid is Empty</p>
          <p className="text-sm text-[#6B778C] mt-1">Initialize a new work order to begin resource mapping.</p>
          <button onClick={handleOpenCreate} className="mt-6 px-8 py-2.5 bg-[#0052CC] text-white rounded-md font-bold text-sm shadow-lg hover:shadow-blue-500/30 transition-all active:scale-95">
            Assemble New Task
          </button>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1D2125] rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-5 border-b dark:border-[#333C4B] flex justify-between items-center bg-slate-50 dark:bg-[#161B22]">
              <div>
                <h2 className="text-xl font-bold">{editingTask ? 'Edit Task Topology' : 'Initialize Task Grid'}</h2>
                <p className="text-[10px] font-bold text-[#6B778C] uppercase tracking-widest mt-0.5">Resource Requirements & Scheduling</p>
              </div>
              <button onClick={() => setShowForm(false)} className="hover:bg-gray-100 dark:hover:bg-white/10 p-2 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-8 custom-scrollbar">
              <div className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-[#6B778C] uppercase tracking-[0.15em]">Work Order Title</label>
                  <input required value={taskData.title} onChange={e => setTaskData({...taskData, title: e.target.value})} placeholder="e.g. Core Auth Refactoring" className="w-full px-3 py-2 border dark:border-[#333C4B] dark:bg-[#161B22] rounded text-sm focus:border-[#0052CC] outline-none transition-all focus:ring-1 focus:ring-[#0052CC]" />
                </div>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#6B778C] uppercase tracking-[0.15em]">Functional Module</label>
                    <select required value={taskData.module_id} onChange={e => setTaskData({...taskData, module_id: e.target.value})} className="w-full px-3 py-2 border dark:border-[#333C4B] dark:bg-[#161B22] rounded text-sm focus:border-[#0052CC] outline-none">
                      <option value="">Select Domain...</option>
                      {modules.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black text-[#6B778C] uppercase tracking-[0.15em]">Technical Specifications</label>
                  <textarea value={taskData.description} onChange={e => setTaskData({...taskData, description: e.target.value})} placeholder="Outline the scope and expected outcomes..." className="w-full px-3 py-2 border dark:border-[#333C4B] dark:bg-[#161B22] rounded text-sm h-32 focus:border-[#0052CC] outline-none resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#6B778C] uppercase tracking-[0.15em]">Deployment Start</label>
                    <input type="date" value={taskData.start_date} onChange={e => setTaskData({...taskData, start_date: e.target.value})} className="w-full px-3 py-2 border dark:border-[#333C4B] dark:bg-[#161B22] rounded text-sm focus:border-[#0052CC] outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#6B778C] uppercase tracking-[0.15em]">Final Deadline</label>
                    <input type="date" value={taskData.due_date} onChange={e => setTaskData({...taskData, due_date: e.target.value})} className="w-full px-3 py-2 border dark:border-[#333C4B] dark:bg-[#161B22] rounded text-sm focus:border-[#0052CC] outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#6B778C] uppercase tracking-[0.15em]">Priority Rank</label>
                    <select value={taskData.priority} onChange={e => setTaskData({...taskData, priority: e.target.value as any})} className="w-full px-3 py-2 border dark:border-[#333C4B] dark:bg-[#161B22] rounded text-sm focus:border-[#0052CC] outline-none">
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-[#6B778C] uppercase tracking-[0.15em]">Originator</label>
                    <input value={taskData.requested_by} onChange={e => setTaskData({...taskData, requested_by: e.target.value})} className="w-full px-3 py-2 border dark:border-[#333C4B] dark:bg-[#161B22] rounded text-sm focus:border-[#0052CC] outline-none" />
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-[#161B22] p-5 rounded-lg border dark:border-[#333C4B] space-y-5">
                <div className="flex items-center justify-between border-b dark:border-[#333C4B] pb-2">
                  <h3 className="text-xs font-black uppercase tracking-[0.15em] flex items-center">
                    <UsersIcon size={14} className="mr-2 text-[#0052CC]" /> Team Allocation Matrix
                    {editingTask && editingTask.status === 'COMMITTED' && (
                      <span className="ml-2 flex items-center text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold border border-amber-200">
                        <Lock size={10} className="mr-1" /> CORE LOCKED
                      </span>
                    )}
                  </h3>
                  <span className="text-[10px] font-black text-[#6B778C]">{taskData.teams_involved.length} Cluster(s)</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {teams.map(t => (
                    <button 
                      key={t.id} 
                      type="button" 
                      onClick={() => toggleTeam(t.id)} 
                      disabled={editingTask?.status === 'COMMITTED'}
                      className={`px-3 py-1.5 rounded text-[10px] font-black uppercase border transition-all ${taskData.teams_involved.includes(t.id) ? 'bg-[#0052CC] text-white border-[#0052CC] shadow-md' : 'bg-white dark:bg-[#1D2125] border-gray-200 dark:border-gray-700 hover:border-[#0052CC]'} ${editingTask?.status === 'COMMITTED' ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
                <div className="space-y-3">
                  {taskData.teams_involved.map(teamId => {
                    const teamName = teams.find(t => t.id === teamId)?.name || teamId;
                    return (
                      <div key={teamId} className="bg-white dark:bg-[#1D2125] p-3 rounded-lg border dark:border-[#333C4B] space-y-3 shadow-sm transition-all hover:ring-1 hover:ring-[#0052CC]/30">
                        <div className="flex justify-between items-center border-b pb-2 dark:border-[#333C4B]">
                          <span className="text-xs font-black text-[#172B4D] dark:text-white uppercase tracking-tight">{teamName}</span>
                          <div className="flex items-center space-x-2">
                            <input 
                              type="number" 
                              min="1" 
                              disabled={editingTask?.status === 'COMMITTED'}
                              value={taskData.team_work[teamId]?.effort_hours || 0} 
                              onChange={e => setTaskData({...taskData, team_work: {...taskData.team_work, [teamId]: {...taskData.team_work[teamId], effort_hours: parseInt(e.target.value) || 0}}})} 
                              className="w-16 px-2 py-1 border dark:border-[#333C4B] dark:bg-[#161B22] rounded text-center text-xs font-bold focus:border-[#0052CC] outline-none disabled:bg-slate-50 disabled:text-slate-500" 
                            />
                            <span className="text-[10px] font-black text-[#6B778C] uppercase">Hrs</span>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[9px] font-black text-[#6B778C] uppercase tracking-[0.2em] flex items-center">
                            <Link2 size={10} className="mr-1" /> Dependencies
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {taskData.teams_involved.filter(id => id !== teamId).length === 0 ? (
                               <span className="text-[9px] text-gray-400 italic">No adjacent teams selected.</span>
                            ) : (
                               taskData.teams_involved.filter(id => id !== teamId).map(otherId => {
                                 const otherTeamName = teams.find(t => t.id === otherId)?.name || otherId;
                                 const isDep = taskData.team_work[teamId]?.depends_on?.includes(otherId);
                                 return (
                                   <button 
                                     key={otherId} 
                                     type="button" 
                                     disabled={editingTask?.status === 'COMMITTED'}
                                     onClick={() => toggleDependency(teamId, otherId)} 
                                     className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all ${isDep ? 'bg-[#172B4D] dark:bg-[#0052CC] text-white border-[#172B4D]' : 'bg-slate-100 dark:bg-slate-800 border-transparent hover:border-gray-300'} ${editingTask?.status === 'COMMITTED' ? 'opacity-70 cursor-not-allowed' : ''}`}
                                   >
                                     {otherTeamName}
                                   </button>
                                 );
                               })
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="col-span-full flex justify-end space-x-4 pt-6 border-t dark:border-[#333C4B] sticky bottom-0 bg-white dark:bg-[#1D2125]">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2.5 text-sm font-bold text-[#42526E] hover:bg-gray-100 dark:hover:bg-white/5 rounded-md transition-all">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-10 py-2.5 bg-[#0052CC] text-white rounded-md font-bold text-sm shadow-xl hover:shadow-blue-500/30 hover:bg-[#0747A6] transition-all disabled:opacity-50 active:scale-95 flex items-center space-x-2">
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  <span>{isSubmitting ? 'Syncing Schema...' : (editingTask ? 'Apply Changes' : 'Initialize Task')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedTaskForAnalysis && (
        <TaskAnalysis 
          task={selectedTaskForAnalysis} 
          members={members} 
          onClose={() => setSelectedTaskForAnalysis(null)}
          onEdit={() => {
            const t = selectedTaskForAnalysis;
            setSelectedTaskForAnalysis(null);
            handleOpenEdit(t);
          }}
        />
      )}
    </div>
  );
};

export default TaskView;
