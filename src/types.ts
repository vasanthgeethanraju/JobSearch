export interface Job {
  job_id: string
  job_title: string
  employer_name: string
  employer_logo: string | null
  job_apply_link: string
  job_city: string | null
  job_country: string | null
  job_posted_at_datetime_utc: string
  job_description: string
  job_employment_type: string
  job_is_remote: boolean
}
