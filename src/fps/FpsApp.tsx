import { useState } from 'react'
import { Hud } from '../ui/Hud.tsx'
import { PauseMenu } from '../ui/PauseMenu.tsx'
import { wantsTouchControls } from '../ui/useHud.ts'
import { FpsView } from './FpsView.tsx'
import { FpsTouchControls } from './ui/FpsTouchControls.tsx'

/** The game in first person (History #92): the view, the HUD, touch controls and the pause menu. */
export default function FpsApp() {
  const [touchUi] = useState(wantsTouchControls)
  return (
    <main className="game-shell relative h-dvh w-dvw overflow-hidden bg-black">
      <FpsView />
      <Hud />
      {touchUi && <FpsTouchControls />}
      <PauseMenu firstPerson />
    </main>
  )
}
