import { lazy, Suspense } from 'react'

// First person is the game (History #92). The side-on build stays playable at `?view=side`, loaded only when asked for.
const FpsApp = lazy(() => import('./fps/FpsApp.tsx'))
const SideOnApp = lazy(() => import('./SideOnApp.tsx'))

export default function App() {
  const sideOn = new URLSearchParams(window.location.search).get('view') === 'side'
  return <Suspense fallback={<main className="h-dvh w-dvw bg-black" />}>{sideOn ? <SideOnApp /> : <FpsApp />}</Suspense>
}
