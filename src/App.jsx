import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Stop, DownloadSimple, Plus, SquaresFour, Stack, Trash, DotsSixVertical, AlignLeft, AlignCenterHorizontal, AlignRight, AlignTop, AlignCenterVertical, AlignBottom, Rows, Columns, CaretDown } from '@phosphor-icons/react'
import * as Mp4Muxer from 'mp4-muxer'
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
  const strokeColor = active ? '#fff' : (isSmall ? '#3b82f6' : 'rgba(255,255,255,0.55)')

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

function App() {
  const [format, setFormat] = useState(() => loadSession('format', 'Dribbble shot HD'))
  const [artboardWidth, setArtboardWidth] = useState(() => loadSession('artboardWidth', 1600))
  const [artboardHeight, setArtboardHeight] = useState(() => loadSession('artboardHeight', 1200))
  const [duration, setDuration] = useState(() => loadSession('duration', 4))
  const [images, setImages] = useState([])
  const [activeTab, setActiveTab] = useState('design')
  const [selectedIds, setSelectedIds] = useState([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [artboardBg, setArtboardBg] = useState(() => loadSession('artboardBg', '#ffffff'))
  const [playbackTime, setPlaybackTime] = useState(0)
  const [dragging, setDragging] = useState(null)
  const [canvasDragOver, setCanvasDragOver] = useState(false)
  const [sidebarDrag, setSidebarDrag] = useState(null)
  const [sidebarDragOver, setSidebarDragOver] = useState(null)
  // Batch sequence controls
  const [batchAnimation, setBatchAnimation] = useState('fadeIn')
  const [batchEasing, setBatchEasing] = useState('ease-out')
  const [batchAnimDuration, setBatchAnimDuration] = useState(0.6)
  const [batchDelay, setBatchDelay] = useState(0.2)
  const [batchOverlap, setBatchOverlap] = useState(0)
  const [batchExitAnimation, setBatchExitAnimation] = useState(false)
  const [batchExitType, setBatchExitType] = useState('fadeIn')
  const [batchExitEasing, setBatchExitEasing] = useState('ease-in')
  const [batchExitDuration, setBatchExitDuration] = useState(0.6)
  const [showFirstFrame, setShowFirstFrame] = useState(false)
  const [firstFrameDuration, setFirstFrameDuration] = useState(0.5)
  // Canvas zoom & pan
  const [canvasZoom, setCanvasZoom] = useState(null) // null = auto-fit
  const [canvasPan, setCanvasPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [spaceHeld, setSpaceHeld] = useState(false)
  const panStart = useRef(null)
  const canvasAreaRef = useRef(null)
  const fileInputRef = useRef(null)
  const animationFrameRef = useRef(null)
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
  }, [format, artboardWidth, artboardHeight, duration, artboardBg])

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
    setImages((prev) => {
      redoStack.current.push(JSON.stringify(prev))
      isUndoRedoing.current = true
      const restored = JSON.parse(undoStack.current.pop())
      setTimeout(() => { isUndoRedoing.current = false }, 0)
      return restored
    })
  }, [])

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return
    setImages((prev) => {
      undoStack.current.push(JSON.stringify(prev))
      isUndoRedoing.current = true
      const restored = JSON.parse(redoStack.current.pop())
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

      // Cmd++ / Cmd+= = zoom in, Cmd+- = zoom out
      if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        setCanvasZoom((prev) => Math.min(8, (prev !== null ? prev : getAutoFitScale()) * 1.25))
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault()
        setCanvasZoom((prev) => Math.max(0.05, (prev !== null ? prev : getAutoFitScale()) * 0.8))
        return
      }

      // Cmd+Option+1 / Ctrl+Alt+1 = Design tab, Cmd+Option+2 / Ctrl+Alt+2 = Animate tab
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.key === '1') {
        e.preventDefault()
        setActiveTab('design')
        return
      }
      if ((e.metaKey || e.ctrlKey) && e.altKey && e.key === '2') {
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
      // Space quick tap = play/pause (< 200ms held)
      if (e.code === 'Space' && Date.now() - spaceDownTime.current < 200) {
        if (isPlaying) stopAnimation()
        else playAnimation()
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
      .filter((f) => f.type.startsWith('image/'))
      .sort((a, b) => naturalSort(a.name, b.name))

    Promise.all(
      sorted.map(
        (file) =>
          new Promise((resolve) => {
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
          })
      )
    ).then((loaded) => {
      setImagesWithUndo((prev) => {
        const startIdx = prev.length
        return [
          ...prev,
          ...loaded.map((item, i) => ({
            id: Date.now() + Math.random() + i,
            src: item.src,
            name: item.name,
            x: 0,
            y: 0,
            width: item.naturalWidth,
            height: item.naturalHeight,
            animation: 'fadeIn',
            easing: 'ease-out',
            animDuration: 0.6,
            delay: (startIdx + i) * 0.3,
            exitAnimation: false,
            exitType: 'fadeIn',
            exitEasing: 'ease-in',
            exitDuration: 0.6,
            exitDelay: 0.3,
          })),
        ]
      })
    })
  }, [setImagesWithUndo])

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
    // Full cycle: entry + hold + exit (if enabled)
    let cycle = batchAnimDuration + batchDelay
    if (batchExitAnimation) cycle += batchExitDuration
    const step = Math.max(0.05, cycle - batchOverlap)
    setImagesWithUndo((prev) =>
      prev.map((img, i) => ({
        ...img,
        animation: batchAnimation,
        easing: batchEasing,
        animDuration: batchAnimDuration,
        delay: +(i * step).toFixed(2),
        exitAnimation: batchExitAnimation,
        exitType: batchExitType,
        exitEasing: batchExitEasing,
        exitDuration: batchExitDuration,
        exitDelay: batchDelay,
      }))
    )
    // Auto-fit duration
    const offset = showFirstFrame ? firstFrameDuration : 0
    const lastStart = (images.length - 1) * step
    let needed = lastStart + batchAnimDuration + offset
    if (batchExitAnimation) needed += batchDelay + batchExitDuration
    setDuration(+(needed + 0.2).toFixed(1))
  }

  const getContentDuration = () => {
    const offset = showFirstFrame ? firstFrameDuration : 0
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

        const scaleChange = newZoom / currentZoom
        const newPanX = cursorX - scaleChange * (cursorX - canvasPan.x)
        const newPanY = cursorY - scaleChange * (cursorY - canvasPan.y)

        setCanvasZoom(newZoom)
        setCanvasPan({ x: newPanX, y: newPanY })
      } else {
        // Pan with scroll
        e.preventDefault()
        setCanvasPan((prev) => ({
          x: prev.x - e.deltaX,
          y: prev.y - e.deltaY,
        }))
        // Switch from auto-fit to manual if still on auto
        if (canvasZoom === null) {
          setCanvasZoom(getAutoFitScale())
        }
      }
    }
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [canvasZoom, artboardWidth, artboardHeight])

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

  // Pan with middle mouse or space+drag
  const handleCanvasPanStart = (e) => {
    if (e.button === 1 || (spaceHeld && e.button === 0)) {
      e.preventDefault()
      setIsPanning(true)
      if (canvasZoom === null) setCanvasZoom(getAutoFitScale())
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
  const playAnimation = useCallback(() => {
    setIsPlaying(true)
    setPlaybackTime(0)
    const startTime = performance.now()
    const dur = duration
    const totalMs = dur * 1000
    const tick = (now) => {
      const elapsed = now - startTime
      const t = Math.min(elapsed / totalMs, 1)
      setPlaybackTime(t * dur)
      if (t < 1) {
        animationFrameRef.current = requestAnimationFrame(tick)
      } else {
        setIsPlaying(false)
      }
    }
    animationFrameRef.current = requestAnimationFrame(tick)
  }, [duration])

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
    if (!isPlaying) return { opacity: 1, transform: 'none' }
    const t = playbackTime

    // Show first frame: only the first image visible during hold period
    if (showFirstFrame && t < firstFrameDuration) {
      const isFirst = images.length > 0 && img.id === images[0].id
      return isFirst
        ? { opacity: 1, transform: 'none' }
        : { opacity: 0, transform: 'none' }
    }

    const offset = showFirstFrame ? firstFrameDuration : 0
    const enterStart = img.delay + offset
    const enterEnd = enterStart + img.animDuration

    // Enter phase
    if (t < enterStart) return getInitialStyle(img.animation)
    if (t < enterEnd) {
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

  // Export
  const renderFrame = (ctx, loadedImages, t, w, h) => {
    ctx.clearRect(0, 0, w, h)
    ctx.fillStyle = artboardBg
    ctx.fillRect(0, 0, w, h)

    const offset = showFirstFrame ? firstFrameDuration : 0

    // During first-frame hold, draw only the first image
    if (showFirstFrame && t < firstFrameDuration && loadedImages.length > 0) {
      const first = loadedImages[0]
      ctx.drawImage(first.el, first.x, first.y, first.width, first.height)
      return
    }

    for (const img of loadedImages) {
      const enterStart = img.delay + offset
      const enterEnd = enterStart + img.animDuration
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
      } else if (t < enterEnd) {
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
        ctx.save()
        ctx.globalAlpha = opacity
        ctx.translate(img.x + img.width / 2 + tx, img.y + img.height / 2 + ty)
        ctx.scale(sx, sy)
        ctx.drawImage(img.el, -img.width / 2, -img.height / 2, img.width, img.height)
        ctx.restore()
      }
    }
  }

  const exportAnimation = async () => {
    const canvas = document.createElement('canvas')
    canvas.width = artboardWidth
    canvas.height = artboardHeight
    const ctx = canvas.getContext('2d')
    const fps = 30
    const totalFrames = Math.ceil(duration * fps)

    const loadedImages = await Promise.all(
      images.map(
        (img) =>
          new Promise((resolve) => {
            const el = new Image()
            el.onload = () => resolve({ ...img, el })
            el.src = img.src
          })
      )
    )

    // Use VideoEncoder + mp4-muxer for MP4 export
    const muxer = new Mp4Muxer.Muxer({
      target: new Mp4Muxer.ArrayBufferTarget(),
      video: {
        codec: 'avc',
        width: artboardWidth,
        height: artboardHeight,
      },
      fastStart: 'in-memory',
    })

    const encoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: (e) => console.error('Encoder error:', e),
    })

    encoder.configure({
      codec: 'avc1.640028',
      width: artboardWidth,
      height: artboardHeight,
      bitrate: 5_000_000,
      framerate: fps,
    })

    for (let frame = 0; frame <= totalFrames; frame++) {
      const t = (frame / totalFrames) * duration
      renderFrame(ctx, loadedImages, t, artboardWidth, artboardHeight)

      const videoFrame = new VideoFrame(canvas, {
        timestamp: (frame / fps) * 1_000_000,
        duration: (1 / fps) * 1_000_000,
      })
      encoder.encode(videoFrame, { keyFrame: frame % 30 === 0 })
      videoFrame.close()
    }

    await encoder.flush()
    encoder.close()
    muxer.finalize()

    const buf = muxer.target.buffer
    const blob = new Blob([buf], { type: 'video/mp4' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'animation.mp4'
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedImage = selectedIds.length === 1 ? images.find((img) => img.id === selectedIds[0]) : null
  const multiSelected = selectedIds.length > 1
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
          <Stack size={18} weight="fill" color="#3b82f6" />
          <span className="logo">Sequence</span>
        </div>
        <div className="topbar-center">
          <button className={`tab-btn ${activeTab === 'design' ? 'active' : ''}`} onClick={() => setActiveTab('design')} title={`Design (${modKey}+${isMac ? '⌥' : 'Alt'}+1)`}>Design</button>
          <button className={`tab-btn ${activeTab === 'animate' ? 'active' : ''}`} onClick={() => setActiveTab('animate')} title={`Animate (${modKey}+${isMac ? '⌥' : 'Alt'}+2)`}>Animate</button>
        </div>
        <div className="topbar-actions">
          {isPlaying ? (
            <button className="btn-stop" onClick={stopAnimation}><Stop size={14} weight="fill" /> Stop</button>
          ) : (
            <button className="btn-play" onClick={playAnimation}><Play size={14} weight="fill" /> Play</button>
          )}
          <button className="btn-export" onClick={exportAnimation}><DownloadSimple size={14} weight="bold" /> Export</button>
        </div>
      </div>

      <div className="main">
        {/* Left sidebar - Layers */}
        <div className="layers-panel">
          <div className="panel-section">
            <div className="layers-header">
              <h3>Layers</h3>
              <div className="layers-actions">
                <button className="btn-add-small" onClick={() => setSelectedIds(images.map((img) => img.id))} title="Select all"><SquaresFour size={16} /></button>
                <button className="btn-add-small" onClick={() => fileInputRef.current?.click()} title="Add images"><Plus size={16} weight="bold" /></button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleImageUpload} />
            </div>
            {renderLayersList()}
            {images.length === 0 && (
              <p className="hint">Drop images here<br/>or click + to add</p>
            )}
            {selectedIds.length > 0 && (
              <div className="selection-info">{selectedIds.length} selected</div>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div
          ref={canvasAreaRef}
          className={`canvas-area ${canvasDragOver ? 'drag-over' : ''} ${isPanning || spaceHeld ? 'panning' : ''}`}
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
              <div className="drop-message">Drop images here</div>
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
                  backgroundColor: artboardBg,
                }}
              >
              {images.map((img) => {
                const animStyle = getImageAnimStyle(img)
                const isSelected = selectedIds.includes(img.id)
                return (
                  <div
                    key={img.id}
                    className={`artboard-image ${isSelected ? 'selected' : ''}`}
                    style={{
                      left: img.x,
                      top: img.y,
                      width: img.width,
                      height: img.height,
                      opacity: animStyle.opacity,
                      transform: animStyle.transform,
                      cursor: isPlaying ? 'default' : 'move',
                    }}
                    onMouseDown={isPlaying ? undefined : (e) => handleArtboardMouseDown(e, img.id)}
                  >
                    <img src={img.src} alt={img.name} draggable={false} />
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
            </div>
          </div>
          </div>

          {activeTab === 'animate' && images.length > 0 && (
            <div className="timeline" onWheel={(e) => e.stopPropagation()}>
              <div className="timeline-header">
                <span className="timeline-label">Timeline</span>
                <span className="timeline-duration">{duration}s</span>
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
                      <div
                        className="track-bar"
                        style={{
                          left: `${(img.delay / duration) * 100}%`,
                          width: `${(img.animDuration / duration) * 100}%`,
                        }}
                      />
                      {img.exitAnimation && (
                        <div
                          className="track-bar exit"
                          style={{
                            left: `${((img.delay + img.animDuration + (img.exitDelay || 0)) / duration) * 100}%`,
                            width: `${((img.exitDuration || img.animDuration) / duration) * 100}%`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                ))}
                {isPlaying && (
                  <div
                    className="playhead"
                    style={{ left: `${140 + ((window.innerWidth - 760) * playbackTime) / duration}px` }}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Properties */}
        <div className="panel">
          {activeTab === 'design' ? (
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
                  <div className="color-field">
                    <input type="color" value={artboardBg} onChange={(e) => setArtboardBg(e.target.value)} />
                    <input type="text" value={artboardBg} onChange={(e) => setArtboardBg(e.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label>Duration</label>
                  <div className="duration-field">
                    <input type="number" value={duration} min={0.5} step={0.5} onChange={(e) => setDuration(+e.target.value)} />
                    <span>s</span>
                    <button className="btn-fit" onClick={fitDurationToContent} title="Fit to content">Fit</button>
                  </div>
                </div>
              </div>

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
                    <div className="field"><label>W</label><input type="number" value={selectedImage.width} onChange={(e) => {
                      const newW = +e.target.value
                      const ratio = newW / selectedImage.width
                      updateImage(selectedImage.id, { width: newW, height: Math.round(selectedImage.height * ratio) })
                    }} /></div>
                    <div className="field"><label>H</label><input type="number" value={selectedImage.height} onChange={(e) => {
                      const newH = +e.target.value
                      const ratio = newH / selectedImage.height
                      updateImage(selectedImage.id, { height: newH, width: Math.round(selectedImage.width * ratio) })
                    }} /></div>
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
            </>
          ) : (
            <>
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
                <div className="field">
                  <label>Duration (s)</label>
                  <input type="number" value={batchAnimDuration} step={0.1} min={0.1} onChange={(e) => setBatchAnimDuration(+e.target.value)} />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Delay (s)</label>
                    <input type="number" value={batchDelay} step={0.1} min={0} onChange={(e) => setBatchDelay(+e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Overlap (s)</label>
                    <input type="number" value={batchOverlap} step={0.1} min={0} max={batchAnimDuration} onChange={(e) => setBatchOverlap(+e.target.value)} />
                  </div>
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
                  <div className="field">
                    <label>Hold (s)</label>
                    <input type="number" value={firstFrameDuration} step={0.1} min={0.1} onChange={(e) => setFirstFrameDuration(+e.target.value)} />
                  </div>
                )}
              </div>
              </>)}

              {selectedImage && (
                <>
                  <div className="panel-section">
                    <h3>{selectedImage.name.substring(0, 20)} — Entry</h3>
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
                      <div className="field"><label>Delay (s)</label><input type="number" value={selectedImage.delay} step={0.1} min={0} onChange={(e) => updateImage(selectedImage.id, { delay: +e.target.value })} /></div>
                      <div className="field"><label>Duration (s)</label><input type="number" value={selectedImage.animDuration} step={0.1} min={0.1} onChange={(e) => updateImage(selectedImage.id, { animDuration: +e.target.value })} /></div>
                    </div>
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
                        <div className="field">
                          <label>Hold before exit (s)</label>
                          <input type="number" value={selectedImage.exitDelay || 0} step={0.1} min={0} onChange={(e) => updateImage(selectedImage.id, { exitDelay: +e.target.value })} />
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
    </div>
  )
}

export default App
