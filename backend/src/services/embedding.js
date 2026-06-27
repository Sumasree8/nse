/**
 * Text embeddings.
 *
 * - With an OpenAI key: real `text-embedding-3-small` vectors (1536-dim).
 * - Without a key: a deterministic local embedding using the hashing trick
 *   over token n-grams, L2-normalized. Unlike the previous `Math.random()`
 *   vectors, these are STABLE and SEMANTICALLY MEANINGFUL enough to power
 *   near-duplicate detection, novelty scoring, and lightweight clustering.
 */
const crypto = require('crypto');
const logger = require('../utils/logger');

const LOCAL_DIM = 384;

function hashToken(token) {
  // 32-bit unsigned hash, deterministic across runs/processes.
  const h = crypto.createHash('md5').update(token).digest();
  return h.readUInt32BE(0);
}

function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

/**
 * Deterministic hashing-trick embedding. Token + bigram features are hashed
 * into a fixed-dimension vector with signed accumulation, then L2-normalized.
 */
function localEmbedding(text, dim = LOCAL_DIM) {
  const vec = new Array(dim).fill(0);
  const tokens = tokenize(text);
  const features = [...tokens];
  for (let i = 0; i < tokens.length - 1; i++) features.push(tokens[i] + '_' + tokens[i + 1]);
  for (const f of features) {
    const h = hashToken(f);
    const idx = h % dim;
    const sign = (h & 1) ? 1 : -1;
    vec[idx] += sign;
  }
  // L2 normalize
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm) || 1;
  return vec.map(v => v / norm);
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom ? dot / denom : 0;
}

let openaiClient;
function getOpenAI() {
  if (!openaiClient) {
    const OpenAI = require('openai');
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

function hasOpenAI() {
  return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'demo-key';
}

/**
 * Returns an embedding for `text`. Uses OpenAI when configured, otherwise the
 * deterministic local embedding. Never returns random noise.
 */
async function embed(text) {
  if (!hasOpenAI()) return localEmbedding(text);
  try {
    const res = await getOpenAI().embeddings.create({
      model: 'text-embedding-3-small',
      input: String(text || '').slice(0, 8000),
    });
    return res.data[0].embedding;
  } catch (err) {
    logger.warn(`OpenAI embedding failed, using local embedding: ${err.message}`);
    return localEmbedding(text);
  }
}

module.exports = { embed, localEmbedding, cosineSimilarity, hasOpenAI, LOCAL_DIM };
