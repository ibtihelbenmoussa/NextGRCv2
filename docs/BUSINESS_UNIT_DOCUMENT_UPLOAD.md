# Business Unit Document Upload Feature

## Overview

Business Units can now have documents attached during creation. Users can upload multiple files (up to 10 files, 10MB each) using the drag-and-drop CardUpload component.

## Implementation Details

### Backend Changes

#### BusinessUnitController (`app/Http/Controllers/BusinessUnitController.php`)

**Updated `store()` method:**

```php
$validated = $request->validate([
    'name' => 'required|string|max:255',
    'code' => 'required|string|max:50|unique:business_units,code',
    'description' => 'nullable|string',
    'manager_ids' => 'nullable|array',
    'manager_ids.*' => 'exists:users,id',
    'is_active' => 'boolean',
    'documents' => 'nullable|array',
    'documents.*' => 'file|max:10240', // 10MB max per file
    'document_categories' => 'nullable|array',
    'document_categories.*' => 'nullable|string|max:255',
    'document_descriptions' => 'nullable|array',
    'document_descriptions.*' => 'nullable|string|max:1000',
]);
```

**Document Upload Logic:**

After creating the business unit, the controller automatically uploads and attaches all documents:

```php
// Upload documents
if (!empty($documents)) {
    foreach ($documents as $index => $document) {
        $businessUnit->addDocument(
            $document,
            [
                'category' => $documentCategories[$index] ?? null,
                'description' => $documentDescriptions[$index] ?? null,
            ]
        );
    }
}
```

### Frontend Changes

#### Create Page (`resources/js/pages/business-units/create.tsx`)

**Added Features:**

1. **File Upload Component**: Integrated `CardUpload` component
2. **Form Data Extension**: Extended form data to include documents
3. **File Change Handler**: Processes uploaded files and prepares them for submission

**New Form Fields:**

```typescript
const { data, setData, post, processing, errors } = useForm<{
    name: string;
    code: string;
    description: string;
    manager_ids: string[];
    is_active: boolean;
    documents?: File[];
    document_categories?: (string | null)[];
    document_descriptions?: (string | null)[];
}>;
```

**File Change Handler:**

```typescript
const handleFilesChange = (files: FileUploadItem[]) => {
    const completedFiles = files.filter((f) => f.status === 'completed');
    setData({
        ...data,
        documents: completedFiles.map((f) => f.file),
        document_categories: completedFiles.map(() => null),
        document_descriptions: completedFiles.map(() => null),
    });
};
```

## User Interface

### Documents Section

A new card section has been added to the creation form:

```tsx
<Card>
    <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents (Optional)
        </CardTitle>
    </CardHeader>
    <CardContent>
        <CardUpload
            maxFiles={10}
            maxSize={10 * 1024 * 1024} // 10MB
            accept="*"
            multiple={true}
            onFilesChange={handleFilesChange}
        />
    </CardContent>
</Card>
```

**Features:**

- Drag & drop support
- Multiple file selection
- File preview for images
- Upload progress indication
- File size and count limits
- Clear error messages

## Upload Specifications

| Setting           | Value                |
| ----------------- | -------------------- |
| Maximum Files     | 10 per business unit |
| Maximum File Size | 10MB per file        |
| Accepted Types    | All file types (\*)  |
| Multiple Upload   | Yes                  |
| Required          | No (Optional)        |

## User Workflow

1. **Navigate** to Business Units → Create
2. **Fill** in required fields (Name, Code)
3. **Scroll** to "Documents (Optional)" section
4. **Upload** documents by:
    - Dragging and dropping files onto the upload area
    - Clicking "Browse files" to select from file system
5. **Review** uploaded files in the preview list
6. **Remove** files if needed using the delete button
7. **Submit** the form to create business unit with documents

## File Storage

### Storage Location

Files are automatically organized in the following structure:

```
storage/app/documents/
└── BusinessUnit/
    └── {business_unit_id}/
        ├── {uuid-1}.pdf
        ├── {uuid-2}.docx
        └── {uuid-3}.xlsx
```

### Metadata Stored

For each document, the following metadata is stored in the database:

- Original filename
- File size
- MIME type
- Upload timestamp
- Uploaded by (user ID)
- Storage disk
- Category (optional)
- Description (optional)

## Database Structure

Documents are stored in the polymorphic `documents` table:

```sql
documents
├── id
├── documentable_id      (Business Unit ID)
├── documentable_type    ('App\Models\BusinessUnit')
├── name                 (Original filename)
├── file_path            (Storage path)
├── file_name            (UUID-based filename)
├── mime_type
├── file_size
├── disk
├── category             (null for now)
├── description          (null for now)
├── uploaded_by          (User ID)
├── created_at
├── updated_at
└── deleted_at
```

## Validation Rules

### Backend Validation

```php
'documents' => 'nullable|array',
'documents.*' => 'file|max:10240', // 10MB
'document_categories' => 'nullable|array',
'document_categories.*' => 'nullable|string|max:255',
'document_descriptions' => 'nullable|array',
'document_descriptions.*' => 'nullable|string|max:1000',
```

### Frontend Validation

- File count limit enforced by `CardUpload` component
- File size limit (10MB) enforced by component
- All file types accepted
- Non-blocking validation with user-friendly error messages

## Error Handling

### Common Errors

1. **File Too Large**: "File exceeds maximum size of 10MB"
2. **Too Many Files**: "Maximum 10 files allowed"
3. **Upload Failed**: Generic error with retry option
4. **Network Error**: Connection issues during upload

### Error Display

Errors are displayed:

- Below the upload component for general errors
- On individual file cards for file-specific errors
- With clear, actionable messages

## Future Enhancements

### Potential Improvements

1. **Document Categories**: Add dropdown for categorizing documents during upload
    - Policy
    - Procedure
    - Organizational Chart
    - Evidence
    - Other

2. **Document Descriptions**: Add text input for each document
    - Allow users to add context
    - Improve searchability

3. **File Type Restrictions**: Limit to specific business document types
    - PDF, Word, Excel, PowerPoint
    - Images (PNG, JPG)
    - Archives (ZIP)

4. **Bulk Upload**: Support for uploading folders or ZIP files

5. **Document Preview**: In-app preview for common file types

6. **Version Control**: Track document versions and changes

## Testing

### Manual Testing Checklist

- [ ] Upload single file
- [ ] Upload multiple files (within limit)
- [ ] Try uploading more than 10 files
- [ ] Try uploading file larger than 10MB
- [ ] Test drag & drop functionality
- [ ] Test file removal before submission
- [ ] Verify files are saved correctly
- [ ] Check file storage location
- [ ] Verify database records
- [ ] Test with different file types
- [ ] Test form submission without files
- [ ] Test error handling

### Automated Tests

See `tests/Feature/DocumentTest.php` for comprehensive test coverage.

## Related Documentation

- [Document Attachment System](./DOCUMENT_ATTACHMENT_SYSTEM.md) - Complete system documentation
- [Document System Summary](./DOCUMENT_SYSTEM_SUMMARY.md) - Quick reference guide
- [Card Upload Component](./CARD_UPLOAD_COMPONENT.md) - CardUpload component documentation

## API Endpoints

### Create Business Unit with Documents

```http
POST /business-units
Content-Type: multipart/form-data

Body:
- name: string (required)
- code: string (required)
- description: string (optional)
- manager_ids[]: array of user IDs (optional)
- is_active: boolean (optional)
- documents[]: array of files (optional)
- document_categories[]: array of strings (optional)
- document_descriptions[]: array of strings (optional)
```

## Security Considerations

1. **File Size Limits**: Prevents DoS attacks via large uploads
2. **File Count Limits**: Prevents resource exhaustion
3. **Validation**: Server-side validation enforced
4. **Authentication**: Only authenticated users can upload
5. **Authorization**: User must have permission to create business units
6. **File Scanning**: Consider adding virus scanning in production
7. **Storage Isolation**: Files stored in private directory by default

## Performance

- Files are uploaded as part of form submission (single request)
- No separate AJAX upload endpoints needed
- Progress indication provided by CardUpload component
- Efficient storage with UUID-based filenames
- Indexed database queries for document retrieval

## Browser Compatibility

The file upload feature works on all modern browsers:

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires:

- JavaScript enabled
- HTML5 File API support
- Drag & Drop API support
