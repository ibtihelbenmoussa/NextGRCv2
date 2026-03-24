# Global Search Feature

## Overview

The global search feature provides a quick way to navigate through the NextGRC application using a keyboard shortcut (Ctrl+K or Cmd+K on Mac).

## Usage

### Keyboard Shortcut

Press **Ctrl+K** (or **Cmd+K** on Mac) anywhere in the application to open the global search dialog.

### Search Button

Click the "Search" button in the header (top right, next to the theme toggle) to open the search dialog.

## Features

- **Quick Navigation**: Search and navigate to any page in the application
- **Grouped Results**: Search results are organized by category:
    - Main (Dashboard, Overview)
    - Organization (Organizations)
    - Audit Universe (Business Units, Macro Processes, Processes)
    - User Management (Users, Roles & Permissions)
    - Settings (Profile, Password, Appearance, Two-Factor Authentication)
- **Fuzzy Search**: Type partial words to find matching pages
- **Keyboard Navigation**: Use arrow keys to navigate results, Enter to select

## Implementation

### Components

1. **GlobalSearch** (`resources/js/components/global-search.tsx`)
    - Main search component using CommandDialog from Radix UI
    - Listens for Ctrl+K keyboard shortcut
    - Manages search items and navigation

2. **AppSidebarHeader** (`resources/js/components/app-sidebar-header.tsx`)
    - Updated to include search button with keyboard shortcut indicator
    - Uses Kbd component to display "⌘ K" hint

3. **AppSidebarLayout** (`resources/js/layouts/app/app-sidebar-layout.tsx`)
    - Integrates GlobalSearch component
    - Manages search dialog open/close state

### Search Items Structure

```typescript
interface SearchItem {
    id: string;
    title: string;
    description?: string;
    icon: React.ComponentType<{ className?: string }>;
    url: string;
    category: string;
}
```

### Adding New Search Items

To add new pages to the global search, edit `resources/js/components/global-search.tsx` and add entries to the `searchItems` array:

```typescript
{
    id: 'unique-id',
    title: 'Page Title',
    description: 'Page description',
    icon: IconComponent, // from lucide-react
    url: '/page-url',
    category: 'Category Name',
}
```

## Technical Details

- Uses **cmdk** library for the command palette functionality
- Integrates with **Inertia.js** router for navigation
- Supports both controlled and uncontrolled state
- Keyboard shortcut works globally throughout the authenticated app
- Responsive design with adaptive button width

## Future Enhancements

- Add recent pages history
- Add frequently accessed pages
- Include search for specific entities (risks, controls, audit missions)
- Add keyboard shortcut hints in tooltips
- Support custom search actions beyond navigation
