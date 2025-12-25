
import React, { useState } from 'react';
import { Module, TeamMember, Team, ModuleOwner } from '../../types';
import { Plus, Layout, Users, ChevronRight, Loader2, UserCheck, UserPlus, X, Edit2, Save, BarChart3, ShieldCheck, Layers, Info } from 'lucide-react';

interface ModuleViewProps {
  modules: Module[];
  members: TeamMember[];
  teams: Team[];
  onAddModule: (module: Omit<Module, 'id' | 'created_at'>) => Promise<any>;
  onUpdateModule: (moduleId: string, updates: Partial<Module>) => Promise<any>;
}

const ModuleView: React.FC<ModuleViewProps> = ({ modules, members, teams, onAddModule, onUpdateModule }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Omit<Module, 'id' | 'created_at'>>({
    name: '',
    description: '',
    owners: []
  });

  /**
   * Strictly normalizes the owners list to ensure:
   * 1. Exactly one PRIMARY per team.
   * 2. Multiple unique SECONDARY per team.
   * 3. Clean object literals without redundant keys or hidden properties.
   */
  const normalizeOwners = (rawOwners: ModuleOwner[]): ModuleOwner[] => {
    const teamMap = new Map<string, { primary?: string, secondaries: Set<string> }>();

    // Initial pass to define structure per active team
    teams.forEach(t => teamMap.set(String(t.id), { secondaries: new Set() }));

    // Process inputs into our unique map
    (rawOwners || []).forEach(owner => {
      const tid = String(owner.team_id);
      const mid = String(owner.member_id);
      
      if (!teamMap.has(tid) || !mid) return;

      const teamData = teamMap.get(tid)!;

      if (owner.role === 'PRIMARY') {
        teamData.primary = mid;
        teamData.secondaries.delete(mid); // Member cannot be both roles for same team
      } else if (owner.role === 'SECONDARY') {
        if (teamData.primary !== mid) {
          teamData.secondaries.add(mid);
        }
      }
    });

    const cleanOwners: ModuleOwner[] = [];
    
    // Construct final clean array with explicit property assignment
    teamMap.forEach((data, teamId) => {
      if (data.primary) {
        cleanOwners.push({
          team_id: teamId,
          member_id: data.primary,
          role: 'PRIMARY'
        });
      }
      
      data.secondaries.forEach(memberId => {
        cleanOwners.push({
          team_id: teamId,
          member_id: memberId,
          role: 'SECONDARY'
        });
      });
    });

    return cleanOwners;
  };

  const handleOpenCreate = () => {
    setEditingModule(null);
    setFormData({ name: '', description: '', owners: [] });
    setShowForm(true);
  };

  const handleOpenEdit = (mod: Module) => {
    setEditingModule(mod);
    const initialOwners = normalizeOwners(mod.owners || []);
    setFormData({
      name: mod.name || '',
      description: mod.description || '',
      owners: initialOwners
    });
    setShowForm(true);
  };

  const handlePrimaryChange = (teamId: string, memberId: string) => {
    setFormData(prev => {
      // Create new clean list filtering out the primary for this team
      let nextOwners = prev.owners.filter(o => !(o.team_id === teamId && o.role === 'PRIMARY'));
      
      if (memberId) {
        // Ensure no role collision for the same member
        nextOwners = nextOwners.filter(o => !(o.team_id === teamId && o.member_id === memberId));
        
        // Add fresh primary object
        nextOwners.push({
          team_id: teamId,
          member_id: memberId,
          role: 'PRIMARY'
        });
      }
      
      return { ...prev, owners: nextOwners };
    });
  };

  const toggleSecondaryMember = (teamId: string, memberId: string) => {
    setFormData(prev => {
      const isCurrentlySecondary = prev.owners.some(o => 
        o.team_id === teamId && o.member_id === memberId && o.role === 'SECONDARY'
      );
      
      let nextOwners = [...prev.owners];

      if (isCurrentlySecondary) {
        nextOwners = nextOwners.filter(o => !(o.team_id === teamId && o.member_id === memberId && o.role === 'SECONDARY'));
      } else {
        // Clear primary role for this member if it exists to avoid conflicts
        nextOwners = nextOwners.filter(o => !(o.team_id === teamId && o.member_id === memberId && o.role === 'PRIMARY'));
        
        nextOwners.push({
          team_id: teamId,
          member_id: memberId,
          role: 'SECONDARY'
        });
      }
      
      return { ...prev, owners: nextOwners };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Explicit construction to ensure only required fields are present
    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      owners: normalizeOwners(formData.owners)
    };

    try {
      if (editingModule) {
        await onUpdateModule(editingModule.id, payload);
      } else {
        await onAddModule(payload);
      }
      setShowForm(false);
    } catch (err: any) { 
      console.error("Module Persistence Failure:", err);
      alert("Submission Error: " + (err.message || 'Check network for details.')); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="bg-white dark:bg-[#1D2125] px-3 py-1.5 rounded border border-[#DFE1E6] dark:border-[#333C4B] flex items-center space-x-2 shadow-sm transition-colors">
           <Layers size={14} className="text-[#0052CC] dark:text-[#4C9AFF]" />
           <span className="text-[10px] font-bold text-[#172B4D] dark:text-[#E2E8F0] uppercase tracking-wider">{modules.length} Functional Clusters</span>
        </div>
        <button onClick={handleOpenCreate} className="bg-[#0052CC] text-white px-4 py-2 rounded font-bold text-sm hover:bg-[#0747A6] transition-colors flex items-center space-x-2 shadow-sm">
          <Plus size={16} />
          <span>New Module</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {modules.map(mod => {
          const clusterCount = new Set((mod.owners || []).map(o => o.team_id)).size;
          const staffingCount = (mod.owners || []).length;
          
          return (
            <div key={mod.id} className="bg-white dark:bg-[#1D2125] border border-[#DFE1E6] dark:border-[#333C4B] rounded p-5 flex flex-col hover:border-[#4C9AFF] transition-all group shadow-sm">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-9 h-9 bg-[#0747A6] rounded flex items-center justify-center text-white shrink-0 font-bold">
                    {mod.name ? mod.name[0].toUpperCase() : 'M'}
                  </div>
                  <div className="truncate">
                    <h3 className="text-sm font-bold text-[#172B4D] dark:text-[#E2E8F0] truncate group-hover:text-[#0052CC] transition-colors">{mod.name}</h3>
                    <p className="text-[10px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase tracking-tighter">Core Module</p>
                  </div>
                </div>
                <button onClick={() => handleOpenEdit(mod)} className="p-1.5 text-[#6B778C] dark:text-[#B3BAC5] hover:text-[#0052CC] dark:hover:text-[#E2E8F0] hover:bg-[#F4F5F7] dark:hover:bg-[#333C4B] rounded transition-colors"><Edit2 size={14} /></button>
              </div>
              <p className="text-xs text-[#42526E] dark:text-[#B3BAC5] mb-5 flex-grow line-clamp-2 min-h-[32px]">{mod.description || 'No detailed specifications.'}</p>
              <div className="pt-4 border-t border-[#F4F5F7] dark:border-[#333C4B] grid grid-cols-2 gap-3 transition-colors">
                <div className="bg-[#F4F5F7] dark:bg-[#161B22] p-2 rounded flex flex-col items-center border border-transparent dark:border-[#333C4B]">
                  <span className="text-[9px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase">Clusters</span>
                  <span className="text-sm font-bold text-[#172B4D] dark:text-[#E2E8F0]">{clusterCount}</span>
                </div>
                <div className="bg-[#DEEBFF] dark:bg-[#0747A6]/30 p-2 rounded flex flex-col items-center border border-transparent dark:border-[#0747A6]/50">
                  <span className="text-[9px] font-bold text-[#0052CC] dark:text-[#4C9AFF] uppercase">Staffing</span>
                  <span className="text-sm font-bold text-[#0052CC] dark:text-[#4C9AFF]">{staffingCount}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-[#091E42]/60 dark:bg-[#000000]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1D2125] rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] border dark:border-[#333C4B] transition-colors">
            <div className="p-5 border-b border-[#DFE1E6] dark:border-[#333C4B] flex justify-between items-center bg-[#F4F5F7] dark:bg-[#161B22]">
              <div>
                <h2 className="text-lg font-bold text-[#172B4D] dark:text-[#E2E8F0]">{editingModule ? 'Update Cluster Topology' : 'Assemble New Module'}</h2>
                <p className="text-xs text-[#6B778C] dark:text-[#B3BAC5] mt-0.5 font-semibold">Map primary liaisons and support personnel across teams.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-[#6B778C] dark:text-[#B3BAC5] hover:text-[#172B4D] dark:hover:text-white p-2 hover:bg-white dark:hover:bg-[#333C4B] rounded-full transition-all"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-8 custom-scrollbar bg-white dark:bg-[#1D2125]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase tracking-wider">Module Designation</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-[#F4F5F7] dark:bg-[#161B22] border border-[#DFE1E6] dark:border-[#333C4B] rounded text-sm text-[#172B4D] dark:text-[#E2E8F0] focus:bg-white dark:focus:bg-[#1D2125] focus:border-[#0052CC] outline-none transition-all" placeholder="e.g. Identity Management" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase tracking-wider">Operational Context</label>
                  <input required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 bg-[#F4F5F7] dark:bg-[#161B22] border border-[#DFE1E6] dark:border-[#333C4B] rounded text-sm text-[#172B4D] dark:text-[#E2E8F0] focus:bg-white dark:focus:bg-[#1D2125] focus:border-[#0052CC] outline-none transition-all" placeholder="Brief scope..." />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2 border-b border-[#DFE1E6] dark:border-[#333C4B] pb-2">
                  <Users size={16} className="text-[#0052CC] dark:text-[#4C9AFF]" />
                  <h3 className="text-[11px] font-bold text-[#172B4D] dark:text-[#E2E8F0] uppercase tracking-widest">Ownership Matrix</h3>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {teams.map(team => {
                    const teamMembers = members.filter(m => String(m.team_id) === String(team.id));
                    const primaryOwner = formData.owners.find(o => String(o.team_id) === String(team.id) && o.role === 'PRIMARY');
                    const secondaryOwners = formData.owners.filter(o => String(o.team_id) === String(team.id) && o.role === 'SECONDARY');

                    return (
                      <div key={team.id} className="bg-[#F4F5F7] dark:bg-[#161B22] border border-[#DFE1E6] dark:border-[#333C4B] rounded p-4 flex flex-col md:flex-row gap-6 md:items-center shadow-sm">
                        <div className="md:w-1/4">
                          <p className="text-sm font-bold text-[#172B4D] dark:text-[#E2E8F0]">{team.name}</p>
                          <p className="text-[10px] text-[#6B778C] dark:text-[#B3BAC5] font-semibold uppercase">{teamMembers.length} Total Associates</p>
                        </div>
                        <div className="md:w-1/3 space-y-1">
                          <label className="text-[9px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase flex items-center">
                            <UserCheck size={10} className="mr-1 text-[#36B37E]" /> Primary Liaison
                          </label>
                          <select 
                            value={primaryOwner?.member_id || ''} 
                            onChange={e => handlePrimaryChange(team.id, e.target.value)}
                            className="w-full bg-white dark:bg-[#1D2125] px-3 py-1.5 border border-[#DFE1E6] dark:border-[#333C4B] rounded text-xs text-[#172B4D] dark:text-[#E2E8F0] outline-none focus:border-[#0052CC] transition-colors font-semibold"
                          >
                            <option value="" className="dark:bg-[#1D2125]">Unassigned</option>
                            {teamMembers.map(m => <option key={m.id} value={m.id} className="dark:bg-[#1D2125]">{m.name}</option>)}
                          </select>
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="text-[9px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase flex items-center">
                            <UserPlus size={10} className="mr-1 text-[#0052CC] dark:text-[#4C9AFF]" /> Secondary Support
                          </label>
                          <div className="flex flex-wrap gap-1">
                             {teamMembers.length === 0 ? (
                               <span className="text-[10px] text-[#6B778C] dark:text-[#B3BAC5] italic">Empty pool.</span>
                             ) : (
                               teamMembers.map(m => {
                                 if (m.id === primaryOwner?.member_id) return null;
                                 const isSelected = secondaryOwners.some(o => String(o.member_id) === String(m.id));
                                 return (
                                   <button 
                                     key={m.id} type="button" 
                                     onClick={() => toggleSecondaryMember(team.id, m.id)}
                                     className={`px-2 py-1 rounded text-[10px] font-bold transition-all border ${
                                       isSelected 
                                         ? 'bg-[#0052CC] dark:bg-[#0052CC] text-white border-[#0052CC] shadow-sm' 
                                         : 'bg-white dark:bg-[#1D2125] text-[#42526E] dark:text-[#B3BAC5] border-[#DFE1E6] dark:border-[#333C4B] hover:bg-[#DEEBFF] dark:hover:bg-[#333C4B]'
                                     }`}
                                   >
                                     {m.name.split(' ')[0]}
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
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-[#DFE1E6] dark:border-[#333C4B] sticky bottom-0 bg-white dark:bg-[#1D2125] transition-colors">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-[#42526E] dark:text-[#B3BAC5] font-bold text-sm hover:bg-[#F4F5F7] dark:hover:bg-[#333C4B] rounded transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-[#0052CC] text-white rounded font-bold text-sm hover:bg-[#0747A6] flex items-center space-x-2 shadow-sm transition-all active:scale-[0.98]">
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={18} />}
                  <span>{editingModule ? 'Save Mapping' : 'Dispatch Module'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleView;
