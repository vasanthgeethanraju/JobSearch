export interface HNThread {
  id: number
  title: string
  createdAt: string
}

export interface HNJob {
  id: number
  author: string
  postedAt: string
  hnUrl: string
  header: string          // first line, e.g. "Acme | Senior Frontend Engineer | NYC | REMOTE"
  headerParts: string[]   // header split on "|"
  company: string
  roles: string[]         // header parts that look like job titles
  remote: boolean
  onsite: boolean
  hybrid: boolean
  emails: string[]
  links: string[]
  careerLink: string | null // best guess at the apply / careers page
  text: string            // full post as plain text
}
