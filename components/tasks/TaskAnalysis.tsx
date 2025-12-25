
import React, { useEffect, useState, useMemo } from "react";
import { 
  Loader2, X, Rocket, ShieldAlert, Target, Lightbulb, Calendar, 
  UserCheck, Timer, CheckCircle2, AlertTriangle, AlertCircle,
  ArrowRight, Info, Clock, User, HardHat
} from "lucide-react";
import { useStore } from "../../store/useStore";
import { Task, TeamMember } from "../../types";

interface TaskAnalysisProps {
  task: Task;
  members: TeamMember[];
  onClose: () => void;
  onEdit: () => void;
}

const TaskAnalysis: React.FC<TaskAnalysisProps> = ({ task, members, onClose, onEdit }) => {
  const store = useStore();
  const [loading, setLoading] = useState(true);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const analyze = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await store.analyzeTask(task.id);
        if (mounted) setResult(data);
      } catch (e: any) {
        if (mounted) setError(e.message || "Analysis failure.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    analyze();
    return () => { mounted = false; };
  }, [task.id]);

  const handleCommit = async (force: boolean = false) => {
    setCommitting(true);
    try {
      // Fallback plan construction if result.plan is empty/null
      let plan = result?.plan;
      if (!plan || Object.keys(plan).length === 0) {
        plan = {};
        Object.keys(task.team_work || {}).forEach(teamId => {
          plan[teamId] = {
            team_id: teamId,
            effort_hours: task.team_work[teamId]?.effort_hours || 0,
            owner_type: 'primary'
          };
        });
      }

      await store.commitTask(task.id, { plan, force });
      onClose();
    } catch (e: any) {
      alert("Commit Error: " + e.message);
    } finally {
      setCommitting(false);
    }
  };

  const formatDateTime = (dateStr: any) => {
    if (!dateStr) return "TBD";
    const date = new Date(dateStr);
    
    // Formatting to: 22 Dec, 2025 09:30
    const day = date.getDate();
    const month = date.toLocaleString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' });
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    return `${day} ${month}, ${year} ${hours}:${minutes}`;
  };

  const headerColor = useMemo(() => {
    if (loading) return 'bg-slate-700';
    if (error) return 'bg-red-700';
    if (result?.feasible) return 'bg-[#006644] dark:bg-[#134D2E]';
    return 'bg-[#BF2600]';
  }, [loading, error, result]);

  return (
    <div className="fixed inset-0 bg-[#091E42]/80 dark:bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-[#0D1117] rounded-xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] border dark:border-[#333C4B]">
        {/* Modal Header */}
        <div className={`p-5 text-white flex justify-between items-center ${headerColor} transition-colors shrink-0`}>
          <div className="flex items-center space-x-3">
            <Target size={24} className="opacity-80" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">Strategic Task Analysis</p>
              <h2 className="text-lg font-black uppercase truncate max-w-lg tracking-tight">{task.title}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={24} /></button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar bg-[#F4F5F7] dark:bg-[#0D1117]">
          {loading ? (
            <div className="flex flex-col items-center py-20 space-y-4">
              <Loader2 className="animate-spin text-[#0052CC]" size={40} />
              <p className="text-xs font-black uppercase tracking-widest text-[#6B778C]">Simulating resource dependencies...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 space-y-4">
              <AlertTriangle className="mx-auto text-red-600" size={48} />
              <p className="text-red-600 font-bold">{error}</p>
              <button onClick={onClose} className="px-6 py-2 bg-slate-200 dark:bg-slate-800 rounded font-bold text-xs uppercase tracking-widest">Dismiss</button>
            </div>
          ) : (
            <>
              {/* Feasibility Status Banner */}
              <div className={`p-6 rounded-xl border-2 flex items-start space-x-4 shadow-sm ${result?.feasible ? 'bg-white dark:bg-green-900/10 border-green-500/30' : 'bg-white dark:bg-red-900/10 border-red-500/30'}`}>
                <div className={`p-3 rounded-xl ${result?.feasible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                   {result?.feasible ? <CheckCircle2 size={32} /> : <ShieldAlert size={32} />}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className={`text-xl font-black uppercase tracking-tight mb-1 ${result?.feasible ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>
                      {result?.feasible ? "Feasible for Deployment" : "Constraint Conflict"}
                    </h3>
                    {result?.recommendation?.action && (
                      <span className={`text-[10px] font-black px-2 py-1 rounded-full border uppercase tracking-widest ${result?.feasible ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        {result.recommendation.action.replace(/_/g, ' ')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium opacity-80 leading-relaxed max-w-2xl text-[#42526E] dark:text-[#B3BAC5]">
                    {result?.feasible 
                      ? "Operational analysis confirms all selected team clusters have sufficient bandwidth to meet the target deadline."
                      : "The current resource grid cannot accommodate this task due to overlapping commitments."}
                  </p>
                </div>
              </div>

              {/* Blocking Reason Details (If Conflict) */}
              {!result?.feasible && result?.blocking_reason && (
                <div className="bg-[#BF2600]/5 dark:bg-red-900/10 border border-[#BF2600]/20 rounded-xl p-6 space-y-4">
                  <div className="flex items-center space-x-2 text-[#BF2600] dark:text-[#FF8B8B]">
                    <AlertCircle size={18} />
                    <h4 className="text-xs font-black uppercase tracking-widest">Bottleneck Identified</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 text-sm">
                        <User size={16} className="text-[#6B778C]" />
                        <div>
                          <p className="text-[10px] font-bold text-[#6B778C] uppercase">Conflicting Resource</p>
                          <p className="font-bold text-[#172B4D] dark:text-white">
                            {result.blocking_reason.blocking_member_name} 
                            <span className="text-[11px] font-normal text-[#6B778C] ml-1">({result.blocking_reason.blocking_team_name})</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 text-sm">
                        <Clock size={16} className="text-[#6B778C]" />
                        <div>
                          <p className="text-[10px] font-bold text-[#6B778C] uppercase">Conflict Window</p>
                          <p className="font-bold text-[#172B4D] dark:text-white text-xs">
                            {formatDateTime(result.blocking_reason.conflict_window?.from)} 
                            <span className="mx-2 text-[#6B778C]">to</span>
                            {formatDateTime(result.blocking_reason.conflict_window?.to)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-white dark:bg-[#1D2125] rounded-lg border dark:border-[#333C4B] shadow-sm">
                      <p className="text-[10px] font-black text-[#6B778C] uppercase tracking-widest mb-2">Blocking Task</p>
                      <p className="text-sm font-bold text-[#172B4D] dark:text-white">{result.blocking_reason.blocking_task_title}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-[9px] font-black bg-slate-100 dark:bg-[#161B22] px-1.5 py-0.5 rounded border dark:border-[#333C4B] uppercase text-[#6B778C]">
                          {result.blocking_reason.blocking_task_priority} Priority
                        </span>
                        <span className="text-[9px] font-bold text-[#0052CC] uppercase">ID: {result.blocking_reason.blocking_task_id?.split('-')[0]}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Delivery Estimates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-[#1D2125] p-6 rounded-xl border dark:border-[#333C4B] shadow-sm relative overflow-hidden group hover:border-[#0052CC] transition-colors">
                  <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Timer size={80} />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-[#0052CC]">
                        <Timer size={20} />
                      </div>
                      <p className="text-[11px] font-black text-[#6B778C] uppercase tracking-widest">Earliest System Handoff</p>
                    </div>
                    <p className="text-2xl font-black text-[#172B4D] dark:text-white">{formatDateTime(result?.estimated_delivery)}</p>
                    <p className="text-[10px] text-[#6B778C] mt-2 font-bold uppercase">Calculated based on serial dependencies</p>
                  </div>
                </div>
                
                {result?.feasible && (
                  <div className="bg-white dark:bg-[#1D2125] p-6 rounded-xl border dark:border-[#333C4B] shadow-sm flex flex-col justify-center">
                    <div className="flex items-center space-x-2 mb-2 text-[#006644]">
                      <Lightbulb size={18} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Optimization Insight</span>
                    </div>
                    <p className="text-sm italic text-[#42526E] dark:text-[#B3BAC5]">
                      All critical paths are unblocked. Committing this plan will update the global resource ledger.
                    </p>
                  </div>
                )}
              </div>

              {/* Proposed Staffing Plan */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b dark:border-[#333C4B] pb-3">
                  <div className="flex items-center space-x-2">
                    <UserCheck size={18} className="text-[#0052CC]" />
                    <h4 className="text-[12px] font-black uppercase tracking-[0.2em] text-[#172B4D] dark:text-white">Proposed Staffing Matrix</h4>
                  </div>
                  <div className="flex items-center space-x-4 text-[10px] font-bold text-[#6B778C]">
                    <span className="flex items-center"><Info size={12} className="mr-1" /> IST Business Hours</span>
                    <span className="flex items-center"><HardHat size={12} className="mr-1" /> Auto-Balanced</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(result?.plan || {}).map(([key, data]: any) => (
                    <div key={key} className="bg-white dark:bg-[#1D2125] p-5 rounded-xl border dark:border-[#333C4B] space-y-4 shadow-sm hover:shadow-md transition-all border-l-4 border-l-[#0052CC]">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-black uppercase tracking-tight text-[#172B4D] dark:text-white">{data.team_name || key}</p>
                          <p className="text-[9px] text-[#6B778C] font-bold uppercase tracking-widest mt-0.5">Primary Execution Unit</p>
                        </div>
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${data.owner_type === 'primary' ? 'bg-[#E3FCEF] text-[#006644]' : 'bg-[#DEEBFF] text-[#0052CC]'}`}>
                          {data.owner_type || 'Assigned'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 bg-[#F4F5F7] dark:bg-[#161B22] p-3 rounded-lg">
                        <div className="h-10 w-10 rounded-xl bg-[#172B4D] dark:bg-[#0052CC] flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white dark:ring-[#0D1117]">
                          {data.assigned_to_name?.[0] || '?'}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black text-[#172B4D] dark:text-white">{data.assigned_to_name || "Allocation Pending"}</p>
                          <div className="flex items-center text-[10px] font-bold text-[#6B778C] mt-0.5">
                            <Clock size={12} className="mr-1" /> {data.effort_hours} Hours Total
                          </div>
                        </div>
                      </div>

                      <div className="pt-3 border-t dark:border-[#333C4B] space-y-2">
                         <span className="text-[9px] font-black text-[#6B778C] uppercase tracking-[0.2em] block">Allocation Timeline</span>
                         <div className="flex items-center justify-between text-[11px] font-bold bg-[#F4F5F7] dark:bg-[#161B22] px-3 py-2 rounded">
                            <div className="flex flex-col">
                              <span className="text-[8px] text-[#6B778C] uppercase mb-0.5">Start</span>
                              <span className="text-[#172B4D] dark:text-[#E2E8F0]">{formatDateTime(data.start_date)}</span>
                            </div>
                            <ArrowRight size={14} className="text-[#6B778C]" />
                            <div className="flex flex-col text-right">
                              <span className="text-[8px] text-[#6B778C] uppercase mb-0.5">End</span>
                              <span className="text-[#172B4D] dark:text-[#E2E8F0]">{formatDateTime(data.end_date)}</span>
                            </div>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fixed Action Footer */}
              <div className="pt-6 flex space-x-4 sticky bottom-0 bg-[#F4F5F7] dark:bg-[#0D1117] pb-4 z-10 transition-colors">
                <button onClick={onEdit} className="flex-1 py-3.5 bg-white dark:bg-[#1D2125] border border-gray-200 dark:border-[#333C4B] rounded-xl font-black text-[11px] uppercase tracking-widest text-[#42526E] dark:text-[#B3BAC5] hover:bg-gray-50 dark:hover:bg-[#161B22] shadow-sm transition-all active:scale-[0.98]">
                  Adjust Parameters
                </button>
                <button 
                  onClick={() => handleCommit(!result?.feasible)} 
                  disabled={committing} 
                  className={`flex-[2] text-white py-3.5 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center justify-center space-x-3 transition-all active:scale-[0.98] ${result?.feasible ? 'bg-[#006644] hover:bg-[#0052CC]' : 'bg-[#BF2600] hover:bg-[#DE350B]'}`}
                >
                  {committing ? <Loader2 className="animate-spin" size={18} /> : (result?.feasible ? <Rocket size={18} /> : <ShieldAlert size={18} />)}
                  <span>{committing ? 'Syncing Execution Ledger...' : 'Commit Execution Plan'}</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskAnalysis;
