# Organization Selection - How It Works

## 🎯 When Does the Selection Page Show?

The organization selection page (`/organizations/select`) appears automatically in these scenarios:

### 1. **First Login - Multiple Organizations**

- User logs in for the first time
- Has access to **2 or more** organizations
- Has no `current_organization_id` set
- **Automatically redirected** to selection page

### 2. **First Login - Single Organization**

- User logs in for the first time
- Has access to **exactly 1** organization
- System **auto-selects** that organization (no selection page shown)
- User goes directly to dashboard

### 3. **First Login - No Organizations**

- User logs in but has no organizations assigned
- Can still access the app but will see "no organizations" message
- Admin needs to assign them to an organization

### 4. **After Organization Access is Revoked**

- User is removed from their current organization
- On next page load, system detects invalid `current_organization_id`
- **Automatically redirected** to selection page to choose another org

## 🔄 How to Access the Selection Page Anytime

Users can always switch organizations or view the full selection page:

### Method 1: Organization Switcher (Sidebar)

1. Look at the top of the sidebar
2. Click on the **current organization** button (shows org name and code)
3. Dropdown shows all available organizations
4. Click **"View All Organizations"** to go to the full selection page
5. Or click any organization to switch directly

### Method 2: Direct URL

Navigate to: `/organizations/select`

### Method 3: From Dashboard

Click "Organizations" in the navigation → "View All Organizations"

## 🎨 Selection Page Features

The enhanced selection page now includes:

- **Large, prominent cards** for each organization
- **Organization icons** with decorative styling
- **Hover animations** for better UX
- **Organization codes** displayed as badges
- **Descriptions** for each organization (line-clamped)
- **Gradient background** for visual appeal
- **Empty state** if user has no organizations
- **Organization count** in the footer

## ⚙️ Technical Details

### Middleware: `EnsureUserHasOrganization`

Located: `app/Http/Middleware/EnsureUserHasOrganization.php`

**What it does:**

1. Checks if user has `current_organization_id` set
2. If not, checks how many organizations they have access to
3. Auto-selects if only 1 organization
4. Redirects to selection page if multiple organizations
5. Validates current organization is still valid (user hasn't been removed)

**Routes it skips:**

- `/organizations/select` (the selection page itself)
- `/organizations/{id}/select` (the selection action)
- `/logout` (logout route)

### Controller Methods

**`OrganizationController@selectPage`**

```php
Route::get('organizations/select', [OrganizationController::class, 'selectPage'])
    ->name('organizations.select.page');
```

Shows the selection page with all organizations the user has access to.

**`OrganizationController@select`**

```php
Route::post('organizations/{organization}/select', [OrganizationController::class, 'select'])
    ->name('organizations.select');
```

Sets the selected organization as the user's current organization.

### Shared Data

Available in all Inertia pages via `usePage<SharedData>().props`:

```typescript
{
    currentOrganization: Organization | null,
    auth: {
        user: {
            organizations: Organization[]
        }
    }
}
```

## 🔐 Security

- Users can only see organizations they belong to
- Attempting to select an invalid organization shows an error
- System validates organization access on every switch
- Invalid current organizations are automatically detected and cleared

## 🎓 User Experience Flow

```
Login
  ↓
Check current_organization_id
  ↓
  ├─ Has ID ────────────────────→ Validate access ─→ Dashboard
  │                                      ↓ Invalid
  ├─ No ID + 1 org ──→ Auto-select ────→ Dashboard
  │
  └─ No ID + Multiple orgs ─→ Selection Page ─→ User Selects ─→ Dashboard
```

## 📱 Responsive Design

The selection page is fully responsive:

- **Mobile**: 1 column layout
- **Tablet**: 2 column grid
- **Desktop**: 3 column grid
- **Large screens**: max-width 5xl with centered layout

## ✨ Improvements Made

1. ✅ **Enhanced visual design** - larger cards, better spacing
2. ✅ **Organization switcher** - always accessible in sidebar
3. ✅ **"View All Organizations"** option added to dropdown
4. ✅ **Direct URL access** - can bookmark `/organizations/select`
5. ✅ **Organization validation** - detects when user is removed from org
6. ✅ **Smooth transitions** - hover effects and animations
7. ✅ **Clear empty states** - helpful messages when no organizations

---

**Note**: The selection page doesn't show "only once" - it's accessible anytime via the organization switcher dropdown or direct URL!
