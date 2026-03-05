/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />
/// <reference types="vite-plugin-pwa/info" />

declare module 'virtual:pwa-register/react' {
  export interface UseRegisterSWOptions {
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onNeedRefresh?: () => void
  }

  export function useRegisterSW(options?: UseRegisterSWOptions): {
    needRefresh: [boolean, (value: boolean) => void]
    offlineReady: [boolean, (value: boolean) => void]
    updateServiceWorker: (reloadPage?: boolean) => Promise<void>
  }
}
