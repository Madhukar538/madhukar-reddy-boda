/**
 * Hybrid Search Engine (BM25 + Dense Vector kNN + Reciprocal Rank Fusion)
 * Modeled after Boda Madhukar Reddy's production Solr 9 + .NET architecture.
 */

export interface CatalogItem {
  id: string;
  sku: string;
  title: string;
  brand: string;
  category: string;
  price: number;
  description: string;
  tags: string[];
  /** Semantic concept vector coordinates for cosine similarity (dense representation) */
  vector: number[];
}

export interface ParsedQuery {
  raw: string;
  cleanText: string;
  extractedSku?: string;
  priceFilter?: { max?: number; min?: number; approximate?: number };
  detectedIntent?: string;
  synonymsApplied: string[];
  typoCorrection?: { original: string; corrected: string };
}

export interface BM25Result {
  item: CatalogItem;
  rank: number;
  bm25Score: number;
  matchedTokens: string[];
  tokenScores: { token: string; tf: number; idf: number }[];
}

export interface VectorResult {
  item: CatalogItem;
  rank: number;
  cosineSimilarity: number;
  semanticConcepts: string[];
}

export interface RRFResult {
  item: CatalogItem;
  fusedRank: number;
  rrfScore: number;
  source: 'both' | 'bm25-only' | 'vector-only';
  bm25Rank?: number;
  vectorRank?: number;
  bm25Contribution: number;
  vectorContribution: number;
  formulaString: string;
  rankShift: number; // Positive = gained positions due to fusion, negative = dropped
}

export interface HybridSearchResult {
  query: ParsedQuery;
  bm25Results: BM25Result[];
  vectorResults: VectorResult[];
  fusedResults: RRFResult[];
  kConstant: number;
  bm25Weight: number;
  vectorWeight: number;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Semantic Concept Dimensions (12 dimensions for dense space simulation)
   0: Formal / Dress / Gala / Evening
   1: Rugged / Dive / Waterproof / Marine
   2: Sport / Fitness / Chronograph / Active
   3: Minimalist / Slim / Modern / Clean
   4: Vintage / Heritage / Automatic / Mechanical
   5: Luxury / Gold / Premium / Precision
   6: Casual / Everyday / Textile / Leather
   7: Tech / Smart / Digital / Sensor
   8: Steel / Metal / Bracelet / Industrial
   9: Solar / Quartz / Battery / Low-maintenance
   10: Pilot / Aviation / Large dial / Field
   11: Unisex / Compact / Refined
───────────────────────────────────────────────────────────────────────────── */

export const CATALOG: CatalogItem[] = [
  {
    id: 'prod-01',
    sku: 'CR5432',
    title: 'Apex Automatic Stainless Steel Chronometer',
    brand: 'Apex',
    category: 'Watches',
    price: 13995,
    description: 'Exposed skeleton dial with automatic self-winding movement. Brushed stainless steel case and link bracelet, 50m water resistance.',
    tags: ['automatic', 'skeleton', 'chronometer', 'steel', 'mechanical'],
    vector: [0.35, 0.2, 0.45, 0.1, 0.9, 0.75, 0.25, 0.05, 0.95, 0.1, 0.3, 0.2],
  },
  {
    id: 'prod-02',
    sku: 'CR5901',
    title: 'Minimalist Ultra-Slim Dress Watch in Onyx Black',
    brand: 'Aura',
    category: 'Watches',
    price: 7495,
    description: 'Sleek 6mm ultra-thin black PVD case with genuine Italian black leather band. Refined two-hand quartz movement for formal evening attire.',
    tags: ['dress', 'evening', 'minimalist', 'black', 'leather', 'slim'],
    vector: [0.95, 0.05, 0.1, 0.95, 0.3, 0.6, 0.4, 0.0, 0.2, 0.8, 0.1, 0.7],
  },
  {
    id: 'prod-03',
    sku: 'SP8820',
    title: 'HydroSport Pro 200M Waterproof Diver Chronograph',
    brand: 'Speedo',
    category: 'Sport Watches',
    price: 9999,
    description: 'ISO-compliant 200-meter diving watch with unidirectional ceramic rotating bezel, screw-down crown, and luminous Super-LumiNova markers.',
    tags: ['diver', 'waterproof', '200m', 'sport', 'chronograph', 'swim'],
    vector: [0.05, 0.98, 0.85, 0.1, 0.2, 0.3, 0.2, 0.1, 0.7, 0.85, 0.3, 0.1],
  },
  {
    id: 'prod-04',
    sku: 'CR4835',
    title: 'Heritage Chronograph with Vintage Brown Leather Strap',
    brand: 'Chronos',
    category: 'Watches',
    price: 11495,
    description: 'Roman numeral markers with classic navy blue sunray dial. Handcrafted brown saddle leather strap with contrast cream stitching.',
    tags: ['chronograph', 'leather', 'brown', 'vintage', 'roman-numerals'],
    vector: [0.55, 0.15, 0.6, 0.3, 0.85, 0.5, 0.9, 0.0, 0.4, 0.7, 0.4, 0.3],
  },
  {
    id: 'prod-05',
    sku: 'MY3301',
    title: 'Regal Heritage Gold-Plated Kurta Watch',
    brand: 'Manyavar',
    category: 'Accessories',
    price: 6499,
    description: 'Intricate champagne dial with gold guilloché pattern and burgundy silk-finish leather band. Designed for weddings and festive evening ceremonies.',
    tags: ['gold', 'festive', 'evening', 'wedding', 'traditional', 'dress'],
    vector: [0.9, 0.0, 0.05, 0.2, 0.7, 0.95, 0.5, 0.0, 0.6, 0.7, 0.05, 0.4],
  },
  {
    id: 'prod-06',
    sku: 'JK1040',
    title: 'Sport Pulse Active Silicone Digital Watch',
    brand: 'Jockey',
    category: 'Sport Watches',
    price: 2999,
    description: 'Lightweight sweat-resistant silicone sports watch with stopwatch lap timer, dual timezone, backlight, and 100m water resistance.',
    tags: ['sport', 'silicone', 'digital', 'waterproof', 'running', 'cheap'],
    vector: [0.0, 0.65, 0.95, 0.5, 0.0, 0.05, 0.6, 0.7, 0.1, 0.9, 0.2, 0.5],
  },
  {
    id: 'prod-07',
    sku: 'CR6012',
    title: 'Solstice Chronograph Amber Dial Stainless Steel',
    brand: 'Solstice',
    category: 'Watches',
    price: 12995,
    description: 'Warm amber sunray dial with polished silver-tone case and solid stainless steel oyster bracelet. Built-in stopwatch chronograph sub-dials.',
    tags: ['chronograph', 'steel', 'amber', 'silver', 'stainless'],
    vector: [0.45, 0.3, 0.6, 0.5, 0.5, 0.65, 0.5, 0.1, 0.92, 0.75, 0.4, 0.3],
  },
  {
    id: 'prod-08',
    sku: 'LX7700',
    title: 'Urban Comfort Everyday Canvas Field Watch',
    brand: 'LuxCozi',
    category: 'Accessories',
    price: 1899,
    description: 'Durable military-spec olive green canvas strap, matte black dial, high-contrast numerals, and scratch-resistant mineral crystal glass.',
    tags: ['field', 'canvas', 'everyday', 'casual', 'military', 'budget'],
    vector: [0.1, 0.4, 0.5, 0.4, 0.6, 0.1, 0.95, 0.0, 0.5, 0.9, 0.85, 0.4],
  },
  {
    id: 'prod-09',
    sku: 'CR5870',
    title: 'Vanguard Titanium Solar-Powered Dress Chronometer',
    brand: 'Vanguard',
    category: 'Watches',
    price: 18495,
    description: 'Hypoallergenic aerospace-grade titanium case. Light-harvesting solar dial never requires a battery change. Sapphire crystal lens.',
    tags: ['titanium', 'solar', 'chronometer', 'sapphire', 'premium'],
    vector: [0.75, 0.45, 0.5, 0.6, 0.4, 0.85, 0.4, 0.6, 0.85, 0.98, 0.6, 0.4],
  },
  {
    id: 'prod-10',
    sku: 'CR4991',
    title: 'Classic Roman Dial Rose Gold & Navy Watch',
    brand: 'Aura',
    category: 'Watches',
    price: 12495,
    description: 'Rich navy blue dial encased in brushed rose gold plating with matching dark blue leather strap. Timeless cocktail and evening wear accessory.',
    tags: ['rose-gold', 'navy', 'leather', 'evening', 'dress', 'cocktail'],
    vector: [0.92, 0.1, 0.2, 0.4, 0.65, 0.88, 0.7, 0.05, 0.5, 0.7, 0.2, 0.6],
  },
  {
    id: 'prod-11',
    sku: 'SP9100',
    title: 'AquaMaster Titanium 300M Deep Sea Dive Watch',
    brand: 'Speedo',
    category: 'Sport Watches',
    price: 15999,
    description: 'Heavy-duty 300-meter diver engineered with helium escape valve, titanium bracelet, and high-visibility neon orange minute hand.',
    tags: ['diver', '300m', 'waterproof', 'titanium', 'deep-sea'],
    vector: [0.05, 0.99, 0.75, 0.05, 0.3, 0.45, 0.2, 0.1, 0.88, 0.8, 0.4, 0.1],
  },
  {
    id: 'prod-12',
    sku: 'CR5380',
    title: 'Minimalist Three-Hand Slim Leather Watch',
    brand: 'Aura',
    category: 'Watches',
    price: 6995,
    description: 'Understated clean white face with subtle hairline indices and rich tan leather band. The definitive quiet luxury daily companion.',
    tags: ['minimalist', 'slim', 'white', 'tan', 'leather', 'clean'],
    vector: [0.8, 0.1, 0.2, 0.98, 0.4, 0.5, 0.85, 0.0, 0.3, 0.8, 0.2, 0.85],
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Query Parsing & Deterministic NLU (Live Vocabulary + Synonyms)
───────────────────────────────────────────────────────────────────────────── */

const SYNONYMS: Record<string, string[]> = {
  evening: ['dress', 'formal', 'cocktail', 'black', 'wedding', 'festive'],
  gala: ['dress', 'formal', 'luxury', 'gold'],
  waterproof: ['diver', 'water resistance', 'swim', '200m', '300m', 'deep sea'],
  swimming: ['diver', 'waterproof', 'sport'],
  cheap: ['budget', 'affordable', 'everyday'],
  formal: ['dress', 'evening', 'minimalist'],
  skeleton: ['automatic', 'mechanical', 'exposed'],
  gym: ['sport', 'active', 'silicone', 'digital'],
};

const TYPOS: Record<string, string> = {
  chrons: 'chronos',
  chronswatch: 'chronos',
  cronometer: 'chronometer',
  cronograph: 'chronograph',
  lether: 'leather',
  waterprof: 'waterproof',
  minmalist: 'minimalist',
  automtic: 'automatic',
};

export function parseQuery(queryText: string): ParsedQuery {
  let clean = queryText.trim().toLowerCase();
  let extractedSku: string | undefined;
  let typoCorrection: { original: string; corrected: string } | undefined;
  const synonymsApplied: string[] = [];

  // 1. SKU extraction (e.g. CR5432, SP8820, JK1040)
  const skuMatch = clean.match(/\b([a-z]{2}\d{4})\b/i);
  if (skuMatch) {
    extractedSku = skuMatch[1].toUpperCase();
  }

  // 2. Price phrase extraction (e.g. under 12k, under 5000, between 6k and 15k, ~12000)
  let priceFilter: { max?: number; min?: number; approximate?: number } | undefined;
  const underMatch = clean.match(/(?:under|below|less than)\s+(\d+(?:,\d+)?|\d+k)/i);
  if (underMatch) {
    const rawVal = underMatch[1].replace(/,/g, '');
    const num = rawVal.endsWith('k') ? parseFloat(rawVal) * 1000 : parseFloat(rawVal);
    priceFilter = { max: num };
  }

  const betweenMatch = clean.match(/(?:between)\s+(\d+k?)\s+(?:and|to)\s+(\d+k?)/i);
  if (betweenMatch) {
    const parseP = (s: string) => (s.endsWith('k') ? parseFloat(s) * 1000 : parseFloat(s));
    priceFilter = { min: parseP(betweenMatch[1]), max: parseP(betweenMatch[2]) };
  }

  const approxMatch = clean.match(/~(\d+k?)/i);
  if (approxMatch) {
    const rawVal = approxMatch[1];
    const target = rawVal.endsWith('k') ? parseFloat(rawVal) * 1000 : parseFloat(rawVal);
    priceFilter = { approximate: target, min: target * 0.85, max: target * 1.15 };
  }

  // 3. Typo handling
  const tokens = clean.split(/\s+/);
  const fixedTokens = tokens.map((token) => {
    if (TYPOS[token]) {
      typoCorrection = { original: token, corrected: TYPOS[token] };
      return TYPOS[token];
    }
    return token;
  });
  clean = fixedTokens.join(' ');

  // 4. Synonym expansion tracking
  for (const [key, synList] of Object.entries(SYNONYMS)) {
    if (clean.includes(key)) {
      synonymsApplied.push(`${key} → [${synList.slice(0, 3).join(', ')}]`);
    }
  }

  let detectedIntent: string | undefined;
  if (extractedSku) detectedIntent = 'Exact SKU lookup';
  else if (priceFilter) detectedIntent = 'Budget-constrained search';
  else if (clean.includes('evening') || clean.includes('dress') || clean.includes('wedding')) detectedIntent = 'Formal / Dress intent';
  else if (clean.includes('water') || clean.includes('diver') || clean.includes('swim')) detectedIntent = 'Aquatic / Marine intent';
  else if (clean.includes('sport') || clean.includes('gym')) detectedIntent = 'Athletic / Fitness intent';

  return {
    raw: queryText,
    cleanText: clean,
    extractedSku,
    priceFilter,
    detectedIntent,
    synonymsApplied,
    typoCorrection,
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   Okapi BM25 Keyword Search Engine
───────────────────────────────────────────────────────────────────────────── */

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9#+.]+/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

export function computeBM25(
  catalog: CatalogItem[],
  query: ParsedQuery,
  k1 = 1.2,
  b = 0.75
): BM25Result[] {
  const queryTokens = Array.from(new Set(tokenize(query.cleanText)));
  if (queryTokens.length === 0 && !query.extractedSku) return [];

  // Compute corpus document lengths
  const docTokensMap = new Map<string, string[]>();
  let totalDocLength = 0;

  for (const item of catalog) {
    const fullText = `${item.title} ${item.sku} ${item.brand} ${item.category} ${item.tags.join(' ')} ${item.description}`;
    const tokens = tokenize(fullText);
    docTokensMap.set(item.id, tokens);
    totalDocLength += tokens.length;
  }

  const avgdl = totalDocLength / catalog.length;
  const N = catalog.length;

  // Compute Document Frequency (DF) and IDF for query tokens
  const idfMap = new Map<string, number>();
  for (const token of queryTokens) {
    let df = 0;
    for (const [, docTokens] of docTokensMap) {
      if (docTokens.includes(token)) df += 1;
    }
    // Standard Lucene / Solr Okapi BM25 IDF with smoothing
    const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
    idfMap.set(token, Math.max(idf, 0.1));
  }

  const results: { item: CatalogItem; score: number; matched: string[]; tokenScores: { token: string; tf: number; idf: number }[] }[] = [];

  for (const item of catalog) {
    const tokens = docTokensMap.get(item.id)!;
    const docLen = tokens.length;
    let score = 0;
    const matched: string[] = [];
    const tokenScores: { token: string; tf: number; idf: number }[] = [];

    // Exact SKU match override (Solr edismax boost)
    if (query.extractedSku && item.sku.toUpperCase() === query.extractedSku) {
      score += 15.0;
      matched.push(`SKU:${item.sku}`);
      tokenScores.push({ token: `SKU:${item.sku}`, tf: 1, idf: 15.0 });
    }

    for (const token of queryTokens) {
      const tf = tokens.filter((t) => t === token || t.startsWith(token)).length;
      if (tf > 0) {
        matched.push(token);
        const idf = idfMap.get(token) ?? 0.5;
        // Okapi BM25 formula
        const numerator = tf * (k1 + 1);
        const denominator = tf + k1 * (1 - b + b * (docLen / avgdl));
        const tokenContrib = idf * (numerator / denominator);
        score += tokenContrib;
        tokenScores.push({ token, tf, idf: Math.round(idf * 100) / 100 });
      }
    }

    // Apply price filter bonus/penalty if requested
    if (query.priceFilter) {
      if (query.priceFilter.max && item.price > query.priceFilter.max) {
        score *= 0.1; // penalized out of range
      } else if (query.priceFilter.min && item.price < query.priceFilter.min) {
        score *= 0.1;
      }
    }

    if (score > 0) {
      results.push({ item, score, matched, tokenScores });
    }
  }

  results.sort((a, b) => b.score - a.score);

  return results.map((r, idx) => ({
    item: r.item,
    rank: idx + 1,
    bm25Score: Math.round(r.score * 1000) / 1000,
    matchedTokens: r.matched,
    tokenScores: r.tokenScores,
  }));
}

/* ─────────────────────────────────────────────────────────────────────────────
   Dense Vector (kNN) Semantic Search Engine
───────────────────────────────────────────────────────────────────────────── */

/** Map query terms to 12-dimensional concept vector space */
export function embedQueryText(queryText: string): { vector: number[]; concepts: string[] } {
  const text = queryText.toLowerCase();
  const v = new Array(12).fill(0);
  const concepts: string[] = [];

  // Dim 0: Formal / Dress
  if (text.match(/formal|dress|evening|suit|gala|black tie|wedding|cocktail/)) {
    v[0] += 0.95;
    concepts.push('Formal/Evening');
  }
  // Dim 1: Rugged / Dive / Waterproof
  if (text.match(/waterproof|diver|diving|swim|aqua|marine|200m|300m|ocean|deep/)) {
    v[1] += 0.95;
    concepts.push('Aquatic/Diver');
  }
  // Dim 2: Sport / Fitness / Chronograph
  if (text.match(/sport|fitness|active|running|gym|lap|stopwatch|pulse|chronograph/)) {
    v[2] += 0.85;
    concepts.push('Sport/Chronograph');
  }
  // Dim 3: Minimalist / Clean
  if (text.match(/minimal|slim|thin|clean|simple|understated|bare/)) {
    v[3] += 0.95;
    concepts.push('Minimalist/Slim');
  }
  // Dim 4: Vintage / Automatic
  if (text.match(/automatic|mechanical|vintage|heritage|skeleton|movement|wind/)) {
    v[4] += 0.9;
    concepts.push('Automatic/Vintage');
  }
  // Dim 5: Luxury / Gold
  if (text.match(/luxury|gold|rose gold|premium|champagne|expensive|high-end/)) {
    v[5] += 0.85;
    concepts.push('Luxury/Precious');
  }
  // Dim 6: Casual / Leather
  if (text.match(/leather|brown|tan|casual|everyday|strap|band/)) {
    v[6] += 0.85;
    concepts.push('Leather/Casual');
  }
  // Dim 7: Tech / Smart / Digital
  if (text.match(/smart|digital|sensor|battery|silicone|lcd/)) {
    v[7] += 0.9;
    concepts.push('Digital/Smart');
  }
  // Dim 8: Steel / Metal
  if (text.match(/steel|stainless|metal|silver|bracelet|iron|titanium/)) {
    v[8] += 0.9;
    concepts.push('Steel/Titanium');
  }
  // Dim 9: Solar / Quartz
  if (text.match(/solar|quartz|accurate|light|eco/)) {
    v[9] += 0.85;
    concepts.push('Solar/Quartz');
  }
  // Dim 10: Field / Military
  if (text.match(/military|field|army|canvas|tactical|pilot|aviation/)) {
    v[10] += 0.85;
    concepts.push('Field/Military');
  }
  // Dim 11: Unisex / Compact
  if (text.match(/unisex|small|compact|refined|white dial/)) {
    v[11] += 0.8;
    concepts.push('Refined/Compact');
  }

  // If no specific concepts matched, set a general baseline
  if (concepts.length === 0) {
    v.fill(0.3);
    concepts.push('General Catalog');
  }

  // L2-normalize
  const norm = Math.sqrt(v.reduce((sum, val) => sum + val * val, 0)) || 1;
  const normalized = v.map((val) => val / norm);

  return { vector: normalized, concepts };
}

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function computeVectorKnn(catalog: CatalogItem[], query: ParsedQuery): VectorResult[] {
  const { vector: queryVector, concepts } = embedQueryText(query.cleanText);

  const scored = catalog.map((item) => {
    // Normalise item vector
    const norm = Math.sqrt(item.vector.reduce((s, v) => s + v * v, 0)) || 1;
    const normItemVector = item.vector.map((v) => v / norm);
    const sim = cosineSimilarity(queryVector, normItemVector);

    // Identify which semantic concepts this item hit strongly
    const activeConcepts: string[] = [];
    if (item.vector[0] > 0.6) activeConcepts.push('Evening/Dress');
    if (item.vector[1] > 0.6) activeConcepts.push('Diver/Waterproof');
    if (item.vector[2] > 0.6) activeConcepts.push('Sport/Chrono');
    if (item.vector[3] > 0.6) activeConcepts.push('Minimalist');
    if (item.vector[4] > 0.6) activeConcepts.push('Mechanical');
    if (item.vector[8] > 0.6) activeConcepts.push('Steel');
    if (item.vector[6] > 0.6) activeConcepts.push('Leather');

    return {
      item,
      cosineSimilarity: Math.round(sim * 1000) / 1000,
      semanticConcepts: activeConcepts.slice(0, 3),
    };
  });

  scored.sort((a, b) => b.cosineSimilarity - a.cosineSimilarity);

  return scored.map((r, idx) => ({
    item: r.item,
    rank: idx + 1,
    cosineSimilarity: r.cosineSimilarity,
    semanticConcepts: r.semanticConcepts.length > 0 ? r.semanticConcepts : concepts,
  }));
}

/* ─────────────────────────────────────────────────────────────────────────────
   Reciprocal Rank Fusion (RRF)
   Score(doc) = Σ ( w_r / (K + rank_r(doc)) )
───────────────────────────────────────────────────────────────────────────── */

export function computeRRF(
  bm25Results: BM25Result[],
  vectorResults: VectorResult[],
  kConstant = 60,
  bm25Weight = 0.5,
  vectorWeight = 0.5
): RRFResult[] {
  const itemMap = new Map<
    string,
    {
      item: CatalogItem;
      bm25Rank?: number;
      vectorRank?: number;
      bm25Contrib: number;
      vectorContrib: number;
      rrfScore: number;
      formula: string;
      source: 'both' | 'bm25-only' | 'vector-only';
    }
  >();

  // 1. Process BM25 retriever results
  for (const r of bm25Results) {
    const contrib = bm25Weight / (kConstant + r.rank);
    itemMap.set(r.item.id, {
      item: r.item,
      bm25Rank: r.rank,
      vectorRank: undefined,
      bm25Contrib: contrib,
      vectorContrib: 0,
      rrfScore: contrib,
      formula: `${bm25Weight.toFixed(2)}/(${kConstant} + ${r.rank})`,
      source: 'bm25-only',
    });
  }

  // 2. Process Vector retriever results & fuse
  for (const r of vectorResults) {
    const contrib = vectorWeight / (kConstant + r.rank);
    const existing = itemMap.get(r.item.id);

    if (existing) {
      existing.vectorRank = r.rank;
      existing.vectorContrib = contrib;
      existing.rrfScore += contrib;
      existing.source = 'both';
      existing.formula = `${existing.formula} + ${vectorWeight.toFixed(2)}/(${kConstant} + ${r.rank})`;
    } else {
      itemMap.set(r.item.id, {
        item: r.item,
        bm25Rank: undefined,
        vectorRank: r.rank,
        bm25Contrib: 0,
        vectorContrib: contrib,
        rrfScore: contrib,
        formula: `${vectorWeight.toFixed(2)}/(${kConstant} + ${r.rank})`,
        source: 'vector-only',
      });
    }
  }

  const fused = Array.from(itemMap.values());
  fused.sort((a, b) => b.rrfScore - a.rrfScore);

  return fused.map((f, idx) => {
    const fusedRank = idx + 1;
    // Calculate rank shift relative to best single retriever
    const bestOriginalRank = Math.min(f.bm25Rank ?? 999, f.vectorRank ?? 999);
    const rankShift = bestOriginalRank === 999 ? 0 : bestOriginalRank - fusedRank;

    return {
      item: f.item,
      fusedRank,
      rrfScore: Math.round(f.rrfScore * 100000) / 100000,
      source: f.source,
      bm25Rank: f.bm25Rank,
      vectorRank: f.vectorRank,
      bm25Contribution: Math.round(f.bm25Contrib * 100000) / 100000,
      vectorContribution: Math.round(f.vectorContrib * 100000) / 100000,
      formulaString: f.formula,
      rankShift,
    };
  });
}

/** Execute full hybrid search pipeline */
export function runHybridSearch(
  queryText: string,
  kConstant = 60,
  bm25Weight = 0.5,
  vectorWeight = 0.5,
  topK = 8
): HybridSearchResult {
  const query = parseQuery(queryText);
  const allBm25 = computeBM25(CATALOG, query);
  const allVector = computeVectorKnn(CATALOG, query);

  const topBm25 = allBm25.slice(0, topK);
  const topVector = allVector.slice(0, topK);

  const fused = computeRRF(topBm25, topVector, kConstant, bm25Weight, vectorWeight);

  return {
    query,
    bm25Results: topBm25,
    vectorResults: topVector,
    fusedResults: fused.slice(0, topK),
    kConstant,
    bm25Weight,
    vectorWeight,
  };
}

