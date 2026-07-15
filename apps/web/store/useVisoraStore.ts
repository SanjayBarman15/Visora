import { create } from 'zustand'

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

interface VisoraState {
  messages: Message[]
  requirements: ElicitationRequirements
  scenePlan: ScenePlan | null
  isGenerating: boolean
  sendMessage: (text: string) => Promise<void>
  generateScenePlan: () => Promise<void>
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

export const useVisoraStore = create<VisoraState>((set, get) => ({
  messages: [],
  requirements: defaultRequirements,
  scenePlan: null,
  isGenerating: false,

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
}))
