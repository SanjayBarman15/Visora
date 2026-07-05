"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { useAuthStore } from "@/hooks/use-auth-store"
import { useDashboardStore, Project } from "@/hooks/use-dashboard-store"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  LogOut,
  Plus,
  Settings,
  MessageSquare,
  HelpCircle,
  Home,
} from "lucide-react"

export function DashboardSidebar() {
  const { user, signOut } = useAuthStore()
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const {
    sidebarCollapsed,
    projects,
    activeProjectId,
    selectProject,
    toggleSidebar,
  } = useDashboardStore()

  const getStatusBadge = (status: Project["status"]) => {
    switch (status) {
      case "done":
        return (
          <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60 font-mono text-[9px] h-4 px-1.5 py-0">
            done
          </Badge>
        )
      case "done_with_warnings":
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-500 dark:border-amber-900/60 font-mono text-[9px] h-4 px-1.5 py-0">
            warnings
          </Badge>
        )
      case "generating":
        return (
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60 font-mono text-[9px] h-4 px-1.5 py-0 animate-pulse">
            generating
          </Badge>
        )
      case "assembling":
        return (
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/60 font-mono text-[9px] h-4 px-1.5 py-0 animate-pulse">
            assembling
          </Badge>
        )
      case "plan_review":
        return (
          <Badge variant="secondary" className="bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-900/60 font-mono text-[9px] h-4 px-1.5 py-0">
            plan review
          </Badge>
        )
      case "error":
        return (
          <Badge variant="secondary" className="bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 font-mono text-[9px] h-4 px-1.5 py-0">
            error
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 font-mono text-[9px] h-4 px-1.5 py-0">
            draft
          </Badge>
        )
    }
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-slate-200 dark:border-slate-900 bg-white dark:bg-[#07090e] text-slate-900 dark:text-slate-100">
      <SidebarHeader className={`h-16 flex flex-row items-center border-b border-slate-200/80 dark:border-slate-900/60 bg-white dark:bg-[#07090e] transition-all duration-200 ${
        sidebarCollapsed ? "justify-center px-0" : "justify-between px-4"
      }`}>
        <Link href="/" className="flex items-center gap-2 hover:opacity-95 transition-opacity">
          <Image
            src={mounted && resolvedTheme === "dark" ? "/visora_logo_dark_removebg.png" : "/visora_logo_light_removebg.png"}
            alt="Visora Logo"
            width={32}
            height={32}
            className="object-contain"
            priority
          />
          {!sidebarCollapsed && (
            <span className="font-sans font-bold tracking-tight text-slate-900 dark:text-white text-md">Visora</span>
          )}
        </Link>
        {!sidebarCollapsed && (
          <Link href="/">
            <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer">
              <Home className="w-4 h-4" />
            </Button>
          </Link>
        )}
      </SidebarHeader>

      <SidebarContent className={`space-y-4 transition-all duration-200 ${sidebarCollapsed ? "p-2" : "p-3"}`}>
        <div className="flex justify-center w-full">
          {sidebarCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => selectProject(null)}
                  size="icon"
                  className="w-8 h-8 bg-sky-500 hover:bg-sky-600 text-slate-950 rounded-lg cursor-pointer flex items-center justify-center shrink-0"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">New Video Project</TooltipContent>
            </Tooltip>
          ) : (
            <Button
              onClick={() => selectProject(null)}
              className="w-full bg-sky-500 hover:bg-sky-600 text-slate-950 font-medium py-2 rounded-lg cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_10px_rgba(56,189,248,0.15)] text-xs"
            >
              <Plus className="w-4 h-4" />
              New video
            </Button>
          )}
        </div>

        <Separator className="bg-slate-200 dark:bg-slate-900/60" />

        <SidebarGroup className="px-0">
          {!sidebarCollapsed && (
            <SidebarGroupLabel className="text-[10px] font-mono tracking-wider text-slate-500 uppercase px-3 mb-2">
              Recent Projects
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 w-full flex flex-col items-center">
              {projects.map((proj) => {
                const isActive = proj.id === activeProjectId
                return (
                  <SidebarMenuItem key={proj.id} className="w-full flex justify-center">
                    {sidebarCollapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton
                            onClick={() => selectProject(proj.id)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors cursor-pointer p-0 shrink-0 ${
                              isActive
                                ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/25"
                                : "text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900/40 hover:text-slate-700 dark:hover:text-white"
                            }`}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-[200px] truncate">
                          {proj.title}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <SidebarMenuButton
                        onClick={() => selectProject(proj.id)}
                        className={`w-full text-left p-3 h-auto rounded-lg transition-all flex flex-col gap-1 cursor-pointer border ${
                          isActive
                            ? "bg-sky-50 dark:bg-sky-500/10 text-sky-900 dark:text-white border-sky-200 dark:border-sky-500/20"
                            : "bg-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/40 hover:text-slate-800 dark:hover:text-slate-200 border-transparent hover:border-slate-200 dark:hover:border-transparent"
                        }`}
                      >
                        <div className="text-xs font-medium truncate leading-tight w-full">
                          {proj.title}
                        </div>
                        <div className="flex justify-between items-center mt-1 w-full">
                          <span className="text-[9px] font-mono text-slate-400 dark:text-slate-650">
                            {new Date(proj.lastMessageAt).toLocaleDateString()}
                          </span>
                          {getStatusBadge(proj.status)}
                        </div>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className={`border-t border-slate-200/80 dark:border-slate-900/60 bg-white dark:bg-[#07090e] transition-all duration-200 ${
        sidebarCollapsed ? "p-2" : "p-3"
      }`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`flex items-center gap-3 w-full hover:bg-slate-100 dark:hover:bg-slate-900/50 rounded-lg transition-colors cursor-pointer text-left focus:outline-none ${
              sidebarCollapsed ? "justify-center p-1" : "p-1.5"
            }`}>
              <Avatar className="w-8 h-8 border border-slate-200 dark:border-slate-800 shrink-0">
                <AvatarFallback className="bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400 font-bold text-xs">
                  {user?.email?.slice(0, 2).toUpperCase() || "US"}
                </AvatarFallback>
              </Avatar>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                    {user?.email?.split("@")[0]}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono truncate">
                    {user?.email}
                  </p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-900 text-slate-800 dark:text-slate-200">
            <DropdownMenuLabel className="font-mono text-xs text-slate-500 dark:text-slate-400">My Account</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-900" />
            <DropdownMenuItem className="text-xs focus:bg-slate-100 dark:focus:bg-slate-900 focus:text-slate-900 dark:focus:text-white cursor-pointer flex items-center gap-2">
              <Settings className="w-3.5 h-3.5" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="text-xs focus:bg-slate-100 dark:focus:bg-slate-900 focus:text-slate-900 dark:focus:text-white cursor-pointer flex items-center gap-2">
              <HelpCircle className="w-3.5 h-3.5" />
              Documentation
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-900" />
            <DropdownMenuItem
              onClick={signOut}
              className="text-xs text-rose-500 dark:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-950/20 focus:text-rose-600 dark:focus:text-rose-350 cursor-pointer flex items-center gap-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
