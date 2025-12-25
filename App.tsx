
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import Overview from './components/dashboard/Overview';
import TeamView from './components/teams/TeamView';
import MemberView from './components/members/MemberView';
import ModuleView from './components/modules/ModuleView';
import TaskView from './components/tasks/TaskView';
import { useStore } from './store/useStore';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const store = useStore();
  const lastFetchedView = useRef<string | null>(null);

  // Trigger targeted GET requests on tab switch with anti-hammering coordination
  useEffect(() => {
    // Avoid re-fetching the same view if it was just loaded successfully
    if (lastFetchedView.current === activeView && !store.lastError) return;
    
    lastFetchedView.current = activeView;

    switch (activeView) {
      case 'dashboard':
        store.refreshAll();
        break;
      case 'teams':
        store.fetchTeams();
        break;
      case 'members':
        store.fetchMembers();
        break;
      case 'modules':
        store.fetchModules();
        break;
      case 'tasks':
        store.fetchTasks();
        break;
    }
  }, [activeView, store.lastError]); // Re-try sync if an error occurred or view changed

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <Overview data={store} />;
      case 'teams':
        return <TeamView teams={store.teams} members={store.members} onAddTeam={store.addTeam} onUpdateTeam={store.updateTeam} />;
      case 'members':
        return <MemberView members={store.members} teams={store.teams} onAddMember={store.addMember} onUpdateMember={store.updateMember} />;
      case 'modules':
        return <ModuleView modules={store.modules} members={store.members} teams={store.teams} onAddModule={store.addModule} onUpdateModule={store.updateModule} />;
      case 'tasks':
        return (
          <TaskView 
            tasks={store.tasks} 
            modules={store.modules} 
            teams={store.teams} 
            members={store.members} 
            assignments={store.assignments}
            onAddTask={store.addTask}
            onUpdateTask={store.updateTask}
            onUpdateStatus={store.updateTaskStatus}
          />
        );
      default:
        return <Overview data={store} />;
    }
  };

  return (
    <Layout activeView={activeView} onViewChange={setActiveView}>
      {renderView()}
    </Layout>
  );
};

export default App;
