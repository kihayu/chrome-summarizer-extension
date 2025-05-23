interface SummarizerOptions {
  sharedContext?: string
  type?: 'tl;dr' | 'teaser' | 'key-points' | 'headline'
  format?: 'plain-text' | 'markdown'
  length?: 'short' | 'medium' | 'long'
}

interface SummarizerProgressEvent extends Event {
  loaded: number
}

interface SummarizerSummarizeOptions {
  context?: string
}

interface Summarizer {
  ready: Promise<void>
  summarize(text: string, options?: SummarizerSummarizeOptions): Promise<string>
  summarizeStreaming(text: string, options?: SummarizerSummarizeOptions): Promise<AsyncIterable<string>>
  addEventListener(event: 'downloadprogress', callback: (event: SummarizerProgressEvent) => void): void
  removeEventListener(event: 'downloadprogress', callback: (event: SummarizerProgressEvent) => void): void
}

interface SummarizerConstructor {
  availability(): Promise<'available' | 'downloadable' | 'unavailable'>
  create(options?: SummarizerOptions): Promise<Summarizer>
}

interface Window {
  Summarizer?: SummarizerConstructor
}

interface WorkerGlobalScope {
  Summarizer?: SummarizerConstructor
}
