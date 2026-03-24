# Overview Flow Implementation

## Summary

This implementation creates an interactive tree visualization of your organizational hierarchy using React Flow. The visualization displays the structure: **Organization → Business Units → Macro Processes → Processes**.

## Features

### 🎨 Visual Components

1. **Organization Node** (Blue) - Root level showing the organization name
2. **Business Unit Nodes** (Green) - Second level showing all business units
3. **Macro Process Nodes** (Purple) - Third level showing macro processes
4. **Process Nodes** (Orange) - Leaf nodes showing individual processes

### 🔧 Interactive Features

- **Pan & Zoom**: Navigate through large hierarchies easily
- **Minimap**: Overview of the entire structure with color-coded node types
- **Animated Edges**: Visual flow indicators showing relationships
- **Fit View**: Automatically adjusts zoom to show entire hierarchy
- **Controls**: Built-in zoom and fit-to-screen controls

### 📊 Node Information

Each node displays:

- **Label**: Entity name
- **Code**: Entity code (if available)
- **Count**: Number of child entities (e.g., "3 Business Units")
- **Icon**: Visual indicator of entity type

## Files Created

### Frontend Components

1. **`resources/js/components/overview/organization-node.tsx`**
    - Displays organization as root node
    - Shows business unit count

2. **`resources/js/components/overview/business-unit-node.tsx`**
    - Displays business units
    - Shows macro process count

3. **`resources/js/components/overview/macro-process-node.tsx`**
    - Displays macro processes
    - Shows process count

4. **`resources/js/components/overview/process-node.tsx`**
    - Displays processes
    - Shows risk count

5. **`resources/js/components/overview/organization-flow.tsx`**
    - Main flow component
    - Handles layout algorithm
    - Manages nodes and edges

### Pages

**`resources/js/pages/overview/index.tsx`**

- Updated to use the OrganizationFlow component
- Displays full-screen flow visualization

### Backend

**`app/Http/Controllers/OverviewController.php`**

- Loads organization with nested relationships
- Includes counts for all child entities
- Filters only active entities

## Layout Algorithm

The implementation uses an intelligent tree layout:

```
Organization (x=0, y=0)
    ├─ Business Unit 1 (x=250, y=-75)
    │   ├─ Macro Process 1 (x=500, y=-150)
    │   │   ├─ Process 1 (x=750, y=-225)
    │   │   └─ Process 2 (x=750, y=-75)
    │   └─ Macro Process 2 (x=500, y=0)
    └─ Business Unit 2 (x=250, y=75)
```

- **Vertical Spacing**: 150px between sibling nodes
- **Horizontal Spacing**: 250px between levels
- **Centering**: Child nodes are centered relative to their parent

## Usage

### Viewing the Overview

1. Ensure you're logged in and have selected an organization
2. Navigate to `/overview`
3. The tree will automatically render with your organization's structure

### Navigation

- **Drag**: Click and drag the background to pan
- **Zoom**: Use mouse wheel or controls to zoom in/out
- **Minimap**: Click areas in the minimap to jump to that section
- **Fit View**: Click the fit view button to see entire structure

## Data Flow

```
Controller (PHP)
    ↓ (loads data with eager loading)
Organization with nested relationships
    ↓ (passed via Inertia)
React Component
    ↓ (transforms to nodes/edges)
React Flow Visualization
```

## Customization

### Changing Colors

Edit the node components to change colors:

```tsx
// In organization-node.tsx
border-2 border-blue-500 bg-blue-50  // Change blue-* to any color
```

### Adjusting Layout

Edit constants in `organization-flow.tsx`:

```tsx
const VERTICAL_SPACING = 150; // Space between siblings
const LEVEL_SPACING = 250; // Space between levels
```

### Adding More Data

Add fields to node data interfaces:

```tsx
export type OrganizationNodeData = {
    label: string;
    code?: string;
    business_units_count?: number;
    // Add new fields here
};
```

## Dependencies

- **@xyflow/react**: React Flow library for interactive diagrams
- **lucide-react**: Icons for node types (already in project)
- **tailwindcss**: Styling (already in project)

## Performance Considerations

- Only active entities are loaded
- Eager loading prevents N+1 queries
- Memoization prevents unnecessary re-renders
- Flow rendering is optimized by React Flow internally

## Future Enhancements

Potential additions:

- Click on nodes to see details
- Filter by entity type
- Search functionality
- Export as image
- Different layout algorithms (radial, hierarchical, etc.)
- Collapsible nodes for large hierarchies
- Real-time updates via WebSockets
