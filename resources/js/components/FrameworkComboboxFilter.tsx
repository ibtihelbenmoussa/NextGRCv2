import { useState, useMemo, useEffect } from "react"
import { router } from "@inertiajs/react"
import { Check, X, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface FrameworkOption {
  code: string
  name: string
}

export function FrameworkComboboxFilter({ frameworks }: { frameworks: FrameworkOption[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // load from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const val = params.get("filter[framework]")
    if (val) setSelected(new Set(val.split(",")))
  }, [])

  // filtered list
  const filtered = useMemo(() => {
    return frameworks.filter(f =>
      f.code.toLowerCase().includes(query.toLowerCase()) ||
      f.name.toLowerCase().includes(query.toLowerCase())
    )
  }, [frameworks, query])

  const updateURL = (next: Set<string>) => {
    const params = new URLSearchParams(window.location.search)

    if (next.size > 0) {
      params.set("filter[framework]", Array.from(next).join(","))
    } else {
      params.delete("filter[framework]")
    }

    params.set("page", "1")

    router.get(`${window.location.pathname}?${params.toString()}`, {}, {
      preserveState: true,
      preserveScroll: true,
      replace: true,
    })
  }

  const toggle = (code: string) => {
    const next = new Set(selected)
    next.has(code) ? next.delete(code) : next.add(code)
    setSelected(next)
    updateURL(next)
  }

  const remove = (code: string) => {
    const next = new Set(selected)
    next.delete(code)
    setSelected(next)
    updateURL(next)
  }

  const clearAll = () => {
    setSelected(new Set())
    updateURL(new Set())
  }

  return (
    <div className="w-full max-w-md">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full border rounded-md px-3 py-2 flex items-center justify-between bg-background"
      >
        <div className="flex flex-wrap gap-1">
          {Array.from(selected).slice(0, 3).map(code => (
            <span key={code} className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-xs">
              {code}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  remove(code)
                }}
              />
            </span>
          ))}
          {selected.size > 3 && (
            <span className="text-xs text-muted-foreground">
              +{selected.size - 3}
            </span>
          )}
        </div>
        <ChevronsUpDown className="h-4 w-4 opacity-50" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="border mt-1 rounded-md shadow-md bg-background z-50">
          
          {/* Search */}
          <input
            placeholder="Search framework..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 border-b outline-none"
          />

          {/* List */}
          <div className="max-h-60 overflow-auto">
            {filtered.map(fw => {
              const isSelected = selected.has(fw.code)
              return (
                <div
                  key={fw.code}
                  onClick={() => toggle(fw.code)}
                  className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted"
                >
                  <div>
                    <div className="text-sm font-medium">{fw.code}</div>
                    <div className="text-xs text-muted-foreground">{fw.name}</div>
                  </div>
                  {isSelected && <Check className="h-4 w-4" />}
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-2 border-t text-xs">
            <span>{selected.size} selected</span>
            {selected.size > 0 && (
              <button onClick={clearAll} className="text-red-500">
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}