import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { PostHogProvider} from 'posthog-js/react'
import './i18n'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 6,        // 6 hora
      refetchInterval: 1000 * 60 * 60,  // cada 30 minutos
      retry: 1                          // reintento en fallo
    }
  }
}); 

const options = {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
}

const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
});

persistQueryClient({
  queryClient,
  persister: localStoragePersister,
  maxAge: 1000 * 60 * 60 * 6, // ✅ Caché válida por 6 horas
});

// Add preload hint for hero image
const preloadHeroImage = () => {
  const linkElement = document.createElement('link');
  linkElement.rel = 'preload';
  linkElement.as = 'image';
  linkElement.href = '/images/hero-right.webp';
  linkElement.type = 'image/webp';
  linkElement.fetchPriority = 'high';
  document.head.appendChild(linkElement);
};

// Execute preload before React renders
preloadHeroImage();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <PostHogProvider apiKey={import.meta.env.VITE_POSTHOG_KEY} options={options}>
        <App />
      </PostHogProvider>
    </QueryClientProvider>
  </StrictMode>,
)
