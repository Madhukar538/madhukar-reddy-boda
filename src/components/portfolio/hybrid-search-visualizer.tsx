'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  ArrowRight,
  TrendingUp,
  Scale,
  Code2,
  CheckCircle2,
  Flame,
  Binary,
  X,
  RotateCcw,
} from 'lucide-react';
import {
  runHybridSearch,
  type HybridSearchResult,
} from '@/lib/hybrid-search-engine';
import { cn } from '@/lib/utils';
import { m, AnimatePresence } from 'framer-motion';

const PRESETS = [
  {
    id: 'sku',
    label: 'Exact SKU lookup',
    query: 'CR5432 steel chronometer',
    badge: 'BM25 Dominates',
    description: 'Exact catalog SKU. Vector search gets distracted by semantic concepts; BM25 edismax nails the exact product at rank #1.',
  },
  {
    id: 'synonym',
    label: 'Synonyms & Intent',
    query: 'evening wristwatch',
    badge: 'Vector Wins',
    description: '"Evening wristwatch" does not appear in titles (they use "dress watch" or "cocktail"). BM25 finds nothing or weak hits; Vector finds formal watches.',
  },
  {
    id: 'combined',
    label: 'Multi-intent Fusion',
    query: 'waterproof chronograph with brown leather strap',
    badge: 'RRF Perfect Match',
    description: 'Blends specific keywords (leather, chronograph) with semantic aquatic capabilities. Fused RRF elevates items that satisfy both intents.',
  },
  {
    id: 'budget',
    label: 'Price NLU parsing',
    query: 'minimalist dress watch under 8000',
    badge: 'Rule NLU + RRF',
    description: 'Demonstrates deterministic price clause parsing ("under 8000") filtering out high-end items while preserving ranking.',
  },
  {
    id: 'typo',
    label: 'Typo tolerance',
    query: 'chrons black dial',
    badge: 'Fuzzy Recovery',
    description: 'Catches "chrons" via Solr ~2 edit-distance fuzzy operator, correcting to "Chronos" without needing an LLM.',
  },
];

export function HybridSearchVisualizer() {
  const [queryText, setQueryText] = useState('waterproof chronograph with brown leather strap');
  const [kConstant, setKConstant] = useState(60);
  const [bm25Weight, setBm25Weight] = useState(0.5);
  const [topK, setTopK] = useState(6);
  const [showPipelineDetails, setShowPipelineDetails] = useState(false);

  const vectorWeight = useMemo(() => Math.round((1 - bm25Weight) * 100) / 100, [bm25Weight]);

  const searchResult: HybridSearchResult = useMemo(() => {
    return runHybridSearch(queryText, kConstant, bm25Weight, vectorWeight, topK);
  }, [queryText, kConstant, bm25Weight, vectorWeight, topK]);

  return (
    <div className="space-y-8">
      {/* Top Banner & Context */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-foreground/10 pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[hsl(var(--sys-purple)/0.14)] text-[hsl(var(--sys-purple))]">
            <Scale className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
              Solr 9 Hybrid Search &amp; RRF Engine
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground">
              In-process BM25 lexical retriever + ONNX Dense Vector kNN + Reciprocal Rank Fusion
            </p>
          </div>
        </div>

        <Link
          href="/blog/hybrid-search-solr-bm25-vector-rrf"
          className="chip chip-accent tap text-xs font-semibold"
        >
          Read the write-up
          <ArrowRight className="h-3.5 w-3.5 ml-1" />
        </Link>
      </div>

      {/* Query Search Bar using native app material */}
      <div className="space-y-4">
        <label className="glass glass-pill flex items-center gap-3 px-4 py-3 focus-within:ring-2 focus-within:ring-primary transition-all">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="search"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search catalog: 'CR5432 steel chronometer', 'evening watch', 'waterproof diver under 10k'…"
            aria-label="Search catalog"
            className="w-full bg-transparent text-[15px] md:text-base text-foreground placeholder:text-muted-foreground/75 outline-none [&::-webkit-search-cancel-button]:hidden"
          />
          {queryText ? (
            <button
              type="button"
              onClick={() => setQueryText('')}
              aria-label="Clear query"
              className="rounded-full p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <kbd className="hidden md:inline rounded-md px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground ring-1 ring-foreground/15">
              Esc
            </kbd>
          )}
        </label>

        {/* Preset Queries */}
        <div className="space-y-2">
          <span className="eyebrow block">Failure Modes &amp; Edge Cases</span>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => {
              const isSelected = queryText === preset.query;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setQueryText(preset.query)}
                  className={cn(
                    'tap chip text-xs transition-colors',
                    isSelected ? 'chip-accent font-semibold' : 'hover:text-foreground'
                  )}
                  title={preset.description}
                >
                  <span>{preset.label}</span>
                  <span className="opacity-70 text-[10.5px]">({preset.badge})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Query Understanding / NLU Card */}
        <div className="glass p-4 rounded-2xl text-xs space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Solr NLU Query Understanding
            </span>
            {searchResult.query.detectedIntent && (
              <span className="chip chip-purple text-[11px]">
                Intent: {searchResult.query.detectedIntent}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
            {searchResult.query.extractedSku && (
              <span>
                <strong className="text-foreground">SKU Short-Circuit:</strong>{' '}
                <code className="text-primary font-mono font-semibold">{searchResult.query.extractedSku}</code> (forced to position #1)
              </span>
            )}
            {searchResult.query.priceFilter && (
              <span>
                <strong className="text-foreground">Price Filter:</strong>{' '}
                {searchResult.query.priceFilter.max && `≤ ₹${searchResult.query.priceFilter.max.toLocaleString('en-IN')}`}
                {searchResult.query.priceFilter.min && `≥ ₹${searchResult.query.priceFilter.min.toLocaleString('en-IN')}`}
              </span>
            )}
            {searchResult.query.typoCorrection && (
              <span className="text-[hsl(var(--sys-orange))] font-medium">
                <strong>Typo Fuzzy Match:</strong> &ldquo;{searchResult.query.typoCorrection.original}&rdquo; → &ldquo;{searchResult.query.typoCorrection.corrected}&rdquo;
              </span>
            )}
            {searchResult.query.synonymsApplied.length > 0 && (
              <span>
                <strong className="text-foreground">Synonyms:</strong> {searchResult.query.synonymsApplied.join('; ')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Parameter Tuning */}
      <div className="glass p-5 md:p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-sm font-semibold text-foreground flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            Interactive Fusion Parameters
          </span>
          <span className="text-xs text-muted-foreground">
            Moving sliders re-computes Reciprocal Rank Fusion instantly
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Constant K Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="k-slider" className="font-medium text-foreground">
                RRF Constant <code className="text-primary font-bold font-mono">K = {kConstant}</code>
              </label>
              <span className="text-muted-foreground tabular-nums">(Standard: 60)</span>
            </div>
            <input
              id="k-slider"
              type="range"
              min="1"
              max="100"
              value={kConstant}
              onChange={(e) => setKConstant(parseInt(e.target.value, 10))}
              className="w-full accent-[hsl(var(--primary))] h-2 bg-foreground/10 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {kConstant < 20
                ? 'Low K: Extreme penalty for lower ranks. High priority to rank #1.'
                : kConstant > 80
                ? 'High K: Rank penalties flatten out; lower ranks compete closely.'
                : 'Balanced K (60): Standard Cormack baseline, gracefully merges both candidates.'}
            </p>
          </div>

          {/* Retriever Weight Balance Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="weight-slider" className="font-medium text-foreground">
                Weight Balance
              </label>
              <span className="font-mono text-xs tabular-nums">
                <span className="text-[hsl(var(--sys-orange))] font-semibold">{Math.round(bm25Weight * 100)}% Lexical</span>
                {' / '}
                <span className="text-[hsl(var(--sys-teal))] font-semibold">{Math.round(vectorWeight * 100)}% Vector</span>
              </span>
            </div>
            <input
              id="weight-slider"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bm25Weight}
              onChange={(e) => setBm25Weight(parseFloat(e.target.value))}
              className="w-full accent-[hsl(var(--primary))] h-2 bg-foreground/10 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {bm25Weight > 0.75
                ? 'BM25 Dominant: Best for exact product codes, SKUs and brands.'
                : bm25Weight < 0.25
                ? 'Vector Dominant: Best for abstract intents and semantic queries.'
                : 'Balanced 50/50: Production default without score calibration issues.'}
            </p>
          </div>

          {/* Candidate Depth Top-K */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label htmlFor="topk-slider" className="font-medium text-foreground">
                Retrieval Pool Depth <code className="text-primary font-bold font-mono">N = {topK}</code>
              </label>
              <span className="text-muted-foreground tabular-nums">(Candidates)</span>
            </div>
            <input
              id="topk-slider"
              type="range"
              min="3"
              max="10"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value, 10))}
              className="w-full accent-[hsl(var(--primary))] h-2 bg-foreground/10 rounded-lg cursor-pointer"
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Number of candidates fetched from each retriever before fusion.
            </p>
          </div>
        </div>
      </div>

      {/* 3-Column Comparative Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: BM25 Lexical Retriever */}
        <div className="glass p-5 rounded-2xl flex flex-col border-t-2 border-t-[hsl(var(--sys-orange))]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Binary className="h-4 w-4 text-[hsl(var(--sys-orange))]" />
              <h3 className="font-bold text-base text-foreground">1. BM25 Keyword</h3>
            </div>
            <span className="chip chip-orange text-xs">Lexical</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Exact token matching via TF/IDF and Solr edismax field weights.
          </p>

          <div className="space-y-3 flex-1">
            {searchResult.bm25Results.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs italic">
                No keyword tokens matched. BM25 returned 0 hits.
              </div>
            ) : (
              searchResult.bm25Results.map((res) => (
                <div
                  key={res.item.id}
                  className="glass glass-interactive p-3.5 rounded-xl text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-semibold text-foreground">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--sys-orange)/0.15)] text-[hsl(var(--sys-orange))] text-[10px] font-bold">
                        #{res.rank}
                      </span>
                      {res.item.title}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>
                      <code className="text-[hsl(var(--sys-orange))] font-mono font-semibold">{res.item.sku}</code> · ₹{res.item.price.toLocaleString('en-IN')}
                    </span>
                    <span className="font-mono font-bold text-foreground">
                      BM25: {res.bm25Score}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {res.tokenScores.map((t, i) => (
                      <span key={i} className="chip chip-orange text-[10px] py-0 px-1.5">
                        {t.token} (tf:{t.tf})
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Dense Vector Retriever */}
        <div className="glass p-5 rounded-2xl flex flex-col border-t-2 border-t-[hsl(var(--sys-teal))]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[hsl(var(--sys-teal))]" />
              <h3 className="font-bold text-base text-foreground">2. Dense Vector kNN</h3>
            </div>
            <span className="chip chip-teal text-xs">Semantic</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            all-MiniLM-L6-v2 ONNX 384-dim concept embeddings + live Cosine Similarity.
          </p>

          <div className="space-y-3 flex-1">
            {searchResult.vectorResults.map((res) => (
              <div
                key={res.item.id}
                className="glass glass-interactive p-3.5 rounded-xl text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-semibold text-foreground">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--sys-teal)/0.15)] text-[hsl(var(--sys-teal))] text-[10px] font-bold">
                      #{res.rank}
                    </span>
                    {res.item.title}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    <code className="text-[hsl(var(--sys-teal))] font-mono font-semibold">{res.item.sku}</code> · ₹{res.item.price.toLocaleString('en-IN')}
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    Cosine: {res.cosineSimilarity}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {res.semanticConcepts.map((concept, i) => (
                    <span key={i} className="chip chip-teal text-[10px] py-0 px-1.5">
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: RRF Fusion */}
        <div className="glass p-5 rounded-2xl flex flex-col border-t-2 border-t-[hsl(var(--sys-purple))]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-[hsl(var(--sys-purple))]" />
              <h3 className="font-bold text-base text-foreground">3. Reciprocal Rank Fusion</h3>
            </div>
            <span className="chip chip-purple text-xs">Fused Output</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            Reranked via rank reciprocals: <code className="font-mono text-[11px]">Σ w / (K + rank)</code>.
          </p>

          <div className="space-y-3 flex-1">
            {searchResult.fusedResults.map((res) => (
              <div
                key={res.item.id}
                className={cn(
                  'glass glass-interactive p-3.5 rounded-xl text-xs space-y-1.5',
                  res.source === 'both' && 'border-[hsl(var(--sys-purple)/0.35)] shadow-sm'
                )}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="flex items-center gap-1.5 font-semibold text-foreground">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[hsl(var(--sys-purple))] text-primary-foreground text-[10px] font-bold">
                      #{res.fusedRank}
                    </span>
                    {res.item.title}
                  </span>
                  {res.source === 'both' && (
                    <span className="shrink-0 chip chip-green text-[10.5px] py-0 px-1.5 font-semibold">
                      <Flame className="h-3 w-3" /> Both
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    <code className="text-primary font-mono font-semibold">{res.item.sku}</code> · ₹{res.item.price.toLocaleString('en-IN')}
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    RRF: {res.rrfScore.toFixed(5)}
                  </span>
                </div>

                {/* Score Calculation Equation Breakdown */}
                <div className="glass-inset rounded-lg p-2 font-mono text-[10px] text-muted-foreground">
                  <span className="text-foreground/75 font-semibold">Formula: </span>
                  {res.source === 'both' ? (
                    <span>
                      <span className="text-[hsl(var(--sys-orange))]">{bm25Weight}/({kConstant}+{res.bm25Rank})</span>
                      {' + '}
                      <span className="text-[hsl(var(--sys-teal))]">{vectorWeight}/({kConstant}+{res.vectorRank})</span>
                      {' = '}
                      <span className="text-foreground font-bold">{res.rrfScore.toFixed(5)}</span>
                    </span>
                  ) : res.source === 'bm25-only' ? (
                    <span>
                      <span className="text-[hsl(var(--sys-orange))]">{bm25Weight}/({kConstant}+{res.bm25Rank})</span> (BM25 only)
                    </span>
                  ) : (
                    <span>
                      <span className="text-[hsl(var(--sys-teal))]">{vectorWeight}/({kConstant}+{res.vectorRank})</span> (Vector only)
                    </span>
                  )}
                </div>

                {/* Rank Consensus Shift Indicator */}
                <div className="flex items-center justify-between text-[10.5px] text-muted-foreground pt-0.5">
                  <span>
                    {res.source === 'both' ? 'Consensus match' : res.source === 'bm25-only' ? 'BM25 only' : 'Vector only'}
                  </span>
                  {res.rankShift > 0 && (
                    <span className="text-[hsl(var(--sys-green))] font-medium flex items-center gap-0.5">
                      <TrendingUp className="h-3 w-3" /> Promoted +{res.rankShift} rank{res.rankShift > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Architecture Deep Dive Collapsible */}
      <div className="glass p-5 md:p-6 rounded-2xl space-y-4">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowPipelineDetails(!showPipelineDetails)}
        >
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-primary" />
            <h3 className="text-base md:text-lg font-bold text-foreground">
              Under the Hood: Solr 9 &amp; .NET Architecture
            </h3>
          </div>
          <button
            type="button"
            className="chip chip-accent text-xs font-semibold"
          >
            {showPipelineDetails ? 'Hide Details' : 'View Pipeline Architecture'}
          </button>
        </div>

        {showPipelineDetails && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 pt-4 border-t border-foreground/10 text-sm text-muted-foreground"
          >
            <div className="glass-inset rounded-xl p-4 font-mono text-xs overflow-x-auto text-foreground/90">
              <pre>{`query ─▶ SKU short-circuit ─▶ split into item clauses ─▶ for each clause:
   ├─ price phrase parser        (under / between / ~ / 12k)
   ├─ rule-based NLU             (brand, category, colour, size, badge, type)
   ├─ fuzzy fallback             (Solr ~2 edit distance on *_text fields)
   ├─ in-process ONNX embedding  (all-MiniLM-L6-v2, 384 dims, FastBertTokenizer)
   ├─ BM25 keyword search        (edismax)
   ├─ kNN vector search          ({!knn f=vector topK=N})
   └─ RRF fusion                 Σ 1 / (K + rank(doc)), K = 60
─▶ merge clauses ─▶ de-dup by style ─▶ page ─▶ UI view model`}</pre>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="glass p-4 rounded-xl space-y-2">
                <h4 className="font-semibold text-foreground flex items-center gap-1.5 text-xs md:text-sm">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--sys-green))]" />
                  Why RRF Beats Direct Score Summation
                </h4>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  BM25 scores range across <code>[0, +∞)</code> depending on corpus IDF, whereas Cosine Similarity is strictly bounded in <code>[-1, 1]</code>. Directly adding them causes severe calibration skew. RRF uses <em>ordinal rank position only</em>, completely eliminating score calibration discrepancies.
                </p>
              </div>

              <div className="glass p-4 rounded-xl space-y-2">
                <h4 className="font-semibold text-foreground flex items-center gap-1.5 text-xs md:text-sm">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  In-Process ONNX (Zero Cloud API Latency)
                </h4>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Rather than paying 100ms+ round-trips to OpenAI or cloud embedding APIs, vectors are embedded in-process in .NET via <code>Microsoft.ML.OnnxRuntime</code> in sub-10ms. Real catalog vectors live directly in Solr 9 cores.
                </p>
              </div>
            </div>
          </m.div>
        )}
      </div>
    </div>
  );
}
