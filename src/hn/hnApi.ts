import { parseJob } from './parseJob'
import type { AlgoliaComment } from './parseJob'
import type { HNJob, HNThread } from './types'

const ALGOLIA = 'https://hn.algolia.com/api/v1'

// The "whoishiring" bot also posts "Who wants to be hired?" and "Freelancer?" threads
export async function fetchHiringThreads(): Promise<HNThread[]> {
  const response = await fetch(`${ALGOLIA}/search_by_date?tags=story,author_whoishiring&hitsPerPage=30`)
  if (!response.ok) throw new Error(`HN search failed (${response.status})`)
  const data = await response.json()
  return data.hits
    .filter((h: { title: string }) => h.title.startsWith('Ask HN: Who is hiring?'))
    .map((h: { objectID: string; title: string; created_at: string }) => ({
      id: Number(h.objectID),
      title: h.title,
      createdAt: h.created_at,
    }))
}

// Accepts "49922569" or "https://news.ycombinator.com/item?id=49922569"
export function parseThreadId(input: string): number | null {
  const match = input.trim().match(/(?:id=)?(\d+)\s*$/)
  return match ? Number(match[1]) : null
}

// One request returns the whole comment tree; only top-level comments are job posts
export async function fetchThreadJobs(threadId: number): Promise<{ title: string; jobs: HNJob[] }> {
  const response = await fetch(`${ALGOLIA}/items/${threadId}`)
  if (!response.ok) throw new Error(`Couldn't load thread ${threadId} (${response.status})`)
  const data = await response.json()
  const jobs = (data.children as AlgoliaComment[])
    .map(parseJob)
    .filter((job): job is HNJob => job !== null)
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt))
  return { title: data.title, jobs }
}
