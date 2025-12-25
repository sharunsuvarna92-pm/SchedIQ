
import { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Team, TeamMember, Module, Task, Assignment } from '../types';

const STORAGE_KEY = 'schediq_resource_manager_data';
const CACHE_KEY = 'schediq_analysis_cache';
const BASE_URL = 'https://resource-manager-zeta.vercel.app/api';

const TEAMS_API = `${BASE_URL}/teams`;
const MEMBERS_API = `${BASE_URL}/team-members`;
const MODULES_API = `${BASE_URL}/modules`;

/**
 * Strips 'id', 'created_at', and other metadata that might cause 400/500 errors 
 * when sent to strict API endpoints (PostgREST/Supabase).
 */
const sanitizePayload = (obj: any) => {
  if (!obj || typeof obj !== 'object') return obj;
  const clean = { ...obj };
  delete clean.id;
  delete clean.created_at;
  delete clean.updated_at;
  return JSON.parse(JSON.stringify(clean));
};

/**
 * Prepares the module payload for the backend.
 */
const prepareModulePayload = (module: any) => {
  const rawOwners = module.owners || module.module_owners || [];
  
  const cleanOwners = rawOwners.map((o: any) => ({
    team_id: String(o.team_id),
    member_id: String(o.member_id),
    role: o.role
  }));

  const payload = {
    name: module.name,
    description: module.description,
    module_owners: cleanOwners
  };

  return sanitizePayload(payload);
};

const getTaskUrl = (path: string = '') => {
  const base = `${BASE_URL}/tasks`;
  if (!path) return base;
  const segments = path.toString().split('/').filter(Boolean);
  const encodedSegments = segments.map(s => encodeURIComponent(s));
  return `${base}/${encodedSegments.join('/')}`;
};

const initialData: AppState = {
  teams: [],
  members: [],
  modules: [],
  tasks: [],
  assignments: [],
};

let globalData: AppState = (() => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialData;
  } catch {
    return initialData;
  }
})();

let globalAnalysisCache: Record<string, any> = (() => {
  try {
    const saved = localStorage.getItem(CACHE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
})();

const listeners = new Set<(data: AppState, cache: Record<string, any>) => void>();

const updateGlobalState = (newData: Partial<AppState>, newCache?: Record<string, any>) => {
  globalData = { ...globalData, ...newData };
  if (newCache) globalAnalysisCache = { ...globalAnalysisCache, ...newCache };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(globalData));
  localStorage.setItem(CACHE_KEY, JSON.stringify(globalAnalysisCache));
  
  listeners.forEach(l => l(globalData, globalAnalysisCache));
};

const MAX_RETRIES = 1;

export const useStore = () => {
  const [data, setData] = useState<AppState>(globalData);
  const [analysisCache, setAnalysisCache] = useState<Record<string, any>>(globalAnalysisCache);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  
  const activeRequests = useRef<Set<string>>(new Set());

  useEffect(() => {
    const listener = (d: AppState, c: Record<string, any>) => {
      setData({ ...d });
      setAnalysisCache({ ...c });
    };
    listeners.add(listener);
    setData({ ...globalData });
    return () => { listeners.delete(listener); };
  }, []);

  const safeFetch = useCallback(async (url: string, options: RequestInit = {}, retryCount = 0): Promise<any> => {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (options.method && options.method !== 'GET') {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(url, {
        ...options,
        headers: { ...headers, ...(options.headers as Record<string, string>) },
      });

      if (!response.ok) {
        let errorMsg = `Server ${response.status}: ${response.statusText}`;
        try {
          const body = await response.json();
          if (body.error || body.message || body.supabase_error?.message) {
            errorMsg = body.error || body.message || body.supabase_error?.message || body.supabase_error?.hint || errorMsg;
          }
        } catch { /* fallback to default */ }
        throw new Error(errorMsg);
      }

      try {
        return await response.json();
      } catch {
        return null;
      }
    } catch (err: any) {
      if (retryCount < MAX_RETRIES) {
        return safeFetch(url, options, retryCount + 1);
      }
      throw err;
    }
  }, []);

  const fetchTeams = useCallback(async () => {
    if (activeRequests.current.has('teams')) return;
    activeRequests.current.add('teams');
    setIsSyncing(true);
    try {
      const result = await safeFetch(TEAMS_API);
      const teams = Array.isArray(result) ? result : (result?.teams || result?.data || []);
      updateGlobalState({ teams: [...teams] });
      setLastError(null);
    } catch (err: any) {
      setLastError(`Teams: ${err.message}`);
    } finally {
      setIsSyncing(false);
      activeRequests.current.delete('teams');
    }
  }, [safeFetch]);

  const fetchMembers = useCallback(async () => {
    if (activeRequests.current.has('members')) return;
    activeRequests.current.add('members');
    setIsSyncing(true);
    try {
      const result = await safeFetch(MEMBERS_API);
      const members = Array.isArray(result) ? result : (result?.members || result?.data || []);
      updateGlobalState({ members: [...members] });
      setLastError(null);
    } catch (err: any) {
      setLastError(`Personnel: ${err.message}`);
    } finally {
      setIsSyncing(false);
      activeRequests.current.delete('members');
    }
  }, [safeFetch]);

  const fetchModules = useCallback(async () => {
    if (activeRequests.current.has('modules')) return;
    activeRequests.current.add('modules');
    setIsSyncing(true);
    try {
      const result = await safeFetch(MODULES_API);
      if (result) {
        const rawModules = Array.isArray(result) ? result : (result.modules || result.data || []);
        const modules = Array.isArray(rawModules) ? rawModules.map((m: any) => ({
          ...m,
          owners: m.owners || m.module_owners || []
        })) : [];
        updateGlobalState({ modules: [...modules] });
        setLastError(null);
      }
    } catch (err: any) {
      setLastError(`Modules: ${err.message}`);
    } finally {
      setIsSyncing(false);
      activeRequests.current.delete('modules');
    }
  }, [safeFetch]);

  const fetchTasks = useCallback(async () => {
    if (activeRequests.current.has('tasks')) return;
    activeRequests.current.add('tasks');
    setIsSyncing(true);
    try {
      const result = await safeFetch(getTaskUrl());
      let tasksArray = [];
      if (Array.isArray(result)) {
        tasksArray = result;
      } else if (result?.tasks && Array.isArray(result.tasks)) {
        tasksArray = result.tasks;
      } else if (result?.data) {
        if (Array.isArray(result.data)) {
          tasksArray = result.data;
        } else if (result.data.tasks && Array.isArray(result.data.tasks)) {
          tasksArray = result.data.tasks;
        }
      }
      updateGlobalState({ tasks: [...tasksArray] });
      setLastError(null);
    } catch (err: any) {
      setLastError(`Tasks: ${err.message}`);
    } finally {
      setIsSyncing(false);
      activeRequests.current.delete('tasks');
    }
  }, [safeFetch]);

  const refreshAll = useCallback(async () => {
    setIsSyncing(true);
    try {
      await Promise.allSettled([fetchTeams(), fetchMembers(), fetchModules(), fetchTasks()]);
    } finally {
      setIsSyncing(false);
    }
  }, [fetchTeams, fetchMembers, fetchModules, fetchTasks]);

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'created_at'>) => {
    await safeFetch(getTaskUrl(), {
      method: 'POST',
      body: JSON.stringify(sanitizePayload(task)),
    });
    await fetchTasks();
  }, [safeFetch, fetchTasks]);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    await safeFetch(getTaskUrl(taskId), {
      method: 'PATCH',
      body: JSON.stringify(sanitizePayload(updates)),
    });
    await fetchTasks();
  }, [safeFetch, fetchTasks]);

  const updateTaskStatus = useCallback(async (taskId: string, status: string) => {
    await safeFetch(getTaskUrl(`${taskId}/status`), {
      method: 'PATCH',
      body: JSON.stringify({ status: status.toUpperCase() }),
    });
    await fetchTasks();
  }, [safeFetch, fetchTasks]);

  const analyzeTask = useCallback(async (taskId: string) => {
    const result = await safeFetch(getTaskUrl(`${taskId}/analyze`), { method: 'POST' });
    if (result) updateGlobalState({}, { [taskId]: result });
    return result;
  }, [safeFetch]);

  const commitTask = useCallback(async (taskId: string, commitPayload: { plan: any; force?: boolean }) => {
    // Send force flag within the body JSON as requested
    await safeFetch(getTaskUrl(`${taskId}/commit`), {
      method: 'POST',
      body: JSON.stringify({
        plan: commitPayload.plan,
        force: !!commitPayload.force
      })
    });
    await fetchTasks();
  }, [safeFetch, fetchTasks]);

  return {
    ...data,
    analysisCache,
    isSyncing,
    lastError,
    addTask,
    updateTask,
    updateTaskStatus,
    analyzeTask,
    commitTask,
    refreshAll,
    fetchTeams,
    fetchMembers,
    fetchModules,
    fetchTasks,
    addTeam: (t: any) => safeFetch(TEAMS_API, { method: 'POST', body: JSON.stringify(sanitizePayload(t)) }).then(fetchTeams),
    updateTeam: (id: string, t: any) => safeFetch(`${TEAMS_API}/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify({ ...sanitizePayload(t), id }) 
    }).then(fetchTeams),
    addMember: (m: any) => safeFetch(MEMBERS_API, { method: 'POST', body: JSON.stringify(sanitizePayload(m)) }).then(fetchMembers),
    updateMember: (id: string, m: any) => safeFetch(`${MEMBERS_API}/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify({ ...sanitizePayload(m), id }) 
    }).then(fetchMembers),
    addModule: (m: any) => safeFetch(MODULES_API, { method: 'POST', body: JSON.stringify(prepareModulePayload(m)) }).then(fetchModules),
    updateModule: (id: string, m: any) => safeFetch(`${MODULES_API}/${id}`, { method: 'PATCH', body: JSON.stringify(prepareModulePayload(m)) }).then(fetchModules),
  };
};
