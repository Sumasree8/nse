/**
 * RSS source — pulls real, day-to-day news from public RSS feeds.
 * No API key required. Each feed is tagged with a base credibility score
 * (see verification.js for the authoritative domain table).
 */
const Parser = require('rss-parser');
const logger = require('../../utils/logger');

const parser = new Parser({
  timeout: 20000,
  headers: {
    // A browser-like UA avoids 403s from feeds that block obvious bots.
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36 NSE-SignalBot/1.0',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
});

// Curated, reputable feeds spanning business / tech / industry verticals.
// Mix of general business news and vertical trade press so signals are diverse.
const FEEDS = [
  // General tech / business
  { url: 'https://feeds.arstechnica.com/arstechnica/index', name: 'Ars Technica', region: 'US' },
  { url: 'https://www.theverge.com/rss/index.xml', name: 'The Verge', region: 'US' },
  { url: 'https://techcrunch.com/feed/', name: 'TechCrunch', region: 'US' },
  { url: 'https://feeds.bbci.co.uk/news/business/rss.xml', name: 'BBC Business', region: 'GB' },
  { url: 'https://feeds.bbci.co.uk/news/technology/rss.xml', name: 'BBC Technology', region: 'GB' },
  { url: 'https://www.cnbc.com/id/10001147/device/rss/rss.html', name: 'CNBC Technology', region: 'US' },
  { url: 'https://hnrss.org/frontpage', name: 'Hacker News', region: 'US' },
  { url: 'https://www.wired.com/feed/rss', name: 'Wired', region: 'US' },
  { url: 'https://www.cnbc.com/id/10000664/device/rss/rss.html', name: 'CNBC Business', region: 'US' },
  // Broad newswires (free, commercial-friendly)
  { url: 'https://www.theguardian.com/uk/business/rss', name: 'The Guardian Business', region: 'GB' },
  { url: 'https://feeds.npr.org/1006/rss.xml', name: 'NPR Business', region: 'US' },
  { url: 'https://www.aljazeera.com/xml/rss/all.xml', name: 'Al Jazeera', region: 'QA' },
  { url: 'https://feeds.feedburner.com/venturebeat/SZYF', name: 'VentureBeat', region: 'US' },
  { url: 'https://feeds.feedburner.com/TechCrunch/startups', name: 'TechCrunch Startups', region: 'US' },
  // Vertical trade press — pain-rich, industry-specific
  { url: 'https://www.fiercehealthcare.com/rss/xml', name: 'Fierce Healthcare', region: 'US' },
  { url: 'https://www.supplychaindive.com/feeds/news/', name: 'Supply Chain Dive', region: 'US' },
  { url: 'https://www.constructiondive.com/feeds/news/', name: 'Construction Dive', region: 'US' },
  { url: 'https://www.cybersecuritydive.com/feeds/news/', name: 'Cybersecurity Dive', region: 'US' },
  { url: 'https://www.healthcaredive.com/feeds/news/', name: 'Healthcare Dive', region: 'US' },
  { url: 'https://www.retaildive.com/feeds/news/', name: 'Retail Dive', region: 'US' },
  { url: 'https://www.bankingdive.com/feeds/news/', name: 'Banking Dive', region: 'US' },
  { url: 'https://www.hrdive.com/feeds/news/', name: 'HR Dive', region: 'US' },
  { url: 'https://www.utilitydive.com/feeds/news/', name: 'Utility Dive', region: 'US' },
];

function domainFromUrl(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return undefined; }
}

// Some feeds emit <title> not as a plain string but as a nested object/array —
// e.g. CDATA or embedded HTML like <a>…</a> becomes { a: [ { _: 'text' } ] }.
// Recursively collect any text we can find so .trim() never blows up.
function toTitle(t) {
  if (t == null) return '';
  if (typeof t === 'string') return t.trim();
  if (Array.isArray(t)) return t.map(toTitle).join(' ').trim();
  if (typeof t === 'object') {
    const direct = t._ ?? t['#'] ?? t['#text'];
    if (typeof direct === 'string') return direct.trim();
    return Object.values(t).map(toTitle).join(' ').replace(/\s+/g, ' ').trim();
  }
  return '';
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetch and normalize articles from all configured RSS feeds.
 * Returns an array of normalized articles (best-effort; failing feeds are skipped).
 */
async function fetchRss({ perFeed = 12 } = {}) {
  const results = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      return (parsed.items || []).slice(0, perFeed).map((item) => {
        const url = item.link || item.guid;
        const summary = stripHtml(item.contentSnippet || item.summary || item.content || '');
        const content = stripHtml(item['content:encoded'] || item.content || item.summary || summary);
        return {
          title: toTitle(item.title),
          summary,
          content: content || summary,
          url,
          domain: domainFromUrl(url) || domainFromUrl(feed.url),
          sourceName: feed.name,
          sourceType: feed.name === 'Hacker News' ? 'rss' : 'news',
          publishedAt: item.isoDate ? new Date(item.isoDate) : (item.pubDate ? new Date(item.pubDate) : new Date()),
          author: item.creator || item.author,
          region: feed.region,
        };
      });
    })
  );

  const articles = [];
  let ok = 0;
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      ok++;
      for (const a of r.value) if (a.title && a.url) articles.push(a);
    } else {
      logger.warn(`RSS feed failed (${FEEDS[i].name}): ${r.reason?.message || r.reason}`);
    }
  });
  logger.info(`RSS: ${articles.length} articles from ${ok}/${FEEDS.length} feeds`);
  return articles;
}

module.exports = { fetchRss, FEEDS };
