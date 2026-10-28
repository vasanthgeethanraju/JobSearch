import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import HNJobs from './HNJobs.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Tiny path switch instead of a router — Vite serves index.html for /hnjobs too */}
    {window.location.pathname.startsWith('/hnjobs') ? <HNJobs /> : <App />}
  </StrictMode>,
)
