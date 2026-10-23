import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'

// Storm flashes: a bright ambient light that strikes at random and fades out fast.
export default function Lightning() {
  const light = useRef()
  const flash = useRef(0)

  useFrame((_, dt) => {
    // About one strike every 5 s; sometimes a quick double flicker.
    if (Math.random() < dt * 0.2) flash.current = 1
    else if (flash.current < 0.4 && flash.current > 0.3 && Math.random() < 0.5) flash.current = 0.9
    flash.current = Math.max(0, flash.current - dt * 4)
    light.current.intensity = flash.current * 3.5
  })

  return <ambientLight ref={light} color="#dfe8ff" intensity={0} />
}
