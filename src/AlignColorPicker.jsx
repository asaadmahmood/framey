import * as React from 'react'
import {
  ColorArea as AriaColorArea,
  ColorPicker as AriaColorPicker,
  ColorSlider as AriaColorSlider,
  ColorSwatch as AriaColorSwatch,
  ColorSwatchPicker as AriaColorSwatchPicker,
  ColorSwatchPickerItem as AriaColorSwatchPickerItem,
  ColorThumb as AriaColorThumb,
  SliderTrack as AriaSliderTrack,
  ColorPickerStateContext,
  parseColor,
} from 'react-aria-components'
import './AlignColorPicker.css'

function EyeDropperButton(props) {
  const state = React.useContext(ColorPickerStateContext)
  if (typeof window === 'undefined' || !('EyeDropper' in window)) return null
  return (
    <button
      className="acp-eyedropper"
      aria-label="Eye dropper"
      onClick={() => {
        new window.EyeDropper()
          .open()
          .then((result) => state.setColor(parseColor(result.sRGBHex)))
          .catch(() => {})
      }}
      {...props}
    >
      <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor"><path d="M224 67.5a35.5 35.5 0 0 0-10.5-25.3 36 36 0 0 0-50.9 0l-20.3 20.2-7.6-7.5a12 12 0 0 0-17 0L99.5 73.2a12 12 0 0 0 0 17l5.8 5.8L34.7 166.6a12 12 0 0 0-3.5 8.5v36a12 12 0 0 0 12 12h36a12 12 0 0 0 8.5-3.5l70.5-70.6 5.8 5.8a12 12 0 0 0 17 0l18.2-18.3a12 12 0 0 0 0-17l-7.5-7.5 20.2-20.3A35.5 35.5 0 0 0 224 67.5Zm-148.7 132H55.2v-20.1l70.5-70.5 20.1 20.1Zm85.5-82.7a12 12 0 0 0 0 17l5.7 5.8-1.2 1.2-73.4-73.4 1.2-1.2 5.8 5.7a12 12 0 0 0 17 0l20.2-20.2a12 12 0 0 1 17 17Z"/></svg>
    </button>
  )
}

function safeParse(value) {
  try {
    return parseColor(value || '#ffffff')
  } catch {
    try {
      return parseColor('#ffffff')
    } catch {
      return parseColor('hsba(0, 0%, 100%, 1)')
    }
  }
}

export function AlignColorPicker({ value, onChange }) {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef(null)

  const color = React.useMemo(() => safeParse(value), [value])

  React.useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleChange = (c) => {
    const hex = c.toString('hex')
    const alpha = c.getChannelValue('alpha')
    if (alpha < 1) {
      const a = Math.round(alpha * 255).toString(16).padStart(2, '0')
      onChange(hex + a)
    } else {
      onChange(hex)
    }
  }

  const displayValue = color.toString('hex')
  const alpha = color.getChannelValue('alpha')
  const alphaPercent = Math.round(alpha * 100)

  return (
    <AriaColorPicker value={color} onChange={handleChange}>
      <div className="acp-wrapper" ref={ref}>
        <button className="acp-trigger" onClick={() => setOpen(!open)}>
          <AriaColorSwatch className="acp-trigger-swatch" />
          <span className="acp-trigger-hex">{displayValue}{alpha < 1 ? ` ${alphaPercent}%` : ''}</span>
        </button>
        {open && (
          <div className="acp-popover" onMouseDown={(e) => e.stopPropagation()}>
            <AriaColorArea className="acp-area" colorSpace="hsb" xChannel="saturation" yChannel="brightness">
              <AriaColorThumb className="acp-thumb" />
            </AriaColorArea>
            <AriaColorSlider className="acp-slider" colorSpace="hsb" channel="hue">
              <AriaSliderTrack className="acp-slider-track">
                <AriaColorThumb className="acp-thumb acp-thumb-hue" />
              </AriaSliderTrack>
            </AriaColorSlider>
            <AriaColorSlider className="acp-slider" channel="alpha">
              <AriaSliderTrack className="acp-slider-track acp-alpha-track">
                <AriaColorThumb className="acp-thumb acp-thumb-hue" />
              </AriaSliderTrack>
            </AriaColorSlider>
            <div className="acp-footer">
              <EyeDropperButton />
              <AriaColorSwatch className="acp-swatch-current" />
              <div className="acp-hex-display">{displayValue}</div>
            </div>
            <AriaColorSwatchPicker className="acp-swatches">
              {['#ffffff', '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280'].map((c) => (
                <AriaColorSwatchPickerItem key={c} color={c} className="acp-swatch-item">
                  <AriaColorSwatch className="acp-swatch" />
                </AriaColorSwatchPickerItem>
              ))}
            </AriaColorSwatchPicker>
          </div>
        )}
      </div>
    </AriaColorPicker>
  )
}
