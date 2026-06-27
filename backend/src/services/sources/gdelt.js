/**
 * GDELT source — pulls real global news via the GDELT 2.0 Doc API.
 * Free, no API key. We run a small set of problem/market-oriented queries so
 * the firehose stays relevant to startup-signal detection (and stays low-noise).
 *
 * Docs: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
 */
const axios = require('axios');
const logger = require('../../utils/logger');

const ENDPOINT = 'https://api.gdeltproject.org/api/v2/doc/doc';

// Problem-oriented queries — bias the firehose toward pain/market-gap stories.
const QUERIES = [
  '(startup OR "market gap" OR "unmet need") (problem OR crisis OR shortage)',
  '("small business" OR SMB) (struggle OR cost OR inefficient OR fraud)',
  '(healthcare OR fintech OR logistics OR "supply chain") (disruption OR shortage OR broken)',
  '("artificial intelligence" OR automation) (risk OR regulation OR adoption)',
];

function domainFromUrl(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); }
  catch { return undefined; }
}

// GDELT timestamps look like 20240115T101500Z
function parseGdeltDate(s) {
  if (!s || s.length < 15) return new Date();
  const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runQuery(query, maxRecords, attempt = 0) {
  let res;
  try {
    res = await axios.get(ENDPOINT, {
      params: {
        query: `${query} sourcelang:english`,
        mode: 'ArtList',
        maxrecords: maxRecords,
        timespan: '3d',
        sort: 'DateDesc',
        format: 'json',
      },
      timeout: 20000,
      headers: { 'User-Agent': 'NSE-SignalBot/1.0' },
    });
  } catch (err) {
    // GDELT rate-limits aggressively (HTTP 429). Back off and retry a few times.
    if ((err.response?.status === 429 || err.code === 'ECONNRESET') && attempt < 3) {
      await sleep(6000 * (attempt + 1));
      return runQuery(query, maxRecords, attempt + 1);
    }
    throw err;
  }
  // GDELT sometimes returns an HTML/text error body instead of JSON
  const data = typeof res.data === 'string' ? {} : res.data;
  const articles = data?.articles || [];
  return articles.map((a) => ({
    title: (a.title || '').trim(),
    summary: '', // GDELT ArtList does not return body text
    content: (a.title || '').trim(),
    url: a.url,
    domain: a.domain || domainFromUrl(a.url),
    sourceName: a.domain || domainFromUrl(a.url),
    sourceType: 'news',
    publishedAt: parseGdeltDate(a.seendate),
    author: undefined,
    region: a.sourcecountry,
  }));
}

/**
 * Fetch normalized articles from GDELT across the curated queries.
 */
async function fetchGdelt({ maxPerQuery = 25 } = {}) {
  // GDELT rate-limits, so queries MUST run sequentially with spacing.
  const seen = new Set();
  const articles = [];
  for (let i = 0; i < QUERIES.length; i++) {
    try {
      const items = await runQuery(QUERIES[i], maxPerQuery);
      for (const a of items) {
        if (a.title && a.url && !seen.has(a.url)) { seen.add(a.url); articles.push(a); }
      }
    } catch (err) {
      logger.warn(`GDELT query failed: ${err.message}`);
    }
    if (i < QUERIES.length - 1) await sleep(5000); // stay under rate limit
  }
  logger.info(`GDELT: ${articles.length} unique articles`);
  return articles;
}

module.exports = { fetchGdelt };
