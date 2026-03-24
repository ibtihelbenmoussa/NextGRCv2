import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface ColorPickerProps {
  value?: string
  onChange?: (color: string) => void
  className?: string
  disabled?: boolean
  presetColors?: string[]
}

const DEFAULT_COLORS = [
  "#22c55e", // Green
  "#84cc16", // Light green
  "#eab308", // Yellow
  "#f97316", // Orange
  "#ef4444", // Red
  "#dc2626", // Dark red
  "#b91c1c", // Darker red
  "#991b1b", // Very dark red
  "#7f1d1d", // Darkest red
  "#450a0a", // Maroon
  "#000000", // Black
  "#ffffff", // White
  "#6b7280", // Gray
  "#3b82f6", // Blue
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
]

export function ColorPicker({
  value = "#22c55e",
  onChange,
  className,
  disabled = false,
  presetColors = DEFAULT_COLORS,
}: ColorPickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value)

  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  const handleColorSelect = React.useCallback((color: string) => {
    setInputValue(color)
    onChange?.(color)
    setOpen(false)
  }, [onChange])

  const handleInputChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)

    // Validate hex color format
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newValue)) {
      onChange?.(newValue)
    }
  }, [onChange])

  const handleInputBlur = React.useCallback(() => {
    // Reset to current value if invalid
    if (!/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(inputValue)) {
      setInputValue(value)
    }
  }, [inputValue, value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-[60px] h-[40px] p-1 border-2",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={disabled}
        >
          <div
            className="w-full h-full rounded-sm"
            style={{ backgroundColor: value }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="color-input" className="text-sm font-medium">
              Color Value
            </Label>
            <Input
              id="color-input"
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              placeholder="#000000"
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Preset Colors</Label>
            <div className="grid grid-cols-8 gap-2">
              {presetColors.map((color, index) => (
                <Button
                  key={`${color}-${index}`}
                  variant="outline"
                  size="sm"
                  className="w-8 h-8 p-0 border-2 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => handleColorSelect(color)}
                  title={color}
                >
                  {value === color && (
                    <div className="w-2 h-2 rounded-full bg-white border border-gray-800" />
                  )}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Select</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleColorSelect("#22c55e")}
                className="flex-1"
              >
                <div className="w-4 h-4 bg-green-500 rounded mr-2" />
                Low
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleColorSelect("#eab308")}
                className="flex-1"
              >
                <div className="w-4 h-4 bg-yellow-500 rounded mr-2" />
                Medium
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleColorSelect("#ef4444")}
                className="flex-1"
              >
                <div className="w-4 h-4 bg-red-500 rounded mr-2" />
                High
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { ColorPicker as default }
