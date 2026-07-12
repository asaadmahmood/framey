import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Stop, DownloadSimple, Plus, SquaresFour, Stack, Trash, DotsSixVertical, AlignLeft, AlignCenterHorizontal, AlignRight, AlignTop, AlignCenterVertical, AlignBottom, Rows, Columns, CaretDown, CaretUp, Camera, FileVideo, ImageSquare } from '@phosphor-icons/react'
import * as Mp4Muxer from 'mp4-muxer'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
// GIF encoder loaded lazily on first use
let GifEncoderModule = null
import { BgColorPicker } from './ColorPicker'
import { AlignColorPicker } from './AlignColorPicker'
import { Slider } from './Slider'
import './ColorPicker.css'
import './AlignColorPicker.css'
import './Slider.css'
import './App.css'

const FORMAT_PRESETS = {
  'Dribbble shot HD': { width: 1600, height: 1200 },
  'Dribbble shot': { width: 800, height: 600 },
  'Instagram Post': { width: 1080, height: 1080 },
  'Instagram Story': { width: 1080, height: 1920 },
  'Twitter Post': { width: 1200, height: 675 },
  'YouTube Thumbnail': { width: 1280, height: 720 },
  'HD 1080p': { width: 1920, height: 1080 },
  'Custom': null,
}

const ANIMATION_TYPES = [
  { id: 'fadeIn', label: 'Fade In' },
  { id: 'slideUp', label: 'Slide Up' },
  { id: 'slideDown', label: 'Slide Down' },
  { id: 'slideLeft', label: 'Slide Left' },
  { id: 'slideRight', label: 'Slide Right' },
  { id: 'scaleUp', label: 'Scale Up' },
  { id: 'scaleDown', label: 'Scale Down' },
]

const FRAME_STYLES = [
  { id: 'none', label: 'None' },
  { id: 'border', label: 'Default' },
  { id: 'glass', label: 'Glass' },
]

const EXIT_ANIMATION_TYPES = [
  { id: 'fadeIn', label: 'Fade Out' },
  { id: 'slideUp', label: 'Slide Up' },
  { id: 'slideDown', label: 'Slide Down' },
  { id: 'slideLeft', label: 'Slide Left' },
  { id: 'slideRight', label: 'Slide Right' },
  { id: 'scaleUp', label: 'Scale Up' },
  { id: 'scaleDown', label: 'Scale Down' },
]

const EASING_OPTIONS = [
  { id: 'linear', label: 'Linear', group: 'Basic' },
  { id: 'ease-in-quad', label: 'Ease In Quad', group: 'Ease In' },
  { id: 'ease-in-cubic', label: 'Ease In Cubic', group: 'Ease In' },
  { id: 'ease-in-quart', label: 'Ease In Quart', group: 'Ease In' },
  { id: 'ease-in-quint', label: 'Ease In Quint', group: 'Ease In' },
  { id: 'ease-in-expo', label: 'Ease In Expo', group: 'Ease In' },
  { id: 'ease-in-circ', label: 'Ease In Circ', group: 'Ease In' },
  { id: 'ease-out-quad', label: 'Ease Out Quad', group: 'Ease Out' },
  { id: 'ease-out-cubic', label: 'Ease Out Cubic', group: 'Ease Out' },
  { id: 'ease-out-quart', label: 'Ease Out Quart', group: 'Ease Out' },
  { id: 'ease-out-quint', label: 'Ease Out Quint', group: 'Ease Out' },
  { id: 'ease-out-expo', label: 'Ease Out Expo', group: 'Ease Out' },
  { id: 'ease-out-circ', label: 'Ease Out Circ', group: 'Ease Out' },
  { id: 'ease-in-out-quad', label: 'Ease In Out Quad', group: 'Ease In Out' },
  { id: 'ease-in-out-cubic', label: 'Ease In Out Cubic', group: 'Ease In Out' },
  { id: 'ease-in-out-quart', label: 'Ease In Out Quart', group: 'Ease In Out' },
  { id: 'ease-in-out-quint', label: 'Ease In Out Quint', group: 'Ease In Out' },
  { id: 'ease-in-out-expo', label: 'Ease In Out Expo', group: 'Ease In Out' },
  { id: 'ease-in-out-circ', label: 'Ease In Out Circ', group: 'Ease In Out' },
  { id: 'bounce-out', label: 'Bounce', group: 'Special' },
  { id: 'overshoot', label: 'Overshoot', group: 'Special' },
  { id: 'elastic-out', label: 'Elastic', group: 'Special' },
  { id: 'impulse', label: 'Impulse', group: 'Special' },
  { id: 'swing', label: 'Swing', group: 'Special' },
  { id: 'snap', label: 'Snap', group: 'Special' },
]

function applyEasing(t, easing) {
  if (t <= 0) return 0
  if (t >= 1) return 1
  switch (easing) {
    // Basic
    case 'linear': return t
    // Ease In
    case 'ease-in-quad': return t * t
    case 'ease-in-cubic': return t * t * t
    case 'ease-in-quart': return t * t * t * t
    case 'ease-in-quint': return t * t * t * t * t
    case 'ease-in-expo': return Math.pow(2, 10 * t - 10)
    case 'ease-in-circ': return 1 - Math.sqrt(1 - t * t)
    // Ease Out
    case 'ease-out-quad': return 1 - (1 - t) * (1 - t)
    case 'ease-out-cubic': return 1 - Math.pow(1 - t, 3)
    case 'ease-out-quart': return 1 - Math.pow(1 - t, 4)
    case 'ease-out-quint': return 1 - Math.pow(1 - t, 5)
    case 'ease-out-expo': return 1 - Math.pow(2, -10 * t)
    case 'ease-out-circ': return Math.sqrt(1 - Math.pow(t - 1, 2))
    // Ease In Out
    case 'ease-in-out-quad': return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    case 'ease-in-out-cubic': return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    case 'ease-in-out-quart': return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2
    case 'ease-in-out-quint': return t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2
    case 'ease-in-out-expo': return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2
    case 'ease-in-out-circ': return t < 0.5 ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2 : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2
    // Special
    case 'bounce-out': {
      const n1 = 7.5625, d1 = 2.75
      if (t < 1 / d1) return n1 * t * t
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
      return n1 * (t -= 2.625 / d1) * t + 0.984375
    }
    case 'overshoot': {
      const s = 1.70158
      return 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2)
    }
    case 'elastic-out': {
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1
    }
    case 'impulse': {
      const h = 2.0
      return h * t * Math.exp(1 - h * t)
    }
    case 'swing': {
      return -Math.pow(Math.cos(Math.PI * t * 1.5), 2) * (1 - t) + t
    }
    case 'snap': return 1 - Math.pow(1 - t, 5)
    // Legacy compat
    case 'ease': return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
    case 'ease-in': return t * t * t
    case 'ease-out': return 1 - Math.pow(1 - t, 3)
    case 'ease-in-out': return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    case 'bounce': return applyEasing(t, 'bounce-out')
    case 'elastic': return applyEasing(t, 'elastic-out')
    default: return t
  }
}

function applyEasingOut(t, easing) {
  return applyEasing(t, easing)
}

// Generate SVG path for an easing curve
function easingToPath(easingId, w, h, pad) {
  const steps = 40
  const iw = w - pad * 2
  const ih = h - pad * 2
  const points = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const v = applyEasing(t, easingId)
    const cv = Math.max(-0.2, Math.min(1.2, v))
    const x = pad + t * iw
    const y = pad + ih - cv * ih
    points.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
  }
  return points.join(' ')
}

function EasingCurve({ id, size = 'small', active = false }) {
  const isSmall = size === 'small'
  const w = isSmall ? 32 : 48
  const h = isSmall ? 20 : 48
  const pad = isSmall ? 3 : 8
  const strokeColor = active ? '#fff' : (isSmall ? '#8f52ff' : 'rgba(255,255,255,0.55)')

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="easing-curve-svg">
      <path d={easingToPath(id, w, h, pad)} fill="none" stroke={strokeColor} strokeWidth={isSmall ? 1.5 : 2.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function EasingDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [popoverStyle, setPopoverStyle] = useState({})
  const ref = useRef(null)
  const triggerRef = useRef(null)
  const selected = EASING_OPTIONS.find((e) => e.id === value) || EASING_OPTIONS[0]

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    window.addEventListener('mousedown', close)
    return () => window.removeEventListener('mousedown', close)
  }, [open])

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const popW = 248
      // Position to the left of the trigger
      let left = rect.left - popW - 8
      let top = rect.top
      // If no room on the left, fall back to below
      if (left < 8) {
        left = rect.left
        top = rect.bottom + 4
      }
      // Keep within viewport vertically
      const maxH = window.innerHeight - 16
      if (top + maxH < 0) top = 8
      setPopoverStyle({ top, left, maxHeight: maxH - top })
    }
    setOpen(!open)
  }

  const groups = []
  const seen = new Set()
  for (const opt of EASING_OPTIONS) {
    if (!seen.has(opt.group)) { seen.add(opt.group); groups.push(opt.group) }
  }

  return (
    <div className="easing-dropdown" ref={ref}>
      <button className="easing-trigger" ref={triggerRef} onClick={handleOpen}>
        <EasingCurve id={selected.id} size="small" />
        <span className="easing-trigger-label">{selected.label}</span>
        <CaretDown size={12} weight="bold" className="easing-arrow-icon" />
      </button>
      {open && (
        <div className="easing-popover" style={popoverStyle} onWheel={(e) => e.stopPropagation()}>
          {groups.map((group) => (
            <div key={group} className="easing-group">
              <div className="easing-group-label">{group}</div>
              <div className="easing-grid">
                {EASING_OPTIONS.filter((o) => o.group === group).map((opt) => (
                  <button
                    key={opt.id}
                    className={`easing-option ${opt.id === value ? 'active' : ''}`}
                    onClick={() => { onChange(opt.id); setOpen(false) }}
                    title={opt.label}
                  >
                    <div className="easing-option-curve">
                      <EasingCurve id={opt.id} size="large" active={opt.id === value} />
                    </div>
                    <span className="easing-option-label">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Monochrome noise tile — built once, reused for both the live preview overlay and canvas exports
let _noiseTile = null
let _noiseTileUrl = null
function getNoiseTile() {
  if (_noiseTile) return _noiseTile
  const size = 160
  const tile = document.createElement('canvas')
  tile.width = size
  tile.height = size
  const tctx = tile.getContext('2d')
  const imgData = tctx.createImageData(size, size)
  const d = imgData.data
  for (let i = 0; i < d.length; i += 4) {
    const v = (Math.random() * 255) | 0
    d[i] = v
    d[i + 1] = v
    d[i + 2] = v
    d[i + 3] = 255
  }
  tctx.putImageData(imgData, 0, 0)
  _noiseTile = tile
  _noiseTileUrl = tile.toDataURL('image/png')
  return tile
}
function getNoiseTileUrl() {
  getNoiseTile()
  return _noiseTileUrl
}

// Ordered 4x4 Bayer dither tile — overlay-blended for a retro screen-door texture
let _ditherTile = null
let _ditherTileUrl = null
function getDitherTile() {
  if (_ditherTile) return _ditherTile
  const bayer = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
  const cell = 3
  const size = 4 * cell
  const tile = document.createElement('canvas')
  tile.width = size
  tile.height = size
  const tctx = tile.getContext('2d')
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 4; x++) {
      const v = Math.round(((bayer[y][x] + 0.5) / 16) * 255)
      tctx.fillStyle = `rgb(${v},${v},${v})`
      tctx.fillRect(x * cell, y * cell, cell, cell)
    }
  }
  _ditherTile = tile
  _ditherTileUrl = tile.toDataURL('image/png')
  return tile
}
function getDitherTileUrl() {
  getDitherTile()
  return _ditherTileUrl
}

// Horizontal scanline tile — 2px dark line every 4px
let _scanTile = null
let _scanTileUrl = null
function getScanlineTile() {
  if (_scanTile) return _scanTile
  const tile = document.createElement('canvas')
  tile.width = 4
  tile.height = 4
  const tctx = tile.getContext('2d')
  tctx.fillStyle = '#000'
  tctx.fillRect(0, 0, 4, 2)
  _scanTile = tile
  _scanTileUrl = tile.toDataURL('image/png')
  return tile
}
function getScanlineTileUrl() {
  getScanlineTile()
  return _scanTileUrl
}

const rc = (f) => `/wallpapers/raycast/${f}.webp`
const rs = (f) => `/wallpapers/resend/${f}.webp`
const nt = (f) => `/wallpapers/nature/${f}.webp`
const ae = (f) => `/wallpapers/aero/${f}.webp`
const WALLPAPER_GROUPS = {
  // Soft 3D renders from Unsplash (unsplash.com/license — free for commercial use)
  'Aero': [
    { name: 'Purple Silk', url: ae('purple-silk') },
    { name: 'Blue Waves', url: ae('blue-waves') },
    { name: 'Dark Flow', url: ae('dark-flow') },
    { name: 'Pastel Spheres', url: ae('pastel-spheres') },
    { name: 'Peach Aura', url: ae('peach-aura') },
    { name: 'Magenta Blur', url: ae('magenta-blur') },
    { name: 'Sunset Fade', url: ae('sunset-fade') },
    { name: 'Rainbow Soft', url: ae('rainbow-soft') },
    { name: 'Violet Fade', url: ae('violet-fade') },
    { name: 'Teal Ribbon', url: ae('teal-ribbon') },
    { name: 'Lilac Ribbon', url: ae('lilac-ribbon') },
    { name: 'Holo Soft', url: ae('holo-soft') },
    { name: 'Glass Petals', url: ae('glass-petals') },
    { name: 'Violet Mesh', url: ae('violet-mesh') },
    { name: 'Grain Violet', url: ae('grain-violet') },
    { name: 'Cream Soft', url: ae('cream-soft') },
    { name: 'Ink Clouds', url: ae('ink-clouds') },
    { name: 'Dark Paint', url: ae('dark-paint') },
  ],
  // Minimal nature photos from Unsplash (unsplash.com/license — free for commercial use)
  'Nature': [
    { name: 'Misty Mountains', url: nt('misty-mountains') },
    { name: 'Starry Peaks', url: nt('starry-peaks') },
    { name: 'Night Sky', url: nt('night-sky') },
    { name: 'Sea Horizon', url: nt('sea-horizon') },
    { name: 'Ocean Beach', url: nt('ocean-beach') },
    { name: 'Dusk Sea', url: nt('dusk-sea') },
    { name: 'Teal Shore', url: nt('teal-shore') },
    { name: 'Green Hills', url: nt('green-hills') },
    { name: 'Foggy Peaks', url: nt('foggy-peaks') },
    { name: 'Crimson Peaks', url: nt('crimson-peaks') },
  ],
  'Abstract': [
    { name: 'Glaze 1', url: rc('glaze_1') },
    { name: 'Glaze 2', url: rc('glaze_2') },
    { name: 'Red Distortion 1', url: rc('red_distortion_1') },
    { name: 'Red Distortion 2', url: rc('red_distortion_2') },
    { name: 'Red Distortion 3', url: rc('red_distortion_3') },
    { name: 'Red Distortion 4', url: rc('red_distortion_4') },
    { name: 'Blue Distortion 1', url: rc('blue_distortion_1') },
    { name: 'Blue Distortion 2', url: rc('blue_distortion_2') },
    { name: 'Mono Dark', url: rc('mono_dark_distortion_1') },
    { name: 'Mono Light', url: rc('mono_light_distortion_1') },
    { name: 'Chromatic Dark', url: rc('chromatic_dark_1') },
    { name: 'Chromatic Light', url: rc('chromatic_light_1') },
    { name: 'Cube', url: rc('cube_prod') },
    { name: 'Cube Mono', url: rc('cube_mono') },
    { name: 'Loupe', url: rc('loupe') },
    { name: 'Loupe Dark', url: rc('loupe-mono-dark') },
    { name: 'Blob Red', url: rc('blob-red') },
  ],
  'Gradient Art': ['1-a','1-b','1-c','2-a','2-b','2-c','3-a','3-b','3-c','4-a','4-b','4-c','5-a','5-b','5-c','6-a','6-b','6-c','7-a','7-b','7-c','8-a','8-b','8-c'].map(id => ({
    name: `Resend ${id}`, url: rs(id),
  })),
}

const BG_PRESETS = {
  'Gradients': [
    // Curated from uiGradients (MIT — github.com/ghosh/uiGradients)
    'linear-gradient(135deg, #12c2e9, #c471ed, #f64f59)',
    'linear-gradient(135deg, #8A2387, #E94057, #F27121)',
    'linear-gradient(135deg, #FC466B, #3F5EFB)',
    'linear-gradient(135deg, #7F00FF, #E100FF)',
    'linear-gradient(135deg, #ef32d9, #89fffd)',
    'linear-gradient(135deg, #11998e, #38ef7d)',
    'linear-gradient(135deg, #f12711, #f5af19)',
    'linear-gradient(135deg, #FF416C, #FF4B2B)',
    'linear-gradient(135deg, #fc00ff, #00dbde)',
    'linear-gradient(135deg, #C33764, #1D2671)',
    'linear-gradient(135deg, #3A1C71, #D76D77, #FFAF7B)',
    'linear-gradient(135deg, #03001e, #7303c0, #ec38bc, #fdeff9)',
    'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
    'linear-gradient(135deg, #8360c3, #2ebf91)',
    'linear-gradient(135deg, #FDC830, #F37335)',
    'linear-gradient(135deg, #C6FFDD, #FBD786, #f7797d)',
    'linear-gradient(135deg, #654ea3, #eaafc8)',
    'linear-gradient(135deg, #00B4DB, #0083B0)',
    'linear-gradient(135deg, #ffe259, #ffa751)',
    'linear-gradient(135deg, #667eea, #764ba2)',
    // Curated from WebGradients (free — webgradients.com by itmeo)
    'linear-gradient(120deg, #a1c4fd, #c2e9fb)',
    'linear-gradient(120deg, #a18cd1, #fbc2eb)',
    'linear-gradient(120deg, #ffecd2, #fcb69f)',
    'linear-gradient(120deg, #fbc2eb, #a6c1ee)',
    'linear-gradient(120deg, #f6d365, #fda085)',
    'linear-gradient(120deg, #d4fc79, #96e6a1)',
    'linear-gradient(120deg, #84fab0, #8fd3f4)',
    'linear-gradient(120deg, #a6c0fe, #f68084)',
    'linear-gradient(120deg, #fccb90, #d57eeb)',
    'linear-gradient(120deg, #4facfe, #00f2fe)',
    'linear-gradient(120deg, #f093fb, #f5576c)',
    'linear-gradient(120deg, #13547a, #80d0c7)',
    'linear-gradient(120deg, #89f7fe, #66a6ff)',
    'linear-gradient(120deg, #48c6ef, #6f86d6)',
    'linear-gradient(120deg, #e0c3fc, #8ec5fc)',
    // Muted vibrant
    'linear-gradient(135deg, #c4475a, #d4616e)',
    'linear-gradient(135deg, #556bb8, #654a8c)',
    'linear-gradient(135deg, #3ab880, #35c4ab)',
    'linear-gradient(135deg, #c8607f, #d4b450)',
    'linear-gradient(135deg, #8a76ae, #cfaad8)',
    'linear-gradient(135deg, #4590d0, #1ec4d0)',
    'linear-gradient(135deg, #5616a0, #2468cc)',
    'linear-gradient(135deg, #9424cc, #24aed0)',
    'linear-gradient(135deg, #cc1a42, #d49a80)',
    'linear-gradient(135deg, #c47cd4, #c4475a)',
    // Warm
    'linear-gradient(45deg, #d48888, #d4b8ac)',
    'linear-gradient(120deg, #ccb358, #d08c72)',
    'linear-gradient(135deg, #d4ad60, #cc6830)',
    'linear-gradient(135deg, #d0ab7a, #ae6cc0)',
    'linear-gradient(135deg, #c4b496, #947450)',
    // Cool
    'linear-gradient(120deg, #8aa8d0, #a8c8d8)',
    'linear-gradient(135deg, #bca8d4, #80a8d0)',
    'linear-gradient(120deg, #72cc96, #78b0c8)',
    'linear-gradient(135deg, #78a8d0, #1a4888)',
    'linear-gradient(135deg, #a0c0cc, #303050)',
    // Raycast
    'linear-gradient(140deg, #a82a7c, #5834c0)',
    'linear-gradient(140deg, #8a78cc, #c4a4d0)',
    'linear-gradient(140deg, #cc5454, #603030)',
    'linear-gradient(140deg, #4aac80, #887428)',
    'linear-gradient(140deg, #40a4a4, #1c1c2c)',
    // Multi-stop
    'linear-gradient(135deg, #182458, #8c1c1c, #cc9c28)',
    'linear-gradient(135deg, #0c0a20, #282450, #1e1e34)',
    'linear-gradient(to right, #cc6c64, #8c2448)',
    'linear-gradient(120deg, #a8cc64, #7cbc84)',
    'linear-gradient(to top, #d4b8ac, #d8b4d8)',
    // Mesh
    'radial-gradient(at 15% 15%, #7c3aed 0%, transparent 55%), radial-gradient(at 85% 25%, #22d3ee 0%, transparent 55%), radial-gradient(at 50% 100%, #f0abfc 0%, transparent 60%), #07070f',
    'radial-gradient(at 0% 30%, #34d399 0%, transparent 50%), radial-gradient(at 90% 10%, #38bdf8 0%, transparent 55%), radial-gradient(at 60% 100%, #818cf8 0%, transparent 55%), #05080f',
    'radial-gradient(at 20% 0%, #fb7185 0%, transparent 55%), radial-gradient(at 100% 40%, #fbbf24 0%, transparent 55%), radial-gradient(at 30% 100%, #c084fc 0%, transparent 55%), #0d0710',
    'radial-gradient(at 30% 20%, #fda4af 0%, transparent 55%), radial-gradient(at 80% 0%, #fcd34d 0%, transparent 50%), radial-gradient(at 70% 90%, #a5b4fc 0%, transparent 55%), #fdf6f0',
    'radial-gradient(at 10% 90%, #67e8f9 0%, transparent 55%), radial-gradient(at 90% 80%, #c4b5fd 0%, transparent 55%), radial-gradient(at 50% 0%, #f9a8d4 0%, transparent 55%), #f4f7fd',
    'radial-gradient(at 40% 20%, #e73c7e 0%, transparent 50%), radial-gradient(at 80% 0%, #ee7752 0%, transparent 50%), radial-gradient(at 0% 50%, #23a6d5 0%, transparent 50%), radial-gradient(at 80% 80%, #23d5ab 0%, transparent 50%), #0f0f0f',
    'radial-gradient(at 0% 0%, #7928ca 0%, transparent 50%), radial-gradient(at 100% 0%, #ff0080 0%, transparent 50%), radial-gradient(at 100% 100%, #ff4d4d 0%, transparent 50%), radial-gradient(at 0% 100%, #0070f3 0%, transparent 50%), #0a0a0a',
    'radial-gradient(at 20% 80%, #fbc2eb 0%, transparent 50%), radial-gradient(at 80% 20%, #a6c1ee 0%, transparent 50%), radial-gradient(at 50% 50%, #fad0c4 0%, transparent 50%), #1a1a2e',
    'radial-gradient(at 30% 0%, #00d2ff 0%, transparent 50%), radial-gradient(at 100% 50%, #3a7bd5 0%, transparent 50%), radial-gradient(at 0% 100%, #00b09b 0%, transparent 50%), #0a0a0a',
    'radial-gradient(at 50% 0%, #9796f0 0%, transparent 50%), radial-gradient(at 100% 100%, #fbc7d4 0%, transparent 50%), radial-gradient(at 0% 50%, #c2e9fb 0%, transparent 50%), #111',
    'radial-gradient(at 0% 0%, #ff6a00 0%, transparent 50%), radial-gradient(at 100% 0%, #ee0979 0%, transparent 50%), radial-gradient(at 50% 100%, #ff6a00 0%, transparent 50%), #0f0f0f',
    'radial-gradient(at 50% 0%, #f7971e 0%, transparent 50%), radial-gradient(at 100% 50%, #ffd200 0%, transparent 50%), radial-gradient(at 0% 100%, #f7971e 0%, transparent 50%), #1a0a00',
    'radial-gradient(at 0% 50%, #8b5cf6 0%, transparent 50%), radial-gradient(at 100% 0%, #06b6d4 0%, transparent 50%), radial-gradient(at 80% 100%, #ec4899 0%, transparent 50%), #0c0c14',
    'radial-gradient(at 40% 0%, #3b82f6 0%, transparent 50%), radial-gradient(at 100% 100%, #8b5cf6 0%, transparent 50%), radial-gradient(at 0% 80%, #06b6d4 0%, transparent 50%), #050510',
    'radial-gradient(at 80% 20%, #f43f5e 0%, transparent 50%), radial-gradient(at 0% 80%, #a855f7 0%, transparent 50%), radial-gradient(at 50% 50%, #3b82f6 0%, transparent 50%), #0a0a12',
    // Dark
    'linear-gradient(135deg, #0f0f0f, #1a1a2e)',
    'linear-gradient(135deg, #16222a, #3a6073)',
    'linear-gradient(135deg, #141e30, #243b55)',
    'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
    'linear-gradient(135deg, #1f1c2c, #928dab)',
    'linear-gradient(140deg, #232323, #1F1F1F)',
    'linear-gradient(140deg, #0a2540, #0a2540)',
    'linear-gradient(135deg, #506853, #213223)',
    'linear-gradient(140deg, #333, #181818)',
    'linear-gradient(135deg, #08203e, #557c93)',
  ],
  // Soft blurred-blob "aura" gradients, hand-built in CSS
  'Aura': [
    'radial-gradient(ellipse 80% 60% at 50% 115%, #3634de 0%, rgba(54,52,222,0.5) 50%, rgba(228,228,238,0) 80%), linear-gradient(180deg, #ececf2, #d8d8e2)',
    'radial-gradient(ellipse 75% 55% at 50% 112%, #7c5cff 0%, rgba(124,92,255,0.45) 50%, rgba(245,242,255,0) 80%), linear-gradient(180deg, #f4f1fb, #e6e0f4)',
    'radial-gradient(circle at 50% 70%, #ff7a59 0%, rgba(255,122,89,0.55) 30%, rgba(255,238,230,0) 65%), radial-gradient(circle at 50% 45%, #ff4f8b 0%, rgba(255,79,139,0.35) 40%, rgba(255,240,244,0) 75%), linear-gradient(180deg, #ffeef0, #ffe2d8)',
    'radial-gradient(ellipse 70% 55% at 50% 110%, #22b573 0%, rgba(34,181,115,0.4) 55%, rgba(238,247,240,0) 82%), linear-gradient(180deg, #eff7f1, #dcece1)',
    'radial-gradient(ellipse 85% 60% at 50% 118%, #ff9d5c 0%, rgba(255,157,92,0.5) 50%, rgba(255,244,234,0) 80%), linear-gradient(180deg, #fff3e8, #ffe4cc)',
    'radial-gradient(circle at 50% -20%, #4f8bff 0%, rgba(79,139,255,0.4) 45%, rgba(238,244,255,0) 75%), linear-gradient(180deg, #eef4ff, #dfe9fb)',
    'radial-gradient(circle at 30% 80%, #c4a5f5 0%, rgba(196,165,245,0.4) 40%, rgba(248,245,255,0) 72%), radial-gradient(circle at 75% 25%, #93b8f8 0%, rgba(147,184,248,0.35) 38%, rgba(248,245,255,0) 70%), linear-gradient(180deg, #f6f3fd, #ebe6f8)',
    'radial-gradient(circle at 25% 30%, #ff8fb3 0%, rgba(255,143,179,0.45) 30%, rgba(255,247,250,0) 60%), radial-gradient(circle at 75% 75%, #ff6584 0%, rgba(255,101,132,0.4) 35%, rgba(255,247,250,0) 68%), linear-gradient(180deg, #fff5f8, #ffe9ef)',
    'radial-gradient(circle at 70% 85%, #37d6c3 0%, rgba(55,214,195,0.45) 40%, rgba(240,252,250,0) 72%), radial-gradient(circle at 25% 20%, #7ee8a2 0%, rgba(126,232,162,0.35) 35%, rgba(240,252,250,0) 68%), linear-gradient(180deg, #f0fbf8, #ddf2ec)',
    'radial-gradient(ellipse 70% 60% at 15% 110%, #e8a33d 0%, rgba(232,163,61,0.5) 40%, rgba(24,22,18,0) 75%), linear-gradient(180deg, #201d18, #191713)',
    'radial-gradient(ellipse 80% 60% at 50% 120%, #4338ca 0%, rgba(67,56,202,0.5) 45%, rgba(10,10,20,0) 78%), linear-gradient(180deg, #101018, #0a0a12)',
    'radial-gradient(circle at 80% 90%, #d946ef 0%, rgba(217,70,239,0.4) 35%, rgba(16,10,18,0) 70%), radial-gradient(circle at 20% 100%, #7c3aed 0%, rgba(124,58,237,0.45) 40%, rgba(16,10,18,0) 72%), linear-gradient(180deg, #14101a, #0d0a12)',
  ],
  'Solid': [
    '#ffffff', '#f5f5f5', '#e5e5e5', '#d4d4d4',
    '#171717', '#0a0a0a', '#000000', '#1e293b',
    '#ef4444', '#f97316', '#eab308', '#22c55e',
    '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4',
    '#fef3c7', '#dbeafe', '#dcfce7', '#fce7f3',
    '#334155', '#14b8a6', '#f43f5e', '#0ea5e9',
  ],
}

const isMac = typeof navigator !== 'undefined' && navigator.platform?.includes('Mac')
const modKey = isMac ? '⌘' : 'Ctrl'

const MAX_UNDO = 50

// IndexedDB helpers for storing large image data
const DB_NAME = 'animate_app'
const DB_VERSION = 1
const STORE_NAME = 'images'

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE_NAME)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function saveToIDB(key, value) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

async function loadFromIDB(key) {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function loadSession(key, fallback) {
  try {
    const val = sessionStorage.getItem('animate_' + key)
    return val !== null ? JSON.parse(val) : fallback
  } catch { return fallback }
}

function VideoFrameView({ videoSrc, videoTime }) {
  const canvasRef = useRef(null)
  const videoRef = useRef(null)
  const lastTimeRef = useRef(-1)

  useEffect(() => {
    if (!videoSrc) return
    const video = document.createElement('video')
    video.muted = true
    video.preload = 'auto'
    video.playsInline = true
    video.src = videoSrc
    videoRef.current = video
    return () => { video.pause(); video.src = '' }
  }, [videoSrc])

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const t = Math.max(0, videoTime)
    if (Math.abs(t - lastTimeRef.current) < 0.03) return
    lastTimeRef.current = t

    const draw = () => {
      const ctx = canvas.getContext('2d')
      canvas.width = video.videoWidth || canvas.clientWidth
      canvas.height = video.videoHeight || canvas.clientHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    }

    if (video.readyState >= 2) {
      video.currentTime = t
      video.onseeked = draw
    } else {
      video.onloadeddata = () => {
        video.currentTime = t
        video.onseeked = draw
      }
    }
  }, [videoTime])

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
}

function App() {
  const [format, setFormat] = useState(() => loadSession('format', 'Dribbble shot HD'))
  const [artboardWidth, setArtboardWidth] = useState(() => loadSession('artboardWidth', 1600))
  const [artboardHeight, setArtboardHeight] = useState(() => loadSession('artboardHeight', 1200))
  const [duration, setDuration] = useState(() => loadSession('duration', 4))
  const [images, setImages] = useState([])
  const [activeTab, setActiveTab] = useState('container')
  const [selectedIds, setSelectedIds] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [exportProgress, setExportProgress] = useState(null) // null = not exporting, { format, progress: 0-1, status }
  const [artboardBg, setArtboardBg] = useState(() => loadSession('artboardBg', '#ffffff'))
  const [noise, setNoise] = useState(() => loadSession('noise', 0))
  const [dither, setDither] = useState(() => loadSession('dither', 0))
  const [scanlines, setScanlines] = useState(() => loadSession('scanlines', 0))
  const [vignette, setVignette] = useState(() => loadSession('vignette', 0))
  const [expandedBgGroups, setExpandedBgGroups] = useState([])
  const [bgPickerOpen, setBgPickerOpen] = useState(false)
  const [autoFitDuration, setAutoFitDuration] = useState(true)
  const [playbackTime, setPlaybackTime] = useState(0)
  const [dragging, setDragging] = useState(null)
  const [canvasDragOver, setCanvasDragOver] = useState(false)
  const [sidebarDrag, setSidebarDrag] = useState(null)
  const [sidebarDragOver, setSidebarDragOver] = useState(null)
  // Batch sequence controls
  const [batchAnimation, setBatchAnimation] = useState('fadeIn')
  const [batchEasing, setBatchEasing] = useState('ease-out-cubic')
  const [batchAnimDuration, setBatchAnimDuration] = useState(0.6)
  const [batchDelay, setBatchDelay] = useState(0.2)
  const [batchOverlap, setBatchOverlap] = useState(0)
  const [batchExitAnimation, setBatchExitAnimation] = useState(true)
  const [batchExitType, setBatchExitType] = useState('fadeIn')
  const [batchExitEasing, setBatchExitEasing] = useState('linear')
  const [batchExitDuration, setBatchExitDuration] = useState(0.3)
  const [showFirstFrame, setShowFirstFrame] = useState(true)
  const [firstFrameDuration, setFirstFrameDuration] = useState(0.5)
  const [firstFrameDelay, setFirstFrameDelay] = useState(0.3)
  // Canvas zoom & pan
  const [canvasZoom, setCanvasZoom] = useState(null) // null = auto-fit
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [spaceHeld, setSpaceHeld] = useState(false)
  const panStart = useRef(null)
  const canvasAreaRef = useRef(null)
  const fileInputRef = useRef(null)
  const animationFrameRef = useRef(null)
  const playAnimationRef = useRef(null)
  const imagesLoadedFromDB = useRef(false)

  // Load images from IndexedDB on mount
  useEffect(() => {
    loadFromIDB('images').then((stored) => {
      if (stored && Array.isArray(stored) && stored.length > 0) {
        setImages(stored)
      }
      imagesLoadedFromDB.current = true
    }).catch(() => {
      imagesLoadedFromDB.current = true
    })
  }, [])

  // Persist settings to sessionStorage (small data only)
  useEffect(() => {
    sessionStorage.setItem('animate_format', JSON.stringify(format))
    sessionStorage.setItem('animate_artboardWidth', JSON.stringify(artboardWidth))
    sessionStorage.setItem('animate_artboardHeight', JSON.stringify(artboardHeight))
    sessionStorage.setItem('animate_duration', JSON.stringify(duration))
    sessionStorage.setItem('animate_artboardBg', JSON.stringify(artboardBg))
    sessionStorage.setItem('animate_noise', JSON.stringify(noise))
    sessionStorage.setItem('animate_dither', JSON.stringify(dither))
    sessionStorage.setItem('animate_scanlines', JSON.stringify(scanlines))
    sessionStorage.setItem('animate_vignette', JSON.stringify(vignette))
  }, [format, artboardWidth, artboardHeight, duration, artboardBg, noise, dither, scanlines, vignette])

  // Persist images to IndexedDB (handles large data)
  useEffect(() => {
    if (!imagesLoadedFromDB.current) return
    saveToIDB('images', images).catch(() => {})
  }, [images])

  // Undo history
  const undoStack = useRef([])
  const redoStack = useRef([])
  const isUndoRedoing = useRef(false)

  const pushUndo = useCallback((prev) => {
    if (isUndoRedoing.current) return
    undoStack.current.push(JSON.stringify(prev))
    if (undoStack.current.length > MAX_UNDO) undoStack.current.shift()
    redoStack.current = []
  }, [])

  const setImagesWithUndo = useCallback((updater) => {
    setImages((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      if (next !== prev) pushUndo(prev)
      return next
    })
  }, [pushUndo])

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return
    const entry = undoStack.current.pop()
    if (!entry || entry === 'undefined') return
    setImages((prev) => {
      redoStack.current.push(JSON.stringify(prev))
      isUndoRedoing.current = true
      const restored = JSON.parse(entry)
      setTimeout(() => { isUndoRedoing.current = false }, 0)
      return restored
    })
  }, [])

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return
    const entry = redoStack.current.pop()
    if (!entry || entry === 'undefined') return
    setImages((prev) => {
      undoStack.current.push(JSON.stringify(prev))
      isUndoRedoing.current = true
      const restored = JSON.parse(entry)
      setTimeout(() => { isUndoRedoing.current = false }, 0)
      return restored
    })
  }, [])

  // Keyboard shortcuts
  const spaceDownTime = useRef(0)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return

      // Track space press time for play/pause vs pan
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault()
        spaceDownTime.current = Date.now()
        return
      }
      if (e.code === 'Space') {
        e.preventDefault()
        return
      }

      // Cmd+0 = zoom to fit
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault()
        zoomToFit()
        return
      }

      // Cmd++ / Cmd+= = zoom in, Cmd+- = zoom out (anchored at canvas center)
      if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        zoomBy(1.25)
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault()
        zoomBy(0.8)
        return
      }

      // Cmd+Option+1/2/3 = Container/Layers/Animate tab
      if (!isPlaying && (e.metaKey || e.ctrlKey) && e.altKey && (e.key === '1' || e.code === 'Digit1')) {
        e.preventDefault()
        setActiveTab('container')
        return
      }
      if (!isPlaying && (e.metaKey || e.ctrlKey) && e.altKey && (e.key === '2' || e.code === 'Digit2')) {
        e.preventDefault()
        setActiveTab('layers')
        return
      }
      if (!isPlaying && (e.metaKey || e.ctrlKey) && e.altKey && (e.key === '3' || e.code === 'Digit3')) {
        e.preventDefault()
        setActiveTab('animate')
        return
      }

      // Cmd+Z / Ctrl+Z = undo, Cmd+Shift+Z / Ctrl+Shift+Z = redo
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
      }

      // Cmd+A / Ctrl+A = select all
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault()
        setSelectedIds(images.map((img) => img.id))
      }

      // Delete/Backspace = remove selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length > 0) {
          e.preventDefault()
          setImagesWithUndo((prev) => prev.filter((img) => !selectedIds.includes(img.id)))
          setSelectedIds([])
        }
      }
    }
    const handleKeyUp = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return
      // Space quick tap = pause/resume, Shift+Space = restart from start
      if (e.code === 'Space' && Date.now() - spaceDownTime.current < 200) {
        if (isPlaying) {
          setIsPlaying(false)
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
        } else {
          playAnimationRef.current(e.shiftKey || playbackTime >= duration)
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isPlaying, images, selectedIds, undo, redo])

  const handleFormatChange = (e) => {
    const f = e.target.value
    setFormat(f)
    if (FORMAT_PRESETS[f]) {
      setArtboardWidth(FORMAT_PRESETS[f].width)
      setArtboardHeight(FORMAT_PRESETS[f].height)
    }
  }

  const naturalSort = (a, b) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  }

  const addImageFiles = useCallback((files) => {
    const sorted = Array.from(files)
      .filter((f) => f.type.startsWith('image/') || f.type === 'video/mp4')
      .sort((a, b) => naturalSort(a.name, b.name))

    Promise.all(
      sorted.map(
        (file) =>
          new Promise((resolve) => {
            if (file.type === 'video/mp4') {
              const videoUrl = URL.createObjectURL(file)
              const video = document.createElement('video')
              video.muted = true
              video.preload = 'metadata'
              let detectedDuration = 0
              video.onloadedmetadata = () => {
                detectedDuration = (video.duration && isFinite(video.duration)) ? video.duration : 0
                video.currentTime = 0.01
              }
              video.onseeked = () => {
                const canvas = document.createElement('canvas')
                canvas.width = video.videoWidth
                canvas.height = video.videoHeight
                const ctx = canvas.getContext('2d')
                ctx.drawImage(video, 0, 0)
                const poster = canvas.toDataURL('image/png')
                const reader = new FileReader()
                reader.onload = (ev) => {
                  resolve({
                    src: poster,
                    videoSrc: ev.target.result,
                    name: file.name,
                    naturalWidth: video.videoWidth,
                    naturalHeight: video.videoHeight,
                    isVideo: true,
                    videoDuration: Math.round(detectedDuration * 10) / 10,
                  })
                  URL.revokeObjectURL(videoUrl)
                }
                reader.readAsDataURL(file)
              }
              video.src = videoUrl
            } else {
              const reader = new FileReader()
              reader.onload = (ev) => {
                const img = new Image()
                img.onload = () => {
                  resolve({
                    src: ev.target.result,
                    name: file.name,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                  })
                }
                img.src = ev.target.result
              }
              reader.readAsDataURL(file)
            }
          })
      )
    ).then((loaded) => {
      setImagesWithUndo((prev) => {
        const all = [
          ...prev,
          ...loaded.map((item, i) => {
            // Fit to canvas width when the image is wider than the artboard; otherwise keep natural size
            const fit = item.naturalWidth > artboardWidth ? artboardWidth / item.naturalWidth : 1
            const w = Math.round(item.naturalWidth * fit)
            const h = Math.round(item.naturalHeight * fit)
            return {
              id: Date.now() + Math.random() + i,
              src: item.src,
              videoSrc: item.videoSrc || null,
              isVideo: item.isVideo || false,
              videoDuration: item.videoDuration || 0,
              name: item.name,
              x: Math.round((artboardWidth - w) / 2),
              y: Math.round((artboardHeight - h) / 2),
              width: w,
              height: h,
              borderRadius: 0,
              borderSize: 0,
              frameStyle: 'none',
              borderColor: '#ffffff',
            }
          }),
        ]
        // Apply batch sequence — use running cursor to account for varying durations
        let cursor = 0
        return all.map((img, i) => {
          const hold = img.exitDelay || (img.isVideo && img.videoDuration ? Math.round(img.videoDuration * 10) / 10 : batchDelay)
          const hasEntry = img.entryAnimation !== false
          const entryDur = hasEntry ? (img.animDuration || batchAnimDuration) : 0
          const exitDur = batchExitAnimation ? (img.exitDuration || batchExitDuration) : 0
          const delay = +cursor.toFixed(2)
          const cycle = entryDur + hold + exitDur
          cursor += Math.max(0.05, cycle - batchOverlap)
          return {
            ...img,
            animation: img.animation || batchAnimation,
            easing: img.easing || batchEasing,
            animDuration: entryDur,
            delay,
            exitAnimation: batchExitAnimation,
            exitType: img.exitType || batchExitType,
            exitEasing: img.exitEasing || batchExitEasing,
            exitDuration: img.exitDuration || batchExitDuration,
            exitDelay: hold,
          }
        })
      })
    })
  }, [setImagesWithUndo, batchAnimation, batchEasing, batchAnimDuration, batchDelay, batchOverlap, batchExitAnimation, batchExitType, batchExitEasing, batchExitDuration, artboardWidth, artboardHeight])

  // Cmd/Ctrl+V — paste an image from the clipboard onto the artboard
  useEffect(() => {
    const handlePaste = (e) => {
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return
      const items = e.clipboardData?.items
      if (!items) return
      const files = []
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            files.push(file.name ? file : new File([file], `pasted-image.${(item.type.split('/')[1] || 'png')}`, { type: item.type }))
          }
        }
      }
      if (files.length > 0) {
        e.preventDefault()
        addImageFiles(files)
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [addImageFiles])

  const handleImageUpload = (e) => {
    addImageFiles(e.target.files)
    e.target.value = ''
  }

  const handleCanvasDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCanvasDragOver(true)
  }

  const handleCanvasDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCanvasDragOver(false)
  }

  const handleCanvasDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setCanvasDragOver(false)
    if (e.dataTransfer.files.length > 0) {
      addImageFiles(e.dataTransfer.files)
    }
  }

  const updateImage = (id, updates) => {
    setImagesWithUndo((prev) => prev.map((img) => (img.id === id ? { ...img, ...updates } : img)))
  }

  const updateSelectedImages = (updates) => {
    setImagesWithUndo((prev) => prev.map((img) => (selectedIds.includes(img.id) ? { ...img, ...updates } : img)))
  }

  const removeImage = (id) => {
    setImagesWithUndo((prev) => prev.filter((img) => img.id !== id))
    setSelectedIds((prev) => prev.filter((sid) => sid !== id))
  }

  const applyBatchSequence = () => {
    if (images.length === 0) return
    setImagesWithUndo((prev) => {
      let cursor = 0
      return prev.map((img, i) => {
        const hold = img.isVideo && img.exitDelay ? img.exitDelay : batchDelay
        const hasEntry = img.entryAnimation !== false
        const entryDur = hasEntry ? batchAnimDuration : 0
        const delay = +cursor.toFixed(2)
        const cycle = entryDur + hold + (batchExitAnimation ? batchExitDuration : 0)
        cursor += Math.max(0.05, cycle - batchOverlap)
        return {
          ...img,
          animation: batchAnimation,
          easing: batchEasing,
          animDuration: batchAnimDuration,
          delay,
          exitAnimation: batchExitAnimation,
          exitType: batchExitType,
          exitEasing: batchExitEasing,
          exitDuration: batchExitDuration,
          exitDelay: hold,
        }
      })
    })
    // Auto-fit duration
    const offset = showFirstFrame ? firstFrameDuration + firstFrameDelay : 0
    let cursor = 0
    for (const img of images) {
      const hold = img.isVideo && img.exitDelay ? img.exitDelay : batchDelay
      const hasEntry = img.entryAnimation !== false
      const entryDur = hasEntry ? batchAnimDuration : 0
      const cycle = entryDur + hold + (batchExitAnimation ? batchExitDuration : 0)
      cursor += Math.max(0.05, cycle - batchOverlap)
    }
    setDuration(+(cursor + offset + 0.2).toFixed(1))
  }

  const getContentDuration = () => {
    const offset = showFirstFrame ? firstFrameDuration + firstFrameDelay : 0
    let maxEnd = 0
    for (const img of images) {
      let end = img.delay + img.animDuration
      if (img.exitAnimation) {
        end += (img.exitDelay || 0) + (img.exitDuration || img.animDuration)
      }
      if (end > maxEnd) maxEnd = end
    }
    return +(maxEnd + offset + 0.2).toFixed(1)
  }

  const fitDurationToContent = () => {
    if (images.length === 0) return
    setDuration(getContentDuration())
  }

  // Compute a fingerprint of all timing-related values
  const timingFingerprint = images.map(img => `${img.delay}|${img.animDuration}|${img.exitAnimation}|${img.exitDuration}|${img.exitDelay}`).join(',')

  // Auto-fit duration when anything affecting total time changes
  useEffect(() => {
    if (!autoFitDuration || images.length === 0) return
    setDuration(getContentDuration())
  }, [timingFingerprint, autoFitDuration, showFirstFrame, firstFrameDuration, firstFrameDelay, images.length])

  // Alignment functions — forceArtboard=true aligns to artboard even with multi-select
  const alignSelected = (alignment, forceArtboard = false) => {
    const ids = selectedIds.length > 0 ? selectedIds : []
    if (ids.length === 0) return

    setImagesWithUndo((prev) => {
      const selected = prev.filter((img) => ids.includes(img.id))
      if (selected.length === 0) return prev

      if (selected.length === 1 || forceArtboard) {
        // Align to artboard
        return prev.map((img) => {
          if (!ids.includes(img.id)) return img
          switch (alignment) {
            case 'left': return { ...img, x: 0 }
            case 'centerH': return { ...img, x: Math.round((artboardWidth - img.width) / 2) }
            case 'right': return { ...img, x: artboardWidth - img.width }
            case 'top': return { ...img, y: 0 }
            case 'centerV': return { ...img, y: Math.round((artboardHeight - img.height) / 2) }
            case 'bottom': return { ...img, y: artboardHeight - img.height }
            default: return img
          }
        })
      }

      // Align multiple to each other
      const bounds = {
        minX: Math.min(...selected.map((i) => i.x)),
        maxX: Math.max(...selected.map((i) => i.x + i.width)),
        minY: Math.min(...selected.map((i) => i.y)),
        maxY: Math.max(...selected.map((i) => i.y + i.height)),
      }

      return prev.map((img) => {
        if (!ids.includes(img.id)) return img
        switch (alignment) {
          case 'left': return { ...img, x: bounds.minX }
          case 'centerH': return { ...img, x: Math.round(bounds.minX + (bounds.maxX - bounds.minX) / 2 - img.width / 2) }
          case 'right': return { ...img, x: bounds.maxX - img.width }
          case 'top': return { ...img, y: bounds.minY }
          case 'centerV': return { ...img, y: Math.round(bounds.minY + (bounds.maxY - bounds.minY) / 2 - img.height / 2) }
          case 'bottom': return { ...img, y: bounds.maxY - img.height }
          default: return img
        }
      })
    })
  }

  const distributeSelected = (axis) => {
    if (selectedIds.length < 3) return
    setImagesWithUndo((prev) => {
      const selected = prev.filter((img) => selectedIds.includes(img.id))
      if (axis === 'horizontal') {
        const sorted = [...selected].sort((a, b) => a.x - b.x)
        const totalWidth = sorted.reduce((sum, img) => sum + img.width, 0)
        const minX = sorted[0].x
        const maxX = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width
        const gap = (maxX - minX - totalWidth) / (sorted.length - 1)
        let currentX = minX
        const updates = {}
        sorted.forEach((img) => {
          updates[img.id] = { x: Math.round(currentX) }
          currentX += img.width + gap
        })
        return prev.map((img) => (updates[img.id] ? { ...img, ...updates[img.id] } : img))
      } else {
        const sorted = [...selected].sort((a, b) => a.y - b.y)
        const totalHeight = sorted.reduce((sum, img) => sum + img.height, 0)
        const minY = sorted[0].y
        const maxY = sorted[sorted.length - 1].y + sorted[sorted.length - 1].height
        const gap = (maxY - minY - totalHeight) / (sorted.length - 1)
        let currentY = minY
        const updates = {}
        sorted.forEach((img) => {
          updates[img.id] = { y: Math.round(currentY) }
          currentY += img.height + gap
        })
        return prev.map((img) => (updates[img.id] ? { ...img, ...updates[img.id] } : img))
      }
    })
  }

  const getAutoFitScale = () => {
    const maxW = window.innerWidth - 620
    const maxH = window.innerHeight - 160
    return Math.min(1, maxW / artboardWidth, maxH / artboardHeight)
  }

  const getArtboardScale = () => {
    return canvasZoom !== null ? canvasZoom : getAutoFitScale()
  }

  // At auto-fit the content is flex-centered while pan state is (0,0);
  // this returns the pan that matches what's actually on screen.
  const getEffectivePan = (rect, zoom) => {
    if (canvasZoom !== null) return canvasPan
    return {
      x: (rect.width - artboardWidth * zoom) / 2,
      y: (rect.height - artboardHeight * zoom) / 2,
    }
  }

  const zoomAtPoint = (targetZoom, anchorX, anchorY) => {
    const el = canvasAreaRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const currentZoom = canvasZoom !== null ? canvasZoom : getAutoFitScale()
    const basePan = getEffectivePan(rect, currentZoom)
    const newZoom = Math.min(8, Math.max(0.05, targetZoom))
    const scaleChange = newZoom / currentZoom
    setCanvasZoom(newZoom)
    setCanvasPan({
      x: anchorX - scaleChange * (anchorX - basePan.x),
      y: anchorY - scaleChange * (anchorY - basePan.y),
    })
  }

  const zoomBy = (factor) => {
    const el = canvasAreaRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const currentZoom = canvasZoom !== null ? canvasZoom : getAutoFitScale()
    zoomAtPoint(currentZoom * factor, rect.width / 2, rect.height / 2)
  }

  const zoomToFit = () => {
    setCanvasZoom(null)
    setCanvasPan({ x: 0, y: 0 })
  }

  // Zoom with scroll wheel (Cmd/Ctrl+scroll or pinch)
  useEffect(() => {
    const el = canvasAreaRef.current
    if (!el) return
    const handleWheel = (e) => {
      // Don't intercept scroll when over timeline or panel
      if (e.target.closest('.timeline') || e.target.closest('.panel') || e.target.closest('.easing-popover')) return
      if (e.ctrlKey || e.metaKey) {
        // Zoom
        e.preventDefault()
        const currentZoom = canvasZoom !== null ? canvasZoom : getAutoFitScale()
        const delta = -e.deltaY * 0.002
        const newZoom = Math.min(8, Math.max(0.05, currentZoom * (1 + delta)))

        // Zoom toward cursor position
        const rect = el.getBoundingClientRect()
        const cursorX = e.clientX - rect.left
        const cursorY = e.clientY - rect.top

        const basePan = getEffectivePan(rect, currentZoom)
        const scaleChange = newZoom / currentZoom
        const newPanX = cursorX - scaleChange * (cursorX - basePan.x)
        const newPanY = cursorY - scaleChange * (cursorY - basePan.y)

        setCanvasZoom(newZoom)
        setCanvasPan({ x: newPanX, y: newPanY })
      } else {
        // Pan with scroll — only useful when zoomed in past fit
        e.preventDefault()
        if (canvasZoom === null || canvasZoom <= getAutoFitScale()) return
        setCanvasPan((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }))
      }
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [canvasZoom, canvasPan, artboardWidth, artboardHeight])

  // Space key for pan mode
  useEffect(() => {
    const down = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return
      if (e.code === 'Space' && !e.repeat) {
        setSpaceHeld(true)
      }
    }
    const up = (e) => {
      if (e.code === 'Space') {
        setSpaceHeld(false)
      }
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  // Pan with middle mouse or space+drag — only when zoomed in past fit
  const canPan = canvasZoom !== null && canvasZoom > getAutoFitScale()

  const handleCanvasPanStart = (e) => {
    if (!canPan) return
    if (e.button === 1 || (spaceHeld && e.button === 0)) {
      e.preventDefault()
      setIsPanning(true)
      panStart.current = { x: e.clientX - canvasPan.x, y: e.clientY - canvasPan.y }
    }
  }

  useEffect(() => {
    if (!isPanning) return
    const handleMove = (e) => {
      setCanvasPan({
        x: e.clientX - panStart.current.x,
        y: e.clientY - panStart.current.y,
      })
    }
    const handleUp = () => setIsPanning(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isPanning])

  // Multi-select click handling
  const handleLayerClick = (e, imgId) => {
    if (e.metaKey || e.ctrlKey) {
      // Toggle selection
      setSelectedIds((prev) =>
        prev.includes(imgId) ? prev.filter((id) => id !== imgId) : [...prev, imgId]
      )
    } else if (e.shiftKey && selectedIds.length > 0) {
      // Range select
      const lastSelected = selectedIds[selectedIds.length - 1]
      const lastIdx = images.findIndex((img) => img.id === lastSelected)
      const clickIdx = images.findIndex((img) => img.id === imgId)
      const [from, to] = [Math.min(lastIdx, clickIdx), Math.max(lastIdx, clickIdx)]
      const rangeIds = images.slice(from, to + 1).map((img) => img.id)
      setSelectedIds((prev) => [...new Set([...prev, ...rangeIds])])
    } else {
      setSelectedIds([imgId])
    }
  }

  // Canvas dragging (move) and resizing
  const handleArtboardMouseDown = (e, imgId, handle = null) => {
    e.stopPropagation()
    e.preventDefault()
    // If clicking an unselected image without modifier, select just it
    if (!selectedIds.includes(imgId)) {
      setSelectedIds([imgId])
    }
    const img = images.find((i) => i.id === imgId)
    const scale = getArtboardScale()
    setDragging({
      id: imgId,
      handle,
      startMouseX: e.clientX,
      startMouseY: e.clientY,
      startX: img.x,
      startY: img.y,
      startW: img.width,
      startH: img.height,
      scale,
      aspectRatio: img.width / img.height,
      // Snapshot all selected images for multi-move
      selectedStarts: images
        .filter((i) => selectedIds.includes(i.id) || i.id === imgId)
        .map((i) => ({ id: i.id, x: i.x, y: i.y, width: i.width, height: i.height })),
      undoPushed: false,
    })
  }

  useEffect(() => {
    if (!dragging) return
    const handleMove = (e) => {
      const dx = (e.clientX - dragging.startMouseX) / dragging.scale
      const dy = (e.clientY - dragging.startMouseY) / dragging.scale

      if (!dragging.handle) {
        // Move all selected
        setImages((prev) => {
          if (!dragging.undoPushed) {
            pushUndo(prev)
            dragging.undoPushed = true
          }
          return prev.map((img) => {
            const snap = dragging.selectedStarts.find((s) => s.id === img.id)
            if (!snap) return img
            return { ...img, x: Math.round(snap.x + dx), y: Math.round(snap.y + dy) }
          })
        })
      } else {
        // Resize single image
        const h = dragging.handle
        let newW = dragging.startW
        let newH = dragging.startH
        let newX = dragging.startX
        let newY = dragging.startY

        if (h === 'se') {
          newW = Math.max(20, dragging.startW + dx)
          newH = newW / dragging.aspectRatio
        } else if (h === 'sw') {
          newW = Math.max(20, dragging.startW - dx)
          newH = newW / dragging.aspectRatio
          newX = dragging.startX + dragging.startW - newW
        } else if (h === 'ne') {
          newW = Math.max(20, dragging.startW + dx)
          newH = newW / dragging.aspectRatio
          newY = dragging.startY + dragging.startH - newH
        } else if (h === 'nw') {
          newW = Math.max(20, dragging.startW - dx)
          newH = newW / dragging.aspectRatio
          newX = dragging.startX + dragging.startW - newW
          newY = dragging.startY + dragging.startH - newH
        }

        setImages((prev) => {
          if (!dragging.undoPushed) {
            pushUndo(prev)
            dragging.undoPushed = true
          }
          return prev.map((img) =>
            img.id === dragging.id
              ? { ...img, x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) }
              : img
          )
        })
      }
    }
    const handleUp = () => setDragging(null)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [dragging])

  // Sidebar drag-to-reorder
  const handleSidebarDragStart = (e, imgId) => {
    setSidebarDrag(imgId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', imgId)
  }

  const handleSidebarDragOverItem = (e, imgId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setSidebarDragOver(imgId)
  }

  const handleSidebarDropItem = (e, targetId) => {
    e.preventDefault()
    if (!sidebarDrag || sidebarDrag === targetId) {
      setSidebarDrag(null)
      setSidebarDragOver(null)
      return
    }
    setImagesWithUndo((prev) => {
      const fromIdx = prev.findIndex((img) => img.id === sidebarDrag)
      const toIdx = prev.findIndex((img) => img.id === targetId)
      if (fromIdx === -1 || toIdx === -1) return prev
      const next = [...prev]
      const [moved] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, moved)
      return next
    })
    setSidebarDrag(null)
    setSidebarDragOver(null)
  }

  const handleSidebarDragEnd = () => {
    setSidebarDrag(null)
    setSidebarDragOver(null)
  }

  // Proportional resize for multi-selected layers
  const resizeSelectedProportionally = (targetWidth) => {
    if (selectedIds.length === 0 || !targetWidth || targetWidth <= 0) return
    setImagesWithUndo((prev) =>
      prev.map((img) => {
        if (!selectedIds.includes(img.id)) return img
        const ratio = targetWidth / img.width
        return {
          ...img,
          width: Math.round(targetWidth),
          height: Math.round(img.height * ratio),
        }
      })
    )
  }

  const resizeSelectedProportionallyByHeight = (targetHeight) => {
    if (selectedIds.length === 0 || !targetHeight || targetHeight <= 0) return
    setImagesWithUndo((prev) =>
      prev.map((img) => {
        if (!selectedIds.includes(img.id)) return img
        const ratio = targetHeight / img.height
        return {
          ...img,
          width: Math.round(img.width * ratio),
          height: Math.round(targetHeight),
        }
      })
    )
  }

  // Playback
  const playAnimation = useCallback((fromStart = false) => {
    setIsPlaying(true)
    const startFrom = fromStart ? 0 : playbackTime
    if (fromStart) setPlaybackTime(0)
    const startTime = performance.now()
    const dur = duration
    const remainingMs = (dur - startFrom) * 1000
    const tick = (now) => {
      const elapsed = now - startTime
      const t = Math.min(startFrom + (elapsed / 1000), dur)
      setPlaybackTime(t)
      if (t < dur) {
        animationFrameRef.current = requestAnimationFrame(tick)
      } else {
        setIsPlaying(false)
      }
    }
    animationFrameRef.current = requestAnimationFrame(tick)
  }, [duration, playbackTime])
  playAnimationRef.current = playAnimation

  const pauseAnimation = useCallback(() => {
    setIsPlaying(false)
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
  }, [])

  const stopAnimation = useCallback(() => {
    setIsPlaying(false)
    setPlaybackTime(0)
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
  }, [])

  const getInitialStyle = (animation) => {
    switch (animation) {
      case 'fadeIn': return { opacity: 0, transform: 'none' }
      case 'slideUp': return { opacity: 0, transform: 'translateY(60px)' }
      case 'slideDown': return { opacity: 0, transform: 'translateY(-60px)' }
      case 'slideLeft': return { opacity: 0, transform: 'translateX(60px)' }
      case 'slideRight': return { opacity: 0, transform: 'translateX(-60px)' }
      case 'scaleUp': return { opacity: 0, transform: 'scale(0.5)' }
      case 'scaleDown': return { opacity: 0, transform: 'scale(1.5)' }
      default: return { opacity: 0, transform: 'none' }
    }
  }

  const getExitStyle = (animation) => {
    // Exit is the reverse of enter
    switch (animation) {
      case 'fadeIn': return { opacity: 0, transform: 'none' }
      case 'slideUp': return { opacity: 0, transform: 'translateY(-60px)' }
      case 'slideDown': return { opacity: 0, transform: 'translateY(60px)' }
      case 'slideLeft': return { opacity: 0, transform: 'translateX(-60px)' }
      case 'slideRight': return { opacity: 0, transform: 'translateX(60px)' }
      case 'scaleUp': return { opacity: 0, transform: 'scale(1.5)' }
      case 'scaleDown': return { opacity: 0, transform: 'scale(0.5)' }
      default: return { opacity: 0, transform: 'none' }
    }
  }

  const getInterpolatedStyle = (animation, p) => {
    switch (animation) {
      case 'fadeIn': return { opacity: p, transform: 'none' }
      case 'slideUp': return { opacity: p, transform: `translateY(${60 * (1 - p)}px)` }
      case 'slideDown': return { opacity: p, transform: `translateY(${-60 * (1 - p)}px)` }
      case 'slideLeft': return { opacity: p, transform: `translateX(${60 * (1 - p)}px)` }
      case 'slideRight': return { opacity: p, transform: `translateX(${-60 * (1 - p)}px)` }
      case 'scaleUp': return { opacity: p, transform: `scale(${0.5 + 0.5 * p})` }
      case 'scaleDown': return { opacity: p, transform: `scale(${1.5 - 0.5 * p})` }
      default: return { opacity: p, transform: 'none' }
    }
  }

  const getExitInterpolatedStyle = (animation, p) => {
    // p goes from 0 (fully visible) to 1 (fully exited)
    switch (animation) {
      case 'fadeIn': return { opacity: 1 - p, transform: 'none' }
      case 'slideUp': return { opacity: 1 - p, transform: `translateY(${-60 * p}px)` }
      case 'slideDown': return { opacity: 1 - p, transform: `translateY(${60 * p}px)` }
      case 'slideLeft': return { opacity: 1 - p, transform: `translateX(${-60 * p}px)` }
      case 'slideRight': return { opacity: 1 - p, transform: `translateX(${60 * p}px)` }
      case 'scaleUp': return { opacity: 1 - p, transform: `scale(${1 + 0.5 * p})` }
      case 'scaleDown': return { opacity: 1 - p, transform: `scale(${1 - 0.5 * p})` }
      default: return { opacity: 1 - p, transform: 'none' }
    }
  }

  const getImageAnimStyle = (img) => {
    if (!isPlaying && playbackTime === 0) {
      if (activeTab === 'animate') {
        // Show the actual frame 0 state — run through the animation logic at t=0
      } else {
        return { opacity: 1, transform: 'none' }
      }
    }
    const t = playbackTime

    // Show first frame: only the first image visible during hold period
    if (showFirstFrame && t < firstFrameDuration + firstFrameDelay) {
      if (t < firstFrameDuration) {
        const isFirst = images.length > 0 && img.id === images[0].id
        return isFirst ? { opacity: 1, transform: 'none' } : { opacity: 0, transform: 'none' }
      }
      return { opacity: 0, transform: 'none' }
    }

    const offset = showFirstFrame ? firstFrameDuration + firstFrameDelay : 0
    const hasEntry = img.entryAnimation !== false
    const enterStart = img.delay + offset
    const enterEnd = hasEntry ? enterStart + img.animDuration : enterStart

    // Enter phase
    if (t < enterStart) return hasEntry ? getInitialStyle(img.animation) : { opacity: 0, transform: 'none' }
    if (hasEntry && t < enterEnd) {
      const linearProgress = (t - enterStart) / img.animDuration
      const progress = applyEasingOut(linearProgress, img.easing || 'ease-out')
      return getInterpolatedStyle(img.animation, progress)
    }

    // Exit phase — starts after entry + hold (delay between)
    if (img.exitAnimation) {
      const exitDur = img.exitDuration || img.animDuration
      const holdTime = img.exitDelay || 0
      const exitStart = enterEnd + holdTime
      const exitEnd = exitStart + exitDur
      const exitType = img.exitType || img.animation

      if (t >= exitStart && t < exitEnd) {
        const linearProgress = (t - exitStart) / exitDur
        const exitProgress = applyEasing(linearProgress, img.exitEasing || 'ease-in')
        return getExitInterpolatedStyle(exitType, exitProgress)
      }
      if (t >= exitEnd) {
        return { opacity: 0, transform: 'none' }
      }
    }

    return { opacity: 1, transform: 'none' }
  }

  // Render CSS background (gradient or solid) to a canvas
  const renderBgToCanvas = async (w, h) => {
    const div = document.createElement('div')
    div.style.cssText = `position:fixed;left:-9999px;width:${w}px;height:${h}px;background:${artboardBg}`
    document.body.appendChild(div)
    const bgCanvas = document.createElement('canvas')
    bgCanvas.width = w
    bgCanvas.height = h
    const bgCtx = bgCanvas.getContext('2d')
    // Use createImageBitmap from the div via foreignObject SVG
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px;background:${artboardBg.replace(/"/g, "'")}"></div></foreignObject></svg>`
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const img = new Image()
    await new Promise((resolve) => { img.onload = resolve; img.src = url })
    bgCtx.drawImage(img, 0, 0)
    URL.revokeObjectURL(url)
    document.body.removeChild(div)
    return bgCanvas
  }

  // Load background to canvas without tainting (for export)
  // Load layers for export — images as Image, videos as Video elements
  const loadLayersForExport = async () => {
    return Promise.all(
      images.map((img) => new Promise((resolve) => {
        if (img.isVideo && img.videoSrc) {
          const video = document.createElement('video')
          video.muted = true
          video.preload = 'auto'
          video.playsInline = true
          video.onloadeddata = () => resolve({ ...img, el: video, isVideoEl: true })
          video.onerror = () => {
            // Fallback to poster
            const el = new Image()
            el.onload = () => resolve({ ...img, el })
            el.src = img.src
          }
          video.src = img.videoSrc
        } else {
          const el = new Image()
          el.onload = () => resolve({ ...img, el })
          el.src = img.src
        }
      }))
    )
  }

  // Seek all video layers to the correct time for a given playback time
  const seekVideosForFrame = async (loadedImages, t) => {
    const offset = showFirstFrame ? firstFrameDuration + firstFrameDelay : 0
    const promises = loadedImages.filter(img => img.isVideoEl).map(img => {
      const hasEntry = img.entryAnimation !== false
      const entryEnd = img.delay + offset + (hasEntry ? img.animDuration : 0)
      const videoT = Math.max(0, t - entryEnd)
      return new Promise((resolve) => {
        if (Math.abs(img.el.currentTime - videoT) < 0.05) { resolve(); return }
        img.el.onseeked = () => resolve()
        img.el.currentTime = videoT
      })
    })
    await Promise.all(promises)
  }

  const loadBgForExport = async (w, h) => {
    if (artboardBg.includes('url(')) {
      const urlMatch = artboardBg.match(/url\(([^)]+)\)/)
      if (urlMatch) {
        const bgUrl = urlMatch[1].replace(/['"]/g, '')
        const bgCanvas = document.createElement('canvas')
        bgCanvas.width = w
        bgCanvas.height = h
        const bgCtx = bgCanvas.getContext('2d')
        const bgImg = new Image()
        bgImg.crossOrigin = 'anonymous'
        await new Promise((resolve) => { bgImg.onload = resolve; bgImg.onerror = resolve; bgImg.src = bgUrl })
        const s = Math.max(w / bgImg.naturalWidth, h / bgImg.naturalHeight)
        bgCtx.drawImage(bgImg, (w - bgImg.naturalWidth * s) / 2, (h - bgImg.naturalHeight * s) / 2, bgImg.naturalWidth * s, bgImg.naturalHeight * s)
        return bgCanvas
      }
    } else if (artboardBg.includes('gradient')) {
      const bgCanvas = document.createElement('canvas')
      bgCanvas.width = w
      bgCanvas.height = h
      const bgCtx = bgCanvas.getContext('2d')
      // Rasterize the exact CSS (multi-layer radial/linear gradients) via SVG foreignObject —
      // data: URL with no external refs, so the canvas stays untainted
      const esc = artboardBg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px;background:${esc}"></div></foreignObject></svg>`
      const svgImg = new Image()
      await new Promise((resolve) => { svgImg.onload = resolve; svgImg.onerror = resolve; svgImg.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) })
      if (svgImg.naturalWidth > 0) {
        try {
          bgCtx.drawImage(svgImg, 0, 0, w, h)
          return bgCanvas
        } catch { /* fall through to linear approximation */ }
      }
      // Fallback: approximate as a simple linear gradient
      const angleMatch = artboardBg.match(/(\d+)deg/)
      const angle = angleMatch ? +angleMatch[1] : 135
      const colors = artboardBg.match(/#[0-9a-fA-F]{3,8}/g) || ['#000000', '#000000']
      // Convert angle to gradient line coordinates
      const rad = (angle - 90) * Math.PI / 180
      const cx = w / 2, cy = h / 2
      const len = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad))
      const x1 = cx - Math.cos(rad) * len / 2
      const y1 = cy - Math.sin(rad) * len / 2
      const x2 = cx + Math.cos(rad) * len / 2
      const y2 = cy + Math.sin(rad) * len / 2
      const grad = bgCtx.createLinearGradient(x1, y1, x2, y2)
      colors.forEach((c, i) => grad.addColorStop(i / (colors.length - 1), c))
      bgCtx.fillStyle = grad
      bgCtx.fillRect(0, 0, w, h)
      return bgCanvas
    }
    return null
  }

  // Export
  const drawFrameEffect = (ctx, x, y, w, h, radius, style) => {
    if (!style || style === 'none') return
    const r = radius || 0
    ctx.save()
    switch (style) {
      case 'border': {
        ctx.beginPath()
        ctx.roundRect(x, y, w, h, r)
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'
        ctx.lineWidth = 4
        ctx.stroke()
        break
      }
      case 'glass':
      case 'glass-light':
      case 'glass-dark': {
        ctx.beginPath()
        ctx.roundRect(x, y, w, h, r)
        ctx.clip()
        ctx.beginPath()
        ctx.roundRect(x - 2, y - 2, w + 4, h + 4, r)
        ctx.roundRect(x + 4, y + 4, w - 8, h - 8, r)
        ctx.fillStyle = 'rgba(255,255,255,0.1)'
        ctx.fill('evenodd')
        break
      }
    }
    ctx.restore()
  }

  const renderFrame = (ctx, bgCanvas, loadedImages, t, w, h) => {
    ctx.clearRect(0, 0, w, h)
    if (bgCanvas) {
      ctx.drawImage(bgCanvas, 0, 0)
    } else {
      ctx.fillStyle = artboardBg
      ctx.fillRect(0, 0, w, h)
    }

    const offset = showFirstFrame ? firstFrameDuration + firstFrameDelay : 0

    // During first-frame hold, draw only the first image
    if (showFirstFrame && t < firstFrameDuration + firstFrameDelay && loadedImages.length > 0) {
      if (t < firstFrameDuration) {
        const first = loadedImages[0]
        const fr = first.borderRadius || 0
        const fbs = first.borderSize || 0
        ctx.save()
        if (fbs) {
          const ffs = first.frameStyle || 'none'
          ctx.beginPath()
          ctx.roundRect(first.x, first.y, first.width, first.height, fr)
          const fbc = first.borderColor || '#ffffff'
          if (ffs === 'glass' || ffs === 'glass-light' || ffs === 'glass-dark') {
            const fbase = fbc.slice(0, 7)
            const fa = fbc.length > 7 ? parseInt(fbc.slice(7, 9), 16) / 255 : 1
            ctx.fillStyle = fbase + Math.round(fa * 0.35 * 255).toString(16).padStart(2, '0')
          } else {
            ctx.fillStyle = fbc
          }
          ctx.fill()
        }
        const fix = first.x + fbs, fiy = first.y + fbs
        const fiw = first.width - fbs * 2, fih = first.height - fbs * 2
        const fir = Math.max(0, fr - fbs)
        if (fr || fbs || (first.frameStyle && first.frameStyle !== 'none')) {
          ctx.beginPath()
          ctx.roundRect(fix, fiy, fiw, fih, fir)
          ctx.clip()
        }
        ctx.drawImage(first.el, fix, fiy, fiw, fih)
        ctx.restore()
        if (first.frameStyle && first.frameStyle !== 'none') {
          drawFrameEffect(ctx, first.x, first.y, first.width, first.height, fr, first.frameStyle)
        }
      }
      return
    }

    for (const img of loadedImages) {
      const hasEntry = img.entryAnimation !== false
      const enterStart = img.delay + offset
      const enterEnd = hasEntry ? enterStart + img.animDuration : enterStart
      let opacity = 1
      let tx = 0, ty = 0, sx = 1, sy = 1

      const applyAnim = (animation, p, isExit) => {
        if (isExit) {
          opacity = 1 - p
          switch (animation) {
            case 'slideUp': ty = -60 * p; break
            case 'slideDown': ty = 60 * p; break
            case 'slideLeft': tx = -60 * p; break
            case 'slideRight': tx = 60 * p; break
            case 'scaleUp': sx = sy = 1 + 0.5 * p; break
            case 'scaleDown': sx = sy = 1 - 0.5 * p; break
          }
        } else {
          opacity = p
          switch (animation) {
            case 'slideUp': ty = 60 * (1 - p); break
            case 'slideDown': ty = -60 * (1 - p); break
            case 'slideLeft': tx = 60 * (1 - p); break
            case 'slideRight': tx = -60 * (1 - p); break
            case 'scaleUp': sx = sy = 0.5 + 0.5 * p; break
            case 'scaleDown': sx = sy = 1.5 - 0.5 * p; break
          }
        }
      }

      if (t < enterStart) {
        opacity = 0
      } else if (hasEntry && t < enterEnd) {
        const lp = (t - enterStart) / img.animDuration
        applyAnim(img.animation, applyEasingOut(lp, img.easing || 'ease-out'), false)
      } else if (img.exitAnimation) {
        const exitDur = img.exitDuration || img.animDuration
        const holdTime = img.exitDelay || 0
        const exitStart = enterEnd + holdTime
        const exitEnd = exitStart + exitDur
        const exitType = img.exitType || img.animation
        if (t < exitStart) { /* hold */ }
        else if (t < exitEnd) {
          const lp = (t - exitStart) / exitDur
          applyAnim(exitType, applyEasing(lp, img.exitEasing || 'ease-in'), true)
        } else { opacity = 0 }
      }

      if (opacity > 0) {
        const r = img.borderRadius || 0
        const bs = img.borderSize || 0
        ctx.save()
        ctx.globalAlpha = opacity
        ctx.translate(img.x + img.width / 2 + tx, img.y + img.height / 2 + ty)
        ctx.scale(sx, sy)
        // Draw border background if borderSize > 0
        if (bs) {
          const fs = img.frameStyle || 'none'
          ctx.beginPath()
          ctx.roundRect(-img.width / 2, -img.height / 2, img.width, img.height, r)
          const bc = img.borderColor || '#ffffff'
          if (fs === 'glass' || fs === 'glass-light' || fs === 'glass-dark') {
            const ibase = bc.slice(0, 7)
            const ia = bc.length > 7 ? parseInt(bc.slice(7, 9), 16) / 255 : 1
            ctx.fillStyle = ibase + Math.round(ia * 0.35 * 255).toString(16).padStart(2, '0')
          } else {
            ctx.fillStyle = bc
          }
          ctx.fill()
        }
        // Clip and draw image inset by border size
        const ix = -img.width / 2 + bs
        const iy = -img.height / 2 + bs
        const iw = img.width - bs * 2
        const ih = img.height - bs * 2
        const ir = Math.max(0, r - bs)
        const zoom = img.zoom || 1
        const hasClip = r || bs || (img.frameStyle && img.frameStyle !== 'none') || zoom !== 1
        if (hasClip) {
          ctx.beginPath()
          ctx.roundRect(ix, iy, iw, ih, ir)
          ctx.clip()
        }
        if (zoom !== 1) {
          const zw = iw * zoom
          const zh = ih * zoom
          ctx.drawImage(img.el, ix - (zw - iw) / 2, iy - (zh - ih) / 2, zw, zh)
        } else {
          ctx.drawImage(img.el, ix, iy, iw, ih)
        }
        ctx.restore()
        if (img.frameStyle && img.frameStyle !== 'none') {
          ctx.save()
          ctx.globalAlpha = opacity
          ctx.translate(img.x + img.width / 2 + tx, img.y + img.height / 2 + ty)
          ctx.scale(sx, sy)
          drawFrameEffect(ctx, -img.width / 2, -img.height / 2, img.width, img.height, r, img.frameStyle)
          ctx.restore()
        }
      }
    }

    if (noise > 0) {
      const tile = getNoiseTile()
      ctx.save()
      ctx.globalAlpha = (noise / 100) * 0.5
      const pattern = ctx.createPattern(tile, 'repeat')
      ctx.fillStyle = pattern
      ctx.fillRect(0, 0, w, h)
      ctx.restore()
    }

    if (dither > 0) {
      const tile = getDitherTile()
      ctx.save()
      ctx.globalAlpha = dither / 100
      ctx.globalCompositeOperation = 'overlay'
      const pattern = ctx.createPattern(tile, 'repeat')
      ctx.fillStyle = pattern
      ctx.fillRect(0, 0, w, h)
      ctx.restore()
    }

    if (scanlines > 0) {
      const tile = getScanlineTile()
      ctx.save()
      ctx.globalAlpha = (scanlines / 100) * 0.55
      const pattern = ctx.createPattern(tile, 'repeat')
      ctx.fillStyle = pattern
      ctx.fillRect(0, 0, w, h)
      ctx.restore()
    }

    if (vignette > 0) {
      ctx.save()
      const cx = w / 2
      const cy = h / 2
      const outer = Math.sqrt(cx * cx + cy * cy)
      const grad = ctx.createRadialGradient(cx, cy, outer * 0.45, cx, cy, outer)
      grad.addColorStop(0, 'rgba(0,0,0,0)')
      grad.addColorStop(1, `rgba(0,0,0,${(vignette / 100) * 0.85})`)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)
      ctx.restore()
    }
  }

  const captureFrame = async (fmt = 'png', scale = 1) => {
    const canvas = document.createElement('canvas')
    canvas.width = artboardWidth * scale
    canvas.height = artboardHeight * scale
    const ctx = canvas.getContext('2d')
    if (scale !== 1) ctx.scale(scale, scale)

    let bgCanvas = null
    try { bgCanvas = await loadBgForExport(artboardWidth, artboardHeight) } catch {}

    const loadedImages = await loadLayersForExport()
    await seekVideosForFrame(loadedImages, playbackTime)

    renderFrame(ctx, bgCanvas, loadedImages, playbackTime, artboardWidth, artboardHeight)

    const mime = fmt === 'webp' ? 'image/webp' : 'image/png'
    const ext = fmt === 'webp' ? 'webp' : 'png'
    const suffix = scale !== 1 ? `@${scale}x` : ''
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `frame-${playbackTime.toFixed(2)}s${suffix}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    }, mime, fmt === 'webp' ? 0.95 : undefined)
  }

  const exportAnimation = async (exportFps = 30) => {
    // H.264 requires even dimensions
    const w = artboardWidth % 2 === 0 ? artboardWidth : artboardWidth + 1
    const h = artboardHeight % 2 === 0 ? artboardHeight : artboardHeight + 1

    setExportProgress({ format: `MP4 ${exportFps}fps`, progress: 0, status: 'Preparing...' })
    await new Promise(r => setTimeout(r, 50))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    const fps = exportFps
    const totalFrames = Math.ceil(duration * fps)

    const loadedImages = await loadLayersForExport()

    let bgCanvas = null
    try { bgCanvas = await loadBgForExport(w, h) } catch (e) { console.warn('Bg render failed', e) }

    try {
      const muxer = new Mp4Muxer.Muxer({
        target: new Mp4Muxer.ArrayBufferTarget(),
        video: {
          codec: 'avc',
          width: w,
          height: h,
        },
        fastStart: 'in-memory',
      })

      const encoder = new VideoEncoder({
        output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
        error: (e) => console.error('Encoder error:', e),
      })

      encoder.configure({
        codec: 'avc1.640028',
        width: w,
        height: h,
        bitrate: 5_000_000,
        framerate: fps,
      })

      for (let frame = 0; frame <= totalFrames; frame++) {
        const t = (frame / totalFrames) * duration
        await seekVideosForFrame(loadedImages, t)
        renderFrame(ctx, bgCanvas, loadedImages, t, w, h)

        const videoFrame = new VideoFrame(canvas, {
          timestamp: (frame / fps) * 1_000_000,
          duration: (1 / fps) * 1_000_000,
        })
        encoder.encode(videoFrame, { keyFrame: frame % 30 === 0 })
        videoFrame.close()

        if (frame % 5 === 0) {
          setExportProgress({ format: 'MP4', progress: frame / totalFrames, status: `Encoding frame ${frame + 1} of ${totalFrames + 1}...` })
          await new Promise(r => setTimeout(r, 0))
        }
      }

      await encoder.flush()
      encoder.close()
      muxer.finalize()

      setExportProgress({ format: 'MP4', progress: 1, status: 'Done!' })

      const buf = muxer.target.buffer
      const blob = new Blob([buf], { type: 'video/mp4' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'animation.mp4'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('MP4 export failed:', err)
    }

    setTimeout(() => setExportProgress(null), 1000)
  }

  const exportGif = async () => {
    if (!GifEncoderModule) {
      setExportProgress({ format: 'GIF', progress: 0, status: 'Loading encoder...' })
      GifEncoderModule = await import('modern-gif')
    }
    setExportProgress({ format: 'GIF', progress: 0, status: 'Preparing...' })
    await new Promise(r => setTimeout(r, 50))

    const gw = artboardWidth
    const gh = artboardHeight

    const canvas = document.createElement('canvas')
    canvas.width = artboardWidth
    canvas.height = artboardHeight
    const ctx = canvas.getContext('2d')

    const gifCanvas = document.createElement('canvas')
    gifCanvas.width = gw
    gifCanvas.height = gh
    const gifCtx = gifCanvas.getContext('2d', { willReadFrequently: true })

    const fps = 15
    const totalFrames = Math.ceil(duration * fps)

    const loadedImages = await loadLayersForExport()

    let bgCanvas = null
    try { bgCanvas = await loadBgForExport(artboardWidth, artboardHeight) } catch {}

    // Use Encoder with async encode for per-frame progress
    const encoder = new GifEncoderModule.Encoder({ width: gw, height: gh })

    try {
      for (let frame = 0; frame <= totalFrames; frame++) {
        const t = (frame / totalFrames) * duration
        await seekVideosForFrame(loadedImages, t)
        renderFrame(ctx, bgCanvas, loadedImages, t, artboardWidth, artboardHeight)
        gifCtx.clearRect(0, 0, gw, gh)
        gifCtx.drawImage(canvas, 0, 0, gw, gh)
        const imageData = gifCtx.getImageData(0, 0, gw, gh)
        await encoder.encode({ data: imageData.data, delay: Math.round(1000 / fps) })

        if (frame % 2 === 0) {
          setExportProgress({ format: 'GIF', progress: (frame / totalFrames) * 0.8, status: `Encoding frame ${frame + 1} of ${totalFrames + 1}...` })
          await new Promise(r => setTimeout(r, 0))
        }
      }

      setExportProgress({ format: 'GIF', progress: 0.85, status: 'Finalizing...' })
      await new Promise(r => setTimeout(r, 50))

      const output = await encoder.flush()
      setExportProgress({ format: 'GIF', progress: 1, status: 'Done!' })

      const blob = new Blob([output], { type: 'image/gif' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'animation.gif'
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('GIF export failed:', err)
    }

    setTimeout(() => setExportProgress(null), 1000)
  }

  const selectedImage = selectedIds.length === 1 ? images.find((img) => img.id === selectedIds[0]) : null
  const multiSelected = selectedIds.length > 1
  // Reference image for reading shared properties in multi-select
  const refImage = selectedImage || (multiSelected ? images.find((img) => img.id === selectedIds[0]) : null)
  const scale = getArtboardScale()

  // Layers list used in left sidebar
  const renderLayersList = () => (
    <div className="image-list">
      {images.map((img) => (
        <div
          key={img.id}
          className={`image-item ${selectedIds.includes(img.id) ? 'selected' : ''} ${sidebarDragOver === img.id ? 'drag-over' : ''} ${sidebarDrag === img.id ? 'dragging' : ''}`}
          onClick={(e) => handleLayerClick(e, img.id)}
          draggable
          onDragStart={(e) => handleSidebarDragStart(e, img.id)}
          onDragOver={(e) => handleSidebarDragOverItem(e, img.id)}
          onDrop={(e) => handleSidebarDropItem(e, img.id)}
          onDragEnd={handleSidebarDragEnd}
        >
          <img src={img.src} className="image-thumb" alt="" />
          <span className="image-name">{img.name}</span>
          <button className="btn-remove" onClick={(e) => { e.stopPropagation(); removeImage(img.id) }} title="Remove"><Trash size={14} /></button>
        </div>
      ))}
    </div>
  )

  return (
    <div className="app">
      <div className="topbar">
        <div className="topbar-left">
          <svg width="18" height="17" viewBox="0 0 48 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M25.946 44.938c-.664.845-2.021.375-2.021-.698V33.937a2.26 2.26 0 0 0-2.262-2.262H10.287c-.92 0-1.456-1.04-.92-1.788l7.48-10.471c1.07-1.497 0-3.578-1.842-3.578H1.237c-.92 0-1.456-1.04-.92-1.788L10.013.474c.214-.297.556-.474.92-.474h28.894c.92 0 1.456 1.04.92 1.788l-7.48 10.471c-1.07 1.498 0 3.579 1.842 3.579h11.377c.943 0 1.473 1.088.89 1.83L25.947 44.94z" fill="#863bff"/>
          </svg>
          <span className="logo">Framey</span>
        </div>
        <div className="topbar-center">
          <div className="topbar-center-tabs">
            <button className={`tab-btn ${activeTab === 'container' ? 'active' : ''}`} onClick={() => setActiveTab('container')}>
              Container
              <span className="tab-tooltip">Container <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd><kbd>{isMac ? '⌥' : 'Alt'}</kbd><kbd>1</kbd></span>
            </button>
            <button className={`tab-btn ${activeTab === 'layers' ? 'active' : ''}`} onClick={() => setActiveTab('layers')}>
              Layers
              <span className="tab-tooltip">Layers <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd><kbd>{isMac ? '⌥' : 'Alt'}</kbd><kbd>2</kbd></span>
            </button>
            <button className={`tab-btn ${activeTab === 'animate' ? 'active' : ''}`} onClick={() => setActiveTab('animate')}>
              Animate
              <span className="tab-tooltip">Animate <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd><kbd>{isMac ? '⌥' : 'Alt'}</kbd><kbd>3</kbd></span>
            </button>
          </div>
        </div>
        <div className="topbar-actions">
          {isPlaying ? (
            <button className="btn-stop" onClick={pauseAnimation}><Stop size={14} weight="fill" /> Pause</button>
          ) : (
            <button className="btn-play" onClick={() => playAnimation(playbackTime === 0 || playbackTime >= duration)}><Play size={14} weight="fill" /> Play</button>
          )}
          <button className="btn-icon" onClick={() => captureFrame('png')} title="Capture current frame as PNG"><Camera size={18} weight="fill" /></button>
          <div className="btn-export-split">
            <button className="btn-export" onClick={() => exportAnimation(30)}><DownloadSimple size={14} weight="bold" /> Export</button>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="btn-export-caret" aria-label="Export options"><CaretDown size={12} weight="bold" /></button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="export-dropdown" sideOffset={6} align="end">
                  <DropdownMenu.Item className="export-dropdown-item" onSelect={() => exportAnimation(30)}>
                    <FileVideo size={16} /> Export as MP4 (30fps)
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="export-dropdown-item" onSelect={() => exportAnimation(60)}>
                    <FileVideo size={16} /> Export as MP4 (60fps)
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="export-dropdown-item" onSelect={exportGif}>
                    <ImageSquare size={16} /> Export as GIF
                  </DropdownMenu.Item>
                  <DropdownMenu.Separator className="export-dropdown-separator" />
                  <DropdownMenu.Item className="export-dropdown-item" onSelect={() => captureFrame('png', 1)}>
                    <ImageSquare size={16} /> Current frame as PNG
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="export-dropdown-item" onSelect={() => captureFrame('png', 2)}>
                    <ImageSquare size={16} /> Current frame as PNG (2x)
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="export-dropdown-item" onSelect={() => captureFrame('webp', 1)}>
                    <ImageSquare size={16} /> Current frame as WebP
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="export-dropdown-item" onSelect={() => captureFrame('webp', 2)}>
                    <ImageSquare size={16} /> Current frame as WebP (2x)
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </div>

      <div className="main">
        {/* Left sidebar - Layers */}
        <div className="layers-panel">
          <div className="panel-section">
            <div className="layers-header">
              <h3>Layers</h3>
              <div className="layers-actions">
                <button className="btn-add-small" onClick={() => setSelectedIds(images.map((img) => img.id))} title="Select all"><SquaresFour size={16} weight="fill" /></button>
                <button className="btn-add-small" onClick={() => fileInputRef.current?.click()} title="Add images"><Plus size={16} weight="bold" /></button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*,video/mp4" multiple hidden onChange={handleImageUpload} />
            </div>
            {renderLayersList()}
            {images.length === 0 && (
              <button className="drop-card" onClick={() => fileInputRef.current?.click()}>
                <span className="drop-card-tile"><Plus size={22} weight="bold" /></span>
                <span className="drop-card-title">Drop or Paste</span>
                <span className="drop-card-sub">Images & Videos</span>
              </button>
            )}
            {selectedIds.length > 0 && (
              <div className="selection-info">{selectedIds.length} selected</div>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasAreaRef}
          className={`canvas-area ${canvasDragOver ? 'drag-over' : ''} ${isPanning || (spaceHeld && canPan) ? 'panning' : ''}`}
          onMouseDown={(e) => {
            handleCanvasPanStart(e)
            if (!spaceHeld && e.button === 0 && (e.target === e.currentTarget || (e.target.closest('.artboard') && !e.target.closest('.artboard-image')))) {
              setSelectedIds([])
            }
          }}
          onDragOver={handleCanvasDragOver}
          onDragLeave={handleCanvasDragLeave}
          onDrop={handleCanvasDrop}
        >
          {canvasDragOver && (
            <div className="drop-overlay">
              <div className="drop-message">Drop images and videos (mp4) here</div>
            </div>
          )}
          <div className="zoom-indicator">{Math.round(scale * 100)}%</div>
          <div
            className="canvas-transform"
            style={{
              transform: canvasZoom !== null
                ? `translate(${canvasPan.x}px, ${canvasPan.y}px)`
                : 'none',
              position: canvasZoom !== null ? 'absolute' : 'relative',
              top: canvasZoom !== null ? 0 : undefined,
              left: canvasZoom !== null ? 0 : undefined,
            }}
          >
            <div
              className="artboard-wrapper"
              style={{ width: artboardWidth * scale, height: artboardHeight * scale }}
            >
              <div
                className="artboard"
                style={{
                  width: artboardWidth,
                  height: artboardHeight,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                  ...(artboardBg.includes('url(') ? {
                    backgroundImage: artboardBg.replace(/\)\s*center\/cover/, ')'),
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                  } : { background: artboardBg }),
                }}
              >
              {images.map((img) => {
                const animStyle = getImageAnimStyle(img)
                const isSelected = selectedIds.includes(img.id)
                return (
                  <div
                    key={img.id}
                    className={`artboard-image ${isSelected ? 'selected' : ''}${img.frameStyle && img.frameStyle !== 'none' ? ` frame-${img.frameStyle}` : ''}`}
                    style={{
                      left: img.x,
                      top: img.y,
                      width: img.width,
                      height: img.height,
                      opacity: animStyle.opacity,
                      transform: animStyle.transform,
                      cursor: isPlaying ? 'default' : 'move',
                      borderRadius: img.borderRadius ? `${img.borderRadius}px` : undefined,
                      overflow: (img.borderRadius || img.borderSize || (img.frameStyle && img.frameStyle !== 'none') || (img.zoom && img.zoom !== 1)) ? 'hidden' : undefined,
                      background: img.borderSize > 0 ? (() => {
                        const bc = img.borderColor || '#ffffff'
                        if (img.frameStyle === 'glass' || img.frameStyle === 'glass-light' || img.frameStyle === 'glass-dark') {
                          const base = bc.slice(0, 7)
                          const existingAlpha = bc.length > 7 ? parseInt(bc.slice(7, 9), 16) / 255 : 1
                          const a = Math.round(existingAlpha * 0.35 * 255).toString(16).padStart(2, '0')
                          return base + a
                        }
                        return bc
                      })() : undefined,
                    }}
                    onMouseDown={isPlaying ? undefined : (e) => handleArtboardMouseDown(e, img.id)}
                  >
                    {(() => {
                      const showVideo = img.isVideo && animStyle.opacity > 0 && playbackTime > 0
                      const videoTime = showVideo ? (() => {
                        const off = showFirstFrame ? firstFrameDuration + firstFrameDelay : 0
                        const hasEntry = img.entryAnimation !== false
                        const layerVisibleAt = img.delay + off + (hasEntry ? img.animDuration : 0)
                        return Math.max(0, playbackTime - layerVisibleAt)
                      })() : 0
                      const rawMedia = showVideo ? (
                        <VideoFrameView videoSrc={img.videoSrc} videoTime={videoTime} />
                      ) : (
                        <img src={img.src} alt={img.name} draggable={false} />
                      )
                      const zoom = img.zoom || 1
                      const mediaEl = zoom !== 1 ? (
                        <div style={{ width: '100%', height: '100%', transform: `scale(${zoom})`, transformOrigin: 'center' }}>
                          {rawMedia}
                        </div>
                      ) : rawMedia
                      return img.borderSize > 0 ? (
                        <div className="border-inset" style={{
                          position: 'absolute',
                          inset: `${img.borderSize}px`,
                          borderRadius: img.borderRadius ? `${Math.max(0, img.borderRadius - img.borderSize)}px` : undefined,
                          overflow: 'hidden',
                        }}>
                          {mediaEl}
                        </div>
                      ) : mediaEl
                    })()}
                    {img.frameStyle && img.frameStyle !== 'none' && (
                      <div className="frame-overlay" />
                    )}
                    {isSelected && !isPlaying && (
                      <>
                        <div className="resize-handle nw" onMouseDown={(e) => handleArtboardMouseDown(e, img.id, 'nw')} />
                        <div className="resize-handle ne" onMouseDown={(e) => handleArtboardMouseDown(e, img.id, 'ne')} />
                        <div className="resize-handle sw" onMouseDown={(e) => handleArtboardMouseDown(e, img.id, 'sw')} />
                        <div className="resize-handle se" onMouseDown={(e) => handleArtboardMouseDown(e, img.id, 'se')} />
                      </>
                    )}
                  </div>
                )
              })}
              {noise > 0 && (
                <div
                  className="artboard-noise"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    backgroundImage: `url(${getNoiseTileUrl()})`,
                    backgroundRepeat: 'repeat',
                    opacity: (noise / 100) * 0.5,
                  }}
                />
              )}
              {dither > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    backgroundImage: `url(${getDitherTileUrl()})`,
                    backgroundRepeat: 'repeat',
                    opacity: dither / 100,
                    mixBlendMode: 'overlay',
                  }}
                />
              )}
              {scanlines > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    backgroundImage: `url(${getScanlineTileUrl()})`,
                    backgroundRepeat: 'repeat',
                    opacity: (scanlines / 100) * 0.55,
                  }}
                />
              )}
              {vignette > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    background: `radial-gradient(circle, rgba(0,0,0,0) 45%, rgba(0,0,0,${(vignette / 100) * 0.85}) 100%)`,
                  }}
                />
              )}
            </div>
          </div>
          </div>

          {activeTab === 'animate' && images.length > 0 && (
            <div className="timeline" onWheel={(e) => e.stopPropagation()}>
              <div className="timeline-header">
                <span className="timeline-label">{playbackTime.toFixed(1)}s / {duration}s</span>
                <div
                  className="timeline-scrubber"
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    if (isPlaying) stopAnimation()
                    const bar = e.currentTarget
                    const update = (ev) => {
                      const rect = bar.getBoundingClientRect()
                      const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width))
                      setPlaybackTime(x * duration)
                    }
                    update(e)
                    const move = (ev) => update(ev)
                    const up = () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
                    window.addEventListener('mousemove', move)
                    window.addEventListener('mouseup', up)
                  }}
                >
                  <div className="scrubber-track">
                    <div className="scrubber-fill" style={{ width: `${(playbackTime / duration) * 100}%` }} />
                    <div className="scrubber-head" style={{ left: `${(playbackTime / duration) * 100}%` }} />
                  </div>
                </div>
              </div>
              <div className="timeline-tracks">
                {images.map((img) => (
                  <div
                    key={img.id}
                    className={`timeline-track ${selectedIds.includes(img.id) ? 'selected' : ''}`}
                    onClick={(e) => { e.stopPropagation(); handleLayerClick(e, img.id) }}
                  >
                    <div className="track-label">{img.name.substring(0, 20)}</div>
                    <div className="track-bar-container">
                      {(() => {
                        const off = showFirstFrame ? firstFrameDuration + firstFrameDelay : 0
                        const hasEntry = img.entryAnimation !== false
                        const start = img.delay + off
                        const entryEnd = hasEntry ? start + img.animDuration : start
                        const holdTime = img.exitDelay || 0
                        const exitStart = entryEnd + holdTime
                        const exitDur = img.exitDuration || img.animDuration
                        return <>
                          {hasEntry && (
                            <div
                              className="track-bar"
                              style={{
                                left: `${(start / duration) * 100}%`,
                                width: `${(img.animDuration / duration) * 100}%`,
                              }}
                            />
                          )}
                          {holdTime > 0 && (
                            <div
                              className="track-bar stay"
                              style={{
                                left: `${(entryEnd / duration) * 100}%`,
                                width: `${(holdTime / duration) * 100}%`,
                              }}
                            />
                          )}
                          {img.exitAnimation && (
                            <div
                              className="track-bar exit"
                              style={{
                                left: `${(exitStart / duration) * 100}%`,
                                width: `${(exitDur / duration) * 100}%`,
                              }}
                            />
                          )}
                        </>
                      })()}
                    </div>
                  </div>
                ))}
                <div className="playhead-line" style={{ left: `calc(112px + (100% - 116px) * ${playbackTime / duration})` }}>
                  <div className="playhead-dot" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Properties */}
        <div className="panel">
          {activeTab === 'container' ? (
            <>
              <div className="panel-section">
                <h3>Layout</h3>
                <div className="field">
                  <label>Format</label>
                  <select value={format} onChange={handleFormatChange}>
                    {Object.keys(FORMAT_PRESETS).map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Width</label>
                    <input type="number" value={artboardWidth} onChange={(e) => { setArtboardWidth(+e.target.value); setFormat('Custom') }} />
                  </div>
                  <div className="field">
                    <label>Height</label>
                    <input type="number" value={artboardHeight} onChange={(e) => { setArtboardHeight(+e.target.value); setFormat('Custom') }} />
                  </div>
                </div>
                <div className="field">
                  <label>Background</label>
                  <div className="bg-picker-wrapper">
                    <div className="bg-picker-trigger-row" onClick={() => setBgPickerOpen(!bgPickerOpen)}>
                      {artboardBg.includes('gradient') ? (() => {
                        const colors = artboardBg.match(/#[0-9a-fA-F]{3,8}/g) || []
                        return <>
                          <div className="bg-picker-swatch" style={{ background: colors[0] || '#000' }} />
                          <div className="bg-picker-swatch" style={{ background: colors[1] || '#000' }} />
                        </>
                      })() : (
                        <div className="bg-picker-swatch" style={{ background: artboardBg }} />
                      )}
                    </div>
                    {bgPickerOpen && (<>
                      <div className="bg-picker-overlay" onClick={() => setBgPickerOpen(false)} />
                      <div className="bg-picker-popover">
                        <BgColorPicker value={artboardBg} onChange={setArtboardBg} />
                      </div>
                    </>)}
                  </div>
                  {Object.entries(BG_PRESETS).map(([group, presets]) => {
                    const needsExpand = presets.length > 8
                    const isExpanded = expandedBgGroups.includes(group)
                    const shown = isExpanded || !needsExpand ? presets : presets.slice(0, 7)
                    return (
                      <div key={group} className="bg-group">
                        <div className="bg-group-header">
                          <span className="bg-group-label">{group}</span>
                        </div>
                        <div className="bg-grid">
                          {shown.map((bg, i) => (
                            <button
                              key={i}
                              className={`bg-swatch ${artboardBg === bg ? 'active' : ''}`}
                              style={{ background: bg }}
                              onClick={() => setArtboardBg(bg)}
                            />
                          ))}
                          {needsExpand && (
                            <button
                              className="bg-swatch bg-expand-tile"
                              onClick={() => setExpandedBgGroups((prev) => isExpanded ? prev.filter((g) => g !== group) : [...prev, group])}
                              title={isExpanded ? 'Show less' : 'Show all'}
                            >
                              {isExpanded ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  {Object.entries(WALLPAPER_GROUPS).map(([group, presets]) => {
                    const groupKey = `wp-${group}`
                    const needsExpand = presets.length > 8
                    const isExpanded = expandedBgGroups.includes(groupKey)
                    const shown = isExpanded || !needsExpand ? presets : presets.slice(0, 7)
                    return (
                      <div key={groupKey} className="bg-group">
                        <div className="bg-group-header">
                          <span className="bg-group-label">{group}</span>
                        </div>
                        <div className="bg-grid">
                          {shown.map((wp, i) => (
                            <button
                              key={i}
                              className={`bg-swatch bg-swatch-img ${artboardBg === `url(${wp.url}) center/cover` ? 'active' : ''}`}
                              style={{ backgroundImage: `url(${wp.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                              onClick={() => setArtboardBg(`url(${wp.url}) center/cover`)}
                              title={wp.name}
                            />
                          ))}
                          {needsExpand && (
                            <button
                              className="bg-swatch bg-expand-tile"
                              onClick={() => setExpandedBgGroups((prev) => isExpanded ? prev.filter((g) => g !== groupKey) : [...prev, groupKey])}
                              title={isExpanded ? 'Show less' : 'Show all'}
                            >
                              {isExpanded ? <CaretUp size={16} weight="bold" /> : <CaretDown size={16} weight="bold" />}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div className="bg-group">
                    <button className="bg-upload-btn" onClick={() => document.getElementById('bg-upload-input')?.click()}>
                      <Plus size={14} /> Upload image
                    </button>
                    <input
                      id="bg-upload-input"
                      type="file"
                      accept="image/*,video/mp4"
                      hidden
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = (ev) => setArtboardBg(`url(${ev.target.result}) center/cover`)
                        reader.readAsDataURL(file)
                        e.target.value = ''
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="panel-section">
                <h3>Effects</h3>
                {[
                  { label: 'Noise', value: noise, set: setNoise },
                  { label: 'Dither', value: dither, set: setDither },
                  { label: 'Scanlines', value: scanlines, set: setScanlines },
                  { label: 'Vignette', value: vignette, set: setVignette },
                ].map(({ label, value, set }) => (
                  <div className="slider-field" key={label}>
                    <label>{label}</label>
                    <div className="slider-field-row">
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={value}
                        onValueChange={set}
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={value}
                        onChange={(e) => set(Math.max(0, Math.min(100, +e.target.value)))}
                        className="border-radius-number"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : activeTab === 'layers' ? (
            <>
              {(selectedImage || multiSelected) && (
                <div className="panel-section">
                  <h3>Alignment</h3>
                  <div className="align-row">
                    <div className="align-group">
                      <button className="align-btn" onClick={(e) => alignSelected('left', e.metaKey || e.ctrlKey)} title="Align left"><AlignLeft size={15} /></button>
                      <button className="align-btn" onClick={(e) => alignSelected('centerH', e.metaKey || e.ctrlKey)} title="Align center horizontally"><AlignCenterHorizontal size={15} /></button>
                      <button className="align-btn" onClick={(e) => alignSelected('right', e.metaKey || e.ctrlKey)} title="Align right"><AlignRight size={15} /></button>
                    </div>
                    <div className="align-group">
                      <button className="align-btn" onClick={(e) => alignSelected('top', e.metaKey || e.ctrlKey)} title="Align top"><AlignTop size={15} /></button>
                      <button className="align-btn" onClick={(e) => alignSelected('centerV', e.metaKey || e.ctrlKey)} title="Align center vertically"><AlignCenterVertical size={15} /></button>
                      <button className="align-btn" onClick={(e) => alignSelected('bottom', e.metaKey || e.ctrlKey)} title="Align bottom"><AlignBottom size={15} /></button>
                    </div>
                    {selectedIds.length >= 3 && (
                      <div className="align-group">
                        <button className="align-btn" onClick={() => distributeSelected('horizontal')} title="Distribute horizontally"><Columns size={15} /></button>
                        <button className="align-btn" onClick={() => distributeSelected('vertical')} title="Distribute vertically"><Rows size={15} /></button>
                      </div>
                    )}
                  </div>
                  {multiSelected && (
                    <p className="hint-small" style={{ marginTop: 8 }}>{modKey}+click to align to artboard</p>
                  )}
                </div>
              )}

              {selectedImage && (
                <div className="panel-section">
                  <h3>Transform</h3>
                  <div className="field-row">
                    <div className="field"><label>X</label><input type="number" value={selectedImage.x} onChange={(e) => updateImage(selectedImage.id, { x: +e.target.value })} /></div>
                    <div className="field"><label>Y</label><input type="number" value={selectedImage.y} onChange={(e) => updateImage(selectedImage.id, { y: +e.target.value })} /></div>
                  </div>
                  <div className="field-row">
                    <div className="field"><label>W</label><input type="number" defaultValue={selectedImage.width} key={`w-${selectedImage.id}-${selectedImage.width}`}
                      onBlur={(e) => {
                        const newW = +e.target.value
                        if (newW && newW !== selectedImage.width) {
                          const aspect = selectedImage.height / selectedImage.width
                          const newH = Math.round(newW * aspect)
                          updateImage(selectedImage.id, {
                            width: newW,
                            height: newH,
                            x: Math.round(selectedImage.x + (selectedImage.width - newW) / 2),
                            y: Math.round(selectedImage.y + (selectedImage.height - newH) / 2),
                          })
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.target.blur()
                      }}
                    /></div>
                    <div className="field"><label>H</label><input type="number" defaultValue={selectedImage.height} key={`h-${selectedImage.id}-${selectedImage.height}`}
                      onBlur={(e) => {
                        const newH = +e.target.value
                        if (newH && newH !== selectedImage.height) {
                          const aspect = selectedImage.width / selectedImage.height
                          const newW = Math.round(newH * aspect)
                          updateImage(selectedImage.id, {
                            height: newH,
                            width: newW,
                            x: Math.round(selectedImage.x + (selectedImage.width - newW) / 2),
                            y: Math.round(selectedImage.y + (selectedImage.height - newH) / 2),
                          })
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.target.blur()
                      }}
                    /></div>
                  </div>
                  <div className="slider-field">
                    <label>Zoom</label>
                    <div className="slider-field-row">
                      <Slider
                        min={100}
                        max={400}
                        step={1}
                        value={Math.round((selectedImage.zoom || 1) * 100)}
                        onValueChange={(v) => updateImage(selectedImage.id, { zoom: v / 100 })}
                      />
                      <input
                        type="number"
                        min="100"
                        max="400"
                        value={Math.round((selectedImage.zoom || 1) * 100)}
                        onChange={(e) => updateImage(selectedImage.id, { zoom: Math.max(100, Math.min(400, +e.target.value)) / 100 })}
                        className="border-radius-number"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedIds.length > 0 && (
                <div className="panel-section">
                  <h3>Style</h3>
                  <div className="frame-style-grid">
                    {FRAME_STYLES.map((fs) => {
                      const current = refImage ? (refImage.frameStyle || 'none') : 'none'
                      return (
                        <button
                          key={fs.id}
                          className={`frame-style-btn ${current === fs.id ? 'active' : ''}`}
                          onClick={() => {
                            if (fs.id === 'none') {
                              updateSelectedImages({ frameStyle: fs.id, borderSize: 0 })
                            } else if (fs.id === 'glass') {
                              updateSelectedImages({ frameStyle: fs.id, borderSize: 15, borderColor: '#ffffff59' })
                            } else {
                              updateSelectedImages({ frameStyle: fs.id, borderSize: 15, borderColor: '#ffffff' })
                            }
                          }}
                          title={fs.label}
                        >
                          <div className={`frame-style-preview fs-${fs.id}`}>
                            <div className="fs-inner" />
                          </div>
                          <span>{fs.label}</span>
                        </button>
                      )
                    })}
                  </div>
                  {refImage && refImage.frameStyle && refImage.frameStyle !== 'none' && (
                    <div className="border-color-picker">
                      <label>Color</label>
                      <AlignColorPicker
                        value={refImage.borderColor || '#ffffff'}
                        onChange={(hex) => updateSelectedImages({ borderColor: hex })}
                      />
                    </div>
                  )}
                </div>
              )}

              {selectedIds.length > 0 && (
                <div className="panel-section">
                  <h3>Border</h3>
                  <div className="slider-field">
                    <label>Radius</label>
                    <div className="slider-field-row">
                      <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={refImage ? (refImage.borderRadius || 0) : 0}
                        onValueChange={(v) => updateSelectedImages({ borderRadius: v })}
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={refImage ? (refImage.borderRadius || 0) : 0}
                        onChange={(e) => updateSelectedImages({ borderRadius: Math.max(0, +e.target.value) })}
                        className="border-radius-number"
                      />
                    </div>
                  </div>
                  <div className="slider-field">
                    <label>Size</label>
                    <div className="slider-field-row">
                      <Slider
                        min={0}
                        max={40}
                        step={1}
                        value={refImage ? (refImage.borderSize || 0) : 0}
                        onValueChange={(v) => updateSelectedImages({ borderSize: v })}
                      />
                      <input
                        type="number"
                        min="0"
                        max="40"
                        value={refImage ? (refImage.borderSize || 0) : 0}
                        onChange={(e) => updateSelectedImages({ borderSize: Math.max(0, +e.target.value) })}
                        className="border-radius-number"
                      />
                    </div>
                  </div>
                </div>
              )}

              {multiSelected && (
                <div className="panel-section">
                  <h3>Resize All ({selectedIds.length})</h3>
                  <p className="hint-small">Set a target size — all selected images resize proportionally.</p>
                  <div className="field-row">
                    <div className="field">
                      <label>Width</label>
                      <input
                        type="number"
                        placeholder="W"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') resizeSelectedProportionally(+e.target.value)
                        }}
                        onBlur={(e) => { if (e.target.value) resizeSelectedProportionally(+e.target.value) }}
                      />
                    </div>
                    <div className="field">
                      <label>Height</label>
                      <input
                        type="number"
                        placeholder="H"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') resizeSelectedProportionallyByHeight(+e.target.value)
                        }}
                        onBlur={(e) => { if (e.target.value) resizeSelectedProportionallyByHeight(+e.target.value) }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {!selectedImage && !multiSelected && (
                <div className="panel-section">
                  <p className="hint">Select a layer to edit its properties</p>
                </div>
              )}
            </>
          ) : (
            <>
              {!selectedImage && (
              <div className="panel-section">
                <div className="section-header-row">
                  <h3>Auto Duration</h3>
                  <label className="checkbox-label compact" title="Auto-fit duration to content">
                    <input type="checkbox" checked={autoFitDuration} onChange={(e) => { setAutoFitDuration(e.target.checked); if (e.target.checked) fitDurationToContent() }} />
                  </label>
                </div>
                <div className="field">
                  <label>Total (s)</label>
                  <input type="number" value={duration} min={0.5} step={0.5} disabled={autoFitDuration} onChange={(e) => setDuration(+e.target.value)} />
                </div>
              </div>
              )}
              {!selectedImage && (<>
              <div className="panel-section">
                <h3>All Sequences — Entry</h3>
                <div className="field">
                  <label>Type</label>
                  <select value={batchAnimation} onChange={(e) => setBatchAnimation(e.target.value)}>
                    {ANIMATION_TYPES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                  </select>
                </div>
                <div className="field">
                  <label>Easing</label>
                  <EasingDropdown value={batchEasing} onChange={setBatchEasing} />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Entry (s)</label>
                    <input type="number" value={batchAnimDuration} step={0.1} min={0.1} onChange={(e) => setBatchAnimDuration(+e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Duration (s)</label>
                    <input type="number" value={batchDelay} step={0.1} min={0} onChange={(e) => setBatchDelay(+e.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label>Overlap (s)</label>
                  <input type="number" value={batchOverlap} step={0.1} min={0} max={batchAnimDuration} onChange={(e) => setBatchOverlap(+e.target.value)} />
                </div>
              </div>

              <div className="panel-section">
                <div className="section-header-row">
                  <h3>All Sequences — Exit</h3>
                  <label className="checkbox-label compact">
                    <input type="checkbox" checked={batchExitAnimation} onChange={(e) => setBatchExitAnimation(e.target.checked)} />
                  </label>
                </div>
                {batchExitAnimation && (
                  <>
                    <div className="field">
                      <label>Type</label>
                      <select value={batchExitType} onChange={(e) => setBatchExitType(e.target.value)}>
                        {EXIT_ANIMATION_TYPES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label>Easing</label>
                      <EasingDropdown value={batchExitEasing} onChange={setBatchExitEasing} />
                    </div>
                    <div className="field">
                      <label>Duration (s)</label>
                      <input type="number" value={batchExitDuration} step={0.1} min={0.1} onChange={(e) => setBatchExitDuration(+e.target.value)} />
                    </div>
                  </>
                )}
                <button className="btn-primary" style={{ marginTop: 12 }} onClick={applyBatchSequence}>Apply to All</button>
              </div>

              <div className="panel-section">
                <div className="section-header-row">
                  <h3>First Frame Preview</h3>
                  <label className="checkbox-label compact">
                    <input type="checkbox" checked={showFirstFrame} onChange={(e) => setShowFirstFrame(e.target.checked)} />
                  </label>
                </div>
                {showFirstFrame && (
                  <div className="field-row">
                    <div className="field">
                      <label>Hold (s)</label>
                      <input type="number" value={firstFrameDuration} step={0.1} min={0.1} onChange={(e) => setFirstFrameDuration(+e.target.value)} />
                    </div>
                    <div className="field">
                      <label>Delay after (s)</label>
                      <input type="number" value={firstFrameDelay} step={0.1} min={0} onChange={(e) => setFirstFrameDelay(+e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
              </>)}

              {selectedImage && (
                <>
                  <div className="panel-section">
                    <div className="section-header-row">
                      <h3>{selectedImage.name.substring(0, 20)} — Entry</h3>
                      <label className="checkbox-label compact">
                        <input type="checkbox" checked={selectedImage.entryAnimation !== false} onChange={(e) => updateImage(selectedImage.id, { entryAnimation: e.target.checked })} />
                      </label>
                    </div>
                    {selectedImage.entryAnimation !== false && (
                      <>
                        <div className="field">
                          <label>Type</label>
                          <select value={selectedImage.animation} onChange={(e) => updateImage(selectedImage.id, { animation: e.target.value })}>
                            {ANIMATION_TYPES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                          </select>
                        </div>
                        <div className="field">
                          <label>Easing</label>
                          <EasingDropdown value={selectedImage.easing} onChange={(v) => updateImage(selectedImage.id, { easing: v })} />
                        </div>
                        <div className="field-row">
                          <div className="field"><label>Entry (s)</label><input type="number" value={selectedImage.animDuration} step={0.1} min={0.1} onChange={(e) => updateImage(selectedImage.id, { animDuration: +e.target.value })} /></div>
                          <div className="field"><label>Duration (s)</label><input type="number" value={selectedImage.exitDelay || 0} step={0.1} min={0} onChange={(e) => updateImage(selectedImage.id, { exitDelay: +e.target.value })} /></div>
                        </div>
                      </>
                    )}
                    {selectedImage.entryAnimation === false && (
                      <div className="field">
                        <label>Duration (s)</label>
                        <input type="number" value={selectedImage.exitDelay || 0} step={0.1} min={0} onChange={(e) => updateImage(selectedImage.id, { exitDelay: +e.target.value })} />
                      </div>
                    )}
                    {selectedImage.isVideo && selectedImage.videoDuration > 0 && (
                      <div className="checkbox-field" style={{ marginTop: 4 }}>
                        <label className="checkbox-label">
                          <input type="checkbox"
                            checked={Math.abs((selectedImage.exitDelay || 0) - Math.round(selectedImage.videoDuration * 10) / 10) < 0.05}
                            onChange={(e) => {
                              updateImage(selectedImage.id, { exitDelay: e.target.checked ? Math.round(selectedImage.videoDuration * 10) / 10 : 0 })
                            }}
                          />
                          Use video duration ({selectedImage.videoDuration.toFixed(1)}s)
                        </label>
                      </div>
                    )}
                  </div>

                  <div className="panel-section">
                    <div className="section-header-row">
                      <h3>{selectedImage.name.substring(0, 20)} — Exit</h3>
                      <label className="checkbox-label compact">
                        <input type="checkbox" checked={selectedImage.exitAnimation || false} onChange={(e) => updateImage(selectedImage.id, { exitAnimation: e.target.checked })} />
                      </label>
                    </div>
                    {selectedImage.exitAnimation && (
                      <>
                        <div className="field">
                          <label>Type</label>
                          <select value={selectedImage.exitType || 'fadeIn'} onChange={(e) => updateImage(selectedImage.id, { exitType: e.target.value })}>
                            {EXIT_ANIMATION_TYPES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
                          </select>
                        </div>
                        <div className="field">
                          <label>Easing</label>
                          <EasingDropdown value={selectedImage.exitEasing || 'ease-in-cubic'} onChange={(v) => updateImage(selectedImage.id, { exitEasing: v })} />
                        </div>
                        <div className="field">
                          <label>Duration (s)</label>
                          <input type="number" value={selectedImage.exitDuration || 0.6} step={0.1} min={0.1} onChange={(e) => updateImage(selectedImage.id, { exitDuration: +e.target.value })} />
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              <div className="panel-section">
                <h3>Sequence</h3>
                <div className="image-list">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className={`image-item ${selectedIds.includes(img.id) ? 'selected' : ''}`}
                      onClick={(e) => handleLayerClick(e, img.id)}
                    >
                      <img src={img.src} className="image-thumb" alt="" />
                      <div className="sequence-info">
                        <span className="image-name">{img.name.substring(0, 15)}</span>
                        <span className="sequence-meta">
                          {ANIMATION_TYPES.find(a => a.id === img.animation)?.label} | {img.delay}s + {img.animDuration}s
                          {img.exitAnimation ? ' + exit' : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {exportProgress && (
        <div className="export-overlay">
          <div className="export-modal">
            <div className="export-modal-icon">
              {exportProgress.format === 'GIF' ? <ImageSquare size={32} /> : <FileVideo size={32} />}
            </div>
            <h2>Exporting {exportProgress.format}</h2>
            <p className="export-modal-status">{exportProgress.status}</p>
            <div className="export-progress-track">
              <div className="export-progress-fill" style={{ width: `${Math.round(exportProgress.progress * 100)}%` }} />
            </div>
            <span className="export-progress-pct">{Math.round(exportProgress.progress * 100)}%</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
