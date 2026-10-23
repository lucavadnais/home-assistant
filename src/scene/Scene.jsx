import { useLayoutEffect } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, OrthographicCamera } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import RearHouse from './RearHouse'
import Duplex, { DuplexGhost } from './Duplex'
import RightNeighbor, { RightNeighborGhost } from './RightNeighbor'
import Surroundings from './Surroundings'
import Precipitation, { BlowingLeaves, Gusts } from './Precipitation'
import Lightning from './Lightning'
import { WEATHERS, windStrength } from '../weather/weather'
import { SEASONS } from './seasons'
import Sky from './Sky'
import IdleDrift from './IdleDrift'
import Traffic from './Traffic'
import { useNeighborLights } from './neighborLights'
import Clouds from './Clouds'
import { WindowGlow } from './parts'

const LIGHTING = {
  night: { background: '#0b1220', ambient: 0.3, sun: 0.6, sunColor: '#9fb6ff', hemi: 0.3, vignette: 0.6 },
  day: { background: '#121a27', ambient: 0.7, sun: 2.6, sunColor: '#fff3e0', hemi: 0.7, vignette: 0.2 },
}

// Night keeps a fixed moonlight; by day the light comes from the sun's real position.
const MOON_POSITION = [14, 30, 18]
const SUN_DISTANCE = 40

// Low sun: golden light and a warm horizon, fading to the plain day look by 10° up (golden
// hour). Must stay well under the winter noon sun (~21° in Montréal) or whole days look like dawn.
const DAWN = { sunColor: '#ffa45c', skyTop: '#6c7fa6', skyHorizon: '#f3ad78', ambient: 0.35, hemi: 0.35 }

// Scene axes: +x east, -z north. Azimuth is clockwise from north.
function sunDirection({ elevation, azimuth }) {
  const el = THREE.MathUtils.degToRad(Math.max(elevation, 4)) // keep some light on the model at the horizon
  const az = THREE.MathUtils.degToRad(azimuth)
  return [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)].map((v) => v * SUN_DISTANCE)
}

const mix = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t)

function dayLighting(sun, sky) {
  const d = LIGHTING.day
  const t = THREE.MathUtils.smoothstep(sun.elevation, 0, 10) // 0 at the horizon → 1 past golden hour
  const strength = THREE.MathUtils.smoothstep(sun.elevation, 0, 20) // sunlight keeps building a bit longer
  return {
    ...d,
    ambient: THREE.MathUtils.lerp(DAWN.ambient, d.ambient, t),
    hemi: THREE.MathUtils.lerp(DAWN.hemi, d.hemi, t),
    sun: d.sun * (0.4 + 0.6 * strength),
    sunColor: mix(DAWN.sunColor, d.sunColor, t),
    position: sunDirection(sun),
    sky: [mix(DAWN.skyTop, sky[0], t), mix(DAWN.skyHorizon, sky[1], t)],
  }
}

// Lit windows fade to this fraction of their night glow once the sun is up (same 0–10° ramp as dawn).
const DAY_WINDOW_GLOW = 0.35

const TARGET = [1, 2, -1]

// Slides the framing sideways by `shift`, a fraction of the screen width, without moving the
// camera: orbiting and zoom still pivot on the house. Positive moves the house to the right.
function ViewShift({ shift }) {
  const camera = useThree((s) => s.camera)
  const { width, height } = useThree((s) => s.size)
  useLayoutEffect(() => {
    const x = -shift * width
    if (x) camera.setViewOffset(width, height, x, 0, width, height)
    else camera.clearViewOffset()
  }, [camera, shift, width, height])
  return null
}

export default function Scene({ rooms, onToggle, mode, sun, hour, showNeighbors, viewShift, season: seasonId, weather: weatherId, wind: windKmh }) {
  const season = SEASONS[seasonId]
  const weather = WEATHERS[weatherId]
  const day = mode === 'day'
  const l = day ? dayLighting(sun, weather.sky ?? season.sky) : { ...LIGHTING.night, position: MOON_POSITION }
  const sky = l.sky
  const wind = windStrength(windKmh)
  const neighborLit = useNeighborLights(mode, hour)
  const windowGlow = day ? THREE.MathUtils.lerp(1, DAY_WINDOW_GLOW, THREE.MathUtils.smoothstep(sun.elevation, 0, 10)) : 1

  return (
    <Canvas shadows dpr={[1, 2]}>
      <color attach="background" args={[l.background]} />
      {day && <Sky top={sky[0]} horizon={sky[1]} />}
      {weather.fog && <fog attach="fog" args={[day ? '#d3d9df' : '#1c2433', 35, 75]} />}
      {/* Clear nights stay cloudless; overcast nights get dark clouds */}
      {(day || weather.clouds > 3) && (
        <Clouds count={weather.clouds} color={day ? weather.cloudColor : '#3a4354'} glow={day ? 0.3 : 0.05} speed={1 + 8 * wind} />
      )}
      <OrthographicCamera makeDefault position={[27, 30, 30]} zoom={18} near={-100} far={300} />
      <OrbitControls
        target={TARGET}
        enablePan={false}
        minZoom={10}
        maxZoom={70}
        maxPolarAngle={Math.PI / 2.3}
        enableDamping
        makeDefault
      />
      <IdleDrift />
      <ViewShift shift={viewShift} />

      <ambientLight intensity={l.ambient} />
      <hemisphereLight args={['#bcd3ff', '#2a3a20', l.hemi]} />
      <directionalLight
        position={l.position}
        intensity={l.sun * weather.sun}
        color={l.sunColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-26}
        shadow-camera-right={26}
        shadow-camera-top={26}
        shadow-camera-bottom={-26}
      />

      <WindowGlow.Provider value={windowGlow}>
        <Surroundings season={season} wind={wind} />
        {showNeighbors ? <Duplex season={season} lit={neighborLit} /> : <DuplexGhost />}
        {showNeighbors ? <RightNeighbor season={season} lit={neighborLit} /> : <RightNeighborGhost />}
        <RearHouse rooms={rooms} onToggle={onToggle} season={season} />
      </WindowGlow.Provider>
      <Precipitation key={weatherId} type={weather.precipitation} wind={wind} />
      {weather.lightning && <Lightning />}
      <Traffic night={!day} snow={season.snow} />
      <Gusts strength={wind} />
      {season.fallenLeaves && <BlowingLeaves colors={season.fallenLeaves} strength={wind} />}

      <EffectComposer>
        <Bloom mipmapBlur luminanceThreshold={1} intensity={0.9} radius={0.6} />
        <Vignette offset={0.3} darkness={l.vignette} />
      </EffectComposer>
    </Canvas>
  )
}
