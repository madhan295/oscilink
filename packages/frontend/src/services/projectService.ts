import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { serializeProject, deserializeProject } from '../utils/projectSerializer';
import toast from 'react-hot-toast';

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  updated_at: string;
  is_public: boolean;
  tags: string[];
}

export async function saveProject(name: string, description: string, isPublic: boolean): Promise<string> {
  const { user } = useAuthStore.getState();
  if (!user) {
    throw new Error('You must be logged in to save projects to the cloud.');
  }

  // Serialize the current state including a generated thumbnail
  const projectData = await serializeProject(name, true);
  
  // Extract circuit_data so it matches our DB schema
  const circuit_data = {
    version: projectData.version,
    components: projectData.components,
    wires: projectData.wires,
    viewport: projectData.viewport
  };

  const currentProjectId = useWorkspaceStore.getState().currentProjectId;
  
  const payload: any = {
    user_id: user.id,
    name,
    description,
    circuit_data,
    code: projectData.code,
    is_public: isPublic,
    thumbnail: projectData.thumbnail,
    tags: projectData.tags || [],
  };

  if (currentProjectId) {
    payload.id = currentProjectId;
  }

  const { data, error } = await supabase
    .from('projects')
    .upsert(payload, { onConflict: 'id' })
    .select('id')
    .single();

  if (error) {
    console.error('Supabase Save Error:', error);
    throw new Error(error.message);
  }

  // Update store with new ID in case it was an insert
  useWorkspaceStore.getState().setCurrentProject(data.id, name);
  
  return data.id;
}

export async function loadProjectsForCurrentUser(): Promise<ProjectSummary[]> {
  const { user } = useAuthStore.getState();
  if (!user) return [];

  const { data, error } = await supabase
    .from('projects')
    .select('id, name, description, thumbnail, updated_at, is_public, tags')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Fetch Projects Error:', error);
    toast.error('Failed to load projects');
    return [];
  }

  return data as ProjectSummary[];
}

export async function loadProjectById(id: string): Promise<void> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Load Project Error:', error);
    throw new Error('Project not found or access denied');
  }

  // Reconstruct the JSON expected by deserializeProject
  const payload: any = {
    version: data.circuit_data.version || '1.0',
    name: data.name,
    components: data.circuit_data.components || [],
    wires: data.circuit_data.wires || [],
    viewport: data.circuit_data.viewport || { x: 0, y: 0, scale: 1 },
    code: data.code || ''
  };

  deserializeProject(payload);
  
  // Set the current project ID and name in the workspace store
  useWorkspaceStore.getState().setCurrentProject(data.id, data.name);
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Delete Project Error:', error);
    throw new Error(error.message);
  }

  // If we just deleted the currently open project, maybe we clear the ID?
  const currentProjectId = useWorkspaceStore.getState().currentProjectId;
  if (currentProjectId === id) {
    useWorkspaceStore.getState().setCurrentProject(null, 'Untitled Project');
  }
}

export async function toggleProjectVisibility(id: string, isPublic: boolean): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ is_public: isPublic })
    .eq('id', id);

  if (error) {
    console.error('Update Visibility Error:', error);
    throw new Error(error.message);
  }
}

export async function renameProject(id: string, newName: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ name: newName })
    .eq('id', id);

  if (error) {
    console.error('Rename Project Error:', error);
    throw new Error(error.message);
  }

  const currentProjectId = useWorkspaceStore.getState().currentProjectId;
  if (currentProjectId === id) {
    useWorkspaceStore.getState().setCurrentProject(id, newName);
  }
}
