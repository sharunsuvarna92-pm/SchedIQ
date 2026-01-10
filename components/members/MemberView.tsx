
import React, { useState } from 'react';
import { Team, TeamMember } from '../../types';
import { Plus, Search, Loader2, Edit2, X, Save, Globe, Clock, User } from 'lucide-react';

interface MemberViewProps {
  members: TeamMember[];
  teams: Team[];
  onAddMember: (member: Omit<TeamMember, 'id' | 'created_at'>) => Promise<any>;
  onUpdateMember: (memberId: string, updates: Partial<TeamMember>) => Promise<any>;
}

const MemberView: React.FC<MemberViewProps> = ({ members, teams, onAddMember, onUpdateMember }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    name: '', email: '', team_id: '', skill_sets: [], experience_level: 'Senior',
    capacity_hours_per_week: 40, timezone: 'Asia/Kolkata', historical_performance: 90, is_active: true
  });
  const [skillInput, setSkillInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMembers = members.filter(m => 
    m.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenForm = () => {
    setEditingMember(null);
    setFormData({
      name: '', email: '', team_id: teams[0]?.id || '',
      skill_sets: [], experience_level: 'Senior',
      capacity_hours_per_week: 40, timezone: 'Asia/Kolkata',
      historical_performance: 90, is_active: true
    });
    setShowForm(true);
  };

  const handleOpenEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({ ...member });
    setShowForm(true);
  };

  const addSkill = () => {
    if (skillInput && !formData.skill_sets?.includes(skillInput)) {
      setFormData({ ...formData, skill_sets: [...(formData.skill_sets || []), skillInput] });
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setFormData({ ...formData, skill_sets: formData.skill_sets?.filter(s => s !== skill) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.team_id) return;
    setIsSubmitting(true);
    try {
      if (editingMember) await onUpdateMember(editingMember.id, formData);
      else await onAddMember(formData as Omit<TeamMember, 'id' | 'created_at'>);
      setShowForm(false);
    } finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search personnel..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#0F172A] border border-slate-200/60 dark:border-slate-800/60 rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all card-shadow" 
          />
        </div>
        <button onClick={handleOpenForm} className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-xl shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 transition-all">
          Onboard Personnel
        </button>
      </div>

      <div className="bg-white dark:bg-[#0F172A] rounded-3xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden card-shadow">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Resource</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rank</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Skills</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Load</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMembers.map(member => (
                <tr key={member.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg shadow-indigo-500/10">{member.name[0]}</div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">{member.name}</div>
                        <div className="text-xs text-slate-400 font-medium">{member.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest border ${member.experience_level === 'Lead' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-transparent'}`}>
                      {member.experience_level}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                      {member.skill_sets?.slice(0, 2).map(skill => (
                        <span key={skill} className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-md">{skill}</span>
                      ))}
                      {member.skill_sets?.length > 2 && <span className="text-[10px] text-slate-400 font-bold">+{member.skill_sets.length - 2}</span>}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-sm font-black text-slate-900 dark:text-white">{member.capacity_hours_per_week}h</span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => handleOpenEdit(member)} className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"><Edit2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 lg:p-6 overflow-y-auto">
          <div className="bg-white dark:bg-[#0F172A] rounded-[32px] lg:rounded-[40px] shadow-2xl w-full max-w-2xl flex flex-col my-auto border border-slate-200/60 dark:border-slate-800/60 animate-in zoom-in-95">
            <div className="p-6 lg:p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white">Resource Profile</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Personnel Allocation Parameters</p>
              </div>
              <button onClick={() => setShowForm(false)} className="hover:bg-slate-100 dark:hover:bg-slate-800 p-3 rounded-2xl"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 lg:p-10 space-y-6 lg:space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-5 py-3 lg:py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:border-indigo-500 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Identifier</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-5 py-3 lg:py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:border-indigo-500 outline-none" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cluster</label>
                  <select required value={formData.team_id} onChange={e => setFormData({...formData, team_id: e.target.value})} className="w-full px-5 py-3 lg:py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none">
                    <option value="">Select Cluster</option>
                    {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Expertise</label>
                  <select value={formData.experience_level} onChange={e => setFormData({...formData, experience_level: e.target.value as any})} className="w-full px-5 py-3 lg:py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none">
                    {['Junior', 'Mid-Senior', 'Senior', 'Lead'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-4 lg:space-x-6 pt-6 lg:pt-8 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 lg:py-4 text-sm font-extrabold text-slate-400 hover:text-slate-600 uppercase tracking-widest">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-10 py-3 lg:py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-600/30 active:scale-95 flex items-center space-x-3">
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  <span>Save Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberView;