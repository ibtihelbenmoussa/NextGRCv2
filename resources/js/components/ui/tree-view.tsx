'use client'

import { useState, useMemo } from "react"
import {
  ChevronRight,
  Search,
  FolderOpen,
  Folder,
  File,
  FileText,
  FileCode,
  FileImage,
  FileSpreadsheet,
  Pencil,
  Trash2,
  FolderPlus,
  Info,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface TreeNode {
  id: string
  label: string
  children?: TreeNode[]
  type?: "folder" | "file"
  icon?: React.ReactNode
  selectedIcon?: React.ReactNode
  openIcon?: React.ReactNode
  actions?: React.ReactNode
  onClick?: () => void
  draggable?: boolean
  droppable?: boolean
  disabled?: boolean
  data?: unknown
}

interface TreeViewProps {
  data: TreeNode[]
  onEdit?: (node: TreeNode) => void
  onDelete?: (node: TreeNode) => void
  onAddChild?: (node: TreeNode) => void
  onInfo?: (node: TreeNode) => void
  onSelect?: (node: TreeNode | undefined) => void
  selectedId?: string
  searchable?: boolean
  showExpandAll?: boolean
  className?: string
}

interface TreeNodeItemProps {
  node: TreeNode
  level: number
  searchTerm: string
  expandedNodes: Set<string>
  onToggle: (id: string) => void
  onEdit?: (node: TreeNode) => void
  onDelete?: (node: TreeNode) => void
  onAddChild?: (node: TreeNode) => void
  onInfo?: (node: TreeNode) => void
  onSelect?: (node: TreeNode) => void
  selectedId?: string
}

function getFileIcon(label: string, isFolder: boolean, isExpanded: boolean) {
  if (isFolder) {
    return isExpanded ? (
      <FolderOpen className="w-4 h-4 text-primary/80" />
    ) : (
      <Folder className="w-4 h-4 text-primary/70" />
    )
  }

  const extension = label.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'txt':
    case 'md':
    case 'doc':
    case 'docx':
      return <FileText className="w-4 h-4 text-muted-foreground" />
    case 'js':
    case 'ts':
    case 'jsx':
    case 'tsx':
    case 'html':
    case 'css':
    case 'json':
      return <FileCode className="w-4 h-4 text-muted-foreground" />
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
      return <FileImage className="w-4 h-4 text-muted-foreground" />
    case 'xlsx':
    case 'xls':
    case 'csv':
      return <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
    default:
      return <File className="w-4 h-4 text-muted-foreground" />
  }
}

function TreeNodeItem({
  node,
  level,
  searchTerm,
  expandedNodes,
  onToggle,
  onEdit,
  onDelete,
  onAddChild,
  onInfo,
  onSelect,
  selectedId,
}: TreeNodeItemProps) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedNodes.has(node.id)
  const matchesSearch = (node.label ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  const isFolder = hasChildren || node.type === 'folder'
  const isSelected = selectedId === node.id

  const hasMatchingDescendant = (node: TreeNode): boolean => {
    if ((node.label ?? '').toLowerCase().includes(searchTerm.toLowerCase())) {
      return true
    }
    if (node.children) {
      return node.children.some(hasMatchingDescendant)
    }
    return false
  }

  const shouldShow = searchTerm === '' || hasMatchingDescendant(node)

  if (!shouldShow) {
    return null
  }

  const handleClick = () => {
    if (hasChildren) {
      onToggle(node.id)
    }
    if (onSelect) {
      onSelect(node)
    }
    if (node.onClick) {
      node.onClick()
    }
  }

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/50 group transition-all duration-200 cursor-pointer',
          matchesSearch && searchTerm !== '' && 'bg-accent/70',
          isSelected && 'bg-accent/70 text-accent-foreground'
        )}
        style={{ paddingLeft: `${level * 1.25 + 0.5}rem` }}
        onClick={handleClick}
      >
        <div
          className={cn(
            'flex items-center justify-center w-4 h-4 transition-transform duration-200',
            !hasChildren && 'invisible',
          )}
        >
          {hasChildren && (
            <ChevronRight
              className={cn(
                'w-3.5 h-3.5 text-muted-foreground transition-transform duration-200',
                isExpanded && 'rotate-90',
              )}
            />
          )}
        </div>

        <div className="flex items-center justify-center w-4 h-4">
          {node.icon || getFileIcon(node.label, isFolder, isExpanded)}
        </div>

        <span className="flex-1 text-sm font-medium text-foreground tracking-tight">
          {node.label}
        </span>

        <div
          className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-accent hover:text-foreground"
              onClick={() => onEdit(node)}
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
          {onAddChild && isFolder && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-accent hover:text-foreground"
              onClick={() => onAddChild(node)}
              title="Add Child"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </Button>
          )}
          {onInfo && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-accent hover:text-foreground"
              onClick={() => onInfo(node)}
              title="Info"
            >
              <Info className="w-3.5 h-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(node)}
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
          {node.actions}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              level={level + 1}
              searchTerm={searchTerm}
              expandedNodes={expandedNodes}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onInfo={onInfo}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function TreeView({
  data,
  onEdit,
  onDelete,
  onAddChild,
  onInfo,
  onSelect,
  selectedId,
  searchable = true,
  showExpandAll = true,
  className,
}: TreeViewProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  useMemo(() => {
    if (searchTerm) {
      const nodesToExpand = new Set<string>()

      const findMatchingNodes = (nodes: TreeNode[], parentIds: string[] = []) => {
        nodes.forEach((node) => {
          const currentPath = [...parentIds, node.id]
          const labelStr = typeof node.label === 'string' ? node.label : '';

          if (labelStr.toLowerCase().includes(searchTerm.toLowerCase())) {
            parentIds.forEach((id) => nodesToExpand.add(id))
          }

          if (node.children) {
            findMatchingNodes(node.children, currentPath)
          }
        })
      }

      findMatchingNodes(data)
      setExpandedNodes(nodesToExpand)
    }
  }, [searchTerm, data])

  const handleToggle = (id: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const expandAll = () => {
    const allIds = new Set<string>()
    const collectIds = (nodes: TreeNode[]) => {
      nodes.forEach((node) => {
        allIds.add(node.id)
        if (node.children) {
          collectIds(node.children)
        }
      })
    }
    collectIds(data)
    setExpandedNodes(allIds)
  }

  const collapseAll = () => {
    setExpandedNodes(new Set())
  }

  const hasSearchResults = useMemo(() => {
    if (!searchTerm || data.length === 0) return true

    const hasMatch = (nodes: TreeNode[]): boolean => {
      return nodes.some((node) => {
        const labelStr = typeof node.label === 'string' ? node.label : '';
        if (labelStr.toLowerCase().includes(searchTerm.toLowerCase())) {
          return true
        }
        if (node.children) {
          return hasMatch(node.children)
        }
        return false
      })
    }

    return hasMatch(data)
  }, [searchTerm, data])

  return (
    <div className={cn('space-y-3', className)}>
      {(searchable || showExpandAll) && (
        <div className="flex items-center gap-2">
          {searchable && (
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm bg-card border-border focus-visible:ring-primary/20"
              />
            </div>
          )}
          {showExpandAll && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={expandAll}
                className="h-9 text-sm px-3 bg-card hover:bg-accent border-border"
              >
                Expand All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={collapseAll}
                className="h-9 text-sm px-3 bg-card hover:bg-accent border-border"
              >
                Collapse All
              </Button>
            </>
          )}
        </div>
      )}

      <div className="border border-border rounded-lg p-2 bg-card shadow-sm">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Folder className="w-16 h-16 mb-4 opacity-20 stroke-[1.5]" />
            <p className="text-sm font-medium text-foreground">No items to display</p>
            <p className="text-xs mt-1.5">Add items to get started</p>
          </div>
        ) : !hasSearchResults ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Search className="w-16 h-16 mb-4 opacity-20 stroke-[1.5]" />
            <p className="text-sm font-medium text-foreground">No results found</p>
            <p className="text-xs mt-1.5">Try a different search term</p>
          </div>
        ) : (
          data.map((node) => (
            <TreeNodeItem
              key={node.id}
              node={node}
              level={0}
              searchTerm={searchTerm}
              expandedNodes={expandedNodes}
              onToggle={handleToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              onInfo={onInfo}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))
        )}
      </div>
    </div>
  )
}
