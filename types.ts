export interface Team {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  team_id: string;
  skill_sets: string[];
  experience_level: 'Junior' | 'Mid-Senior' | 'Senior' | 'Lead';
  capacity_hours_per_week: number;
  timezone: string;
  calendar_busy_intervals: any;
  historical_performance: number; // 0-100 score
  is_active: boolean;
  created_at: string;
}

export interface ModuleOwner {
  team_id: string;
  member_id: string;
  role: 'PRIMARY' | 'SECONDARY';
}

export interface Module {
  id: string;
  name: string;
  description: string;
  owners: ModuleOwner[];
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  module_id: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  requested_by: string;
  start_date: string;
  due_date: string; // Updated from required_by
  expected_delivery_date?: string; // System calculated after commit
  teams_involved: string[]; // array of team names
  team_work: Record<string, { 
    effort_hours: number; 
    primary_owner?: string;
    depends_on?: string[]; 
  }>;
  status: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  task_id: string;
  member_id: string;
  assigned_hours: number;
  start_date: string;
  end_date: string;
  source: string;
  created_at: string;
}

export interface AppState {
  teams: Team[];
  members: TeamMember[];
  modules: Module[];
  tasks: Task[];
  assignments: Assignment[];
}