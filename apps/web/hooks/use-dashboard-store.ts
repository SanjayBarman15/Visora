import { create } from "zustand"

export interface Message {
  id: string
  projectId: string
  role: "user" | "assistant"
  content: string
  timestamp: string
}

export interface Scene {
  id: string
  order: number
  title: string
  description: string
  duration: number // keep duration for backward compatibility
  durationSeconds: number
  status: "retrieving" | "generating" | "rendering" | "done" | "error"
  code: string
}

export interface Project {
  id: string
  title: string
  createdAt: string
  lastMessageAt: string
  status: "draft" | "eliciting" | "plan_review" | "generating" | "assembling" | "done" | "done_with_warnings" | "error"
  activeSceneIndex: number
}

interface DashboardState {
  sidebarCollapsed: boolean
  projects: Project[]
  activeProjectId: string | null
  messages: Message[]
  scenePlans: Record<string, Scene[]>
  isCodePanelOpen: boolean
  
  // Actions
  toggleSidebar: () => void
  selectProject: (id: string | null) => void
  setActiveProject: (id: string | null) => void
  startNewProject: (promptText: string) => void
  sendMessage: (content: string) => void
  addMessage: (projectId: string, message: { id: string; role: Message["role"]; content: string; timestamp: string }) => void
  updateProjectStatus: (id: string, status: Project["status"]) => void
  toggleCodePanel: () => void
  selectScene: (projectId: string, index: number) => void
  updateScene: (projectId: string, sceneId: string, updates: Partial<Scene>) => void
  reorderScenes: (projectId: string, startIndex: number, endIndex: number) => void
  deleteScene: (projectId: string, sceneId: string) => void
  approvePlan: (projectId: string) => void
}

// Mock Manim Codes
const mockIntroAreaCode = `class IntroArea(Scene):
    def construct(self):
        # Create standard coordinate axes
        axes = Axes(
            x_range=[0, 5, 1],
            y_range=[0, 5, 1],
            x_length=6,
            y_length=5,
            axis_config={"color": BLUE_C}
        )
        
        # Define smooth mathematical function
        curve = axes.plot(
            lambda x: 0.1 * x**2 + 1,
            color=YELLOW_D
        )
        
        # Approximate area with riemann rectangles
        rects = axes.get_riemann_rectangles(
            curve,
            x_range=[1, 4],
            dx=0.5,
            fill_opacity=0.5,
            color=GREEN_D
        )
        
        # Add labels and draw
        labels = axes.get_axis_labels()
        self.play(Create(axes), Write(labels))
        self.play(Create(curve))
        self.play(Create(rects))
        self.wait(1.5)`

const mockLimitAreaCode = `class LimitArea(Scene):
    def construct(self):
        axes = Axes(x_range=[0, 5], y_range=[0, 5], x_length=6, y_length=5)
        curve = axes.plot(lambda x: 0.1 * x**2 + 1, color=YELLOW_D)
        self.add(axes, curve)
        
        # Show approximation getting closer to actual area
        current_rects = axes.get_riemann_rectangles(curve, x_range=[1, 4], dx=0.5)
        self.play(Create(current_rects))
        
        for dx in [0.2, 0.1, 0.05]:
            new_rects = axes.get_riemann_rectangles(
                curve, 
                x_range=[1, 4], 
                dx=dx,
                fill_opacity=0.6,
                color=GREEN_B
            )
            self.play(Transform(current_rects, new_rects), run_time=1.5)
            self.wait(0.5)`

const mockIntegralCode = `class IntegralSymbol(Scene):
    def construct(self):
        # Write out the formal integral definition
        tex = MathTex(
            "\\lim_{n \\to \\infty} \\sum_{i=1}^n f(x_i) \\Delta x",
            "=",
            "\\int_a^b f(x) dx"
        )
        tex.scale(1.5)
        tex.set_color_by_tex("int", YELLOW)
        
        self.play(Write(tex[0]))
        self.wait(1)
        self.play(Write(tex[1]))
        self.play(TransformMatchingShapes(tex[0].copy(), tex[2]))
        self.wait(2)`

const mockFourierCode = `class FourierCircleWrapping(Scene):
    def construct(self):
        # Setup visual wrap-around vector
        circle = Circle(radius=2, color=BLUE)
        center_dot = Dot()
        freq_label = Tex("Winding Frequency: 2 Hz").to_edge(UP)
        
        self.play(Create(circle), Create(center_dot))
        self.play(Write(freq_label))
        
        # Spin vector around coordinate space
        vector = Arrow(ORIGIN, circle.get_right(), buff=0, color=YELLOW)
        self.play(Create(vector))
        self.play(Rotate(vector, angle=2*PI, about_point=ORIGIN, run_time=3))
        self.wait(1)`

const mockMergeSortCode = `class MergeSortDivide(Scene):
    def construct(self):
        # Display 8 raw visual blocks
        bars = VGroup(*[
            Rectangle(width=0.4, height=h, fill_opacity=0.8, color=RED).shift(RIGHT * i * 0.6)
            for i, h in enumerate([3, 1, 4, 1, 5, 9, 2, 6])
        ]).center()
        
        self.play(Create(bars))
        self.wait(1)
        
        # Sub-divide into left/right branches
        left_half = bars[:4]
        right_half = bars[4:]
        
        self.play(
          left_half.animate.shift(LEFT * 0.5 + UP * 0.5),
          right_half.animate.shift(RIGHT * 0.5 + UP * 0.5)
        )
        self.wait(1.5)`

// Initial seed data
const initialProjects: Project[] = [
  {
    id: "proj_1",
    title: "Explain calculus to a 16 year old",
    createdAt: "2026-07-04T11:58:00Z",
    lastMessageAt: "2026-07-04T12:00:00Z",
    status: "done",
    activeSceneIndex: 0,
  },
  {
    id: "proj_2",
    title: "Fourier transform visual intro",
    createdAt: "2026-07-04T10:28:00Z",
    lastMessageAt: "2026-07-04T10:30:00Z",
    status: "generating",
    activeSceneIndex: 1,
  },
  {
    id: "proj_3",
    title: "How merge sort works",
    createdAt: "2026-07-04T09:12:00Z",
    lastMessageAt: "2026-07-04T09:15:00Z",
    status: "plan_review",
    activeSceneIndex: 0,
  },
]

const initialScenePlans: Record<string, Scene[]> = {
  proj_1: [
    {
      id: "s1",
      order: 1,
      title: "Introduction to Area",
      description: "Visualise finding the area under a curve using simple rectangles.",
      duration: 5,
      durationSeconds: 5,
      status: "done",
      code: mockIntroAreaCode,
    },
    {
      id: "s2",
      order: 2,
      title: "Increasing Rectangles",
      description: "Increase the number of rectangles to show the approximation gets better.",
      duration: 8,
      durationSeconds: 8,
      status: "done",
      code: mockLimitAreaCode,
    },
    {
      id: "s3",
      order: 3,
      title: "Defining the Integral",
      description: "Transition from summation to the integral sign.",
      duration: 6,
      durationSeconds: 6,
      status: "done",
      code: mockIntegralCode,
    },
  ],
  proj_2: [
    {
      id: "s4",
      order: 1,
      title: "Signal Construction",
      description: "Define a combination of two sine waves (3Hz and 5Hz).",
      duration: 4,
      durationSeconds: 4,
      status: "done",
      code: "# Plotting wave combination function\n# f(t) = sin(2*pi*3*t) + sin(2*pi*5*t)",
    },
    {
      id: "s5",
      order: 2,
      title: "Winding Signal around Circle",
      description: "Wrap the signal around a circle at changing frequencies.",
      duration: 9,
      durationSeconds: 9,
      status: "rendering",
      code: mockFourierCode,
    },
    {
      id: "s6",
      order: 3,
      title: "Plotting Center of Mass",
      description: "Trace the center of mass x-coordinate to reveal the frequency peaks.",
      duration: 7,
      durationSeconds: 7,
      status: "retrieving",
      code: "# Trace center of mass to plot the final spectrum graph",
    },
  ],
  proj_3: [
    {
      id: "s7",
      order: 1,
      title: "Unsorted Array View",
      description: "Show a list of 8 random numbers as vertical colored bars.",
      duration: 4,
      durationSeconds: 4,
      status: "done",
      code: mockMergeSortCode,
    },
    {
      id: "s8",
      order: 2,
      title: "Divide Phase",
      description: "Recursively split the array into halves until single elements remain.",
      duration: 8,
      durationSeconds: 8,
      status: "done",
      code: mockMergeSortCode,
    },
    {
      id: "s9",
      order: 3,
      title: "Conquer & Merge",
      description: "Compare and merge elements back together in sorted order.",
      duration: 10,
      durationSeconds: 10,
      status: "done",
      code: mockMergeSortCode,
    },
  ],
}

const initialMessages: Message[] = [
  {
    id: "m1",
    projectId: "proj_1",
    role: "user",
    content: "Explain calculus to a 16 year old in an visual, intuitive way.",
    timestamp: "2026-07-04T11:58:00Z",
  },
  {
    id: "m2",
    projectId: "proj_1",
    role: "assistant",
    content:
      "Hi! I'm Scout, your Visora design assistant. I've mapped this out into a Riemann sum visualization. The scenes have been rendered successfully and the final video is assembled. You can view the output and inspect the Manim code in the right panel.",
    timestamp: "2026-07-04T12:00:00Z",
  },
  {
    id: "m3",
    projectId: "proj_2",
    role: "user",
    content: "Show the Fourier transform by wrapping a signal around a circle.",
    timestamp: "2026-07-04T10:28:00Z",
  },
  {
    id: "m4",
    projectId: "proj_2",
    role: "assistant",
    content:
      "Great idea. I'll configure the Manim agent to generate a coordinate circle and plot the signal winding frequency in real-time. The generator is currently compiling the rendering pipeline.",
    timestamp: "2026-07-04T10:30:00Z",
  },
  {
    id: "m5",
    projectId: "proj_3",
    role: "user",
    content: "A quick tutorial explaining the divide-and-conquer strategy in merge sort.",
    timestamp: "2026-07-04T09:12:00Z",
  },
  {
    id: "m6",
    projectId: "proj_3",
    role: "assistant",
    content:
      "Hello! I have created the preliminary scene outline for your Merge Sort animation. Please review the plan below, edit any descriptions or durations as you see fit, and click 'Approve & Start Generation' when you are ready to render.",
    timestamp: "2026-07-04T09:15:00Z",
  },
]

export const useDashboardStore = create<DashboardState>((set, get) => ({
  sidebarCollapsed: false,
  projects: initialProjects,
  activeProjectId: null,
  messages: initialMessages,
  scenePlans: initialScenePlans,
  isCodePanelOpen: false,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  selectProject: (id) => set({ activeProjectId: id }),
  setActiveProject: (id) => set({ activeProjectId: id }),

  startNewProject: (promptText) => {
    const newId = `proj_${Date.now()}`
    const newProject: Project = {
      id: newId,
      title: promptText.length > 40 ? promptText.slice(0, 37) + "..." : promptText,
      createdAt: new Date().toISOString(),
      lastMessageAt: new Date().toISOString(),
      status: "eliciting",
      activeSceneIndex: 0,
    }

    const starterScenes: Scene[] = [
      {
        id: `s_${newId}_starter`,
        order: 1,
        title: "Introduction",
        description: `Visualise the core concept: "${promptText}"`,
        duration: 5,
        durationSeconds: 5,
        status: "done",
        code: `# Auto-generated starter template for ${promptText}`,
      },
    ]

    const userMessage: Message = {
      id: `m_user_${Date.now()}`,
      projectId: newId,
      role: "user",
      content: promptText,
      timestamp: new Date().toISOString(),
    }

    set((state) => ({
      projects: [newProject, ...state.projects],
      activeProjectId: newId,
      messages: [...state.messages, userMessage],
      scenePlans: {
        ...state.scenePlans,
        [newId]: starterScenes,
      },
    }))

    // Simulate assistant reply after 1.5 seconds, then transition to plan_review
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `m_ast_${Date.now()}`,
        projectId: newId,
        role: "assistant",
        content: `I've constructed a proposed scene outline for your topic: "${promptText}". You can see it below. I've designed three main visual stages: an introduction to establish the concepts, a main visual deep-dive showing the core mechanics, and a final summary. Please review and click Approve to generate!`,
        timestamp: new Date().toISOString(),
      }

      set((state) => {
        const updatedProjects = state.projects.map((p) =>
          p.id === newId ? { ...p, status: "plan_review" as const } : p
        )
        const outlineScenes: Scene[] = [
          {
            id: `s_${newId}_1`,
            order: 1,
            title: "Introduction & Setup",
            description: `Define and setup the basic visual grid for: ${promptText}.`,
            duration: 5,
            durationSeconds: 5,
            status: "done" as const,
            code: `# Code block for setup`,
          },
          {
            id: `s_${newId}_2`,
            order: 2,
            title: "Core Mechanics Demonstration",
            description: "Dynamic visual transformation illustrating the core formula/logic.",
            duration: 10,
            durationSeconds: 10,
            status: "done" as const,
            code: `# Code block for core visuals`,
          },
          {
            id: `s_${newId}_3`,
            order: 3,
            title: "Mathematical Summary",
            description: "Write out final equations and summarize with highlighting overlays.",
            duration: 6,
            durationSeconds: 6,
            status: "done" as const,
            code: `# Code block for math overlay`,
          }
        ]

        return {
          projects: updatedProjects,
          messages: [...state.messages, assistantMessage],
          scenePlans: {
            ...state.scenePlans,
            [newId]: outlineScenes,
          },
        }
      })
    }, 1500)
  },

  sendMessage: (content) => {
    const { activeProjectId } = get()
    if (!activeProjectId) return

    const userMessage: Message = {
      id: `m_user_${Date.now()}`,
      projectId: activeProjectId,
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    }

    set((state) => ({
      messages: [...state.messages, userMessage],
    }))

    // Simulate assistant response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: `m_ast_${Date.now()}`,
        projectId: activeProjectId,
        role: "assistant",
        content: `Got it. I'm updating the outline parameters. Let me know if the updated scene plan looks good or if we should tweak anything else.`,
        timestamp: new Date().toISOString(),
      }

      set((state) => ({
        messages: [...state.messages, assistantMessage],
      }))
    }, 1200)
  },

  addMessage: (projectId, message) => {
    const fullMessage: Message = {
      ...message,
      projectId,
    }
    set((state) => ({
      messages: [...state.messages, fullMessage],
    }))
  },

  updateProjectStatus: (id, status) => {
    set((state) => ({
      projects: state.projects.map((p) => (p.id === id ? { ...p, status } : p)),
    }))
  },

  toggleCodePanel: () => set((state) => ({ isCodePanelOpen: !state.isCodePanelOpen })),

  selectScene: (projectId, index) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, activeSceneIndex: index } : p
      ),
    }))
  },

  updateScene: (projectId, sceneId, updates) => {
    set((state) => {
      const scenes = state.scenePlans[projectId] || []
      const updatedScenes = scenes.map((s) => {
        if (s.id !== sceneId) return s
        const nextDuration = updates.duration !== undefined ? updates.duration : (updates.durationSeconds !== undefined ? updates.durationSeconds : s.duration)
        return {
          ...s,
          ...updates,
          duration: nextDuration,
          durationSeconds: nextDuration,
        }
      })
      return {
        scenePlans: {
          ...state.scenePlans,
          [projectId]: updatedScenes,
        },
      }
    })
  },

  reorderScenes: (projectId, startIndex, endIndex) => {
    set((state) => {
      const scenes = state.scenePlans[projectId] || []
      const result = Array.from(scenes)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      // Recalculate orders
      const updated = result.map((s, idx) => ({ ...s, order: idx + 1 }))
      return {
        scenePlans: {
          ...state.scenePlans,
          [projectId]: updated,
        },
      }
    })
  },

  deleteScene: (projectId, sceneId) => {
    set((state) => {
      const scenes = state.scenePlans[projectId] || []
      const updatedScenes = scenes.filter((s) => s.id !== sceneId).map((s, idx) => ({ ...s, order: idx + 1 }))
      return {
        scenePlans: {
          ...state.scenePlans,
          [projectId]: updatedScenes,
        },
        projects: state.projects.map((p) => {
          if (p.id !== projectId) return p
          return {
            ...p,
            activeSceneIndex: Math.min(p.activeSceneIndex, updatedScenes.length - 1),
          }
        }),
      }
    })
  },

  approvePlan: (projectId) => {
    // Set status to generating
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, status: "generating" as const } : p
      ),
    }))

    // Simulate parallel scene generation stages
    const steps: Array<Array<"retrieving" | "generating" | "rendering" | "done">> = [
      ["retrieving", "retrieving", "retrieving"],
      ["generating", "retrieving", "retrieving"],
      ["rendering", "generating", "retrieving"],
      ["done", "rendering", "generating"],
      ["done", "done", "rendering"],
      ["done", "done", "done"],
    ]

    steps.forEach((stepStatuses, index) => {
      setTimeout(() => {
        set((state) => {
          const scenes = state.scenePlans[projectId] || []
          const updatedScenes = scenes.map((s, idx) => {
            const nextStatus = stepStatuses[idx] || "done"
            return {
              ...s,
              status: nextStatus,
              code: idx === 0 ? mockIntroAreaCode : idx === 1 ? mockLimitAreaCode : mockIntegralCode
            }
          })
          
          // Check if final step (all done) -> transition project status to assembling then done
          const isAllDone = stepStatuses.every((s) => s === "done")
          let newStatus: Project["status"] = "generating"
          
          if (isAllDone) {
            newStatus = "assembling"
            // Quickly assemble and transition to done
            setTimeout(() => {
              set((state2) => ({
                projects: state2.projects.map((p2) =>
                  p2.id === projectId ? { ...p2, status: "done" as const } : p2
                ),
              }))
            }, 1500)
          }

          return {
            scenePlans: {
              ...state.scenePlans,
              [projectId]: updatedScenes,
            },
            projects: state.projects.map((p) =>
              p.id === projectId ? { ...p, status: isAllDone ? "assembling" as const : "generating" as const } : p
            ),
          }
        })
      }, (index + 1) * 2000)
    })
  },
}))
