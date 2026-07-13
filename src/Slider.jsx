import * as SliderPrimitive from '@radix-ui/react-slider'
import './Slider.css'

export function Slider({ min = 0, max = 100, step = 1, value, onValueChange, onValueCommit }) {
  return (
    <SliderPrimitive.Root
      className="align-slider-root"
      min={min}
      max={max}
      step={step}
      value={[value]}
      onValueChange={(vals) => onValueChange(vals[0])}
      onValueCommit={onValueCommit ? (vals) => onValueCommit(vals[0]) : undefined}
    >
      <SliderPrimitive.Track className="align-slider-track">
        <SliderPrimitive.Range className="align-slider-range" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="align-slider-thumb" />
    </SliderPrimitive.Root>
  )
}
