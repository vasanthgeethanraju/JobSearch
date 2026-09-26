import { useState, useEffect } from 'react'
import type { Job } from './types'
import { fetchJobs } from './api'

type Theme = 'light' | 'dark' | 'system'

const PLATFORMS = [
  { label: 'Greenhouse', site: 'boards.greenhouse.io' },
  { label: 'Lever', site: 'jobs.lever.co' },
  { label: 'Ashby', site: 'jobs.ashbyhq.com' },
  { label: 'Remote Rocketship', site: 'remoterocketship.com' },
  { label: 'Remotive', site: 'remotive.com' },
  { label: 'We Work Remotely', site: 'weworkremotely.com' },
]

const TIME_MAP: Record<string, string> = {
  'Past Hour': 'qdr:h',
  'Past 24 Hours': 'qdr:d',
  'Past Week': 'qdr:w',
  'Past Month': 'qdr:m',
}

function App() {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme) || 'system'
  )
  const [jobTitle, setJobTitle] = useState('')
  const [time, setTime] = useState('Past 24 Hours')
  const [selected, setSelected] = useState<string[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else if (theme === 'light') {
      root.classList.remove('dark')
    } else {
      window.matchMedia('(prefers-color-scheme: dark)').matches
        ? root.classList.add('dark')
        : root.classList.remove('dark')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  function togglePlatform(site: string) {
    setSelected(prev =>
      prev.includes(site) ? prev.filter(s => s !== site) : [...prev, site]
    )
  }

  async function handleStart() {
    if (!jobTitle) return
    setLoading(true)
    setJobs([])
    const results = await fetchJobs(jobTitle)
    setJobs(results)
    setLoading(false)
  }

  return (
    <div className="relative min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col items-center pt-20 px-4 transition-colors">

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 flex gap-2">
        {(['light', 'dark', 'system'] as Theme[]).map(t => (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={`px-3 py-1 rounded-full text-sm border capitalize transition-colors ${
              theme === t
                ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                : 'border-gray-400 text-gray-400'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <h1 className="text-5xl font-bold mb-12">Geethan's Job Search</h1>

      <div className="flex flex-col gap-6 w-full max-w-xl">

        <input
          type="text"
          placeholder="Job title (e.g. Front End)"
          value={jobTitle}
          onChange={e => setJobTitle(e.target.value)}
          className="bg-white dark:bg-black border border-black dark:border-white text-black dark:text-white text-xl px-4 py-3 rounded-lg outline-none placeholder-gray-400"
        />

        <select
          value={time}
          onChange={e => setTime(e.target.value)}
          className="bg-white dark:bg-black border border-black dark:border-white text-black dark:text-white text-xl px-4 py-3 rounded-lg"
        >
          {Object.keys(TIME_MAP).map(t => (
            <option key={t}>{t}</option>
          ))}
        </select>

        <div className="flex flex-wrap gap-3">
          {PLATFORMS.map(platform => (
            <label
              key={platform.site}
              className={`cursor-pointer px-5 py-2 rounded-full border text-lg font-medium transition-colors ${
                selected.includes(platform.site)
                  ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white'
                  : 'bg-white dark:bg-black text-black dark:text-white border-black dark:border-white'
              }`}
            >
              <input
                type="checkbox"
                checked={selected.includes(platform.site)}
                onChange={() => togglePlatform(platform.site)}
                className="hidden"
              />
              {platform.label}
            </label>
          ))}
        </div>

        <button
          onClick={handleStart}
          disabled={loading}
          className="bg-black dark:bg-white text-white dark:text-black text-xl font-bold py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Start'}
        </button>

      </div>

      {/* Job Results */}
      {jobs.length > 0 && (
        <div className="w-full max-w-xl mt-10 flex flex-col gap-4">
          <h2 className="text-2xl font-bold">{jobs.length} Jobs Found</h2>
          {/* {jobs.map(job => (
            <div
              key={job.id}
              className="border border-black dark:border-white rounded-lg px-5 py-4"
            >
              <p className="text-lg font-semibold">{job.title}</p>
              <p className="text-gray-500">{job.company_name}</p>
              <p className="text-gray-400 text-sm">{job.candidate_required_location}</p>
            </div>
          ))} */}
          {jobs.map(job => (
            <div
              key={job.job_id}
              className="border border-black dark:border-white rounded-lg px-5 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            >
              <p className="text-lg font-semibold">{job.job_title}</p>
              <p className="text-gray-500">{job.employer_name}</p>
              <p className="text-gray-400 text-sm">
                {job.job_is_remote ? 'Remote' : `${job.job_city ?? ''}, ${job.job_country ?? ''}`}
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

export default App
