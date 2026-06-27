/**
 * Reddit source — real, daily pain/problem signals from public subreddits.
 *
 * No API key required. Reddit blocks its public JSON endpoint for generic
 * clients (HTTP 403), but the per-subreddit RSS feed still works with a
 * browser-like User-Agent — so we read that. `t=day` keeps it fresh daily.
 *
 * These communities are where operators describe real friction in their own
 * words — exactly the "unmet need" raw material NSE looks for.
 */
const Parser = require('rss-parser');
const logger = require('../../utils/logger');

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml, text/xml, */*',
  },
});

const SUBREDDITS = [
  'smallbusiness', 'startups', 'Entrepreneur', 'SaaS', 'devops', 'sysadmin',
  'msp', 'ecommerce', 'fintech', 'logistics', 'healthIT', 'ExperiencedDevs',
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchSub(sub) {
  const feed = await parser.parseURL(`https://www.reddit.com/r/${sub}/top/.rss?t=day`);
  return (feed.items || []).slice(0, 10).map((item) => {
    const body = stripHtml(item.contentSnippet || item.content || '').slice(0, 600);
    const title = stripHtml(item.title);
    return {
      title,
      summary: body || title,
      // pad short posts with the title so the relevance gate (needs >120 chars) is fair
      content: [title, body].filter(Boolean).join('. '),
      url: item.link,
      domain: 'reddit.com',
      sourceName: `r/${sub}`,
      sourceType: 'reddit',
      publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
      author: item.author,
      region: undefined,
    };
  }).filter(a => a.title && a.url);
}

/**
 * Fetch normalized posts across subreddits. Sequential with light spacing to
 * stay under Reddit's rate limit; failing subs are skipped (best-effort).
 */
async function fetchReddit() {
  const articles = [];
  let ok = 0;
  for (let i = 0; i < SUBREDDITS.length; i++) {
    try {
      const items = await fetchSub(SUBREDDITS[i]);
      articles.push(...items);
      ok++;
    } catch (err) {
      logger.warn(`Reddit r/${SUBREDDITS[i]} failed: ${err.statusCode || err.message}`);
    }
    if (i < SUBREDDITS.length - 1) await sleep(1500); // Reddit rate-limits bursts
  }
  logger.info(`Reddit: ${articles.length} posts from ${ok}/${SUBREDDITS.length} subreddits`);
  return articles;
}

module.exports = { fetchReddit, SUBREDDITS };
