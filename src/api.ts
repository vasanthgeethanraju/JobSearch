import type { Job } from './types'

export async function fetchJobs(searchTerm: string): Promise<Job[]> {
  const url = `https://jsearch.p.rapidapi.com/search-v2?query=${encodeURIComponent(searchTerm)}&page=1&num_pages=1`

  const response = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': import.meta.env.VITE_RAPIDAPI_KEY,
      'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
    }
  })

  const data = await response.json()
  console.log("api response", data);
  return data.data.jobs ?? []
}
