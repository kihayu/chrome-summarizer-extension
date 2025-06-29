let summarizingInProgress = false

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received message:', message)
  if (message.action === 'getSummary') {
    console.log(`Summarizing in progress: ${summarizingInProgress}`)
    if (summarizingInProgress) {
      sendResponse({ status: 'generating' })
    } else {
      sendResponse({ status: 'starting' })
      generateSummary(message.url, message.length, message.style)
    }
    return true
  }
})

async function generateSummary(url: string, length: string, style: string) {
  console.log('Generating summary')
  try {
    summarizingInProgress = true

    const articleElements = document.querySelectorAll('article')
    const articles =
      articleElements.length > 0 ? articleElements : document.querySelectorAll('main')

    if (articles.length === 0) {
      console.error('No article or main element found')
      summarizingInProgress = false
      return
    }

    const text = Array.from(articles).reduce(
      (longest, article) =>
        article.innerText.length > longest.length ? article.innerText : longest,
      ''
    )

    if (!text) {
      console.error('Article has no text content')
      summarizingInProgress = false
      return
    }

    if (!('Summarizer' in self)) {
      console.error('Summarizer API not available in this browser')
      summarizingInProgress = false
      chrome.runtime.sendMessage({
        action: 'updateSummary',
        status: 'error',
        error: 'Summarizer API is not available in this browser',
      })
      return
    }

    const options = {
      sharedContext: 'This is a scientific article',
      type: style as 'tldr' | 'key-points',
      format: 'markdown' as const,
      length: length as 'short' | 'medium' | 'long',
    }

    try {
      chrome.runtime.sendMessage({
        action: 'updateSummary',
        status: 'generating',
      })

      const summarizer: SummarizerConstructor | null = self.Summarizer!
      const availability = await summarizer.availability()
      let summarizerInstance: Summarizer | null = null

      if (availability === 'available') {
        summarizerInstance = await summarizer.create(options)
      } else if (availability === 'downloadable') {
        chrome.runtime.sendMessage({
          action: 'start_download',
        })
        summarizerInstance = await summarizer.create({
          monitor(m) {
            m.addEventListener('downloadprogress', (e) => {
              console.log(`Downloaded ${e.loaded * 100}%`)
              chrome.runtime.sendMessage({
                action: 'downloadModel',
                status: 'downloading',
                progress: Math.floor(e.loaded * 100),
              })
            })
          },
        })
        chrome.runtime.sendMessage({
          action: 'downloadModel',
          status: 'downloaded',
        })

        await summarizerInstance.ready
      } else {
        chrome.runtime.sendMessage({
          action: 'updateSummary',
          status: 'error',
          error: 'Something went wrong. Check DevTools Console for more information.',
        })
        return
      }

      const summary = await summarizerInstance.summarizeStreaming(text)

      for await (const chunk of summary) {
        chrome.runtime.sendMessage({
          action: 'updateSummary',
          summary: chunk,
          url: url,
          status: 'add_chunk',
        })
      }

      summarizingInProgress = false

      chrome.runtime.sendMessage({
        action: 'updateSummary',
        summary: summary,
        url: url,
        status: 'complete',
      })
    } catch (error) {
      console.error('Error initializing Summarizer:')
      console.error(error)
      summarizingInProgress = false

      chrome.runtime.sendMessage({
        action: 'updateSummary',
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  } catch (error) {
    console.error('Error in content script:', error)
    summarizingInProgress = false

    chrome.runtime.sendMessage({
      action: 'updateSummary',
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
