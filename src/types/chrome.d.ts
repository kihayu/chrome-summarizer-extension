/* eslint-disable */
interface Chrome {
  runtime: {
    sendMessage: (message: any, responseCallback?: (response: any) => void) => void
    onMessage: {
      addListener: (
        callback: (message: any, sender: any, sendResponse: (response: any) => void) => void
      ) => void
      removeListener: (
        callback: (message: any, sender: any, sendResponse: (response: any) => void) => void
      ) => void
    }
    lastError?: {
      message: string
    }
  }
  tabs: {
    query: (
      queryInfo: { active: boolean; currentWindow: boolean },
      callback: (tabs: Tab[]) => void
    ) => void
    sendMessage: (tabId: number, message: any, responseCallback?: (response: any) => void) => void
  }
}

interface Tab {
  id?: number
  url?: string
  title?: string
  active: boolean
  index: number
  windowId: number
}

declare let chrome: Chrome
