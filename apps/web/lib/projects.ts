import { createClient } from '@/utils/supabase/client'

export interface ProjectRecord {
  id: string
  user_id: string
  title: string
  status: string
  final_video_url: string | null
  created_at: string
}

/**
 * Creates a new project + session row in Supabase.
 * Called from the dashboard when user sends their first message.
 * Returns { projectId, sessionId } to be stored in Zustand and used for routing.
 */
export async function createProject(
  userId: string,
  firstMessage: string
): Promise<{ projectId: string; sessionId: string }> {
  const supabase = createClient()

  // Derive title from first message (max 80 chars)
  const title =
    firstMessage.trim().length > 80
      ? firstMessage.trim().slice(0, 77) + '...'
      : firstMessage.trim()

  // 1. Create the project row
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: userId,
      title,
      status: 'draft',
    })
    .select('id')
    .single()

  if (projectError || !project) {
    throw new Error(`Failed to create project: ${projectError?.message}`)
  }

  // 2. Create the session row linked to the project
  const sessionId = crypto.randomUUID()
  const { error: sessionError } = await supabase.from('sessions').insert({
    id: sessionId,
    user_id: userId,
    project_id: project.id,
  })

  if (sessionError) {
    throw new Error(`Failed to create session: ${sessionError.message}`)
  }

  return { projectId: project.id, sessionId }
}

/**
 * Fetches a project by ID. Returns null if not found or not owned by user.
 */
export async function getProject(
  projectId: string,
  userId: string
): Promise<ProjectRecord | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('projects')
    .select('id, user_id, title, status, final_video_url, created_at')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single()

  if (error || !data) return null

  return data as ProjectRecord
}

/**
 * Fetches all projects for a user, ordered by most recent.
 * Useful for a future projects sidebar/list.
 */
export async function getUserProjects(userId: string): Promise<ProjectRecord[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('projects')
    .select('id, user_id, title, status, final_video_url, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error || !data) return []

  return data as ProjectRecord[]
}
