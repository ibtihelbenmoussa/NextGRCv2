# Node Details Dialog Feature

## Overview

This feature adds interactive click functionality to all nodes in the organization flow diagram. When a user clicks on any node, a dialog appears showing the node's details with a button to navigate to the full details page.

## Implementation

### Components

1. **NodeDetailsDialog** (`resources/js/components/overview/node-details-dialog.tsx`)
    - Reusable dialog component that displays node information
    - Shows node type icon, name, code, and relevant statistics
    - Provides "View Full Details" button that navigates to the appropriate show page
    - Fully supports dark mode

2. **Updated Node Components**
    - **OrganizationNode**: Added `onClick` prop and cursor-pointer styling
    - **BusinessUnitNode**: Added `onClick` prop and cursor-pointer styling
    - **MacroProcessNode**: Added `onClick` prop and cursor-pointer styling
    - **ProcessNode**: Added `onClick` prop and cursor-pointer styling

3. **OrganizationFlow** (main orchestrator)
    - Added state management for selected node and dialog visibility
    - Added `handleNodeClick` callback passed to all nodes
    - Integrated `NodeDetailsDialog` component

## Node Details Type

```typescript
type NodeDetailsType =
    | {
          type: 'organization';
          id: number;
          name: string;
          code?: string;
          business_units_count?: number;
      }
    | {
          type: 'businessUnit';
          id: number;
          name: string;
          code?: string;
          macro_processes_count?: number;
          organization_id: number;
      }
    | {
          type: 'macroProcess';
          id: number;
          name: string;
          code?: string;
          processes_count?: number;
          business_unit_id: number;
      }
    | {
          type: 'process';
          id: number;
          name: string;
          code?: string;
          risks_count?: number;
          macro_process_id: number;
      };
```

## User Experience

### Interaction Flow

1. User clicks on any node in the flow diagram
2. Dialog opens showing:
    - Node type with color-coded icon
    - Node name
    - Node code (if available)
    - Relevant statistics (count of children or risks)
3. User can:
    - Click "Close" to dismiss the dialog
    - Click "View Full Details" to navigate to the show page

### Navigation Routes

- **Organization**: `/organizations/{id}`
- **Business Unit**: `/business-units/{id}`
- **Macro Process**: `/macro-processes/{id}`
- **Process**: `/processes/{id}`

## Click Handler Logic

- Clicking the node body triggers the dialog
- Clicking collapse buttons does NOT trigger the dialog (event bubbling prevented)
- Handles are not clickable (they're for visual connection only)

## Dark Mode Support

The dialog and all nodes fully support dark mode with appropriate color schemes:

- Dialog background and borders adapt to theme
- Node gradients have dark mode variants
- Icons and text maintain proper contrast

## Technical Details

### State Management

```typescript
const [selectedNode, setSelectedNode] = useState<NodeDetailsType | null>(null);
const [dialogOpen, setDialogOpen] = useState(false);

const handleNodeClick = useCallback((nodeDetails: NodeDetailsType) => {
    setSelectedNode(nodeDetails);
    setDialogOpen(true);
}, []);
```

### Node Click Implementation

Each node component receives an `onClick` callback in its data:

```typescript
data: {
    // ... other data
    onClick: () => handleNodeClick({
        type: 'organization',
        id: organization.id,
        name: organization.name,
        code: organization.code,
        business_units_count: businessUnits.length,
    }),
}
```

### Event Handling

To prevent collapse buttons from triggering the dialog:

```typescript
onClick={(e) => {
    if (!(e.target as HTMLElement).closest('button')) {
        data.onClick?.();
    }
}}
```

## Benefits

1. **Quick Preview**: Users can quickly see node details without navigating away
2. **Easy Navigation**: One-click access to full details page
3. **Visual Feedback**: Cursor changes to pointer on hover
4. **Context Preservation**: Dialog doesn't disrupt the flow diagram state
5. **Accessibility**: Keyboard accessible via standard dialog patterns

## Future Enhancements

Potential improvements for future iterations:

- Add more detailed statistics in the dialog
- Show related entities (e.g., list of child entities)
- Add quick actions (edit, delete) in the dialog
- Implement keyboard shortcuts for quick navigation
- Add loading states when navigating to show pages
