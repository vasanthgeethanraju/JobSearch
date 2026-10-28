import type { HNJob } from './types'

// Matched against the full post, since many headers don't name the role
export const ROLE_PRESETS = {
  // lookbehind skips hardware "RF front-end"
  'Frontend': /(?<!frequency |\brf )front[- ]?end|\breact\b|\bvue\b|angular|svelte|next\.?js|\bui engineer|web developer/i,
  'Full-stack': /full[- ]?stack/i,
  'Backend': /back[- ]?end|node\.?js|golang|django|\brails\b|\bjava\b|kotlin/i,
}

export type RolePreset = keyof typeof ROLE_PRESETS
export type WorkType = 'Any' | 'Remote' | 'Hybrid' | 'Onsite'
export type StatusView = 'New' | 'Applied' | 'All'
export type JobStatus = 'seen' | 'applied'
export type SortOrder = 'Newest' | 'Oldest' | 'Company A–Z'

export interface Filters {
  emailOnly: boolean
  presets: RolePreset[]
  keywords: string // comma-separated, e.g. "typescript, design systems"
  workType: WorkType
  view: StatusView
  sort: SortOrder
}

export const DEFAULT_FILTERS: Filters = {
  emailOnly: true,
  presets: ['Frontend', 'Full-stack'],
  keywords: '',
  workType: 'Any',
  view: 'New',
  sort: 'Newest',
}

// How many filters differ from "show everything" — for the Filters button badge
export function activeFilterCount(filters: Filters): number {
  return (filters.emailOnly ? 1 : 0) +
    filters.presets.length +
    (filters.keywords.trim() ? 1 : 0) +
    (filters.workType !== 'Any' ? 1 : 0)
}

export function matchedPresets(job: HNJob, presets: RolePreset[]): RolePreset[] {
  return presets.filter(p => ROLE_PRESETS[p].test(job.text))
}

function parseKeywords(keywords: string): string[] {
  return keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean)
}

// Presets and keywords are OR'ed together; with none selected every role matches
function matchesRole(job: HNJob, filters: Filters): boolean {
  const keywords = parseKeywords(filters.keywords)
  if (filters.presets.length === 0 && keywords.length === 0) return true
  const text = job.text.toLowerCase()
  return matchedPresets(job, filters.presets).length > 0 || keywords.some(k => text.includes(k))
}

function matchesWorkType(job: HNJob, workType: WorkType): boolean {
  if (workType === 'Remote') return job.remote
  if (workType === 'Hybrid') return job.hybrid
  if (workType === 'Onsite') return job.onsite
  return true
}

export function matchesView(status: JobStatus | undefined, view: StatusView): boolean {
  if (view === 'New') return !status
  if (view === 'Applied') return status === 'applied'
  return true
}

// Everything except the status view, so the view tabs can show their own counts
export function filterJobs(jobs: HNJob[], filters: Filters, search: string): HNJob[] {
  const query = search.trim().toLowerCase()
  return jobs.filter(job =>
    (!filters.emailOnly || job.emails.length > 0) &&
    matchesWorkType(job, filters.workType) &&
    matchesRole(job, filters) &&
    (!query || job.text.toLowerCase().includes(query))
  )
}

export function sortJobs(jobs: HNJob[], sort: SortOrder): HNJob[] {
  const sorted = [...jobs]
  if (sort === 'Newest') sorted.sort((a, b) => b.postedAt.localeCompare(a.postedAt))
  if (sort === 'Oldest') sorted.sort((a, b) => a.postedAt.localeCompare(b.postedAt))
  if (sort === 'Company A–Z') sorted.sort((a, b) => a.company.localeCompare(b.company, undefined, { sensitivity: 'base' }))
  return sorted
}
