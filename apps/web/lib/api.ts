import createClient from "openapi-fetch"
import type { paths } from "../types/api"

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export const api = createClient<paths>({
  baseUrl: apiUrl,
})
export type APIPaths = paths
export type RouteResponse<T extends keyof paths, M extends keyof paths[T]> = 
  paths[T][M] extends { responses: { 200: { content: { "application/json": infer R } } } } ? R : never
export type RouteBody<T extends keyof paths, M extends keyof paths[T]> = 
  paths[T][M] extends { requestBody: { content: { "application/json": infer B } } } ? B : never
