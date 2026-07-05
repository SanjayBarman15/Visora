import { create } from "zustand"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export interface Project {
  id: string
  title: string
  lastMessageAt: string
  status: "idle" | "rendering" | "done" | "error"
}

interface DashboardState {
  sidebarCollapsed: boolean
  projects: Project[]
  activeProjectId: string | null
  projectMessages: Record<string, Message[]> // Mapping projectId -> messages
  
  // Actions
  toggleSidebar: () => void
  selectProject: (id: string | null) => void
  startNewProject: (promptText: string) => void
  sendMessage: (content: string) => void
}

// Initial seed data
const initialProjects: Project[] = [
  {
    id: "proj_1",
    title: "Explain calculus to a 16 year old",
    lastMessageAt: "2026-07-04T12:00:00Z",
    status: "done",
  },
  {
    id: "proj_2",
    title: "Fourier transform visual intro",
    lastMessageAt: "2026-07-04T10:30:00Z",
    status: "rendering",
  },
  {
    id: "proj_3",
    title: "How merge sort works",
    lastMessageAt: "2026-07-04T09:15:00Z",
    status: "idle",
  },
  {
    id: "proj_4",
    title: "visualizing backpropagation in neural nets",
    lastMessageAt: "2026-07-03T18:45:00Z",
    status: "done",
  },
  {
    id: "proj_5",
    title: "Maxwell's equations step-by-step",
    lastMessageAt: "2026-07-03T14:20:00Z",
    status: "error",
  },
  {
    id: "proj_6",
    title: "Euler's identity visual proof",
    lastMessageAt: "2026-07-02T11:05:00Z",
    status: "done",
  },
  {
    id: "proj_7",
    title: "Double pendulum chaos simulation",
    lastMessageAt: "2026-07-01T16:50:00Z",
    status: "done",
  },
]

const initialMessages: Record<string, Message[]> = {
  proj_1: [
    {
      id: "m1",
      role: "user",
      content: "Explain calculus to a 16 year old in an visual, intuitive way.",
      timestamp: "2026-07-04T11:58:00Z",
    },
    {
      id: "m2",
      role: "assistant",
      content:
        "Hi! I'm Scout, your Visora design assistant. I can help clarify your calculus video request. To get the best code generation, I'd suggest focusing on the concept of 'accumulated area' (integrals) or the 'instantaneous slope' (derivatives). Which of these visual paths would you like to build first?",
      timestamp: "2026-07-04T12:00:00Z",
    },
  ],
  proj_2: [
    {
      id: "m3",
      role: "user",
      content: "Show the Fourier transform by wrapping a signal around a circle.",
      timestamp: "2026-07-04T10:28:00Z",
    },
    {
      id: "m4",
      role: "assistant",
      content:
        "Great idea. I'll configure the Manim agent to generate a coordinate circle and plot the signal winding frequency in real-time. The generator is currently compiling the rendering pipeline.",
      timestamp: "2026-07-04T10:30:00Z",
    },
  ],
  proj_3: [
    {
      id: "m5",
      role: "user",
      content: "A quick tutorial explaining the divide-and-conquer strategy in merge sort.",
      timestamp: "2026-07-04T09:12:00Z",
    },
    {
      id: "m6",
      role: "assistant",
      content:
        "Hello! I will coordinate the plan to visualize the array splits. How many elements do you want to show in the sorting array? Typically, 8 elements is optimal for a clear screen layout.",
      timestamp: "2026-07-04T09:15:00Z",
    },
  ],
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  sidebarCollapsed: false,
  projects: initialProjects,
  activeProjectId: null,
  projectMessages: initialMessages,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  selectProject: (id) => set({ activeProjectId: id }),

  startNewProject: (promptText) => {
    const newId = `proj_${Date.now()}`
    const newProject: Project = {
      id: newId,
      title: promptText.length > 40 ? promptText.slice(0, 37) + "..." : promptText,
      lastMessageAt: new Date().toISOString(),
      status: "idle",
    }

    const userMessage: Message = {
      id: `m_user_${Date.now()}`,
      role: "user",
      content: promptText,
      timestamp: new Date().toISOString(),
    }

    // Add loading skeleton state for agent response
    set((state) => ({
      projects: [newProject, ...state.projects],
      activeProjectId: newId,
      projectMessages: {
        ...state.projectMessages,
        [newId]: [userMessage],
      },
    }))

    // Simulate assistant reply after 1.5 seconds
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `m_ast_${Date.now()}`,
        role: "assistant",
        content: `Welcome to Visora! I'm Scout, your requirements coordinator. I've received your prompt: "${promptText}". I will start mapping this out into visual scenes. To ensure the generated Manim code matches your intent, could you specify your preferred tone and whether you'd like mathematical formulas overlayed?`,
        timestamp: new Date().toISOString(),
      }

      set((state) => ({
        projectMessages: {
          ...state.projectMessages,
          [newId]: [...(state.projectMessages[newId] || []), assistantMessage],
        },
      }))
    }, 1500)
  },

  sendMessage: (content) => {
    const { activeProjectId } = get()
    if (!activeProjectId) return

    const userMessage: Message = {
      id: `m_user_${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    }

    set((state) => ({
      projectMessages: {
        ...state.projectMessages,
        [activeProjectId]: [...(state.projectMessages[activeProjectId] || []), userMessage],
      },
    }))

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `m_ast_${Date.now()}`,
        role: "assistant",
        content: `Got it. I'm updating the agent parameters to include this requirement. The scene planner is refining the visual sequence.`,
        timestamp: new Date().toISOString(),
      }

      set((state) => ({
        projectMessages: {
          ...state.projectMessages,
          [activeProjectId]: [...(state.projectMessages[activeProjectId] || []), assistantMessage],
        },
      }))
    }, 1200)
  },
}))
