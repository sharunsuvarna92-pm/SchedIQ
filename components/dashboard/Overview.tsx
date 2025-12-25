
import React from 'react';
import { AppState, TeamMember } from '../../types';
import { 
  Users, 
  Briefcase, 
  Layers, 
  CheckSquare,
  TrendingUp,
  Clock,
  AlertCircle,
  Flame,
  UserX
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface OverviewProps {
  data: any;
}

const Overview: React.FC<OverviewProps> = ({ data }) => {
  const stats = [
    { label: 'Total Teams', value: data.teams?.length || 0, icon: Users, color: 'text-[#0052CC]', darkColor: 'dark:text-[#4C9AFF]', bg: 'bg-[#DEEBFF]', darkBg: 'dark:bg-[#0747A6]/30' },
    { label: 'Active Personnel', value: (data.members || []).filter((m: TeamMember) => m.is_active).length, icon: Briefcase, color: 'text-[#006644]', darkColor: 'dark:text-[#4ADE80]', bg: 'bg-[#E3FCEF]', darkBg: 'dark:bg-[#134D2E]/30' },
    { label: 'Active Modules', value: data.modules?.length || 0, icon: Layers, color: 'text-[#0747A6]', darkColor: 'dark:text-[#4C9AFF]', bg: 'bg-[#DEEBFF]', darkBg: 'dark:bg-[#0747A6]/30' },
    { label: 'Active Tasks', value: data.tasks?.length || 0, icon: CheckSquare, color: 'text-[#FF8B00]', darkColor: 'dark:text-[#FFAB00]', bg: 'bg-[#FFF0B3]', darkBg: 'dark:bg-[#FF8B00]/20' },
  ];

  const taskStats = [
    { name: 'Planning', value: (data.tasks || []).filter((t: any) => t.status?.toUpperCase() === 'PLANNING').length, color: '#42526E', darkColor: '#B3BAC5' },
    { name: 'Committed', value: (data.tasks || []).filter((t: any) => t.status?.toUpperCase() === 'COMMITTED').length, color: '#172B4D', darkColor: '#4C9AFF' },
    { name: 'Completed', value: (data.tasks || []).filter((t: any) => t.status?.toLowerCase() === 'completed').length, color: '#36B37E', darkColor: '#36B37E' },
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-[#1D2125] p-5 rounded-lg border border-[#DFE1E6] dark:border-[#333C4B] shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center space-x-4">
              <div className={`${stat.bg} ${stat.darkBg} p-3 rounded-md transition-colors`}>
                <stat.icon className={`${stat.color} ${stat.darkColor}`} size={22} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-[#6B778C] dark:text-[#B3BAC5] uppercase tracking-wide">{stat.label}</p>
                <h3 className="text-2xl font-bold text-[#172B4D] dark:text-[#E2E8F0]">{stat.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#1D2125] p-6 rounded-lg border border-[#DFE1E6] dark:border-[#333C4B] shadow-sm">
          <div className="mb-8">
            <h3 className="text-base font-bold text-[#172B4D] dark:text-[#E2E8F0]">Resource Lifecycle</h3>
            <p className="text-xs text-[#6B778C] dark:text-[#B3BAC5]">Distribution of active work orders</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taskStats} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#333C4B" : "#F4F5F7"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#B3BAC5' : '#6B778C', fontSize: 10, fontWeight: 700}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: isDarkMode ? '#B3BAC5' : '#6B778C', fontSize: 10, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#1D2125' : '#FFFFFF',
                    borderRadius: '4px', 
                    border: `1px solid ${isDarkMode ? '#333C4B' : '#DFE1E6'}`, 
                    padding: '8px',
                    color: isDarkMode ? '#E2E8F0' : '#172B4D'
                  }}
                  cursor={{ fill: isDarkMode ? '#333C4B' : '#F4F5F7' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                  {taskStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={isDarkMode ? entry.darkColor : entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#1D2125] p-6 rounded-lg border border-[#DFE1E6] dark:border-[#333C4B] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-bold text-[#172B4D] dark:text-[#E2E8F0] flex items-center">
              <Flame size={18} className="mr-2 text-[#FF5630]" /> Overload Risk
            </h3>
          </div>
          
          <div className="space-y-3">
            {overburdernedPersonnel.length > 0 ? (
              overburdernedPersonnel.map(person => (
                <div key={person.id} className="p-3 bg-[#FFEBE6] dark:bg-[#441C1C] border border-[#FFBDAD] dark:border-[#6C2A2A] rounded-md flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-[#BF2600] dark:bg-[#DE350B] rounded flex items-center justify-center text-white font-bold text-[10px]">
                      {person.name[0]}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#BF2600] dark:text-[#FF8B8B]">{person.name}</p>
                      <p className="text-[10px] text-[#BF2600]/70 dark:text-[#FF8B8B]/70 font-bold uppercase">{person.experience_level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#BF2600] dark:text-[#FF8B8B]">+{person.overload}h</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-[#6B778C]/40 dark:text-[#B3BAC5]/20">
                <UserX size={40} className="mb-2" />
                <p className="text-xs font-bold uppercase tracking-widest">Safe Operations</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
