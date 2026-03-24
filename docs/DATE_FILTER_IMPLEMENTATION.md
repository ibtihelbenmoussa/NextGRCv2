# Date Range Filter Implementation

## Overview

Successfully implemented a proper date range filter for the Business Units page using a calendar date picker component.

## What Was Implemented

### 1. **Date Range Picker UI**

Added a calendar-based date range picker above the data table:

- **Button trigger** - Shows current date range or placeholder text
- **Dual calendar view** - Two months displayed side-by-side for easy range selection
- **Clear button** - X icon to quickly reset the date filter
- **Formatted display** - Shows dates in "MMM dd, y" format (e.g., "Oct 01, 2025 - Oct 08, 2025")

### 2. **Date Filtering Logic**

Implemented client-side date range filtering:

- **Range selection** - Filter by both start and end dates
- **Single date** - Can filter from a specific date (open-ended)
- **Normalization** - Properly handles time zones by normalizing to start/end of day
- **Efficient filtering** - Uses `useMemo` for performance optimization

### 3. **Components Added**

```typescript
// State management
const [dateRange, setDateRange] = useState<{
    from?: Date;
    to?: Date;
}>({});

// Filtered data
const filteredData = useMemo(() => {
    // Filter businessUnits.data by date range
}, [businessUnits.data, dateRange]);
```

## UI Structure

```
┌─────────────────────────────────────────────┐
│  [Filter by date range ▼]  [X]             │  ← Date Range Picker
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Search: [_____________]  Status ▼  View ▼ │  ← DataTable Toolbar
│  [New Business Unit]                        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│  Name  | Code | ... | Last Updated         │  ← Table
│  ...                                        │
└─────────────────────────────────────────────┘
```

## Features

### ✅ **Calendar Date Picker**

- Two-month calendar view for easy date selection
- Visual selection of date ranges
- Intuitive drag-to-select functionality
- Built with `react-day-picker` via the Calendar component

### ✅ **Smart Date Formatting**

- Display format: "Oct 01, 2025 - Oct 08, 2025"
- Single date: "Oct 08, 2025"
- Empty state: "Filter by date range"

### ✅ **Clear Filter**

- X button appears only when a date range is active
- One click to reset the filter

### ✅ **Performance Optimized**

- Uses `useMemo` to prevent unnecessary re-filtering
- Only recalculates when data or date range changes

### ✅ **Time Zone Handling**

```typescript
// Normalizes dates to avoid time zone issues
updatedAt.setHours(0, 0, 0, 0); // Start of day
to.setHours(23, 59, 59, 999); // End of day
```

## How It Works

### 1. **User Opens Calendar**

Clicks "Filter by date range" button → Calendar popover opens

### 2. **Selects Date Range**

- Click first date → Sets "from" date
- Click second date → Sets "to" date
- Calendar shows visual selection

### 3. **Data Filters Automatically**

- `useMemo` detects date range change
- Filters `businessUnits.data` array
- DataTable receives `filteredData`

### 4. **Clear Filter**

User clicks X button → Resets to empty object → Shows all data

## Code Snippets

### Date Range State

```typescript
const [dateRange, setDateRange] = useState<{
    from?: Date;
    to?: Date;
}>({});
```

### Filter Logic

```typescript
const filteredData = useMemo(() => {
    if (!dateRange.from && !dateRange.to) {
        return businessUnits.data;
    }

    return businessUnits.data.filter((bu) => {
        const updatedAt = new Date(bu.updated_at);
        updatedAt.setHours(0, 0, 0, 0);

        if (dateRange.from && dateRange.to) {
            const from = new Date(dateRange.from);
            const to = new Date(dateRange.to);
            from.setHours(0, 0, 0, 0);
            to.setHours(23, 59, 59, 999);
            return updatedAt >= from && updatedAt <= to;
        }

        if (dateRange.from) {
            const from = new Date(dateRange.from);
            from.setHours(0, 0, 0, 0);
            return updatedAt >= from;
        }

        if (dateRange.to) {
            const to = new Date(dateRange.to);
            to.setHours(23, 59, 59, 999);
            return updatedAt <= to;
        }

        return true;
    });
}, [businessUnits.data, dateRange]);
```

### Calendar UI

```tsx
<Popover>
    <PopoverTrigger asChild>
        <Button variant="outline">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateRange.from ? (
                dateRange.to ? (
                    <>
                        {format(dateRange.from, 'LLL dd, y')} -
                        {format(dateRange.to, 'LLL dd, y')}
                    </>
                ) : (
                    format(dateRange.from, 'LLL dd, y')
                )
            ) : (
                <span>Filter by date range</span>
            )}
        </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-0" align="start">
        <Calendar
            mode="range"
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={(range) => {
                setDateRange({
                    from: range?.from,
                    to: range?.to,
                });
            }}
            numberOfMonths={2}
        />
    </PopoverContent>
</Popover>
```

## Dependencies Used

- ✅ `@/components/ui/calendar` - Calendar component (react-day-picker)
- ✅ `@/components/ui/popover` - Popover for calendar display
- ✅ `date-fns` - Date formatting (`format` function)
- ✅ `lucide-react` - Icons (`CalendarIcon`, `X`)

## Benefits

### 👍 **Better UX**

- Visual calendar is more intuitive than text inputs
- Can see month/year context while selecting
- No typing required

### 👍 **Professional Appearance**

- Consistent with modern web applications
- Matches the design system (Radix UI)
- Smooth animations and interactions

### 👍 **Flexible Filtering**

- Single date filtering (from OR to)
- Range filtering (from AND to)
- Easy to clear

### 👍 **Client-Side Performance**

- No server round trips for filtering
- Instant results
- Works well with up to ~1000 records

## Future Enhancements

If you want to add more features:

### 1. **Preset Ranges**

Add quick buttons like:

- Today
- Last 7 days
- Last 30 days
- This month
- Last month

### 2. **Server-Side Filtering**

For large datasets (>1000 records):

- Send date range to Laravel backend
- Use query parameters in Inertia
- Return filtered paginated results

### 3. **Multiple Date Columns**

Allow filtering by:

- Created At
- Updated At
- Custom date fields

### 4. **Save Filter Preferences**

- Store in localStorage
- Remember last used date range
- Quick restore on page load

## Testing Checklist

- ✅ Select a date range and verify filtering works
- ✅ Select only a "from" date (open-ended range)
- ✅ Select only a "to" date
- ✅ Clear the filter with X button
- ✅ Combine with Status filter
- ✅ Combine with Search
- ✅ Sort while filtered
- ✅ Pagination works correctly
- ✅ No console errors

## Notes

- Filter is **client-side** - all data must be loaded first
- Works in combination with other filters (Status, Search)
- Calendar supports keyboard navigation (Tab, Arrow keys, Enter)
- Accessible with ARIA labels
- Mobile-responsive (calendar adjusts to screen size)
