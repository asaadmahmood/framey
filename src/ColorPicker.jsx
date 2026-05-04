import { useState, useRef, useEffect, useCallback } from 'react'

function clamp(v, min, max) { return Math.min(max, Math.max(min, v)) }

function hsbToHex(h, s, b) {
  const hi = Math.floor(h / 60) % 6
  const f = h / 60 - Math.floor(h / 60)
  const p = b * (1 - s)
  const q = b * (1 - f * s)
  const t = b * (1 - (1 - f) * s)
  let r, g, bl
  switch (hi) {
    case 0: r = b; g = t; bl = p; break
    case 1: r = q; g = b; bl = p; break
    case 2: r = p; g = b; bl = t; break
    case 3: r = p; g = q; bl = b; break
    case 4: r = t; g = p; bl = b; break
    default: r = b; g = p; bl = q; break
  }
  const toHex = (v) => Math.round(v * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`
}

function hexToHSB(hex) {
  hex = (hex || '#000000').replace('#', '')
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]
  if (hex.length !== 6) return { h: 0, s: 0, b: 0 }
  const r = parseInt(hex.slice(0,2), 16) / 255
  const g = parseInt(hex.slice(2,4), 16) / 255
  const b = parseInt(hex.slice(4,6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + 6) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
  }
  return { h, s: max === 0 ? 0 : d / max, b: max }
}

function parseColors(value) {
  const m = (value || '').match(/#[0-9a-fA-F]{3,8}/g)
  return m || ['#3b82f6']
}

function ColorArea({ hue, sat, bright, onChange }) {
  const ref = useRef(null)
  const dragging = useRef(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const getPos = useCallback((e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = clamp((e.clientX - rect.left) / rect.width, 0, 1)
    const y = clamp((e.clientY - rect.top) / rect.height, 0, 1)
    onChangeRef.current(x, 1 - y)
  }, [])

  useEffect(() => {
    const move = (e) => { if (dragging.current) getPos(e) }
    const up = () => { dragging.current = false }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [getPos])

  return (
    <div ref={ref} className="cp-area" style={{ background: `hsl(${hue}, 100%, 50%)` }}
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); dragging.current = true; getPos(e) }}>
      <div className="cp-area-white" />
      <div className="cp-area-black" />
      <div className="cp-area-thumb" style={{ left: `${sat * 100}%`, top: `${(1 - bright) * 100}%` }} />
    </div>
  )
}

function HueSlider({ hue, onChange }) {
  const ref = useRef(null)
  const dragging = useRef(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const getPos = useCallback((e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    onChangeRef.current(clamp((e.clientX - rect.left) / rect.width, 0, 1) * 360)
  }, [])

  useEffect(() => {
    const move = (e) => { if (dragging.current) getPos(e) }
    const up = () => { dragging.current = false }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, [getPos])

  return (
    <div ref={ref} className="cp-hue-slider"
      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); dragging.current = true; getPos(e) }}>
      <div className="cp-hue-thumb" style={{ left: `${(hue / 360) * 100}%` }} />
    </div>
  )
}

export function BgColorPicker({ value, onChange }) {
  const isGrad = value.includes('gradient')
  const [mode, setMode] = useState(isGrad ? 'gradient' : 'solid')
  const colors = parseColors(value)

  const [hsb1, setHsb1] = useState(() => hexToHSB(colors[0]))
  const [hsb2, setHsb2] = useState(() => hexToHSB(colors[1] || '#8b5cf6'))
  const [angle, setAngle] = useState(135)
  const [activeStop, setActiveStop] = useState(0)

  // Sync from external value changes (preset clicks)
  const lastExternal = useRef(value)
  useEffect(() => {
    if (value === lastExternal.current) return
    lastExternal.current = value
    const isG = value.includes('gradient')
    setMode(isG ? 'gradient' : 'solid')
    const c = parseColors(value)
    setHsb1(hexToHSB(c[0]))
    if (c[1]) setHsb2(hexToHSB(c[1]))
    const angleMatch = value.match(/(\d+)deg/)
    if (angleMatch) setAngle(+angleMatch[1])
  }, [value])

  const hex1 = hsbToHex(hsb1.h, hsb1.s, hsb1.b)
  const hex2 = hsbToHex(hsb2.h, hsb2.s, hsb2.b)
  const activeHsb = activeStop === 0 ? hsb1 : hsb2
  const setActiveHsb = activeStop === 0 ? setHsb1 : setHsb2
  const activeHex = activeStop === 0 ? hex1 : hex2

  const emit = (h1, h2, m, a) => {
    const c1 = hsbToHex(h1.h, h1.s, h1.b)
    const c2 = hsbToHex(h2.h, h2.s, h2.b)
    const result = m === 'solid' ? c1 : `linear-gradient(${a}deg, ${c1}, ${c2})`
    lastExternal.current = result
    onChange(result)
  }

  const handleArea = (s, b) => {
    const next = { ...activeHsb, s, b }
    setActiveHsb(next)
    emit(activeStop === 0 ? next : hsb1, activeStop === 1 ? next : hsb2, mode, angle)
  }

  const handleHue = (h) => {
    const next = { ...activeHsb, h }
    setActiveHsb(next)
    emit(activeStop === 0 ? next : hsb1, activeStop === 1 ? next : hsb2, mode, angle)
  }

  const handleHexInput = (hex) => {
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return
    const next = hexToHSB(hex)
    setActiveHsb(next)
    emit(activeStop === 0 ? next : hsb1, activeStop === 1 ? next : hsb2, mode, angle)
  }

  return (
    <div className="cp-root" onMouseDown={(e) => e.stopPropagation()}>
      <div className="cp-mode-tabs">
        <button className={`cp-mode-tab ${mode === 'solid' ? 'active' : ''}`} onClick={() => { setMode('solid'); emit(hsb1, hsb2, 'solid', angle) }}>Solid</button>
        <button className={`cp-mode-tab ${mode === 'gradient' ? 'active' : ''}`} onClick={() => { setMode('gradient'); emit(hsb1, hsb2, 'gradient', angle) }}>Gradient</button>
      </div>

      <ColorArea hue={activeHsb.h} sat={activeHsb.s} bright={activeHsb.b} onChange={handleArea} />
      <HueSlider hue={activeHsb.h} onChange={handleHue} />

      {mode === 'gradient' && (
        <div className="cp-stops">
          <button className={`cp-stop ${activeStop === 0 ? 'active' : ''}`} style={{ background: hex1 }} onClick={() => setActiveStop(0)} />
          <button className={`cp-stop ${activeStop === 1 ? 'active' : ''}`} style={{ background: hex2 }} onClick={() => setActiveStop(1)} />
          <div className="cp-angle-field">
            <input type="number" value={angle} min={0} max={360} onChange={(e) => { const a = +e.target.value; setAngle(a); emit(hsb1, hsb2, 'gradient', a) }} />
            <span>°</span>
          </div>
        </div>
      )}

      <div className="cp-hex-row">
        <div className="cp-swatch-mini" style={{ background: mode === 'gradient' ? `linear-gradient(${angle}deg, ${hex1}, ${hex2})` : hex1 }} />
        <input type="text" className="cp-hex-input" value={activeHex} onChange={(e) => handleHexInput(e.target.value)} />
        {'EyeDropper' in window && (
          <button className="cp-eyedropper" title="Pick color from screen" onClick={async () => {
            try {
              const result = await new window.EyeDropper().open()
              handleHexInput(result.sRGBHex)
            } catch {}
          }}>
            <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M224 67.5a35.5 35.5 0 0 0-10.5-25.3 36 36 0 0 0-50.9 0l-20.3 20.2-7.6-7.5a12 12 0 0 0-17 0L99.5 73.2a12 12 0 0 0 0 17l5.8 5.8L34.7 166.6a12 12 0 0 0-3.5 8.5v36a12 12 0 0 0 12 12h36a12 12 0 0 0 8.5-3.5l70.5-70.6 5.8 5.8a12 12 0 0 0 17 0l18.2-18.3a12 12 0 0 0 0-17l-7.5-7.5 20.2-20.3A35.5 35.5 0 0 0 224 67.5Zm-148.7 132H55.2v-20.1l70.5-70.5 20.1 20.1Zm85.5-82.7a12 12 0 0 0 0 17l5.7 5.8-1.2 1.2-73.4-73.4 1.2-1.2 5.8 5.7a12 12 0 0 0 17 0l20.2-20.2a12 12 0 0 1 17 17Z"/></svg>
          </button>
        )}
      </div>
    </div>
  )
}
