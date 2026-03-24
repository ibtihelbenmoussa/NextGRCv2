# Quick Start Guide - Overview Flow

## What You Built

An interactive tree visualization showing your organization's structure:

```
Organization
    └─ Business Units
        └─ Macro Processes
            └─ Processes
```

## How to Use

### 1. Access the Overview

Navigate to: **`http://your-app.com/overview`**

### 2. Interactions

| Action                 | How To                             | Result               |
| ---------------------- | ---------------------------------- | -------------------- |
| **Pan**                | Click & drag background            | Move around the tree |
| **Zoom In**            | Mouse wheel up OR click + button   | Closer view          |
| **Zoom Out**           | Mouse wheel down OR click - button | Wider view           |
| **Fit to Screen**      | Click 📐 button in controls        | See entire tree      |
| **Minimap Navigation** | Click on minimap area              | Jump to that section |

### 3. Node Colors

- 🔵 **Blue** = Organization (root)
- 🟢 **Green** = Business Units
- 🟣 **Purple** = Macro Processes
- 🟠 **Orange** = Processes

### 4. Understanding the Display

Each node shows:

- **Name** of the entity
- **Code** (e.g., "ORG-001")
- **Count** of child items (e.g., "3 Business Units")

### 5. Empty States

| Message                    | Meaning                            |
| -------------------------- | ---------------------------------- |
| "No organization selected" | Select an organization first       |
| "No structure to display"  | Organization has no business units |
| "Loading..."               | Data is being fetched              |

## Data Requirements

For the overview to display properly, you need:

1. ✅ User must be logged in
2. ✅ User must have `current_organization_id` set
3. ✅ Organization must have at least one Business Unit
4. ✅ Entities should be marked as `is_active = true`

## Technical Details

### Database Queries

The controller loads:

```
Organization
  → business_units (active only)
      → macro_processes (active only)
          → processes (active only)
```

### Performance

- **Single Query** with eager loading (no N+1 problem)
- **Counts** are loaded efficiently with `withCount()`
- **Filters** only active entities

## Customization Tips

### Change Layout Spacing

Edit `resources/js/components/overview/organization-flow.tsx`:

```typescript
const VERTICAL_SPACING = 150; // Increase for more space between nodes
const LEVEL_SPACING = 250; // Increase for wider tree
```

### Change Node Colors

Edit individual node components:

```typescript
// In organization-node.tsx
className = 'border-blue-500 bg-blue-50'; // Change to any Tailwind color
```

### Add Click Handlers

In node components, add:

```typescript
<div onClick={() => console.log('Node clicked', data)}>
```

## Troubleshooting

### Tree not showing?

1. Check browser console for errors
2. Verify user has `current_organization_id`
3. Ensure organization has business units
4. Check that entities are marked as active

### Layout looks weird?

- Try the "Fit View" button (📐)
- Adjust spacing constants
- Check that nodes have proper data

### Performance issues?

- Limit depth of tree by modifying controller query
- Add pagination for large structures
- Implement lazy loading for child nodes

## Next Steps

Consider adding:

- Click handlers to view details
- Search/filter functionality
- Export as PDF/PNG
- Collapsible nodes
- Different layout options
- Real-time updates
