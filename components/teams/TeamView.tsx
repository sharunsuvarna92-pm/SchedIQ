
import React, { useState } from 'react';
import { Team, TeamMember } from '../../types';
import { Plus, Search, Loader2, Edit2, Users, X, Save, Shield, Activity, BarChart3 } from 'lucide-react';

interface TeamViewProps {
  teams: Team[];
  members: TeamMember[];
  onAddTeam: (team: Omit<Team, 'id' | 'created_at'>) => Promise<any>;
  onUpdateTeam: (teamId: string, updates: { name?: string; description?: string }) => Promise<any>;
}

const TeamView: React.FC<TeamViewProps> = ({ teams, members, onAddTeam, onUpdateTeam }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTeams = teams.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreate = () => {
    setEditingTeam(null);
    setFormData({ name: '', description: '' });
    setShowForm(true);
  };

  const handleOpenEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({ name: team.name, description: team.description });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingTeam) await onUpdateTeam(editingTeam.id, formData);
      else await onAddTeam(formData);
      setShowForm(false);
    } catch (err) {
      alert("Process failure. Check team parameters.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B778C] dark:text-[#B3BAC5]" size={16} />
          <input 
            type="text" 
            placeholder="Search clusters..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1D2125] border border-[#DFE1E6] dark:border-[#333C4B] rounded text-sm text-[#172B4D] dark:text-[#E2E8F0] focus:border-[#0052CC] outline-none transition-colors"
          />
        </div>
        <button 
          onClick={handleOpenCreate}
          className="bg-[#0052CC] text-white px-4 py-2 rounded font-bold text-sm hover:bg-[#0747A6] flex items-center space-x-2 shadow-sm transition-colors"
        >
          <Plus size={16} />
          <span>New Team</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTeams.map(team => {
          const teamMembers = members.filter(m => m.team_id === team.id);
          return (
            <div key={team.id} className="bg-white dark:bg-[#1D2125] border border-[#DFE1E6] dark:border-[#333C4B] rounded-md p-5 flex flex-col hover:shadow-md dark:hover:border-[#0052CC] transition-all group shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 bg-[#172B4D] dark:bg-[#0052CC] rounded flex items-center justify-center text-white font-bold text-xs">
                  {team.name ? team.name[0].toUpperCase() : 'T'}
                </div>
                <button onClick={() => handleOpenEdit(team)} className="p-1.5 text-[#6B778C] dark:text-[#B3BAC5] hover:text-[#0052CC] dark:hover:text-[#E2E8F0] hover:bg-[#F4F5F7] dark:hover:bg-[#333C4B] rounded transition-colors">
                  <Edit2 size={14} />
                </button>
              </div>

              <div className="flex-grow space-y-1 mb-4">
                <h3 className="text-sm font-bold text-[#172B4D] dark:text-[#E2E8F0] group-hover:text-[#0052CC] transition-colors">{team.name}</h3>
                <p className="text-xs text-[#6B778C] dark:text-[#B3BAC5] leading-snug line-clamp-2 min-h-[32px]">{team.description}</p>
              </div>
              
              <div className="pt-4 border-t border-[#F4F5F7] dark:border-[#333C4B] flex items-center justify-between">
                <div className="flex items-center -space-x-2">
                  {teamMembers.slice(0, 3).map(m => (
                    <div key={m.id} className="w-7 h-7 rounded-full border-2 border-white dark:border-[#1D2125] bg-[#0052CC] flex items-center justify-center text-[8px] font-bold text-white shadow-sm" title={m.name}>
                      {m.name[0]}
                    </div>
                  ))}
                  {teamMembers.length > 3 && (
                    <div className="w-7 h-7 rounded-full border-2 border-white dark:border-[#1D2125] bg-[#42526E] dark:bg-[#333C4B] flex items-center justify-center text-[8px] font-bold text-white">
                      +{teamMembers.length - 3}
                    </div>
                  )}
                </div>
                <div className="text-[10px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase bg-[#F4F5F7] dark:bg-[#161B22] px-2 py-1 rounded transition-colors">
                   {teamMembers.length} Person
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-[#091E42]/60 dark:bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1D2125] rounded-lg shadow-2xl w-full max-w-md border dark:border-[#333C4B] overflow-hidden">
            <div className="p-5 border-b border-[#DFE1E6] dark:border-[#333C4B] flex justify-between items-center bg-[#F4F5F7] dark:bg-[#161B22]">
              <h2 className="text-lg font-bold text-[#172B4D] dark:text-[#E2E8F0]">{editingTeam ? 'Edit Team' : 'New Team'}</h2>
              <button onClick={() => setShowForm(false)} className="text-[#6B778C] dark:text-[#B3BAC5] hover:text-[#172B4D] dark:hover:text-white transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase tracking-wider">Designation</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-[#F4F5F7] dark:bg-[#161B22] border border-[#DFE1E6] dark:border-[#333C4B] rounded text-sm text-[#172B4D] dark:text-[#E2E8F0] focus:bg-white dark:focus:bg-[#1D2125] focus:border-[#0052CC] outline-none transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase tracking-wider">Focus Area</label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full px-3 py-2 bg-[#F4F5F7] dark:bg-[#161B22] border border-[#DFE1E6] dark:border-[#333C4B] rounded text-sm text-[#172B4D] dark:text-[#E2E8F0] focus:bg-white dark:focus:bg-[#1D2125] focus:border-[#0052CC] outline-none h-24 resize-none transition-all" />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-[#DFE1E6] dark:border-[#333C4B]">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[#42526E] dark:text-[#B3BAC5] font-bold text-sm hover:bg-[#F4F5F7] dark:hover:bg-[#333C4B] rounded transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-[#0052CC] text-white rounded font-bold text-sm hover:bg-[#0747A6] transition-all shadow-sm">
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : (editingTeam ? 'Save' : 'Assemble')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamView;
