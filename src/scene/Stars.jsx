import { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { between, random } from './chance'

// Twinkling night stars. Like the day sky, points written straight to clip space and drawn
// first (no depth test), so the whole scene renders on top of them and they never move with
// the camera. Each star pulses at its own pace; the brightest few get a small cross glint.
const COUNT = 220
// Share of stars drawn big and bright, with the glint
const BRIGHT = 0.08
// Lowest stars, in screen height from -1 (bottom) to 1 (top): none down near the horizon
const LOWEST = 0.2
const TINTS = ['#ffffff', '#ffffff', '#dfe8ff', '#fff1dc']

const vertexShader = /* glsl */ `
  attribute float size;
  attribute float phase;
  attribute float speed;
  attribute float bright;
  attribute vec3 tint;
  uniform float time;
  uniform float pixelRatio;
  varying float vAlpha;
  varying float vBright;
  varying vec3 vTint;
  void main() {
    // 0..1, squared so stars spend more time dim and flash briefly
    float twinkle = 0.5 + 0.5 * sin(time * speed + phase);
    twinkle *= twinkle;
    // Fade out towards the bottom of the sky
    vAlpha = (0.25 + 0.75 * twinkle) * smoothstep(${LOWEST.toFixed(2)}, ${(LOWEST + 0.25).toFixed(2)}, position.y);
    vBright = bright * twinkle;
    vTint = tint;
    gl_Position = vec4(position.xy, 0.0, 1.0);
    gl_PointSize = size * pixelRatio * (0.75 + 0.25 * twinkle);
  }
`

const fragmentShader = /* glsl */ `
  varying float vAlpha;
  varying float vBright;
  varying vec3 vTint;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float a = exp(-dot(p, p) * 70.0);
    // Thin horizontal and vertical rays on the bright stars
    vec2 q = abs(p);
    a += vBright * (exp(-q.y * 60.0) * exp(-q.x * 6.0) + exp(-q.x * 60.0) * exp(-q.y * 6.0)) * 0.8;
    gl_FragColor = vec4(vTint, a * vAlpha);
    #include <colorspace_fragment>
  }
`

export default function Stars({ density = 1 }) {
  const pixelRatio = useThree((s) => s.viewport.dpr)
  const geometry = useMemo(() => {
    const count = Math.round(COUNT * density)
    const position = new Float32Array(count * 3)
    const size = new Float32Array(count)
    const phase = new Float32Array(count)
    const speed = new Float32Array(count)
    const bright = new Float32Array(count)
    const tint = new Float32Array(count * 3)
    const color = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const r = (k) => random(i * 7 + k)
      position[i * 3] = between(r(0), -1, 1)
      position[i * 3 + 1] = between(r(1), LOWEST, 1)
      const isBright = r(2) < BRIGHT
      size[i] = isBright ? between(r(3), 9, 13) : between(r(3), 2, 4.5)
      bright[i] = isBright ? 1 : 0
      phase[i] = r(4) * Math.PI * 2
      speed[i] = between(r(5), 0.6, 2.4)
      color.set(TINTS[Math.floor(r(6) * TINTS.length)]).toArray(tint, i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(position, 3))
    g.setAttribute('size', new THREE.BufferAttribute(size, 1))
    g.setAttribute('phase', new THREE.BufferAttribute(phase, 1))
    g.setAttribute('speed', new THREE.BufferAttribute(speed, 1))
    g.setAttribute('bright', new THREE.BufferAttribute(bright, 1))
    g.setAttribute('tint', new THREE.BufferAttribute(tint, 3))
    return g
  }, [density])
  const uniforms = useMemo(() => ({ time: { value: 0 }, pixelRatio: { value: 1 } }), [])
  uniforms.pixelRatio.value = pixelRatio

  useFrame(({ clock }) => { uniforms.time.value = clock.elapsedTime })

  return (
    <points geometry={geometry} renderOrder={-1} frustumCulled={false}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        // Not `transparent`: that would draw them after the opaque model, over it. Additive
        // blending still applies, and renderOrder keeps them first.
        blending={THREE.AdditiveBlending}
        depthTest={false}
        depthWrite={false}
      />
    </points>
  )
}
