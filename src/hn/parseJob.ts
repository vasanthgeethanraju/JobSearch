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

export function parseJob(comment: AlgoliaComment): HNJob | null {
  if (!comment.text) return null // deleted / dead

  // HN separates paragraphs with a bare <p>
  const doc = new DOMParser().parseFromString(comment.text.replace(/<p>/gi, '\n\n'), 'text/html')
  const text = doc.body.textContent?.trim() ?? ''
  const header = text.split('\n')[0].trim()
  const headerParts = header.split('|').map(p => p.trim()).filter(Boolean)

  // HN truncates long link text, so read the real URL from href
  const hrefs = [...doc.querySelectorAll('a[href]')].map(a => a.getAttribute('href')!)
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
    links: [...new Set(hrefs.filter(h => h.startsWith('http')))],
    text,
  }
}
