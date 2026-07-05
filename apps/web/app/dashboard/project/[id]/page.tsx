"use client"

import React, { useEffect, use } from "react"
import { useDashboardStore } from "@/hooks/use-dashboard-store"
import DashboardPage from "../../page"

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { setActiveProject } = useDashboardStore()

  useEffect(() => {
    if (resolvedParams?.id) {
      setActiveProject(resolvedParams.id)
    }
  }, [resolvedParams?.id, setActiveProject])

  return <DashboardPage isProjectSubroute={true} />
}
