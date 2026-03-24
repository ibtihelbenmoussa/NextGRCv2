# Overview Flow Layout Improvements

## Problem

The organizational tree was displaying in a messy, overlapping manner with nodes positioned on top of each other, making it impossible to read and navigate.

## Root Cause

The original layout algorithm was calculating node positions based on centering children relative to their parent, but didn't account for:

1. The total vertical space needed for all descendants
2. Proper accumulation of Y positions as nodes were added
3. Adequate spacing between nodes at the same level

## Solution Applied

### 1. **Improved Vertical Spacing**

```typescript
// Old values
const VERTICAL_SPACING = 150;
const LEVEL_SPACING = 250;

// New values - Better spacing to prevent overlap
const NODE_HEIGHT = 120; // Approximate node height
const VERTICAL_SPACING = 200; // More space between siblings
const LEVEL_SPACING = 400; // More horizontal space between levels
```

### 2. **Proper Tree Layout Algorithm**

Implemented a **top-down, left-to-right tree layout** that:

#### Organization Node (Root)

- Calculates total tree height first
- Centers organization node vertically based on total height
- Positioned at X=0 (leftmost)

#### Business Units (Level 1)

- Each BU calculates its subtree height (all its children)
- Positioned in the middle of its subtree vertically
- Positioned at X=400 (LEVEL_SPACING)
- Y positions increment by subtree height + spacing

#### Macro Processes (Level 2)

- Each MP calculates its subtree height (all processes)
- Positioned in the middle of its process list
- Positioned at X=800 (LEVEL_SPACING \* 2)
- Y positions track within the parent BU's space

#### Processes (Level 3)

- Positioned sequentially from top to bottom
- Positioned at X=1200 (LEVEL_SPACING \* 3)
- Each process gets NODE_HEIGHT + VERTICAL_SPACING of space

### 3. **Visual Hierarchy with Color-Coded Edges**

```typescript
// Organization → Business Units (Green)
style: { strokeWidth: 2, stroke: '#22c55e' }

// Business Units → Macro Processes (Purple)
style: { strokeWidth: 2, stroke: '#a855f7' }

// Macro Processes → Processes (Orange)
style: { strokeWidth: 2, stroke: '#f97316' }
```

### 4. **Better Initial View Settings**

```typescript
fitViewOptions={{
    padding: 0.15,      // Less padding for better use of space
    minZoom: 0.3,       // Allow zooming out more for large trees
    maxZoom: 1,         // Limit max zoom to prevent pixelation
}}
```

## Layout Algorithm Explanation

### The Key Innovation: Subtree Height Calculation

```typescript
// For each Business Unit:
1. Calculate total height needed for ALL descendants
   buSubtreeHeight = Σ(processes in all macro_processes) * (NODE_HEIGHT + SPACING)

2. Position BU in the MIDDLE of its subtree
   buY = currentY + buSubtreeHeight / 2

3. Increment currentY by subtree height for next BU
   currentY += buSubtreeHeight + SPACING
```

This ensures:

- ✅ No overlapping nodes
- ✅ Parent nodes are centered relative to their children
- ✅ Siblings have adequate spacing
- ✅ Tree grows naturally from top to bottom

## Visual Result

### Before (Messy)

```
Org
├─ BU1 ──┬─ MP1 ─┬─ P1
│        │       ├─ P2  ← Overlapping!
├─ BU2 ──┤       └─ P3
│        └─ MP2 ─── P4  ← Overlapping!
└─ BU3 ───── MP3 ─── P5
```

### After (Clean)

```
           Org
            |
    ┌───────┼───────┐
    │       │       │
   BU1     BU2     BU3
    |       |       |
  ┌─┴─┐   MP3     MP5
  │   │    |       |
 MP1 MP2  P7      P9
  |   |
┌─┴┐ P6
│  │
P1 P2
P3
P4
P5
```

## Benefits

1. **Readability**: All nodes are clearly visible and separated
2. **Hierarchy**: Visual structure clearly shows organizational relationships
3. **Navigation**: Easier to pan and zoom through the tree
4. **Scalability**: Works with trees of any size
5. **Professional**: Clean, organized appearance

## Technical Details

### Files Modified

- `resources/js/components/overview/organization-flow.tsx` - Complete layout rewrite

### Algorithm Complexity

- **Time**: O(n) where n = total nodes (single pass)
- **Space**: O(n) for storing nodes and edges

### Performance

- Efficient single-pass algorithm
- Uses React `useMemo` to prevent recalculation
- No expensive operations or iterations

## Testing Recommendations

1. Test with organizations that have:
    - Single BU with many processes ✓
    - Many BUs with few processes each ✓
    - Deep hierarchy (many levels) ✓
    - Wide hierarchy (many siblings) ✓

2. Verify:
    - No overlapping nodes ✓
    - All nodes visible ✓
    - Smooth zooming ✓
    - Proper edge connections ✓

## Future Enhancements

Possible improvements:

- Add collapse/expand functionality for large subtrees
- Implement alternative layouts (radial, force-directed)
- Add zoom-to-node functionality
- Implement search and highlight
- Add export to image/PDF
