"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface FastColorPickerProps {
  value?: string
  onChange?: (color: string) => void
  className?: string
  disabled?: boolean
  size?: "sm" | "md" | "lg"
}

// Comprehensive color palette organized by category
const COLOR_PALETTE = {
  // Risk colors (most important)
  risk: [
    "#22c55e", // Green - Low
    "#84cc16", // Light green
    "#eab308", // Yellow - Medium
    "#f59e0b", // Amber
    "#f97316", // Orange - High
    "#ef4444", // Red - Extreme
    "#dc2626", // Dark red - Critical
    "#b91c1c", // Darker red
  ],
  // Extended risk colors
  extended: [
    "#065f46", // Dark green
    "#16a34a", // Medium green
    "#ca8a04", // Dark yellow
    "#d97706", // Dark orange
    "#991b1b", // Very dark red
    "#7f1d1d", // Darkest red
    "#450a0a", // Maroon
    "#1f2937", // Dark gray
  ],
  // Professional colors
  professional: [
    "#1e40af", // Blue
    "#3730a3", // Indigo
    "#7c2d12", // Brown
    "#374151", // Gray-700
    "#4b5563", // Gray-600
    "#6b7280", // Gray-500
    "#9ca3af", // Gray-400
    "#d1d5db", // Gray-300
  ],
  // Accent colors
  accent: [
    "#0891b2", // Cyan
    "#0d9488", // Teal
    "#059669", // Emerald
    "#7c3aed", // Violet
    "#c026d3", // Fuchsia
    "#db2777", // Pink
    "#000000", // Black
    "#ffffff", // White
  ]
}

export function FastColorPicker({
  value = "#22c55e",
  onChange,
  className,
  disabled = false,
  size = "md",
}: FastColorPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10"
  }

  const handleColorSelect = React.useCallback((color: string, event?: React.MouseEvent) => {
    event?.preventDefault()
    event?.stopPropagation()
    onChange?.(color)
    setIsOpen(false)
  }, [onChange])

  const handleToggle = React.useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }, [disabled, isOpen])

  // Close on outside click or escape key
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen])

  const ColorButton = React.memo(({ color, isSelected }: { color: string; isSelected: boolean }) => (
    <button
      type="button"
      onClick={(e) => handleColorSelect(color, e)}
      className={cn(
        "w-5 h-5 rounded border transition-all duration-75",
        "hover:scale-110 hover:shadow-sm hover:z-10 relative",
        "focus:outline-none focus:ring-1 focus:ring-primary focus:ring-offset-1",
        isSelected
          ? "border-gray-900 ring-1 ring-primary scale-110 shadow-md z-10"
          : "border-gray-300 hover:border-gray-500"
      )}
      style={{ backgroundColor: color }}
      title={color.toUpperCase()}
    />
  ))

  ColorButton.displayName = "ColorButton"

  return (
    <div ref={containerRef} className={cn("relative inline-block", className)}>
      {/* Compact trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "border-2 rounded-md transition-all duration-150",
          "hover:scale-105 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
          sizeClasses[size],
          disabled && "opacity-50 cursor-not-allowed hover:scale-100",
          isOpen ? "border-primary ring-2 ring-primary ring-offset-1" : "border-gray-300 hover:border-gray-400"
        )}
        style={{ backgroundColor: value }}
        title={`Color: ${value.toUpperCase()}`}
      >
        {/* Small indicator for selected state */}
        {isOpen && (
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border border-white shadow-sm" />
        )}
      </button>

      {/* Compact color palette dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-xl min-w-[240px] max-w-[280px]">

          {/* Risk Colors - Most Important */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700">Risk Levels</span>
              <div className="h-px bg-gray-200 flex-1 ml-2" />
            </div>
            <div className="grid grid-cols-8 gap-1.5">
              {COLOR_PALETTE.risk.map((color) => (
                <ColorButton
                  key={color}
                  color={color}
                  isSelected={value === color}
                />
              ))}
            </div>
          </div>

          {/* Extended Risk Colors */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700">Extended</span>
              <div className="h-px bg-gray-200 flex-1 ml-2" />
            </div>
            <div className="grid grid-cols-8 gap-1.5">
              {COLOR_PALETTE.extended.map((color) => (
                <ColorButton
                  key={color}
                  color={color}
                  isSelected={value === color}
                />
              ))}
            </div>
          </div>

          {/* Professional Colors */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700">Professional</span>
              <div className="h-px bg-gray-200 flex-1 ml-2" />
            </div>
            <div className="grid grid-cols-8 gap-1.5">
              {COLOR_PALETTE.professional.map((color) => (
                <ColorButton
                  key={color}
                  color={color}
                  isSelected={value === color}
                />
              ))}
            </div>
          </div>

          {/* Accent Colors */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-700">Accent</span>
              <div className="h-px bg-gray-200 flex-1 ml-2" />
            </div>
            <div className="grid grid-cols-8 gap-1.5">
              {COLOR_PALETTE.accent.map((color) => (
                <ColorButton
                  key={color}
                  color={color}
                  isSelected={value === color}
                />
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="border-t border-gray-100 pt-3 mt-3">
            <div className="flex gap-1">
              <button
                type="button"
                onClick={(e) => handleColorSelect("#22c55e", e)}
                className="flex-1 h-7 px-2 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 transition-colors duration-75 flex items-center justify-center gap-1"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                Low
              </button>
              <button
                type="button"
                onClick={(e) => handleColorSelect("#eab308", e)}
                className="flex-1 h-7 px-2 text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 rounded hover:bg-yellow-100 transition-colors duration-75 flex items-center justify-center gap-1"
              >
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                Med
              </button>
              <button
                type="button"
                onClick={(e) => handleColorSelect("#ef4444", e)}
                className="flex-1 h-7 px-2 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 transition-colors duration-75 flex items-center justify-center gap-1"
              >
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                High
              </button>
            </div>
          </div>

          {/* Color info */}
          {value && (
            <div className="border-t border-gray-100 pt-3 mt-3">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Selected:</span>
                <code className="px-2 py-1 bg-gray-100 rounded text-gray-800 font-mono">
                  {value.toUpperCase()}
                </code>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default FastColorPicker
