"use client"

import React, { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useAuth } from "@/components/auth-provider"
import { useDashboardStore, Message, Project } from "@/hooks/use-dashboard-store"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
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
  SidebarProvider,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarTrigger
} from "@/components/ui/sidebar"
import { useTheme } from "next-themes"
import {
  LogOut,
  Plus,
  Settings,
  MessageSquare,
  Sparkles,
  ArrowUp,
  Cpu,
  HelpCircle,
  Home,
  Sun,
  Moon
} from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  const {
    sidebarCollapsed,
    projects,
    activeProjectId,
    projectMessages,
    toggleSidebar,
    selectProject,
    startNewProject,
    sendMessage,
  } = useDashboardStore()

  // State for inputs
  const [initPromptText, setInitPromptText] = useState("")
  const [chatInputText, setChatInputText] = useState("")

  const messageEndRef = useRef<HTMLDivElement>(null)

  const activeProject = projects.find((p) => p.id === activeProjectId)
  const activeMessages = activeProjectId ? projectMessages[activeProjectId] || [] : []

  // Auto scroll to bottom of messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeMessages])

  // Click handler for prompt chips
  const handleChipClick = (text: string) => {
    setInitPromptText(text)
  }

  // Submit hander for the initial large input
  const handleInitSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!initPromptText.trim()) return
    startNewProject(initPromptText)
    setInitPromptText("")
  }

  // Submit handler for the chat composer
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInputText.trim()) return
    sendMessage(chatInputText)
    setChatInputText("")
  }

  // Get status badge colors
  const getStatusBadge = (status: Project["status"]) => {
    switch (status) {
      case "done":
        return (
          <Badge variant="secondary" className="bg-emerald-950/40 text-emerald-400 border-emerald-900/60 font-mono text-[9px] h-4 px-1.5 py-0">
            done
          </Badge>
        )
      case "rendering":
        return (
          <Badge variant="secondary" className="bg-amber-950/40 text-amber-400 border-amber-900/60 font-mono text-[9px] h-4 px-1.5 py-0 animate-pulse">
            rendering
          </Badge>
        )
      case "error":
        return (
          <Badge variant="secondary" className="bg-rose-950/40 text-rose-400 border-rose-900/60 font-mono text-[9px] h-4 px-1.5 py-0">
            error
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="bg-slate-900 text-slate-400 border-slate-800 font-mono text-[9px] h-4 px-1.5 py-0">
            queued
          </Badge>
        )
    }
  }

  // Suggested prompt chips
  const exampleChips = [
    "Explain Newton's laws of motion",
    "Visualize a bubble sort algorithm",
    "Show how neural networks optimize weights",
    "Explain the geometry of derivatives",
  ]

  return (
    <SidebarProvider open={!sidebarCollapsed} onOpenChange={(open) => toggleSidebar()}>
      {/* 1. Left Sidebar */}
      <Sidebar collapsible="icon" className="border-r border-slate-200 dark:border-slate-900 bg-white dark:bg-[#07090e] text-slate-900 dark:text-slate-100">
        {/* Top Section */}
        <SidebarHeader className={`h-16 flex flex-row items-center border-b border-slate-200 dark:border-slate-900/60 bg-white dark:bg-[#07090e] transition-all duration-200 ${
          sidebarCollapsed ? "justify-center px-0" : "justify-between px-4"
        }`}>
          <Link href="/" className="flex items-center gap-2 hover:opacity-95 transition-opacity">
            <Image
              src={mounted && resolvedTheme === "dark" ? "/visora_logo_dark_removebg.png" : "/visora_logo_light_removebg.png"}
              alt="Visora Logo"
              width={32}
              height={32}
              className="object-contain"
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

          <Separator className="bg-slate-900/60" />

          {/* Project List */}
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
                                  ? "bg-sky-500/10 text-sky-400 border border-sky-500/25"
                                  : "text-slate-400 hover:bg-slate-900/40 hover:text-white"
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
                              ? "bg-sky-500/10 text-white border-sky-500/20"
                              : "bg-transparent text-slate-400 hover:bg-slate-900/40 hover:text-slate-200 border-transparent"
                          }`}
                        >
                          <div className="text-xs font-medium truncate leading-tight w-full">
                            {proj.title}
                          </div>
                          <div className="flex justify-between items-center mt-1 w-full">
                            <span className="text-[9px] font-mono text-slate-600">
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

        {/* Bottom Section (User/Settings) */}
        <SidebarFooter className={`border-t border-slate-200 dark:border-slate-900/60 bg-white dark:bg-[#07090e] transition-all duration-200 ${
          sidebarCollapsed ? "p-2" : "p-3"
        }`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`flex items-center gap-3 w-full hover:bg-slate-100 dark:hover:bg-slate-900/50 rounded-lg transition-colors cursor-pointer text-left focus:outline-none ${
                sidebarCollapsed ? "justify-center p-1" : "p-1.5"
              }`}>
                <Avatar className="w-8 h-8 border border-slate-200 dark:border-slate-800 shrink-0">
                  <AvatarFallback className="bg-sky-500/10 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold text-xs">
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
                className="text-xs text-rose-500 dark:text-rose-400 focus:bg-rose-50 dark:focus:bg-rose-950/20 focus:text-rose-600 dark:focus:text-rose-300 cursor-pointer flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      {/* 2 & 3. Main Workspace Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Absolute Background coordinate grid mock */}
        <div 
          className="absolute inset-0 opacity-[0.015] pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(to right, #ffffff 1px, transparent 1px),
              linear-gradient(to bottom, #ffffff 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Unified Workspace Header */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-900/60 bg-white/70 dark:bg-[#05070a]/70 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            {activeProjectId ? (
              <>
                <MessageSquare className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-lg">
                  {activeProject?.title}
                </h2>
                {activeProject && (
                  <div className="hidden sm:block shrink-0">
                    {getStatusBadge(activeProject.status)}
                  </div>
                )}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-sky-500 dark:text-sky-400 shrink-0" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Visora Workspace
                </h2>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                className="w-8 h-8 rounded-lg text-slate-650 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white cursor-pointer"
              >
                {resolvedTheme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {activeProjectId ? (
          /* ================= CONVERSATION VIEW ================= */
          <div className="flex-1 flex flex-col overflow-hidden relative z-10">

            {/* Chat Messages */}
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-3xl mx-auto space-y-6 pb-24">
                {activeMessages.map((msg) => {
                  const isUser = msg.role === "user"
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-4 ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      {!isUser && (
                        <Avatar className="w-7 h-7 border border-slate-800 shrink-0">
                          <AvatarFallback className="bg-sky-500/10 text-sky-400 text-[10px] font-bold">
                            SC
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div
                        className={`rounded-2xl px-4.5 py-3 text-sm max-w-[85%] leading-relaxed ${
                          isUser
                            ? "bg-slate-100 dark:bg-slate-900 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                            : "bg-card dark:bg-[#07090e]/50 border border-border dark:border-slate-900/80 text-slate-750 dark:text-slate-300"
                        }`}
                      >
                        <div className="font-sans whitespace-pre-wrap">{msg.content}</div>
                        <div className="text-[9px] font-mono text-slate-600 mt-2 text-right">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      {isUser && (
                        <Avatar className="w-7 h-7 border border-slate-800 shrink-0">
                          <AvatarFallback className="bg-sky-950 text-sky-500 text-[10px] font-bold">
                            U
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  )
                })}

                {/* Simulated Loading Skeleton state when user submits new message */}
                {activeMessages.length === 1 && (
                  <div className="flex gap-4 justify-start">
                    <Avatar className="w-7 h-7 border border-slate-800 shrink-0">
                      <AvatarFallback className="bg-sky-500/10 text-sky-400 text-[10px] font-bold">
                        SC
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-[#07090e]/50 border border-slate-900/80 rounded-2xl p-4 w-full max-w-[70%] space-y-2">
                      <Skeleton className="h-3 w-[80%] bg-slate-800/60" />
                      <Skeleton className="h-3 w-[60%] bg-slate-800/60" />
                      <Skeleton className="h-3 w-[40%] bg-slate-800/60" />
                    </div>
                  </div>
                )}

                <div ref={messageEndRef} />
              </div>
            </ScrollArea>

            {/* Bottom Fixed Input Bar */}
            <div className="p-4 border-t border-border bg-background/90 backdrop-blur-md">
              <form onSubmit={handleChatSubmit} className="max-w-3xl mx-auto flex gap-2">
                <input
                  type="text"
                  placeholder="Ask Scout to modify the video requirements..."
                  value={chatInputText}
                  onChange={(e) => setChatInputText(e.target.value)}
                  className="flex-1 bg-background border border-border rounded-lg px-4 py-2.5 text-xs text-foreground placeholder-slate-450 dark:placeholder-slate-600 focus:outline-none focus:border-sky-500/30 transition-colors font-sans"
                />
                <Button
                  type="submit"
                  disabled={!chatInputText.trim()}
                  className="bg-sky-500 hover:bg-sky-600 text-slate-950 px-4 rounded-lg cursor-pointer flex items-center justify-center disabled:opacity-50"
                >
                  <ArrowUp className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        ) : (
          /* ================= DEFAULT / EMPTY WORKSPACE VIEW ================= */
          <div className="flex-1 flex items-center justify-center p-6 relative z-10">
            <div className="w-full max-w-2xl space-y-8">
              
              {/* Product Header Branding */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-sky-500/20 bg-sky-550/10 dark:bg-sky-950/20 text-sky-600 dark:text-sky-400 text-[10px] font-mono tracking-wider uppercase mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Code-Driven Explainer Engine
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  What are we visualising today?
                </h1>
                <p className="text-slate-600 dark:text-slate-500 text-xs sm:text-sm max-w-md mx-auto">
                  Type your prompt to coordinate with Scout and generate mathematically precise Python Manim videos.
                </p>
              </div>

              {/* Large Composer Card */}
              <div className="bg-card border border-border rounded-xl p-4 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-sky-500/0 via-sky-500/30 to-sky-500/0" />
                
                <form onSubmit={handleInitSubmit} className="space-y-3">
                  <Textarea
                    required
                    placeholder="Describe the video you want to create..."
                    value={initPromptText}
                    onChange={(e) => setInitPromptText(e.target.value)}
                    className="min-h-[120px] w-full bg-background border border-border rounded-lg placeholder-slate-400 dark:placeholder-slate-700 text-foreground focus:border-sky-500/20 focus:ring-0 resize-none font-sans text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-600 flex items-center gap-1">
                      <Cpu className="w-3.5 h-3.5 text-sky-500/50" />
                      Powered by Visora NIM Pipeline
                    </span>
                    <Button
                      type="submit"
                      disabled={!initPromptText.trim()}
                      className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-slate-950 font-semibold px-4 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 transition-all text-xs"
                    >
                      Generate Outline
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </form>
              </div>

              {/* Suggested Chips list */}
              <div className="space-y-2.5">
                <div className="text-[10px] font-mono text-slate-500 dark:text-slate-600 uppercase tracking-wider text-center">
                  Suggested Prompt Templates
                </div>
                <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
                  {exampleChips.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChipClick(chip)}
                      className="px-3.5 py-1.5 bg-card border border-border hover:border-slate-350 dark:hover:border-slate-800 text-slate-650 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-200 text-xs rounded-lg transition-colors cursor-pointer font-sans"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </SidebarProvider>
  )
}
