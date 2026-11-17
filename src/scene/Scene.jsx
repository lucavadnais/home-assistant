import { useEffect, useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, OrthographicCamera } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import Precipitation, { BlowingLeaves, Gusts, WeatherArea } from './Precipitation'
import Lightning from './Lightning'
import { WEATHERS, windStrength } from '../weather/weather'
import { SEASONS } from './seasons'
import Sky from './Sky'
import Stars from './Stars'
import IdleDrift from './IdleDrift'
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

// Starting view: from the street, almost face-on and low (8° up), the whole plot filling the
// screen (the house's `framing`, see houses/index.js). The camera is orthographic, so its
// distance only has to clear the scene.
// `?view=` in the URL picks a fixed view instead, without the idle sway: front, right, back,
// left (each façade face-on), corner or top. Used to compare the model with photos of the house.
const VIEWS = {
  front: [0, 8], right: [90, 8], back: [180, 8], left: [270, 8], corner: [35, 22], top: [0, 80],
}
const FIXED_VIEW = VIEWS[new URLSearchParams(window.location.search).get('view')] ?? null
const [VIEW_AZIMUTH, VIEW_ELEVATION] = (FIXED_VIEW ?? VIEWS.front).map(THREE.MathUtils.degToRad)
// Lowest the camera can orbit down to, above the horizon
const MIN_ELEVATION = THREE.MathUtils.degToRad(5)
const cameraPosition = ([x, y, z]) => [
  x + 50 * Math.cos(VIEW_ELEVATION) * Math.sin(VIEW_AZIMUTH),
  y + 50 * Math.sin(VIEW_ELEVATION),
  z + 50 * Math.cos(VIEW_ELEVATION) * Math.cos(VIEW_AZIMUTH),
]
const MAX_ZOOM = 70
const fitZoom = ({ width, height, minZoom }) => THREE.MathUtils.clamp(
  Math.min((0.92 * window.innerWidth) / width, (0.85 * window.innerHeight) / height),
  minZoom, MAX_ZOOM,
)

// Lite mode, for weak GPUs (TV boxes): native resolution, no post-processing (the vignette is
// CSS), a smaller shadow map redrawn only when the scene changes, 30 fps and fewer particles.
const LITE_FPS = 30
const LITE_PARTICLES = 0.35
const SHADOW_REFRESH_MS = 10 * 1000

// Drives the render loop at `fps` instead of every display frame (needs <Canvas frameloop="never">).
function FrameLimiter({ fps }) {
  const advance = useThree((s) => s.advance)
  useEffect(() => {
    const interval = 1000 / fps
    let start = null
    let last = -Infinity
    let id
    const loop = (t) => {
      id = requestAnimationFrame(loop)
      // 1 ms slack: on a 60 Hz screen frames come every ~16.7 ms, so 30 fps keeps every other one
      if (t - last < interval - 1) return
      last = t
      start ??= t
      advance((t - start) / 1000) // seconds since the loop started, like the clock it replaces
    }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [advance, fps])
  return null
}

// Draws the shadow map on each render of the scene (new sun position, season, lights…) and every
// few seconds (parked cars), instead of every frame. Whatever moves on its own must not cast
// shadows here, or its shadow would stay behind.
function StaticShadows() {
  const gl = useThree((s) => s.gl)
  useLayoutEffect(() => {
    gl.shadowMap.autoUpdate = false
    const id = setInterval(() => { gl.shadowMap.needsUpdate = true }, SHADOW_REFRESH_MS)
    return () => {
      clearInterval(id)
      gl.shadowMap.autoUpdate = true
    }
  }, [gl])
  useEffect(() => { gl.shadowMap.needsUpdate = true })
  return null
}

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

export default function Scene({ rooms, onToggle, mode, sun, hour, showNeighbors, viewShift, season: seasonId, weather: weatherId, wind: windKmh, lite, house }) {
  const { Model, framing } = house
  // A house made before `lot` existed falls back on 6538's plot
  const lot = house.lot ?? { x: [-14, 13], z: [-18.5, 21.5] }
  // The sun's shadows are computed over the whole lot (at least ±26 m, what 6538 needs)
  const shadowReach = Math.max(26, ...lot.x.map(Math.abs), ...lot.z.map(Math.abs))
  const season = SEASONS[seasonId]
  const weather = WEATHERS[weatherId]
  const day = mode === 'day'
  const l = day ? dayLighting(sun, weather.sky ?? season.sky) : { ...LIGHTING.night, position: MOON_POSITION }
  const sky = l.sky
  const wind = windStrength(windKmh)
  const neighborLit = useNeighborLights(mode, hour)
  // Fitted once, not on resize: the viewer's own zoom is kept meanwhile
  const zoom = useMemo(() => fitZoom(framing), [framing])
  const position = useMemo(() => cameraPosition(framing.target), [framing])
  const windowGlow = day ? THREE.MathUtils.lerp(1, DAY_WINDOW_GLOW, THREE.MathUtils.smoothstep(sun.elevation, 0, 10)) : 1

  const particles = lite ? LITE_PARTICLES : 1

  // Lite settings are read when the renderer is created: switching remounts the canvas.
  // `flat` (no tone mapping) matches what the EffectComposer sets, so both modes look alike.
  return (
    <>
      <Canvas key={lite ? 'lite' : 'full'} shadows flat dpr={lite ? 1 : [1, 2]} frameloop={lite ? 'never' : 'always'}>
        {lite && <FrameLimiter fps={LITE_FPS} />}
        {lite && <StaticShadows />}
        <color attach="background" args={[l.background]} />
        {day && <Sky top={sky[0]} horizon={sky[1]} />}
        {/* Stars only on clear nights: no precipitation, fog or overcast sky */}
        {!day && !weather.precipitation && !weather.fog && weather.clouds <= 5 && <Stars density={particles} />}
        {weather.fog && <fog attach="fog" args={[day ? '#d3d9df' : '#1c2433', 35, 75]} />}
        {/* Clear nights stay cloudless; overcast nights get dark clouds */}
        {(day || weather.clouds > 3) && (
          <Clouds count={weather.clouds} color={day ? weather.cloudColor : '#3a4354'} glow={day ? 0.3 : 0.05} speed={1 + 8 * wind} />
        )}
        <OrthographicCamera makeDefault position={position} zoom={zoom} near={-100} far={300} />
        <OrbitControls
          target={framing.target}
          enablePan={false}
          minZoom={framing.minZoom}
          maxZoom={MAX_ZOOM}
          maxPolarAngle={Math.PI / 2 - MIN_ELEVATION}
          enableDamping
          makeDefault
        />
        {!FIXED_VIEW && <IdleDrift />}
        <ViewShift shift={viewShift} />

        <ambientLight intensity={l.ambient} />
        <hemisphereLight args={['#bcd3ff', '#2a3a20', l.hemi]} />
        <directionalLight
          position={l.position}
          intensity={l.sun * weather.sun}
          color={l.sunColor}
          castShadow
          shadow-mapSize={lite ? [1024, 1024] : [2048, 2048]}
          shadow-bias={-0.0004}
          shadow-camera-left={-shadowReach}
          shadow-camera-right={shadowReach}
          shadow-camera-top={shadowReach}
          shadow-camera-bottom={-shadowReach}
        />

        <WindowGlow.Provider value={windowGlow}>
          <Model
            rooms={rooms}
            onToggle={onToggle}
            season={season}
            wind={wind}
            day={day}
            lite={lite}
            showNeighbors={showNeighbors}
            neighborLit={neighborLit}
          />
        </WindowGlow.Provider>
        {/* Rain, snow and wind cover the whole lot, neighbours included */}
        <WeatherArea.Provider value={lot}>
          <Precipitation key={weatherId} type={weather.precipitation} wind={wind} density={particles} />
          {weather.lightning && <Lightning />}
          <Gusts strength={wind} density={particles} />
          {season.fallenLeaves && <BlowingLeaves colors={season.fallenLeaves} strength={wind} density={particles} />}
        </WeatherArea.Provider>

        {!lite && (
          <EffectComposer>
            <Bloom mipmapBlur luminanceThreshold={1} intensity={0.9} radius={0.6} />
            <Vignette offset={0.3} darkness={l.vignette} />
          </EffectComposer>
        )}
      </Canvas>
      {lite && <div className="vignette" style={{ '--darkness': l.vignette }} />}
    </>
  )
}
