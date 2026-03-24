# Risk Categories System

## Overview
This document describes the Risk Categories system implementation. Risk categories allow organizations to organize their risks in a hierarchical tree structure, where each category can have subcategories at multiple levels.

## Features
- **Tree Structure**: Categories can have parent-child relationships with unlimited depth
- **Organization-Specific**: Each organization has its own set of risk categories
- **Color Coding**: Visual identification through customizable colors
- **Active/Inactive Status**: Control category visibility
- **Risk Association**: Track which risks belong to each category
- **CRUD Operations**: Full create, read, update, delete functionality
- **Export**: Excel export capability with filters

## Database Schema

### Risk Categories Table
**Table**: `risk_categories`

| Column | Type | Description |
|--------|------|-------------|
| id | bigint | Primary key |
| organization_id | bigint | Foreign key to organizations |
| parent_id | bigint (nullable) | Self-referencing foreign key for tree structure |
| name | string | Category name |
| code | string | Unique code within organization |
| description | text (nullable) | Category description |
| color | string (nullable) | Hex color code (#RRGGBB) |
| is_active | boolean | Active status (default: true) |
| created_at | timestamp | Creation timestamp |
| updated_at | timestamp | Last update timestamp |
| deleted_at | timestamp (nullable) | Soft delete timestamp |

**Indexes**:
- Unique: `organization_id` + `code`
- Index: `organization_id` + `parent_id`

### Risks Table Update
Added `risk_category_id` column to the `risks` table to link risks to categories.

## Model Relationships

### RiskCategory Model
**Location**: `app/Models/RiskCategory.php`

**Relationships**:
- `organization()`: BelongsTo Organization
- `parent()`: BelongsTo RiskCategory (self-reference)
- `children()`: HasMany RiskCategory (self-reference)
- `descendants()`: HasMany RiskCategory (recursive, all descendants)
- `risks()`: HasMany Risk

**Scopes**:
- `roots()`: Get only root categories (no parent)

**Attributes**:
- `path`: Full hierarchical path (e.g., "Parent > Child > Grandchild")
- `depth`: Depth level in the tree (0 for root)

### Organization Model Update
Added relationship:
- `riskCategories()`: HasMany RiskCategory

### Risk Model Update
Added relationship:
- `riskCategory()`: BelongsTo RiskCategory

## Controller

### RiskCategoryController
**Location**: `app/Http/Controllers/RiskCategoryController.php`

**Methods**:
- `index()`: List all categories with pagination and filters
- `create()`: Show create form
- `store()`: Create new category
- `show()`: Display category details
- `edit()`: Show edit form
- `update()`: Update category
- `destroy()`: Delete category (with validation)
- `tree()`: Get tree structure (API endpoint)
- `export()`: Export to Excel

**Validation Rules**:
- Prevents circular references in parent-child relationships
- Ensures parent belongs to same organization
- Validates unique code within organization
- Prevents deletion of categories with children or associated risks

## Routes

**Location**: `routes/web.php`

```php
Route::get('risk-categories/export', [RiskCategoryController::class, 'export'])
    ->name('risk-categories.export');
Route::get('risk-categories/tree', [RiskCategoryController::class, 'tree'])
    ->name('risk-categories.tree');
Route::resource('risk-categories', RiskCategoryController::class);
```

**Available Routes**:
- `GET /risk-categories` - List categories
- `GET /risk-categories/create` - Create form
- `POST /risk-categories` - Store new category
- `GET /risk-categories/{id}` - Show category
- `GET /risk-categories/{id}/edit` - Edit form
- `PUT /risk-categories/{id}` - Update category
- `DELETE /risk-categories/{id}` - Delete category
- `GET /risk-categories/tree` - Get tree structure (API)
- `GET /risk-categories/export` - Export to Excel

## Frontend Pages

### Index Page
**Location**: `resources/js/pages/risk-categories/index.tsx`

**Features**:
- Data table with pagination, search, and filters
- Statistics cards (total, active, root categories, total risks)
- Color-coded category display
- Parent category links
- Actions menu (view, edit, delete)
- Status badges
- Export functionality

**Filters**:
- Status (Active/Inactive)
- Date range

### Create Page
**Location**: `resources/js/pages/risk-categories/create.tsx`

**Fields**:
- Name (required)
- Code (required, auto-uppercase)
- Description (optional)
- Parent Category (optional, dropdown with tree structure)
- Color (color picker + hex input)
- Active Status (toggle)

### Show Page
**Location**: `resources/js/pages/risk-categories/show.tsx`

**Displays**:
- Category details with color badge
- Parent category link
- Statistics (subcategories count, associated risks count)
- List of subcategories
- List of associated risks
- Edit and delete actions

### Edit Page
**Location**: `resources/js/pages/risk-categories/edit.tsx`

**Features**:
- Same fields as create page
- Pre-populated with existing data
- Prevents circular references (excludes self and descendants from parent selection)

## Export Functionality

### RiskCategoriesExport
**Location**: `app/Exports/RiskCategoriesExport.php`

**Exported Columns**:
1. Code
2. Name
3. Description
4. Parent Category
5. Color
6. Status
7. Risks Count
8. Created At
9. Updated At

## Usage Examples

### Creating a Root Category
1. Navigate to `/risk-categories`
2. Click "Create Category"
3. Fill in name (e.g., "Financial Risk") and code (e.g., "FIN")
4. Leave parent category empty
5. Choose a color
6. Submit

### Creating a Subcategory
1. Navigate to `/risk-categories/create`
2. Fill in name and code
3. Select a parent category from dropdown
4. Submit

### Tree Structure Example
```
Financial Risk (FIN)
├── Credit Risk (FIN-CR)
│   ├── Default Risk (FIN-CR-DEF)
│   └── Concentration Risk (FIN-CR-CON)
└── Market Risk (FIN-MR)
    ├── Interest Rate Risk (FIN-MR-IR)
    └── Currency Risk (FIN-MR-CUR)

Operational Risk (OPR)
├── Process Risk (OPR-PR)
└── Technology Risk (OPR-TR)
```

## Security & Validation

### Organization Isolation
- All queries are scoped to the current organization
- Users can only access categories from their current organization
- Parent categories must belong to the same organization

### Circular Reference Prevention
- When updating a category, the system prevents setting a descendant as parent
- Validation checks the entire parent chain

### Deletion Protection
- Categories with subcategories cannot be deleted
- Categories with associated risks cannot be deleted
- User must reassign or delete children/risks first

## Integration with Risks

### Updating Risk Model
The Risk model now includes:
```php
'risk_category_id' in $fillable array
riskCategory() relationship method
```

### Migration Path
1. Run migrations to add `risk_categories` table
2. Run migration to add `risk_category_id` to `risks` table
3. Old `category` string field is kept for backward compatibility
4. Gradually migrate existing risk categories to the new system
5. Update risk forms to use category dropdown instead of text input

## Future Enhancements

### Potential Features
- **Drag & Drop Reordering**: Visual tree management
- **Category Templates**: Pre-defined category structures
- **Risk Count by Category**: Dashboard visualization
- **Category Import**: Bulk import from Excel
- **Category Permissions**: Role-based access to categories
- **Category Descriptions**: Rich text editor support
- **Category Icons**: Icon selection in addition to colors
- **Category Archiving**: Archive instead of delete

## Testing Checklist

- [ ] Create root category
- [ ] Create subcategory
- [ ] Create multi-level hierarchy (3+ levels)
- [ ] Edit category details
- [ ] Change parent category
- [ ] Attempt circular reference (should fail)
- [ ] Delete empty category
- [ ] Attempt to delete category with children (should fail)
- [ ] Attempt to delete category with risks (should fail)
- [ ] Filter by status
- [ ] Search categories
- [ ] Export to Excel
- [ ] View category tree
- [ ] Associate risk with category
- [ ] View risks in category

## Troubleshooting

### Common Issues

**Issue**: Cannot delete category
**Solution**: Check if category has subcategories or associated risks. Reassign or delete them first.

**Issue**: Circular reference error
**Solution**: Ensure you're not setting a descendant as parent when editing.

**Issue**: Code already taken
**Solution**: Codes must be unique within an organization. Choose a different code.

**Issue**: Cannot see categories
**Solution**: Ensure you have selected an organization and have appropriate permissions.
