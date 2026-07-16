import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { ProjectClient } from './project-client'

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the project — ensure it belongs to this user
  const { data: project, error } = await supabase
    .from('projects')
    .select('id, title, status, final_video_url, created_at')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (error || !project) {
    redirect('/dashboard')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'Casanova'

  return (
    <Suspense fallback={null}>
      <ProjectClient
        projectId={project.id}
        projectTitle={project.title}
        userId={user.id}
        displayName={displayName}
      />
    </Suspense>
  )
}
