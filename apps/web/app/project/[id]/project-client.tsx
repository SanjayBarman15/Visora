'use client'

import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useVisoraStore } from '@/store/useVisoraStore'
import { ProjectView } from '@/components/project-view'

interface ProjectClientProps {
  projectId: string
  projectTitle: string
  userId: string
  displayName: string
}

export function ProjectClient({
  projectId,
  projectTitle,
  userId,
  displayName,
}: ProjectClientProps) {
  const searchParams = useSearchParams()
  const { initProject, sendMessage, projectId: storedProjectId } = useVisoraStore()
  const firstMessageSent = useRef(false)

  useEffect(() => {
    // If the store doesn't already have this project loaded, init it.
    // sessionId may be missing (e.g. on page refresh) — we use a fresh one.
    if (storedProjectId !== projectId) {
      const sessionId = crypto.randomUUID()
      initProject(projectId, sessionId)
    }
  }, [projectId, storedProjectId, initProject])

  useEffect(() => {
    // Send the first message if it was passed as a query param (from dashboard)
    const firstMessage = searchParams.get('firstMessage')
    if (firstMessage && !firstMessageSent.current) {
      firstMessageSent.current = true
      // Small delay to let the store initialize
      setTimeout(() => {
        sendMessage(firstMessage)
      }, 100)
    }
  }, [searchParams, sendMessage])

  return (
    <ProjectView
      projectId={projectId}
      projectTitle={projectTitle}
      displayName={displayName}
    />
  )
}
