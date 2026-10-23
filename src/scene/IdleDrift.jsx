import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// Gentle camera sway so the scene never looks frozen: after IDLE_S seconds without input the
// camera slowly swings ±AMPLITUDE around the orbit target, easing in; any drag or zoom stops it
// at once and hands control back. Needs <OrbitControls makeDefault />.
const IDLE_S = 4
const AMPLITUDE = THREE.MathUtils.degToRad(6)
const PERIOD_S = 60
const UP = new THREE.Vector3(0, 1, 0)

export default function IdleDrift() {
  const controls = useThree((s) => s.controls)
  const lastInput = useRef(0)
  const strength = useRef(0)
  const phase = useRef(0)

  useEffect(() => {
    if (!controls) return
    const onStart = () => {
      lastInput.current = performance.now()
      strength.current = 0
      phase.current = 0 // next sway starts from wherever the user leaves the camera
    }
    const onEnd = () => { lastInput.current = performance.now() }
    controls.addEventListener('start', onStart)
    controls.addEventListener('end', onEnd)
    return () => {
      controls.removeEventListener('start', onStart)
      controls.removeEventListener('end', onEnd)
    }
  }, [controls])

  useFrame(({ camera }, dt) => {
    if (!controls) return
    const step = Math.min(dt, 0.1)
    const idle = (performance.now() - lastInput.current) / 1000 > IDLE_S
    strength.current = THREE.MathUtils.lerp(strength.current, idle ? 1 : 0, 1 - Math.exp(-step * 0.5))
    if (strength.current < 0.001) return

    // Angular velocity of a sine sway: the angle stays within ±AMPLITUDE of where it started.
    const omega = (2 * Math.PI) / PERIOD_S
    phase.current += step * omega
    const angle = strength.current * AMPLITUDE * omega * Math.cos(phase.current) * step
    camera.position.sub(controls.target).applyAxisAngle(UP, angle).add(controls.target)
    controls.update()
  })

  return null
}
