# Overview Flow: User Guide

## 🎯 What's New

Your organizational overview has been transformed with:

1. **Top-to-Bottom Layout** - More intuitive hierarchical flow
2. **Collapsible Nodes** - Expand/collapse any branch with one click
3. **Better Organization** - Cleaner, more organized visualization

## 📊 Layout Structure

```
                    Organization (Blue)
                          |
        ┌─────────────────┼─────────────────┐
        |                 |                 |
    Business Unit 1   Business Unit 2   Business Unit 3
     (Green)            (Green)            (Green)
        |                 |                 |
    ┌───┴───┐            MP3                |
    |       |            (Purple)            |
   MP1     MP2            |               MP4
  (Purple)(Purple)        P3              (Purple)
    |       |           (Orange)            |
  ┌─┴─┐    P2                            ┌──┴──┐
  |   |  (Orange)                        |     |
  P1  P2                                 P5    P6
(Orange)(Orange)                      (Orange)(Orange)
```

## 🎮 How to Use

### Basic Navigation

| Action       | Method                      | Description                  |
| ------------ | --------------------------- | ---------------------------- |
| **Pan**      | Click + Drag                | Move around the diagram      |
| **Zoom In**  | Mouse Wheel Up / + Button   | See details closer           |
| **Zoom Out** | Mouse Wheel Down / - Button | See more of the tree         |
| **Fit View** | 📐 Button                   | Auto-zoom to show everything |
| **Minimap**  | Click colored area          | Jump to that section         |

### Collapse/Expand ⭐

Each node with children has a **chevron button** on the right side:

| Button | State     | Action                            |
| ------ | --------- | --------------------------------- |
| **▼**  | Expanded  | Click to collapse (hide children) |
| **▶** | Collapsed | Click to expand (show children)   |

### Example Workflows

#### 1. Focus on One Business Unit

```
1. Click ▼ on Organization node
   → All business units collapse
2. Click ▶ on Organization node
   → All business units appear
3. Click ▼ on Business Units you don't want to see
   → Only the BU you care about is expanded
4. Explore that BU's macro processes and processes
```

#### 2. Get High-Level Overview

```
1. Collapse all Business Units
   → See only organization + all BU names
2. Quickly identify which BUs exist
3. Expand specific BUs as needed
```

#### 3. Navigate Large Organizations

```
1. Start with everything expanded
2. Collapse branches as you explore
3. Keep only relevant branches open
4. Less clutter = easier navigation
```

## 🎨 Visual Guide

### Node Appearance

**Organization Node (Blue)**

```
┌────────────────────────────────┐
│ 🏢 Organization          [▼]   │
│                                │
│ Name: Acme Corporation         │
│ Code: ORG-001                  │
│ 3 Business Units               │
└────────────────────────────────┘
```

**Business Unit Node (Green)**

```
┌──────────────────────────┐
│ 💼 Business Unit    [▼]  │
│                          │
│ Name: Finance            │
│ Code: BU-FIN             │
│ 5 Macro Processes        │
└──────────────────────────┘
```

**Macro Process Node (Purple)**

```
┌─────────────────────┐
│ 🌿 Macro Process [▼]│
│                     │
│ Name: Accounting    │
│ Code: MP-ACC        │
│ 12 Processes        │
└─────────────────────┘
```

**Process Node (Orange)**

```
┌──────────────────┐
│ ⚙️ Process        │
│                  │
│ Name: Invoicing  │
│ Code: P-INV      │
│ 3 Risks          │
└──────────────────┘
```

## 💡 Tips & Tricks

### Performance Tips

- ✅ **Collapse large branches** when not needed - improves rendering speed
- ✅ **Use minimap** for quick navigation in large trees
- ✅ **Zoom out** to see overview, zoom in for details

### Navigation Tips

- 💡 **Collapse siblings** to focus on one branch at a time
- 💡 **Use fit view** (📐) after collapsing/expanding to optimize viewport
- 💡 **Start collapsed** when first viewing a huge organization

### Workflow Tips

- 🎯 **Collapse all → Expand what you need** = fastest way to find specific items
- 🎯 **Keep commonly used branches expanded** for quick access
- 🎯 **Use colors** to quickly identify node types

## 🐛 Troubleshooting

### "Nothing showing"

- Check if organization node is collapsed (look for ▶)
- Click ▶ to expand
- Click Fit View (📐) button

### "Can't see all nodes"

- Use Zoom Out (-) button
- Click Fit View (📐) button
- Collapse some branches to reduce total size

### "Diagram is too wide"

- Collapse some business units
- Zoom out to see everything
- Use minimap to navigate

### "Nodes are overlapping"

- This shouldn't happen! If it does:
    - Refresh the page
    - Try collapsing and re-expanding
    - Report as a bug

## ⌨️ Keyboard Shortcuts

| Key                  | Action          |
| -------------------- | --------------- |
| **Mouse Wheel**      | Zoom in/out     |
| **Click + Drag**     | Pan             |
| **Click on Chevron** | Toggle collapse |

## 📱 Responsive Behavior

- Works on all screen sizes
- Zoom controls adjust for touch screens
- Minimap scales automatically
- Nodes maintain readability at all zoom levels

## 🚀 Best Practices

### For Small Organizations (< 50 nodes)

- Keep everything expanded
- Use zoom and pan for navigation
- No need to collapse

### For Medium Organizations (50-200 nodes)

- Collapse branches you're not currently viewing
- Use minimap for quick jumps
- Expand as you navigate

### For Large Organizations (200+ nodes)

- Start with everything collapsed except top level
- Expand only what you need to see
- Collapse after viewing to keep viewport clean
- Heavy use of minimap recommended

## 🎓 Learning Path

### Beginner

1. Learn to zoom and pan
2. Practice collapsing/expanding one branch
3. Use fit view button

### Intermediate

4. Collapse multiple branches
5. Navigate using minimap
6. Find specific processes quickly

### Advanced

7. Develop custom navigation workflows
8. Use collapse patterns for different tasks
9. Efficiently manage large organizational trees

## 📞 Need Help?

If you encounter issues:

1. Try refreshing the page
2. Check that you have data in your organization
3. Ensure browser is up to date
4. Clear browser cache if diagram doesn't update

Enjoy your new interactive organizational overview! 🎉
