import * as THREE from 'three'

// Procedural textures drawn on a canvas, so the scene needs no image assets.
// Brick and siding tiles are 1 m × 1 m; pair them with worldUvBox() so they keep scale on every face.

const cache = new Map()

function canvasTexture(key, width, height, draw, repeat = true) {
  if (cache.has(key)) return cache.get(key)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  draw(canvas.getContext('2d'), width, height)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  cache.set(key, tex)
  return tex
}

export function brickTexture(tone = '#8e3b2c') {
  return canvasTexture(`brick${tone}`, 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#b5a899'
    ctx.fillRect(0, 0, w, h)
    const rows = 16
    const rowH = h / rows
    const brickW = w / 4
    const base = new THREE.Color(tone)
    let seed = 7
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    for (let r = 0; r < rows; r++) {
      const offset = r % 2 ? brickW / 2 : 0
      for (let x = -brickW + offset; x < w; x += brickW) {
        ctx.fillStyle = `#${base.clone().offsetHSL(0, 0, (rand() - 0.5) * 0.1).getHexString()}`
        ctx.fillRect(x + 2, r * rowH + 2, brickW - 3, rowH - 3)
      }
    }
  })
}

export function sidingTexture() {
  return canvasTexture('siding', 64, 256, (ctx, w, h) => {
    const laps = 5
    const lapH = h / laps
    for (let i = 0; i < laps; i++) {
      const y = i * lapH
      const g = ctx.createLinearGradient(0, y, 0, y + lapH)
      g.addColorStop(0, '#f6f5f0')
      g.addColorStop(0.82, '#e4e2da')
      g.addColorStop(0.9, '#bdb9ae')
      g.addColorStop(1, '#f6f5f0')
      ctx.fillStyle = g
      ctx.fillRect(0, y, w, lapH)
    }
  })
}

// One baluster plus top/bottom rails; tinted by the material colour.
export function barsTexture() {
  return canvasTexture('bars', 32, 128, (ctx, w, h) => {
    ctx.fillStyle = '#fff'
    ctx.fillRect(w / 2 - 3, 0, 6, h)
    ctx.fillRect(0, 0, w, 6)
    ctx.fillRect(0, h - 6, w, 6)
  })
}

// House number in white on a transparent background (for the mailbox).
export function numberTexture(text) {
  return canvasTexture(`number${text}`, 256, 96, (ctx, w, h) => {
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 72px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, w / 2, h / 2 + 4)
  }, false)
}

// Vertical cedar-style planks, 12.5 cm wide.
export function woodTexture() {
  return canvasTexture('wood', 256, 256, (ctx, w, h) => {
    const boards = 8
    const bw = w / boards
    const base = new THREE.Color('#b89a72')
    let seed = 3
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    for (let i = 0; i < boards; i++) {
      ctx.fillStyle = `#${base.clone().offsetHSL(0, (rand() - 0.5) * 0.08, (rand() - 0.5) * 0.12).getHexString()}`
      ctx.fillRect(i * bw, 0, bw, h)
      ctx.fillStyle = 'rgba(80, 55, 30, 0.18)'
      for (let g = 0; g < 4; g++) ctx.fillRect(i * bw + 4 + rand() * (bw - 8), 0, 1, h)
      ctx.fillStyle = '#5e4a34'
      ctx.fillRect(i * bw, 0, 2, h)
    }
  })
}

// Horizontal stained boards, 7 per metre with a dark gap between them (fences, balcony rails).
export function slatTexture(tone) {
  return canvasTexture(`slat${tone}`, 128, 256, (ctx, w, h) => {
    const boards = 7
    const bh = h / boards
    const base = new THREE.Color(tone)
    let seed = 11
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647
    ctx.fillStyle = `#${base.clone().offsetHSL(0, 0, -0.25).getHexString()}`
    ctx.fillRect(0, 0, w, h)
    for (let i = 0; i < boards; i++) {
      ctx.fillStyle = `#${base.clone().offsetHSL(0, 0, (rand() - 0.5) * 0.08).getHexString()}`
      ctx.fillRect(0, i * bh + 3, w, bh - 6)
    }
  })
}

// Diagonal lattice strips on a transparent background (alpha-test it), 4 diamonds per tile.
export function latticeTexture() {
  return canvasTexture('lattice', 128, 128, (ctx, w) => {
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 7
    for (let i = -4; i <= 8; i++) {
      const o = (i * w) / 4
      ctx.beginPath()
      ctx.moveTo(o, 0)
      ctx.lineTo(o + w, w)
      ctx.moveTo(o, w)
      ctx.lineTo(o + w, 0)
      ctx.stroke()
    }
  })
}

// Soft round sprite for falling particles.
export function dotTexture() {
  return canvasTexture('dot', 32, 32, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2)
    g.addColorStop(0, '#fff')
    g.addColorStop(0.6, 'rgba(255,255,255,0.9)')
    g.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }, false)
}

// BoxGeometry whose UVs are in metres instead of 0..1 per face.
export function worldUvBox(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d)
  const uv = g.attributes.uv
  // Face order: +x, -x, +y, -y, +z, -z (4 vertices each)
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i
      uv.setXY(k, uv.getX(k) * dims[f][0], uv.getY(k) * dims[f][1])
    }
  }
  return g
}

// Someone seen side-on, walking to the right, in soft white on a transparent background,
// 0.7 m × 1.05 m. Not repeated: the edges clamp, so the body runs on below the bottom and nothing
// shows beside or above the figure. Variants:
//   0 short hair · 1 ponytail · 2 bun · 3 man: broad shoulders, thick neck, short beard
//   4 stockier person: round face, double chin, belly
export const SILHOUETTES = { plain: 0, ponytail: 1, bun: 2, man: 3, stocky: 4 }

export function silhouetteTexture(variant) {
  return canvasTexture(`silhouette${variant}`, 128, 192, (ctx, w, h) => {
    const blob = (x, y, rx, ry, rot = 0) => {
      ctx.beginPath()
      ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.filter = 'blur(3px)'
    ctx.fillStyle = '#fff'
    const man = variant === SILHOUETTES.man
    const stocky = variant === SILHOUETTES.stocky
    // Head, nose bump and neck
    blob(62, 44, stocky ? 18 : 16, stocky ? 20 : 19)
    blob(77, 48, 4, 5)
    if (man) {
      ctx.fillRect(52, 56, 19, 26)
      blob(70, 60, 8, 6) // short beard along the jaw
    } else if (stocky) {
      ctx.fillRect(51, 58, 22, 24)
      blob(70, 62, 10, 6) // double chin
    } else {
      ctx.fillRect(55, 58, 14, 24)
    }
    if (variant === SILHOUETTES.ponytail) blob(42, 52, 7, 15, 0.35)
    if (variant === SILHOUETTES.bun) {
      ctx.beginPath()
      ctx.arc(54, 24, 9, 0, Math.PI * 2)
      ctx.fill()
    }
    // Torso
    ctx.beginPath()
    if (man) {
      // Broad, squarer shoulders and a straight chest
      ctx.moveTo(34, h + 10)
      ctx.lineTo(32, 96)
      ctx.quadraticCurveTo(32, 71, 58, 70)
      ctx.quadraticCurveTo(92, 70, 94, 94)
      ctx.lineTo(90, h + 10)
    } else if (stocky) {
      // Wide back and a round belly pushing forward
      ctx.moveTo(36, h + 10)
      ctx.lineTo(34, 102)
      ctx.quadraticCurveTo(34, 76, 58, 74)
      ctx.quadraticCurveTo(86, 74, 90, 100)
      ctx.quadraticCurveTo(110, 136, 98, h + 10)
    } else {
      // Straight back, slight chest, rounded shoulder
      ctx.moveTo(44, h + 10)
      ctx.lineTo(42, 100)
      ctx.quadraticCurveTo(42, 78, 58, 76)
      ctx.quadraticCurveTo(80, 76, 82, 98)
      ctx.lineTo(84, h + 10)
    }
    ctx.closePath()
    ctx.fill()
    // The blur faded the bottom rows: repeat the last clean row so the body runs on unbroken.
    ctx.filter = 'none'
    ctx.drawImage(ctx.canvas, 0, h - 14, w, 1, 0, h - 14, w, 14)
  }, false)
}
