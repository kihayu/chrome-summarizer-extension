interface SummarizerOptions {
  sharedContext?: string
  type?: 'summary' | 'key-points' | 'paragraph'
  format?: 'text' | 'markdown' | 'html'
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
