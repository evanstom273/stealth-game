import { useState } from 'react'
import { PhaserGame } from './game/PhaserGame.tsx'
import { Hud } from './ui/Hud.tsx'
import { PauseMenu } from './ui/PauseMenu.tsx'
import { TouchControls } from './ui/TouchControls.tsx'
import { wantsTouchControls } from './ui/useHud.ts'

/** The side-on build, kept as reference at `?view=side` (History #92). */
export default function SideOnApp() {
  const [touchUi] = useState(wantsTouchControls)
  return (
    <main className="game-shell relative h-dvh w-dvw overflow-hidden bg-black">
      <PhaserGame />
      <Hud />
      {touchUi && <TouchControls />}
      <PauseMenu />
    </main>
  )
}
