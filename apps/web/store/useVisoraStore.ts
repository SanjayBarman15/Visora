import { create } from 'zustand'

export type RenderStatus = 'idle' | 'pending' | 'rendering' | 'completed' | 'failed'

export interface ElicitationRequirements {
  audience_level: string | null
  duration_target: number | null
  style_preference: string | null
  math_inclusion_flag: boolean | null
  required_concepts: string[]
  excluded_concepts: string[]
  voiceover_tone_preference: string | null
  is_complete: boolean
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export interface ScenePlan {
  title: string
  description: string
  duration_seconds: number
  key_visuals: string[]
}

export interface ForgeCode {
  code: string
  scene_class_name: string
}

interface VisoraState {
  // Project context — set once on project page load
  projectId: string | null
  sessionId: string | null

  // Chat & generation state
  messages: Message[]
  requirements: ElicitationRequirements
  scenePlan: ScenePlan | null
  forgeCode: ForgeCode | null
  isGenerating: boolean

  // Render state
  renderStatus: RenderStatus
  clipUrl: string | null
  checkpointId: string | null

  // Actions
  initProject: (projectId: string, sessionId: string) => Promise<void>
  resetStore: () => void
  sendMessage: (text: string) => Promise<void>
  generateScenePlan: () => Promise<void>
  generateCode: () => Promise<void>
  submitRender: () => Promise<void>
}

const defaultRequirements: ElicitationRequirements = {
  audience_level: null,
  duration_target: null,
  style_preference: null,
  math_inclusion_flag: null,
  required_concepts: [],
  excluded_concepts: [],
  voiceover_tone_preference: null,
  is_complete: false,
}

const defaultState = {
  projectId: null,
  sessionId: null,
  messages: [],
  requirements: defaultRequirements,
  scenePlan: null,
  forgeCode: null,
  isGenerating: false,
  renderStatus: 'idle' as RenderStatus,
  clipUrl: null,
  checkpointId: null,
}

export const useVisoraStore = create<VisoraState>((set, get) => ({
  ...defaultState,

  initProject: async (projectId: string, sessionId: string) => {
    set({ projectId, sessionId })

    try {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()

      // 1. Fetch scene details (scene_index=0)
      const { data: sceneData } = await supabase
        .from('scenes')
        .select('id, title, visual_description, approximate_duration_seconds, status')
        .eq('project_id', projectId)
        .eq('scene_index', 0)
        .maybeSingle()

      // 2. Fetch latest checkpoint
      const { data: checkpointData } = await supabase
        .from('scene_checkpoints')
        .select('id, generated_code, render_status, clip_url')
        .eq('project_id', projectId)
        .eq('scene_index', 0)
        .order('attempt_number', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (checkpointData) {
        set({
          checkpointId: checkpointData.id,
          renderStatus: checkpointData.render_status as RenderStatus,
          clipUrl: checkpointData.clip_url,
          forgeCode: checkpointData.generated_code ? {
            code: checkpointData.generated_code,
            scene_class_name: 'GeneratedScene',
          } : null,
        })
      } else {
        // Clear render details if no checkpoint exists
        set({
          checkpointId: null,
          renderStatus: 'idle',
          clipUrl: null,
          forgeCode: null,
        })
      }

      if (sceneData) {
        set({
          scenePlan: {
            title: sceneData.title,
            description: sceneData.visual_description || '',
            duration_seconds: sceneData.approximate_duration_seconds || 30,
            key_visuals: [],
          }
        })
      } else {
        set({ scenePlan: null })
      }
    } catch (err) {
      console.error('Error hydrating project state:', err)
    }
  },

  resetStore: () => {
    set(defaultState)
  },

  sendMessage: async (text: string) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    set((state) => ({
      messages: [...state.messages, userMessage],
      isGenerating: true,
    }))

    try {
      const currentMessages = get().messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))
      const currentRequirements = get().requirements

      const response = await fetch('http://localhost:8000/api/elicitation/turn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: currentMessages,
          requirements: currentRequirements,
          // Future: add project_id and session_id here when backend supports it
          // project_id: get().projectId,
          // session_id: get().sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch from backend')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response_text,
        timestamp: new Date().toISOString(),
      }

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        requirements: data.requirements,
      }))
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Something went wrong while connecting to the assistant. Please try again.',
        timestamp: new Date().toISOString(),
      }
      set((state) => ({
        messages: [...state.messages, errorMessage],
      }))
    } finally {
      set({ isGenerating: false })
    }
  },

  generateScenePlan: async () => {
    set({ isGenerating: true })

    try {
      const currentMessages = get().messages.map((m) => ({
        role: m.role,
        content: m.content,
      }))

      const response = await fetch('http://localhost:8000/api/planning/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: currentMessages,
          // Future: add project_id and session_id here when backend supports it
          // project_id: get().projectId,
          // session_id: get().sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate scene plan')
      }

      const scenePlan: ScenePlan = await response.json()

      set({ scenePlan })
    } catch (error) {
      console.error('Error generating scene plan:', error)
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Failed to generate the scene plan. Please try again.',
        timestamp: new Date().toISOString(),
      }
      set((state) => ({
        messages: [...state.messages, errorMessage],
      }))
    } finally {
      set({ isGenerating: false })
    }
  },

  generateCode: async () => {
    const currentPlan = get().scenePlan
    if (!currentPlan) return

    set({ isGenerating: true })

    try {
      const response = await fetch('http://localhost:8000/api/planning/forge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...currentPlan,
          // Future: add project_id and session_id here when backend supports it
          // project_id: get().projectId,
          // session_id: get().sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate code')
      }

      const forgeCode: ForgeCode = await response.json()
      set({ forgeCode })
    } catch (error) {
      console.error('Error generating code:', error)
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Failed to generate code. Please try again.',
        timestamp: new Date().toISOString(),
      }
      set((state) => ({
        messages: [...state.messages, errorMessage],
      }))
    } finally {
      set({ isGenerating: false })
    }
  },

  submitRender: async () => {
    const { forgeCode, scenePlan, projectId } = get()
    if (!forgeCode || !projectId) return

    set({ renderStatus: 'pending', clipUrl: null, checkpointId: null })

    try {
      const response = await fetch('http://localhost:8000/api/render/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          code: forgeCode.code,
          scene_class_name: forgeCode.scene_class_name,
          scene_title: scenePlan?.title ?? 'Scene',
          scene_description: scenePlan?.description ?? '',
          duration_seconds: scenePlan?.duration_seconds ?? 30,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit render job')
      }

      const data = await response.json()
      // Store the checkpointId — the useRenderStatus hook will subscribe to it
      set({ checkpointId: data.checkpoint_id, renderStatus: 'pending' })
    } catch (error) {
      console.error('Error submitting render:', error)
      set({ renderStatus: 'failed' })
    }
  },
}))
