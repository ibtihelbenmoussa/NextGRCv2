# Overview Flow - ELK.js Integration

## Summary

Successfully integrated **ELK.js** (Eclipse Layout Kernel) for automatic tree layout in the organization overview flow diagram. This replaces the custom manual layout algorithm with a professional, battle-tested automatic graph layout engine.

## Changes Made

### 1. Installed ELK.js

```bash
npm install elkjs
```

### 2. Rewrote `organization-flow.tsx`

**Key Features:**

- Uses ELK.js layered algorithm for automatic hierarchical layout
- Left-to-right (horizontal) tree layout
- Proper spacing between nodes and layers
- Maintains collapsible functionality
- Dynamic layout recalculation when nodes collapse/expand

**ELK Configuration:**

```typescript
const elkOptions = {
    'elk.algorithm': 'layered',
    'elk.direction': 'RIGHT',
    'elk.layered.spacing.nodeNodeBetweenLayers': '400',
    'elk.spacing.nodeNode': '100',
};
```

### 3. Updated `index.tsx`

Added `ReactFlowProvider` wrapper to fix the Zustand provider error:

```tsx
<ReactFlowProvider>
    <OrganizationFlow organization={organization} />
</ReactFlowProvider>
```

## How It Works

1. **Build Node/Edge Data**: Creates nodes and edges without positioning
2. **ELK Layout**: Passes data to ELK.js which calculates optimal positions
3. **Apply Layout**: Updates React Flow with calculated positions
4. **Auto Fit View**: Automatically centers and scales the diagram

## Benefits

✅ **No Manual Position Calculations**: ELK.js handles all positioning automatically  
✅ **No Overlapping**: Professional graph layout algorithm prevents overlaps  
✅ **Optimal Spacing**: Automatically calculates ideal spacing based on node dimensions  
✅ **Dynamic Reflow**: Layout recalculates when nodes collapse/expand  
✅ **Battle-Tested**: ELK is used in professional diagramming tools  
✅ **Configurable**: Easy to adjust spacing and layout direction via options

## Layout Behavior

- **Direction**: Left to right (Organization → Business Units → Macro Processes → Processes)
- **Node Dimensions**: 320px width × 100px height
- **Layer Spacing**: 400px between hierarchy levels
- **Node Spacing**: 100px between siblings
- **Collapsible**: Click chevron buttons to collapse/expand branches
- **Dynamic**: Layout automatically adjusts when structure changes

## Technical Details

### ELK Graph Structure

```typescript
{
  id: 'root',
  layoutOptions: elkOptions,
  children: nodes.map(node => ({
    ...node,
    width: 320,
    height: 100,
  })),
  edges: edges.map(edge => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  })),
}
```

### React Flow Integration

- Uses `useLayoutEffect` to apply layout before render
- Leverages `fitView()` for automatic viewport adjustment
- State managed with `useNodesState` and `useEdgesState`

## Bundle Size Note

The ELK.js library adds approximately 1.6MB to the bundle (507KB gzipped). This is acceptable for the benefits of professional automatic layout.

## Future Enhancements

Potential improvements:

- Add layout direction toggle (horizontal/vertical)
- Adjust spacing dynamically based on zoom level
- Add animation transitions between layouts
- Implement custom ELK node size calculation based on content
