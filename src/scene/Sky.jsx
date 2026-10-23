import { useMemo } from 'react'
import * as THREE from 'three'

// Full-screen daytime sky gradient. A 2×2 quad written straight to clip space: drawn first
// (opaque, lowest renderOrder, no depth test) so the whole scene renders on top of it.
const vertexShader = /* glsl */ `
  varying float vY;
  void main() {
    vY = position.y;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 top;
  uniform vec3 horizon;
  varying float vY;
  void main() {
    gl_FragColor = vec4(mix(horizon, top, smoothstep(-0.9, 0.9, vY)), 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export default function Sky({ top, horizon }) {
  const uniforms = useMemo(() => ({ top: { value: new THREE.Color() }, horizon: { value: new THREE.Color() } }), [])
  uniforms.top.value.set(top)
  uniforms.horizon.value.set(horizon)

  return (
    <mesh renderOrder={-1} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  )
}
