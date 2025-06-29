document.addEventListener('DOMContentLoaded', () => {
  const refreshButton = document.getElementById('refreshButton') as HTMLButtonElement
  const defaultMessage = document.getElementById('default-message') as HTMLDivElement
  const loadingContainer = document.getElementById('loading-container') as HTMLDivElement
  const summaryContent = document.getElementById('summary-content') as HTMLDivElement
  const options = document.getElementById('options') as HTMLDivElement
  const lengthSelect = document.getElementById('length-select') as HTMLSelectElement
  const styleSelect = document.getElementById('style-select') as HTMLSelectElement
  let summaryText = document.getElementById('summary-text') as HTMLElement

  let summarizing = false
  let bulletPointText = ''
  let bulletPoints: Array<string> = []
  let bulletHTML: HTMLLIElement = document.createElement('li')

  const showLoading = () => {
    summaryText.textContent = ''
    bulletPointText = ''
    bulletPoints = []
    bulletHTML = document.createElement('li')
    defaultMessage.classList.add('hidden')
    summaryContent.classList.add('hidden')
    loadingContainer.classList.remove('hidden')
    summarizing = true
  }

  const showSummary = () => {
    loadingContainer.classList.add('hidden')
    defaultMessage.classList.add('hidden')
    summaryContent.classList.remove('hidden')
    options.classList.remove('hidden')
  }

  const updateSummary = (chunk: string, cached = false) => {
    if (styleSelect.value === 'key-points') {
      if (cached) {
        bulletPoints = chunk.split('\n')
        bulletPoints.forEach((point) => {
          const li = document.createElement('li')
          li.textContent = point
          summaryText.appendChild(li)
        })
        return
      }

      if (chunk === '*') {
        if (bulletPointText.trim().length > 0) {
          const formattedText = bulletPointText.replaceAll('*', '')
          bulletPoints.push(formattedText)
          bulletHTML = document.createElement('li')
        }

        bulletPointText = ''
        summaryText.append(bulletHTML)
      }
      bulletPointText += chunk
      const excludedSymbols = ['\n', '*']
      if (!excludedSymbols.includes(chunk)) {
        bulletHTML.append(chunk)
      }
      return
    }

    summaryText.append(chunk)
  }

  const showDefaultMessage = () => {
    loadingContainer.classList.add('hidden')
    summaryContent.classList.add('hidden')
    defaultMessage.classList.remove('hidden')
    options.classList.add('hidden')
    summarizing = false
  }

  const requestSummary = (refresh = false) => {
    console.log('Requesting summary')
    showLoading()

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length === 0) {
        console.log('No active tab found')
        showDefaultMessage()
        return
      }

      const activeTab = tabs[0]
      console.log('Active tab info:', { id: activeTab?.id, url: activeTab?.url })

      if (!activeTab || !activeTab.id) {
        console.log('Active tab is not valid or missing ID')
        showDefaultMessage()
        return
      }

      if (activeTab.url && activeTab.url.startsWith('chrome://')) {
        console.log('Cannot access chrome:// URLs')
        showDefaultMessage()
        return
      }

      const cachedSummary = (
        JSON.parse(localStorage.getItem('summaries') || '[]') as Array<Summary>
      ).find((summary: Summary) => summary.url === activeTab.url)

      if (!refresh && cachedSummary !== undefined) {
        console.log('Showing cached summary')
        summaryText.textContent = ''

        lengthSelect.value = cachedSummary.length || 'medium'
        styleSelect.value = cachedSummary.style || 'tldr'
        updateSummary(cachedSummary.summary, true)
        showSummary()
        summarizing = false
        return
      }

      chrome.tabs.sendMessage(
        activeTab.id,
        {
          action: 'getSummary',
          url: activeTab.url,
          length: lengthSelect.value,
          style: styleSelect.value,
        },
        (response) => {
          if (chrome.runtime.lastError || !response) {
            console.log('Failed to get summary')
            console.log(chrome.runtime.lastError)
            showDefaultMessage()
            return
          }

          if (response.status === 'generating') {
            console.log('Summary is generating')
            return
          }

          console.log('Summary is not complete')
          showDefaultMessage()
        }
      )
    })
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Popup received message:', message)

    if (message.action === 'updateSummary') {
      switch (message.status) {
        case 'complete':
          console.log('Showing summary, hiding loader')
          sendResponse({ received: true })

          const storedSummaries: Array<Summary> = JSON.parse(
            localStorage.getItem('summaries') || '[]'
          )
          const summary: Summary = {
            summary: summaryText.innerText,
            url: message.url,
            length: lengthSelect.value as 'short' | 'medium' | 'long',
            style: styleSelect.value as 'tldr' | 'key-points',
          }
          const existingSummary = storedSummaries.find((s: Summary) => s.url === summary.url)
          if (existingSummary) {
            storedSummaries.splice(storedSummaries.indexOf(existingSummary), 1)
          }

          storedSummaries.push(summary)
          localStorage.setItem('summaries', JSON.stringify(storedSummaries))

          summarizing = false
          bulletPoints.push(bulletPointText)
          console.log(bulletPoints)
          break
        case 'add_chunk':
          console.log('Adding summary chunk')
          sendResponse({ received: true })
          updateSummary(message.summary)
          showSummary()
          break
        case 'generating':
          console.log('Showing loader')
          showLoading()
          sendResponse({ received: true })
          break
        case 'error':
          console.log('Showing error')
          showDefaultMessage()
          const errorDiv = document.createElement('div')
          errorDiv.className = 'error-message'
          errorDiv.textContent = `Error: ${message.error || 'Unknown error'}`
          defaultMessage.appendChild(errorDiv)
          sendResponse({ received: true })
          break
        default:
          console.log('Unknown status:', message.status)
          break
      }
    } else if (message.action === 'downloadModel') {
      switch (message.status) {
        case 'start_download':
          console.log('Downloading model')
          loadingContainer.querySelector('p')!.textContent = 'Downloading model...'
          showLoading()
          summarizing = true
          break
        case 'downloading':
          loadingContainer.querySelector('p')!.textContent =
            `Downloading model... ${message.progress}%`
          break
        case 'downloaded':
          console.log('Model downloaded')
          loadingContainer.querySelector('p')!.textContent =
            'Generating summary using on device AI. The first summary may take a while.'
          break
        default:
          console.log('Unknown status:', message.status)
          break
      }
    }

    return true
  })

  refreshButton.addEventListener('click', () => {
    console.log('Refreshing summary')
    if (summarizing) {
      console.log('Summarizing in progress, cannot refresh')
      return
    }

    requestSummary(true)
  })

  lengthSelect.addEventListener('change', () => {
    console.log('Summary length changed to:', lengthSelect.value)
    localStorage.setItem('summaryLength', lengthSelect.value)
    requestSummary(true)
  })

  const setSummaryTextElement = () => {
    const tag = styleSelect.value === 'key-points' ? 'ul' : 'p'
    const tempContainer = document.createElement(tag)
    tempContainer.id = 'summary-text'
    tempContainer.classList.add('summary-box')
    summaryContent.replaceChild(tempContainer, summaryText)
    summaryText = tempContainer
  }

  styleSelect.addEventListener('change', () => {
    console.log('Summary style changed to:', styleSelect.value)
    localStorage.setItem('summaryStyle', styleSelect.value)
    setSummaryTextElement()
    requestSummary(true)
  })

  lengthSelect.value = localStorage.getItem('summaryLength') || 'medium'
  styleSelect.value = localStorage.getItem('summaryStyle') || 'tldr'

  setSummaryTextElement()
  requestSummary()
})
