import type { HNJob } from './types'

export interface AlgoliaComment {
  id: number
  author: string | null
  created_at: string
  text: string | null
}

const ROLE_WORDS = /engineer|developer|designer|scientist|manager|architect|lead|head of|director|analyst|researcher|sre|devops|intern|recruiter|specialist|founding|cto|vp\b/i
const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)*\.[a-z]{2,}/gi

// "jobs [at] acme [dot] com", "jobs (at) acme.com", "jobs at acme dot com" -> "jobs@acme.com"
export function deobfuscate(text: string): string {
  return text
    .replace(/\s*[[({<]\s*(?:at|@)\s*[\])}>]\s*/gi, '@')
    .replace(/\s*[[({<]\s*(?:dot|\.)\s*[\])}>]\s*/gi, '.')
    .replace(
      /\b([\w.+-]+)\s+at\s+([\w-]+(?:\s+dot\s+[\w-]+)+)\b/gi,
      (match, user: string, domain: string) => {
        const parts = domain.split(/\s+dot\s+/i)
        // only treat as an email if it ends in something TLD-shaped
        return /^[a-z]{2,6}$/i.test(parts[parts.length - 1]) ? `${user}@${parts.join('.')}` : match
      }
    )
}

export function extractEmails(text: string): string[] {
  const found = deobfuscate(text).match(EMAIL) ?? []
  return [...new Set(found.map(e => e.replace(/\.+$/, '').toLowerCase()))]
}

const CAREER_LINK = /career|jobs|apply|hiring|greenhouse|lever\.co|ashbyhq|workable|bamboohr|recruitee|wellfound|ycombinator\.com\/companies|grnh\.se/i

// Bare domains like "meetyogi.com" (HN only auto-links text starting with http); skips email domains
const BARE_DOMAIN = /(?<![@\w.-])((?:[a-z0-9-]+\.)+(?:com|io|ai|co|dev|app|xyz|org|net|so|tech|us|eu|de|uk))\b/i

// Prefer links that look like a job page, else the first link, else a domain named in the header
function pickCareerLink(links: string[], header: string): string | null {
  const external = links.filter(l => !l.includes('news.ycombinator.com'))
  const headerDomain = header.match(BARE_DOMAIN)?.[1]
  return external.find(l => CAREER_LINK.test(l)) ?? external[0] ??
    (headerDomain ? `https://${headerDomain.toLowerCase()}` : null)
}

// People sometimes post the "Who wants to be hired?" template here by mistake
function isCandidatePost(header: string, text: string): boolean {
  return /^location\s*:/i.test(header) || /willing to relocate\s*:/i.test(text)
}

export function parseJob(comment: AlgoliaComment): HNJob | null {
  if (!comment.text) return null // deleted / dead

  // HN separates paragraphs with a bare <p>
  const doc = new DOMParser().parseFromString(comment.text.replace(/<p>/gi, '\n\n'), 'text/html')
  const text = doc.body.textContent?.trim() ?? ''
  const header = text.split('\n')[0].trim()
  if (isCandidatePost(header, text)) return null
  const headerParts = header.split('|').map(p => p.trim()).filter(Boolean)

  // HN truncates long link text, so read the real URL from href
  const hrefs = [...doc.querySelectorAll('a[href]')].map(a => a.getAttribute('href')!)
  const links = [...new Set(hrefs.filter(h => h.startsWith('http')))]
  const hrefEmails = hrefs
    .filter(h => /^mailto:/i.test(h))
    .map(h => h.replace(/^mailto:/i, '').split('?')[0].toLowerCase())

  return {
    id: comment.id,
    author: comment.author ?? '',
    postedAt: comment.created_at,
    hnUrl: `https://news.ycombinator.com/item?id=${comment.id}`,
    header,
    headerParts,
    company: headerParts[0] ?? '',
    roles: headerParts.slice(1).filter(p => ROLE_WORDS.test(p)),
    remote: /\bremote\b/i.test(header),
    onsite: /\bon-?site\b|\bin[- ]office\b/i.test(header),
    hybrid: /\bhybrid\b/i.test(header),
    emails: [...new Set([...hrefEmails, ...extractEmails(text)])],
    links,
    careerLink: pickCareerLink(links, header),
    text,
  }
}
