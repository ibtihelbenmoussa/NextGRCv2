"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface RiskColorPresetProps {
  value?: string
  onChange?: (color: string) => void
  className?: string
  disabled?: boolean
  showLabel?: boolean
}

// Ultra-fast preset colors with instant selection
const RISK_PRESETS = [
  { color: "#22c55e", label: "Low", key: "low" },
  { color: "#eab308", label: "Medium", key: "medium" },
  { color: "#f97316", label: "High", key: "high" },
  { color: "#ef4444", label: "Extreme", key: "extreme" },
  { color: "#dc2626", label: "Critical", key: "critical" },
] as const

export function RiskColorPreset({
  value = "#22c55e",
  onChange,
  className,
  disabled = false,
  showLabel = true,
}: RiskColorPresetProps) {
  const handleColorSelect = React.useCallback((color: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onChange?.(color)
  }, [onChange])

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {RISK_PRESETS.map(({ color, label, key }) => {
        const isSelected = value === color

        return (
          <button
            key={key}
            type="button"
            onClick={(e) => handleColorSelect(color, e)}
            disabled={disabled}
            className={cn(
              "relative flex items-center justify-center w-8 h-8 rounded border-2 transition-all duration-75 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary",
              isSelected
                ? "border-gray-900 ring-2 ring-primary shadow-md scale-110"
                : "border-gray-300 hover:border-gray-500",
              disabled && "opacity-50 cursor-not-allowed hover:scale-100"
            )}
            style={{ backgroundColor: color }}
            title={showLabel ? `${label} Risk - ${color}` : color}
          >
            {isSelected && (
              <div className="w-2 h-2 bg-white rounded-full border border-gray-800 shadow-sm" />
            )}
          </button>
        )
      })}

      {showLabel && value && (
        <span className="ml-2 text-sm font-medium text-gray-700">
          {RISK_PRESETS.find(p => p.color === value)?.label || "Custom"}
        </span>
      )}
    </div>
  )
}

// Ultra-compact version for tight spaces
export function RiskColorPresetMini({
  value = "#22c55e",
  onChange,
  className,
  disabled = false,
}: Omit<RiskColorPresetProps, 'showLabel'>) {
  const handleColorSelect = React.useCallback((color: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onChange?.(color)
  }, [onChange])

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {RISK_PRESETS.map(({ color, label, key }) => {
        const isSelected = value === color

        return (
          <button
            key={key}
            type="button"
            onClick={(e) => handleColorSelect(color, e)}
            disabled={disabled}
            className={cn(
              "w-6 h-6 rounded border transition-all duration-75 hover:scale-105 focus:outline-none focus:ring-1 focus:ring-primary",
              isSelected
                ? "border-gray-900 ring-1 ring-primary scale-105"
                : "border-gray-300",
              disabled && "opacity-50 cursor-not-allowed hover:scale-100"
            )}
            style={{ backgroundColor: color }}
            title={`${label} - ${color}`}
          />
        )
      })}
    </div>
  )
}

// Horizontal bar version for inline use
export function RiskColorPresetBar({
  value = "#22c55e",
  onChange,
  className,
  disabled = false,
}: Omit<RiskColorPresetProps, 'showLabel'>) {
  const handleColorSelect = React.useCallback((color: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    onChange?.(color)
  }, [onChange])

  const selectedIndex = RISK_PRESETS.findIndex(p => p.color === value)

  return (
    <div className={cn("relative flex h-8 rounded overflow-hidden border-2 border-gray-300", className)}>
      {RISK_PRESETS.map(({ color, label, key }) => {
        const isSelected = value === color

        return (
          <button
            key={key}
            type="button"
            onClick={(e) => handleColorSelect(color, e)}
            disabled={disabled}
            className={cn(
              "flex-1 transition-all duration-75 hover:brightness-110 focus:outline-none relative",
              isSelected && "z-10 ring-2 ring-primary ring-inset",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            style={{ backgroundColor: color }}
            title={`${label} Risk`}
          >
            {isSelected && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full border border-gray-800 shadow-sm" />
              </div>
            )}
          </button>
        )
      })}

      {/* Selection indicator */}
      {selectedIndex >= 0 && (
        <div
          className="absolute bottom-0 h-1 bg-gray-900 transition-all duration-150"
          style={{
            left: `${(selectedIndex / RISK_PRESETS.length) * 100}%`,
            width: `${100 / RISK_PRESETS.length}%`
          }}
        />
      )}
    </div>
  )
}

export default RiskColorPreset
