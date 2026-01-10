
import React from 'react';
import { AppState, TeamMember } from '../../types';
import { 
  Users, 
  Briefcase, 
  Layers, 
  CheckSquare,
  Flame,
  UserX
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface OverviewProps {
  data: any;
}

const Overview: React.FC<OverviewProps> = ({ data }) => {
  const stats = [
    { label: 'Total Teams', value: data.teams?.length || 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', darkBg: 'dark:bg-indigo-500/10' },
    { label: 'Active Personnel', value: (data.members || []).filter((m: TeamMember) => m.is_active).length, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-500/10' },
    { label: 'Active Modules', value: data.modules?.length || 0, icon: Layers, color: 'text-violet-600', bg: 'bg-violet-50', darkBg: 'dark:bg-violet-500/10' },
    { label: 'Active Tasks', value: data.tasks?.length || 0, icon: CheckSquare, color: 'text-amber-600', bg: 'bg-amber-50', darkBg: 'dark:bg-amber-500/10' },
  ];

  const taskStats = [
    { name: 'Planning', value: (data.tasks || []).filter((t: any) => t.status?.toUpperCase() === 'PLANNING').length, color: '#94A3B8', darkColor: '#475569' },
    { name: 'Committed', value: (data.tasks || []).filter((t: any) => t.status?.toUpperCase() === 'COMMITTED').length, color: '#4F46E5', darkColor: '#818CF8' },
    { name: 'Completed', value: (data.tasks || []).filter((t: any) => t.status?.toLowerCase() === 'completed').length, color: '#10B981', darkColor: '#34D399' },
  ];

  const overburdernedPersonnel = Object.values(data.analysisCache || {})
    .filter((res: any) => res && res.feasible === false && res.conflicts)
    .flatMap((res: any) => res.conflicts)
    .reduce((acc: any[], conflict: any) => {
      const member = data.members.find((m: any) => m.id === conflict.member_id);
      if (member && !acc.find(a => a.id === member.id)) {
        acc.push({ ...member, overload: conflict.overload_hours });
      }
      return acc;
    }, []);

  const isDarkMode = document.documentElement.classList.contains('dark');

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-[#0F172A] p-5 lg:p-7 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 card-shadow hover:scale-[1.02] transition-all cursor-default">
            <div className="flex items-center space-x-4 lg:space-x-5">
              <div className={`${stat.bg} ${stat.darkBg} p-3 lg:p-4 rounded-2xl transition-all shadow-inner`}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <div>
                <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-1">{stat.label}</p>
                <h3 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 bg-white dark:bg-[#0F172A] p-6 lg:p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 card-shadow">
          <div className="mb-6 lg:mb-10">
            <h3 className="text-lg lg:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">Resource Lifecycle</h3>
            <p className="text-xs lg:text-sm text-slate-400 font-medium">Active work orders distribution</p>
          </div>
          <div className="h-60 lg:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskStats} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#1E293B" : "#F1F5F9"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF',
                    borderRadius: '16px', 
                    border: 'none', 
                    padding: '12px',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                  cursor={{ fill: isDarkMode ? '#1E293B' : '#F8FAFC' }}
                />
                <Bar dataKey="value" radius={[6, 6, 6, 6]} barSize={32}>
                  {taskStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={isDarkMode ? entry.darkColor : entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0F172A] p-6 lg:p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/60 card-shadow">
          <div className="flex items-center justify-between mb-6 lg:mb-8">
            <h3 className="text-lg lg:text-xl font-extrabold text-slate-900 dark:text-white flex items-center tracking-tight">
              <Flame size={20} className="mr-2 text-rose-500 animate-pulse" /> Overload Risk
            </h3>
          </div>
          
          <div className="space-y-4 max-h-[400px] lg:max-h-none overflow-y-auto custom-scrollbar pr-2">
            {overburdernedPersonnel.length > 0 ? (
              overburdernedPersonnel.map(person => (
                <div key={person.id} className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl flex items-center justify-between transition-all hover:bg-rose-100/50 dark:hover:bg-rose-950/30">
                  <div className="flex items-center space-x-3 lg:space-x-4">
                    <div className="w-9 h-9 lg:w-10 lg:h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white font-black text-xs">
                      {person.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-rose-900 dark:text-rose-100 truncate">{person.name}</p>
                      <p className="text-[9px] text-rose-600 dark:text-rose-400 font-extrabold uppercase tracking-widest mt-0.5">{person.experience_level}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-rose-600 dark:text-rose-400">+{person.overload}h</p>
                    <div className="w-10 lg:w-12 h-1 bg-rose-200 dark:bg-rose-900/50 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-rose-600 w-2/3"></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 lg:py-20 text-slate-200 dark:text-slate-800">
                <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center mb-4">
                   <UserX size={32} className="opacity-20" />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">Safe Operations</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;