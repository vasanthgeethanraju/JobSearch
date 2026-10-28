import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { fetchHiringThreads, fetchThreadJobs, parseThreadId } from './hn/hnApi'
import { ROLE_PRESETS, DEFAULT_FILTERS, filterJobs, matchedPresets, matchesView } from './hn/filters'
import type { Filters, JobStatus, RolePreset, StatusView, WorkType } from './hn/filters'
import { useStoredState } from './hn/useStoredState'
import type { HNJob, HNThread } from './hn/types'

const WORK_TYPES: WorkType[] = ['Any', 'Remote', 'Hybrid', 'Onsite']
const VIEWS: StatusView[] = ['New', 'Applied', 'All']

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full border font-medium transition-colors ${
        active
          ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
          : 'bg-white dark:bg-black text-black dark:text-white border-black dark:border-white'
      }`}
    >
      {children}
    </button>
  )
}

function HNJobs() {
  const [threads, setThreads] = useState<HNThread[]>([])
  const [threadInput, setThreadInput] = useState('')
  const [title, setTitle] = useState('')
  const [jobs, setJobs] = useState<HNJob[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useStoredState<Filters>('hnFilters', DEFAULT_FILTERS)
  const [statuses, setStatuses] = useStoredState<Record<number, JobStatus>>('hnJobStatus', {})

  // Same dark-mode rule as the main page (theme is set there and saved in localStorage)
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'system'
    const dark = theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  async function loadThread(threadId: number) {
    setLoading(true)
    setError('')
    try {
      const result = await fetchThreadJobs(threadId)
      setTitle(result.title)
      setJobs(result.jobs)
      setThreadInput(String(threadId))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }

  // On open, find the latest "Who is hiring?" thread and load it
  useEffect(() => {
    fetchHiringThreads()
      .then(found => {
        setThreads(found)
        if (found.length > 0) loadThread(found[0].id)
      })
      .catch(e => setError(e instanceof Error ? e.message : String(e)))
  }, [])

  function handleLoad() {
    const id = parseThreadId(threadInput)
    if (id) loadThread(id)
    else setError('Paste an HN thread URL or item id')
  }

  function updateFilters(patch: Partial<Filters>) {
    setFilters(prev => ({ ...prev, ...patch }))
  }

  function togglePreset(preset: RolePreset) {
    updateFilters({
      presets: filters.presets.includes(preset)
        ? filters.presets.filter(p => p !== preset)
        : [...filters.presets, preset],
    })
  }

  // Clicking the current status again clears it
  function toggleStatus(ids: number[], status: JobStatus) {
    setStatuses(prev => {
      const next = { ...prev }
      for (const id of ids) {
        if (ids.length === 1 && next[id] === status) delete next[id]
        else next[id] = status
      }
      return next
    })
  }

  const matching = filterJobs(jobs, filters, search)
  const shown = matching.filter(job => matchesView(statuses[job.id], filters.view))
  const viewCount = (view: StatusView) => matching.filter(job => matchesView(statuses[job.id], view)).length

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col items-center pt-20 px-4 pb-20 transition-colors">

      <a href="/" className="absolute top-6 left-6 text-sm text-gray-400 hover:text-black dark:hover:text-white">
        ← Job Search
      </a>

      <h1 className="text-5xl font-bold mb-12">HN Jobs</h1>

      <div className="flex flex-col gap-6 w-full max-w-3xl">

        <div className="flex gap-3">
          <select
            value={threads.some(t => String(t.id) === threadInput) ? threadInput : ''}
            onChange={e => e.target.value && loadThread(Number(e.target.value))}
            className="bg-white dark:bg-black border border-black dark:border-white text-black dark:text-white text-lg px-4 py-3 rounded-lg"
          >
            <option value="">Pick a month</option>
            {threads.map(t => (
              <option key={t.id} value={t.id}>{t.title.replace('Ask HN: Who is hiring? ', '')}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="…or paste a thread URL / id"
            value={threadInput}
            onChange={e => setThreadInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLoad()}
            className="flex-1 min-w-0 bg-white dark:bg-black border border-black dark:border-white text-black dark:text-white text-lg px-4 py-3 rounded-lg outline-none placeholder-gray-400"
          />

          <button
            onClick={handleLoad}
            className="bg-black dark:bg-white text-white dark:text-black text-lg font-bold px-6 rounded-lg"
          >
            Load
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <Pill active={filters.emailOnly} onClick={() => updateFilters({ emailOnly: !filters.emailOnly })}>
              Email only
            </Pill>
            <span className="w-px bg-gray-400 mx-1" />
            {(Object.keys(ROLE_PRESETS) as RolePreset[]).map(preset => (
              <Pill key={preset} active={filters.presets.includes(preset)} onClick={() => togglePreset(preset)}>
                {preset}
              </Pill>
            ))}
            <span className="w-px bg-gray-400 mx-1" />
            {WORK_TYPES.map(type => (
              <Pill key={type} active={filters.workType === type} onClick={() => updateFilters({ workType: type })}>
                {type}
              </Pill>
            ))}
          </div>

          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Extra role keywords, comma-separated"
              value={filters.keywords}
              onChange={e => updateFilters({ keywords: e.target.value })}
              className="flex-1 min-w-0 bg-white dark:bg-black border border-black dark:border-white text-black dark:text-white px-4 py-2 rounded-lg outline-none placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="Search posts"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 min-w-0 bg-white dark:bg-black border border-black dark:border-white text-black dark:text-white px-4 py-2 rounded-lg outline-none placeholder-gray-400"
            />
          </div>
        </div>

        {error && <p className="text-red-500">{error}</p>}

        {loading ? (
          <p className="text-gray-400">Loading…</p>
        ) : title && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-400 pb-3">
              <div className="flex gap-4">
                {VIEWS.map(view => (
                  <button
                    key={view}
                    onClick={() => updateFilters({ view })}
                    className={`text-lg ${filters.view === view ? 'font-bold underline underline-offset-8' : 'text-gray-400'}`}
                  >
                    {view} ({viewCount(view)})
                  </button>
                ))}
              </div>
              {filters.view === 'New' && shown.length > 0 && (
                <button
                  onClick={() => toggleStatus(shown.map(job => job.id), 'seen')}
                  className="text-sm text-gray-400 hover:text-black dark:hover:text-white"
                >
                  Mark all {shown.length} as seen
                </button>
              )}
            </div>
            <p className="text-sm text-gray-400">
              {title} — {matching.length} of {jobs.length} posts match your filters
            </p>
          </>
        )}

        {!loading && shown.map(job => (
          <div key={job.id} className="border border-black dark:border-white rounded-lg p-4 flex flex-col gap-2">
            <div className="flex justify-between gap-4">
              <h2 className="text-xl font-bold">{job.company}</h2>
              <a href={job.hnUrl} target="_blank" rel="noreferrer" className="text-sm text-gray-400 hover:underline shrink-0">
                {new Date(job.postedAt).toLocaleDateString()} · HN ↗
              </a>
            </div>

            {job.roles.length > 0 && <p className="text-lg">{job.roles.join(' · ')}</p>}
            <p className="text-sm text-gray-400">{job.header}</p>

            <div className="flex flex-wrap gap-2 text-sm">
              {matchedPresets(job, filters.presets).map(preset => (
                <span key={preset} className="px-2 py-0.5 rounded-full border border-black dark:border-white">{preset}</span>
              ))}
              {job.remote && <span className="px-2 py-0.5 rounded-full border border-gray-400">Remote</span>}
              {job.hybrid && <span className="px-2 py-0.5 rounded-full border border-gray-400">Hybrid</span>}
              {job.onsite && <span className="px-2 py-0.5 rounded-full border border-gray-400">Onsite</span>}
              {job.emails.map(email => (
                <a key={email} href={`mailto:${email}`} className="px-2 py-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black">
                  {email}
                </a>
              ))}
            </div>

            <div className="flex items-center justify-between gap-4">
              <details className="flex-1">
                <summary className="cursor-pointer text-sm text-gray-400">Full post</summary>
                <p className="mt-2 whitespace-pre-line text-sm">{job.text}</p>
              </details>
              <div className="flex gap-2 text-sm self-start">
                {(['seen', 'applied'] as JobStatus[]).map(status => (
                  <button
                    key={status}
                    onClick={() => toggleStatus([job.id], status)}
                    className={`px-3 py-1 rounded-full border capitalize ${
                      statuses[job.id] === status
                        ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                        : 'border-gray-400 text-gray-400'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}

        {!loading && title && shown.length === 0 && (
          <p className="text-gray-400">
            {filters.view === 'New' ? 'Nothing new — you’re all caught up.' : 'No posts here.'}
          </p>
        )}

      </div>
    </div>
  )
}

export default HNJobs
