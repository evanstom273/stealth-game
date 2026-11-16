import * as THREE from 'three'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js'
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js'
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js'
import { ceilAt, floorAt, isWall, type Box, type Level } from '../level/level.ts'

const INK = 0x12161b

/** A canvas texture that repeats once per S. */
function tex(paint: (g: CanvasRenderingContext2D, s: number) => void, size = 128): THREE.CanvasTexture {
  const cv = document.createElement('canvas')
  cv.width = cv.height = size
  paint(cv.getContext('2d')!, size)
  const t = new THREE.CanvasTexture(cv)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 8
  return t
}

const TEX = {
  floor: () => tex((g, s) => {
    g.fillStyle = '#8c979c'; g.fillRect(0, 0, s, s)
    g.strokeStyle = 'rgba(18,22,27,0.16)'; g.lineWidth = 2; g.strokeRect(18, 18, s - 36, s - 36)
    g.strokeStyle = 'rgba(18,22,27,0.55)'; g.lineWidth = 4; g.strokeRect(0, 0, s, s)
  }),
  wall: () => tex((g, s) => {
    g.fillStyle = '#cdd5d9'; g.fillRect(0, 0, s, s)
    g.strokeStyle = 'rgba(18,22,27,0.12)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, s / 2); g.lineTo(s, s / 2); g.stroke()
    g.strokeStyle = 'rgba(18,22,27,0.4)'; g.lineWidth = 3; g.strokeRect(0, 0, s, s)
  }),
  ceiling: () => tex((g, s) => {
    g.fillStyle = '#5b656c'; g.fillRect(0, 0, s, s)
    g.strokeStyle = 'rgba(18,22,27,0.55)'; g.lineWidth = 4; g.strokeRect(0, 0, s, s)
  }),
  crate: () => tex((g, s) => {
    g.fillStyle = '#b98d5c'; g.fillRect(0, 0, s, s)
    g.strokeStyle = 'rgba(18,22,27,0.6)'; g.lineWidth = 4
    g.strokeRect(10, 10, s - 20, s - 20)
    g.beginPath(); g.moveTo(10, 10); g.lineTo(s - 10, s - 10); g.moveTo(s - 10, 10); g.lineTo(10, s - 10); g.stroke()
  }),
  grating: () => tex((g, s) => {
    g.fillStyle = '#6f7a82'; g.fillRect(0, 0, s, s)
    g.strokeStyle = 'rgba(18,22,27,0.5)'; g.lineWidth = 3
    for (let i = 0; i <= s; i += s / 6) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, s); g.stroke() }
  }),
}

/** Collects quads for one material: positions, normals, world-scale UVs, and a flat tone by which way each faces. */
class Quads {
  pos: number[] = []
  nor: number[] = []
  uv: number[] = []
  col: number[] = []
  /** Corners in order round the quad; flips them so the front faces along the normal. */
  add(corners: [number, number, number][], n: [number, number, number], uvs: [number, number][], tone: number) {
    const [a, b, c] = corners
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2]
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2]
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx
    let order = [0, 1, 2, 0, 2, 3]
    if (cx * n[0] + cy * n[1] + cz * n[2] < 0) order = [0, 2, 1, 0, 3, 2]
    for (const i of order) {
      this.pos.push(...corners[i]); this.nor.push(...n); this.uv.push(...uvs[i]); this.col.push(tone, tone, tone)
    }
  }
  geometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3))
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2))
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3))
    return g
  }
}

// Each face gets a flat tone by which way it points (as the 3/4 boxes did): floors and south/north faces full, east/west a step darker, ceilings darker still.
const toneFor = (n: [number, number, number]) => (n[1] > 0.5 ? 1 : n[1] < -0.5 ? 0.72 : Math.abs(n[0]) > 0.5 ? 0.84 : 1)

function boxFaces(q: Quads, b: Box) {
  const { x0, y0, z0, x1, y1, z1 } = b
  const faces: [[number, number, number][], [number, number, number], [number, number][]][] = [
    [[[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], [0, 1, 0], [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]],
    [[[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]], [0, -1, 0], [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]],
    [[[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], [0, 0, 1], [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]],
    [[[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], [0, 0, -1], [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]],
    [[[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], [1, 0, 0], [[z0, y0], [z1, y0], [z1, y1], [z0, y1]]],
    [[[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], [-1, 0, 0], [[z0, y0], [z1, y0], [z1, y1], [z0, y1]]],
  ]
  for (const [c, n, uv] of faces) q.add(c, n, uv, toneFor(n))
}

export interface LevelView {
  group: THREE.Group
  /** Fat lines need to know the size of the screen. */
  setResolution(w: number, h: number): void
  dispose(): void
}

/** The level as meshes: tiles, walls where heights change, freeform pieces, glass, the pipe, lamps and ink edges. */
export function buildLevelView(L: Level): LevelView {
  const group = new THREE.Group()
  const floors = new Quads(), walls = new Quads(), ceils = new Quads(), crates = new Quads(), grating = new Quads(), glass = new Quads()
  const dirs: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]]
  for (let r = 0; r < L.rows; r++) {
    for (let c = 0; c < L.cols; c++) {
      if (isWall(L, c, r)) continue
      const f = floorAt(L, c, r), ce = ceilAt(L, c, r)
      floors.add([[c, f, r], [c + 1, f, r], [c + 1, f, r + 1], [c, f, r + 1]], [0, 1, 0], [[c, r], [c + 1, r], [c + 1, r + 1], [c, r + 1]], 1)
      ceils.add([[c, ce, r], [c + 1, ce, r], [c + 1, ce, r + 1], [c, ce, r + 1]], [0, -1, 0], [[c, r], [c + 1, r], [c + 1, r + 1], [c, r + 1]], 0.72)
      for (const [dc, dr] of dirs) {
        const nc = c + dc, nr = r + dr
        const spans: [number, number][] = []
        if (isWall(L, nc, nr)) spans.push([f, ce])
        else {
          const nf = floorAt(L, nc, nr), nce = ceilAt(L, nc, nr)
          if (nf > f) spans.push([f, Math.min(nf, ce)])
          if (nce < ce) spans.push([Math.max(nce, f), ce])
        }
        // The face sits on the shared edge and faces back into this tile.
        const n: [number, number, number] = [-dc, 0, -dr]
        for (const [y0, y1] of spans) {
          if (y1 - y0 < 1e-3) continue
          if (dc !== 0) {
            const x = dc > 0 ? c + 1 : c
            walls.add([[x, y0, r], [x, y0, r + 1], [x, y1, r + 1], [x, y1, r]], n, [[r, y0], [r + 1, y0], [r + 1, y1], [r, y1]], toneFor(n))
          } else {
            const z = dr > 0 ? r + 1 : r
            walls.add([[c, y0, z], [c + 1, y0, z], [c + 1, y1, z], [c, y1, z]], n, [[c, y0], [c + 1, y0], [c + 1, y1], [c, y1]], toneFor(n))
          }
        }
      }
    }
  }
  for (const b of L.boxes) {
    if (b.kind === 'pipe') continue
    boxFaces(b.kind === 'catwalk' ? grating : crates, b)
  }
  for (const b of L.thin) boxFaces(glass, b)

  const textures: THREE.Texture[] = []
  const mat = (t: THREE.Texture | null, extra: THREE.MeshLambertMaterialParameters = {}) => {
    if (t) textures.push(t)
    return new THREE.MeshLambertMaterial({ map: t, vertexColors: true, ...extra })
  }
  const meshes: [Quads, THREE.Material][] = [
    [floors, mat(TEX.floor())],
    [walls, mat(TEX.wall())],
    [ceils, mat(TEX.ceiling())],
    [crates, mat(TEX.crate())],
    [grating, mat(TEX.grating())],
    [glass, mat(null, { color: 0x9fd0e8, transparent: true, opacity: 0.32, depthWrite: false })],
  ]
  const solidGeos: THREE.BufferGeometry[] = []
  for (const [q, m] of meshes) {
    if (!q.pos.length) continue
    const g = q.geometry()
    if (q !== glass) solidGeos.push(g)
    const mesh = new THREE.Mesh(g, m)
    if (q === glass) mesh.renderOrder = 2
    group.add(mesh)
  }

  // The slanted pipe, drawn round, its top along the steps it's walked on.
  const pipeGeos: THREE.BufferGeometry[] = []
  if (L.pipe) {
    const p = L.pipe
    const dy = p.y1 - p.y0, dz = p.z1 - p.z0
    const len = Math.hypot(dy, dz)
    const geo = new THREE.CylinderGeometry(p.radius, p.radius, len, 14, 1)
    const m = new THREE.Matrix4().makeRotationX(Math.atan2(dz, dy))
    m.setPosition(p.x, (p.y0 + p.y1) / 2 - p.radius, (p.z0 + p.z1) / 2)
    geo.applyMatrix4(m)
    pipeGeos.push(geo)
    group.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: 0x7a8a94 })))
  }

  // Ink: an outline wherever surfaces meet at an angle, thinning with distance like the characters' outlines.
  const lines: THREE.Object3D[] = []
  const lineMats: LineMaterial[] = []
  const ink = (geo: THREE.BufferGeometry, threshold: number, width: number) => {
    const edges = new THREE.EdgesGeometry(geo, threshold)
    const lg = new LineSegmentsGeometry().fromEdgesGeometry(edges)
    edges.dispose()
    const lm = new LineMaterial({ color: INK, linewidth: width, worldUnits: true })
    lm.fog = true
    lineMats.push(lm)
    const l = new LineSegments2(lg, lm)
    lines.push(l)
    group.add(l)
  }
  for (const g of solidGeos) ink(g, 25, 0.03)
  for (const g of pipeGeos) ink(g, 40, 0.025)
  if (glass.pos.length) ink(glass.geometry(), 25, 0.025)

  // Lamps: a warm light under each fixture.
  for (const l of L.lamps) {
    const light = new THREE.PointLight(0xffe2b8, 7, 9, 1.5)
    light.position.set(l.x, l.y - 0.3, l.z)
    group.add(light)
    const fixture = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.45), new THREE.MeshBasicMaterial({ color: 0xfff1d0 }))
    fixture.position.set(l.x, l.y + 0.2, l.z)
    group.add(fixture)
    ink(fixture.geometry.clone().translate(l.x, l.y + 0.2, l.z), 30, 0.02)
  }
  // Checkpoints: a pale ring on the floor (stand-ins, as in side-on).
  for (const cp of L.checkpoints) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.5, 32), new THREE.MeshBasicMaterial({ color: 0x8fd3ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide }))
    ring.rotation.x = -Math.PI / 2
    ring.position.set(cp.x, floorAt(L, Math.floor(cp.x), Math.floor(cp.z)) + 0.01, cp.z)
    group.add(ring)
  }

  return {
    group,
    setResolution(w, h) { for (const m of lineMats) m.resolution.set(w, h) },
    dispose() {
      group.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose()
        const mm = m.material as THREE.Material | THREE.Material[] | undefined
        if (Array.isArray(mm)) mm.forEach((x) => x.dispose())
        else mm?.dispose()
      })
      textures.forEach((t) => t.dispose())
      void lines
    },
  }
}
