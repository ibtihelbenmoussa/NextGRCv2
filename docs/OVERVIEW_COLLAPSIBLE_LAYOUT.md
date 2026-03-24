# Overview Flow: Top-to-Bottom Collapsible Layout

## Changes Implemented

### 1. **Layout Direction: Left-to-Right → Top-to-Bottom**

The organizational tree now flows from top to bottom, which is more intuitive for hierarchical structures:

```
Before (Messy Left-to-Right):          After (Clean Top-to-Bottom):

Org → BU1 → MP1 → P1                           Organization
  ↓     ↓     ↓                                      |
  → BU2 → MP2 → P2                        ┌─────────┼─────────┐
  ↓     ↓     ↓                          BU1       BU2       BU3
  → BU3 → MP3 → P3                         |         |         |
                                       ┌───┴───┐     |         |
                                      MP1    MP2    MP3       MP4
                                       |       |     |         |
                                    ┌──┴──┐   P3    P4     ┌──┴──┐
                                   P1    P2                P5    P6
```

### 2. **Collapsible/Expandable Nodes**

All nodes with children can now be collapsed or expanded by clicking the chevron button:

- **Chevron Down (▼)**: Node is expanded, children are visible
- **Chevron Right (▶)**: Node is collapsed, children are hidden

#### Collapsible Node Types:

- ✅ **Organization**: Can collapse all business units
- ✅ **Business Units**: Can collapse all macro processes
- ✅ **Macro Processes**: Can collapse all processes
- ❌ **Processes**: No children, so no collapse button

### 3. **Smart Layout Algorithm**

#### Horizontal Distribution

Nodes at the same level are distributed horizontally based on their count:

- Each node gets approximately 280px width + 50px spacing
- Siblings are centered relative to their parent
- Prevents horizontal overlap

#### Vertical Spacing

Fixed vertical spacing between levels:

- Organization → Business Units: 200px
- Business Units → Macro Processes: 200px
- Macro Processes → Processes: 200px

### 4. **Interactive Features**

#### Collapse/Expand Buttons

- Located on the right side of each node (if it has children)
- Color-coded to match node type:
    - Blue button for Organization
    - Green button for Business Units
    - Purple button for Macro Processes
- Hover effect for visual feedback
- Smooth transitions

#### State Management

- Uses React `useState` to track collapsed nodes
- Collapsed state is maintained in a `Set<string>`
- Node IDs are used as keys for collapse state
- Re-renders only affected subtrees when toggling

## Layout Configuration

```typescript
const NODE_WIDTH = 280; // Width of each node
const HORIZONTAL_SPACING = 50; // Space between sibling nodes
const VERTICAL_SPACING = 200; // Space between levels
```

### Adjusting Spacing

Edit these constants in `organization-flow.tsx` to change the layout:

```typescript
// For tighter layout
const HORIZONTAL_SPACING = 30;
const VERTICAL_SPACING = 150;

// For more spacious layout
const HORIZONTAL_SPACING = 100;
const VERTICAL_SPACING = 250;
```

## Component Updates

### Node Data Interface

All collapsible nodes now include these properties:

```typescript
{
    label: string;
    code?: string;
    count?: number;
    isCollapsed?: boolean;         // NEW: Collapse state
    hasChildren?: boolean;          // NEW: Whether node has children
    onToggleCollapse?: () => void;  // NEW: Toggle callback
}
```

### Updated Components

1. **OrganizationNode** - Added collapse button
2. **BusinessUnitNode** - Added collapse button
3. **MacroProcessNode** - Added collapse button
4. **ProcessNode** - No collapse button (leaf nodes)

## User Interaction Flow

### Expanding the Tree

1. Start with all nodes expanded (default)
2. Click any chevron down (▼) button to collapse that branch
3. All descendants of collapsed node are hidden
4. Edges to hidden nodes are removed

### Collapsing Branches

1. Click chevron right (▶) to expand a collapsed branch
2. Immediate children appear
3. Grandchildren remain in their previous state (collapsed/expanded)

### Example Workflow

```
1. View full organization tree
2. Collapse Business Unit 1 → Hides all its Macro Processes and Processes
3. Collapse Organization → Hides everything except Organization node
4. Expand Organization → Shows all Business Units
5. Expand Business Unit 1 → Shows its Macro Processes
6. Individual Macro Processes can be expanded/collapsed independently
```

## Benefits

### ✅ Better Organization

- Top-to-bottom is more natural for hierarchical data
- Easier to follow the organizational structure
- Clear visual hierarchy

### ✅ Improved Navigation

- Collapse large branches to focus on specific areas
- Quickly navigate between different parts of organization
- Reduce visual clutter

### ✅ Performance

- Hidden nodes aren't rendered
- Fewer nodes = better performance for large organizations
- Efficient state management with Set

### ✅ User Experience

- Intuitive collapse/expand interaction
- Visual feedback with hover effects
- Consistent with common tree UI patterns

## Technical Implementation

### State Management

```typescript
// Track which nodes are collapsed
const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

// Toggle collapse state
const toggleNodeCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(nodeId)) {
            newSet.delete(nodeId); // Expand
        } else {
            newSet.add(nodeId); // Collapse
        }
        return newSet;
    });
}, []);
```

### Conditional Rendering

```typescript
// Skip rendering children if parent is collapsed
if (collapsedNodes.has(parentNodeId)) {
    return { nodes, edges }; // Skip children
}

// Otherwise, render children normally
macroProcesses.forEach((mp) => {
    // Create child nodes...
});
```

### Layout Algorithm

```typescript
// Calculate horizontal spacing for siblings
const totalWidth =
    siblingCount * NODE_WIDTH + (siblingCount - 1) * HORIZONTAL_SPACING;

let currentX = -totalWidth / 2; // Center siblings

siblings.forEach((sibling) => {
    // Position at currentX
    currentX += NODE_WIDTH + HORIZONTAL_SPACING;
});
```

## Keyboard Shortcuts (Future Enhancement)

Potential additions:

- **Space**: Toggle collapse on selected node
- **Arrow Keys**: Navigate between nodes
- **+**: Expand all
- **-**: Collapse all
- **Home**: Focus root node
- **End**: Focus deepest visible node

## Accessibility Considerations

- Buttons have proper `title` attributes for tooltips
- Color contrast meets WCAG standards
- Keyboard navigation (future enhancement)
- Screen reader support (future enhancement)

## Performance Metrics

- **Render time**: O(n) where n = visible nodes
- **Memory**: O(n) for all nodes + O(c) for collapsed state
- **Update time**: O(n) when toggling (re-calculates positions)
- **Optimized**: Only visible nodes are in the DOM

## Testing Scenarios

### Test Case 1: Large Organization

- 10 Business Units
- Each with 5 Macro Processes
- Each with 10 Processes
- **Total**: 1 + 10 + 50 + 500 = 561 nodes

**Expected**:

- Smooth initial render
- Can collapse entire organization
- Individual branches collapse independently

### Test Case 2: Deep Hierarchy

- 1 Business Unit
- 1 Macro Process
- 100 Processes

**Expected**:

- Vertical layout doesn't overflow
- All nodes visible and accessible
- Zoom/pan works smoothly

### Test Case 3: Wide Hierarchy

- 20 Business Units
- 1 Macro Process each
- 1 Process each

**Expected**:

- Horizontal distribution is even
- Fits in viewport with zoom out
- No overlapping nodes

## Files Modified

- ✏️ `resources/js/components/overview/organization-flow.tsx` - Layout & state
- ✏️ `resources/js/components/overview/organization-node.tsx` - Collapse button
- ✏️ `resources/js/components/overview/business-unit-node.tsx` - Collapse button
- ✏️ `resources/js/components/overview/macro-process-node.tsx` - Collapse button
- ✏️ `resources/js/components/overview/process-node.tsx` - Type updates
