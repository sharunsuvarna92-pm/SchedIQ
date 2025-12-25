
import React, { useState } from 'react';
import { Team, TeamMember } from '../../types';
import { Plus, Search, Filter, MoreHorizontal, Star, Loader2, Edit2, X, Save, Globe, Clock, Briefcase } from 'lucide-react';

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
    if (!formData.team_id) { alert("Please assign a team cluster."); return; }
    setIsSubmitting(true);
    try {
      if (editingMember) await onUpdateMember(editingMember.id, formData);
      else await onAddMember(formData as Omit<TeamMember, 'id' | 'created_at'>);
      setShowForm(false);
    } catch (err) { alert("Recruitment failure. Check parameters."); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B778C] dark:text-[#B3BAC5]" size={16} />
          <input 
            type="text" 
            placeholder="Search by name, email, or skill..." 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1D2125] border border-[#DFE1E6] dark:border-[#333C4B] rounded text-sm text-[#172B4D] dark:text-[#E2E8F0] focus:border-[#0052CC] outline-none transition-all" 
          />
        </div>
        <button onClick={handleOpenForm} className="bg-[#0052CC] text-white px-4 py-2 rounded font-bold text-sm hover:bg-[#0747A6] flex items-center space-x-2 shadow-sm transition-colors">
          <Plus size={16} />
          <span>Onboard Person</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#1D2125] border border-[#DFE1E6] dark:border-[#333C4B] rounded overflow-hidden shadow-sm transition-colors">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#F4F5F7] dark:bg-[#161B22] border-b border-[#DFE1E6] dark:border-[#333C4B] transition-colors">
              <th className="px-6 py-3 text-[11px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase tracking-wider">Associate</th>
              <th className="px-6 py-3 text-[11px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase tracking-wider">Level</th>
              <th className="px-6 py-3 text-[11px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase tracking-wider">Skill Grid</th>
              <th className="px-6 py-3 text-[11px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase tracking-wider text-center">Load Cap</th>
              <th className="px-6 py-3 text-[11px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-[11px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F4F5F7] dark:divide-[#333C4B]">
            {filteredMembers.map(member => (
              <tr key={member.id} className="hover:bg-[#F4F5F7]/40 dark:hover:bg-[#333C4B]/20 group transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-9 w-9 bg-[#172B4D] dark:bg-[#0052CC] rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">{member.name ? member.name[0] : '?'}</div>
                    <div>
                      <div className="text-sm font-bold text-[#172B4D] dark:text-[#E2E8F0] group-hover:text-[#0052CC] transition-colors">{member.name}</div>
                      <div className="text-[11px] text-[#6B778C] dark:text-[#B3BAC5] font-medium">{member.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${member.experience_level === 'Lead' ? 'bg-[#172B4D] dark:bg-[#0052CC] text-white' : 'bg-[#EBECF0] dark:bg-[#333C4B] text-[#42526E] dark:text-[#E2E8F0]'}`}>{member.experience_level}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1 max-w-[260px]">
                    {member.skill_sets?.slice(0, 3).map(skill => (
                      <span key={skill} className="text-[10px] font-bold text-[#0052CC] dark:text-white bg-[#DEEBFF] dark:bg-[#0747A6] px-1.5 py-0.5 rounded transition-colors">{skill}</span>
                    ))}
                    {member.skill_sets?.length > 3 && <span className="text-[10px] text-[#6B778C] dark:text-[#B3BAC5] font-bold">+{member.skill_sets.length - 3}</span>}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-bold text-[#172B4D] dark:text-[#E2E8F0]">{member.capacity_hours_per_week}h</span>
                    <span className="text-[9px] text-[#6B778C] dark:text-[#B3BAC5] font-bold uppercase">/ week</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${member.is_active ? 'bg-[#36B37E]' : 'bg-[#6B778C] dark:bg-[#42526E]'}`}></div>
                    <span className="text-xs font-semibold text-[#42526E] dark:text-[#B3BAC5]">{member.is_active ? 'Active' : 'Offline'}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => handleOpenEdit(member)} className="p-2 text-[#6B778C] dark:text-[#B3BAC5] hover:text-[#0052CC] hover:bg-[#DEEBFF] dark:hover:bg-[#333C4B] rounded transition-all"><Edit2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-[#091E42]/60 dark:bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1D2125] rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] border dark:border-[#333C4B] overflow-hidden">
            <div className="p-5 border-b border-[#DFE1E6] dark:border-[#333C4B] flex justify-between items-center bg-[#F4F5F7] dark:bg-[#161B22]">
              <div>
                <h2 className="text-lg font-bold text-[#172B4D] dark:text-[#E2E8F0]">{editingMember ? 'Update Resource Profile' : 'Onboard New Associate'}</h2>
                <p className="text-xs text-[#6B778C] dark:text-[#B3BAC5] mt-0.5 font-semibold">Define skills, capacity, and operational parameters.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="text-[#6B778C] dark:text-[#B3BAC5] hover:text-[#172B4D] dark:hover:text-white p-1 hover:bg-white dark:hover:bg-[#333C4B] rounded-full transition-all"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar bg-white dark:bg-[#1D2125]">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase tracking-wider">Full Name</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-[#F4F5F7] dark:bg-[#161B22] border border-[#DFE1E6] dark:border-[#333C4B] rounded text-sm text-[#172B4D] dark:text-[#E2E8F0] focus:bg-white dark:focus:bg-[#1D2125] focus:border-[#0052CC] outline-none transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase tracking-wider">Email Identifier</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 bg-[#F4F5F7] dark:bg-[#161B22] border border-[#DFE1E6] dark:border-[#333C4B] rounded text-sm text-[#172B4D] dark:text-[#E2E8F0] focus:bg-white dark:focus:bg-[#1D2125] focus:border-[#0052CC] outline-none transition-all" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase tracking-wider">Team Cluster</label>
                  <select required value={formData.team_id} onChange={e => setFormData({...formData, team_id: e.target.value})} className="w-full px-3 py-2 bg-[#F4F5F7] dark:bg-[#161B22] border border-[#DFE1E6] dark:border-[#333C4B] rounded text-sm text-[#172B4D] dark:text-[#E2E8F0] outline-none focus:border-[#0052CC]">
                    <option value="" className="dark:bg-[#1D2125]">Select Cluster</option>
                    {teams.map(t => <option key={t.id} value={t.id} className="dark:bg-[#1D2125]">{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase tracking-wider">Expertise Rank</label>
                  <select value={formData.experience_level} onChange={e => setFormData({...formData, experience_level: e.target.value as any})} className="w-full px-3 py-2 bg-[#F4F5F7] dark:bg-[#161B22] border border-[#DFE1E6] dark:border-[#333C4B] rounded text-sm text-[#172B4D] dark:text-[#E2E8F0] outline-none focus:border-[#0052CC]">
                    {['Junior', 'Mid-Senior', 'Senior', 'Lead'].map(l => <option key={l} className="dark:bg-[#1D2125]">{l}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase tracking-wider">Temporal Zone</label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-2.5 top-2.5 text-[#6B778C] dark:text-[#B3BAC5]" />
                    <input value={formData.timezone} onChange={e => setFormData({...formData, timezone: e.target.value})} placeholder="e.g. UTC+5:30" className="w-full pl-9 pr-3 py-2 bg-[#F4F5F7] dark:bg-[#161B22] border border-[#DFE1E6] dark:border-[#333C4B] rounded text-sm text-[#172B4D] dark:text-[#E2E8F0] focus:bg-white dark:focus:bg-[#1D2125] focus:border-[#0052CC] outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase tracking-wider">Bandwidth (Hrs)</label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-2.5 top-2.5 text-[#6B778C] dark:text-[#B3BAC5]" />
                    <input type="number" value={formData.capacity_hours_per_week} onChange={e => setFormData({...formData, capacity_hours_per_week: parseInt(e.target.value)})} className="w-full pl-9 pr-3 py-2 bg-[#F4F5F7] dark:bg-[#161B22] border border-[#DFE1E6] dark:border-[#333C4B] rounded text-sm text-[#172B4D] dark:text-[#E2E8F0] focus:bg-white dark:focus:bg-[#1D2125] focus:border-[#0052CC] outline-none transition-all" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[11px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase tracking-wider">Skill Matrix</label>
                <div className="flex space-x-2">
                  <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="Add skill (e.g. React, Docker)" className="flex-1 px-3 py-2 bg-[#F4F5F7] dark:bg-[#161B22] border border-[#DFE1E6] dark:border-[#333C4B] rounded text-sm text-[#172B4D] dark:text-[#E2E8F0] focus:bg-white dark:focus:bg-[#1D2125] focus:border-[#0052CC] outline-none transition-all" />
                  <button type="button" onClick={addSkill} className="bg-[#172B4D] dark:bg-[#0052CC] text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest hover:bg-[#0052CC] dark:hover:bg-[#0747A6] transition-colors shadow-sm">Add</button>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.skill_sets?.map(skill => (
                    <span key={skill} className="px-2.5 py-1 bg-[#DEEBFF] dark:bg-[#0747A6] text-[#0052CC] dark:text-white rounded-full text-[10px] font-bold flex items-center border border-[#B3D4FF] dark:border-[#333C4B] animate-in zoom-in-75">
                      {skill}
                      <button type="button" onClick={() => removeSkill(skill)} className="ml-1.5 hover:text-[#BF2600] dark:hover:text-[#FF8B8B] transition-colors"><X size={12} /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input type="checkbox" id="active-check" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-4 h-4 rounded border-[#DFE1E6] dark:border-[#333C4B] text-[#0052CC] focus:ring-[#0052CC]" />
                <label htmlFor="active-check" className="text-xs font-bold text-[#172B4D] dark:text-[#E2E8F0] cursor-pointer">Associate is operational and available for allocation</label>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-[#DFE1E6] dark:border-[#333C4B] sticky bottom-0 bg-white dark:bg-[#1D2125] transition-colors">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 text-[#42526E] dark:text-[#B3BAC5] font-bold text-sm hover:bg-[#F4F5F7] dark:hover:bg-[#333C4B] rounded transition-colors">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-[#0052CC] text-white rounded font-bold text-sm hover:bg-[#0747A6] shadow-sm transition-all active:scale-[0.98] flex items-center space-x-2">
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Save size={18} />}
                  <span>{isSubmitting ? 'Syncing...' : (editingMember ? 'Update Associate' : 'Onboard Associate')}</span>
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
