# Overview Flow - Spacing & Overlap Fix

## Issue

Nodes in the organization flow diagram were overlapping due to:

1. Variable node widths (`min-w-[XXXpx]`) allowing nodes to grow beyond expected size
2. Long text content not being truncated, causing nodes to expand
3. Insufficient spacing between nodes in the layout calculations

## Solution Applied

### 1. Fixed Node Widths

Changed all node components from `min-w-[XXXpx]` to fixed `w-[320px]`:

- **organization-node.tsx**: `min-w-[280px]` → `w-[320px]`
- **business-unit-node.tsx**: `min-w-[240px]` → `w-[320px]`
- **macro-process-node.tsx**: `min-w-[220px]` → `w-[320px]`
- **process-node.tsx**: `min-w-[200px]` → `w-[320px]`

All nodes now have a **consistent 320px width** for predictable layout calculations.

### 2. Text Truncation

Added `truncate` class and `title` attribute to all node labels:

```tsx
<div className="truncate text-sm font-bold text-gray-900" title={data.label}>
    {data.label}
</div>
```

This ensures long names are truncated with ellipsis (...) and full text is shown on hover.

### 3. Increased Spacing Constants

Updated layout configuration in `organization-flow.tsx`:

```typescript
const NODE_WIDTH = 350; // 280 → 350 (accounting for padding & borders)
const HORIZONTAL_SPACING = 100; // 50 → 100 (doubled horizontal gaps)
const VERTICAL_SPACING = 250; // 200 → 250 (more vertical breathing room)
```

## Result

✅ **No more overlapping nodes**  
✅ **Consistent, predictable layout**  
✅ **Long text properly truncated with tooltips**  
✅ **Better visual spacing and organization**

The layout algorithm now properly accounts for actual node dimensions and provides sufficient spacing between all nodes at every level of the hierarchy.

## Technical Details

### Why 350px for NODE_WIDTH?

- Actual node width: 320px
- Additional space needed: ~30px for borders, shadows, and React Flow handles
- Total allocation per node: 350px ensures no overlap even with visual effects

### Layout Calculation

The subtree width calculation recursively computes space needed:

```
totalWidth = (numChildren × NODE_WIDTH) + ((numChildren - 1) × HORIZONTAL_SPACING)
```

Each parent node is centered within its allocated subtree width, and children are distributed evenly.
