/**
 * Benchmark charts shown above a post, keyed by the post's slug (like diagrams.ts).
 * Each chart compares a few machines on one measure; values are the measured or
 * published numbers quoted in the post.
 */
export type BenchmarkBar = { label: string; value: number; display: string; note?: string };
export type BenchmarkChart = {
  title: string;
  caption: string;
  /** 'lower' when a smaller value is better (time); 'higher' otherwise. */
  better: 'lower' | 'higher';
  bars: BenchmarkBar[];
};
export type Benchmark = { title: string; subtitle: string; charts: BenchmarkChart[]; footnote?: string };

export const benchmarks: Record<string, Benchmark> = {
  'rtx-5090-vs-dgx-spark-local-llm-inference': {
    title: 'RTX 5090 vs DGX Spark',
    subtitle: 'Gemma 4 26B on Ollama 0.31.1, same request on both machines',
    charts: [
      {
        title: 'Response time',
        caption: 'Seconds for the same agent request, end to end',
        better: 'lower',
        bars: [
          { label: 'RTX 5090', value: 15, display: '~15 s' },
          { label: 'DGX Spark', value: 41, display: '~41 s', note: '2.73× slower' },
        ],
      },
      {
        title: 'Memory bandwidth',
        caption: 'GB/s, from the published specs',
        better: 'higher',
        bars: [
          { label: 'RTX 5090', value: 1792, display: '1,792 GB/s', note: '~6.6× more' },
          { label: 'DGX Spark', value: 273, display: '~273 GB/s' },
        ],
      },
      {
        title: 'Memory capacity',
        caption: 'GB available to the model',
        better: 'higher',
        bars: [
          { label: 'RTX 5090', value: 32, display: '32 GB GDDR7' },
          { label: 'DGX Spark', value: 128, display: '128 GB unified', note: '4× more' },
        ],
      },
    ],
    footnote: 'One request per machine; prefill and generation were not timed separately.',
  },
};
