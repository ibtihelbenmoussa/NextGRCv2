# Document Attachment System - Implementation Summary

## ✅ What Has Been Implemented

A complete polymorphic document attachment system that allows **Business Units**, **Macro Processes**, and **Processes** to have files/documents attached to them.

## 📁 Files Created

### 1. Database Migration

**File:** `database/migrations/2025_10_08_000000_create_documents_table.php`

Creates the `documents` table with polymorphic relationship columns (`documentable_id`, `documentable_type`).

**Key Fields:**

- File metadata (name, path, mime type, size)
- Storage configuration (disk)
- Optional categorization and description
- Audit trail (uploaded_by, timestamps)
- Soft deletes support

### 2. Document Model

**File:** `app/Models/Document.php`

Eloquent model for documents with:

- Polymorphic relationship to parent entities
- Helper methods for file access (URL generation, downloads)
- File type detection (images, PDFs)
- Automatic file deletion when model is force-deleted

### 3. HasDocuments Trait

**File:** `app/Models/Concerns/HasDocuments.php`

Reusable trait that provides document functionality to any model:

- `documents()` - Relationship method
- `addDocument()` - Upload and attach files
- `getDocumentsByCategory()` - Filter by category
- `hasDocuments()` - Check if entity has documents
- `getTotalDocumentsSize()` - Calculate total storage used
- `deleteAllDocuments()` - Bulk deletion

### 4. DocumentController

**File:** `app/Http/Controllers/DocumentController.php`

Generic controller for document operations:

- Upload documents
- List documents
- Download documents
- Generate temporary URLs (for S3)
- Update metadata
- Delete documents (soft/hard)

### 5. Example Routes

**File:** `routes/documents.example.php`

Sample route definitions showing how to set up endpoints for each entity type.

### 6. Documentation

**File:** `docs/DOCUMENT_ATTACHMENT_SYSTEM.md`

Comprehensive documentation including:

- Architecture explanation
- Database schema
- Usage examples
- Security considerations
- Testing examples
- Performance tips

## 🔧 Models Updated

The following models now have the `HasDocuments` trait:

1. ✅ **BusinessUnit** (`app/Models/BusinessUnit.php`)
2. ✅ **MacroProcess** (`app/Models/MacroProcess.php`)
3. ✅ **Process** (`app/Models/Process.php`)

## 🚀 Quick Start

### 1. Run the Migration

```bash
php artisan migrate
```

### 2. Upload a Document (Example)

```php
use App\Models\BusinessUnit;

$businessUnit = BusinessUnit::find(1);

$document = $businessUnit->addDocument(
    $request->file('document'),
    [
        'category' => 'policy',
        'description' => 'Annual compliance policy'
    ]
);
```

### 3. Retrieve Documents

```php
// Get all documents
$documents = $businessUnit->documents;

// Get by category
$policies = $businessUnit->getDocumentsByCategory('policy');

// With eager loading
$businessUnit = BusinessUnit::with('documents.uploadedBy')->find(1);
```

### 4. Download a Document

```php
$document = Document::find(1);

return Storage::disk($document->disk)->download(
    $document->file_path,
    $document->name
);
```

## 📊 Database Schema

```
documents
├── id
├── documentable_id      (Foreign key - varies by entity)
├── documentable_type    (Class name - 'App\Models\BusinessUnit', etc.)
├── name                 (Original filename)
├── file_path            (Storage path)
├── file_name            (Unique UUID-based filename)
├── mime_type            (File MIME type)
├── file_size            (Size in bytes)
├── disk                 (Storage disk: 'local', 's3', etc.)
├── category             (Optional categorization)
├── description          (Optional description)
├── uploaded_by          (User ID)
├── created_at
├── updated_at
└── deleted_at
```

## 🗂️ File Storage Structure

Files are automatically organized by entity type and ID:

```
storage/app/documents/
├── BusinessUnit/
│   ├── 1/
│   │   ├── uuid-1.pdf
│   │   └── uuid-2.docx
│   └── 2/
├── MacroProcess/
│   └── 5/
└── Process/
    └── 10/
```

## 🎯 Key Features

### ✅ Polymorphic Design

- Single `documents` table for all entity types
- Easy to extend to other models (Risks, Controls, etc.)
- Efficient querying with composite indexes

### ✅ Flexible Storage

- Supports multiple storage disks (local, S3, etc.)
- Configurable per document
- Automatic file cleanup on deletion

### ✅ Rich Metadata

- File categorization
- Descriptions
- Audit trail (who uploaded, when)
- Soft delete support

### ✅ Helper Methods

- Human-readable file sizes
- File type detection
- URL generation
- Temporary URL support for private files

### ✅ Security

- File validation support
- Access control ready
- Private storage support
- Temporary URL generation

## 🔒 Security Best Practices

### 1. Validate Uploads

```php
$request->validate([
    'document' => 'required|file|mimes:pdf,doc,docx,jpg,png|max:10240'
]);
```

### 2. Check Permissions

```php
if (!auth()->user()->can('view', $businessUnit)) {
    abort(403);
}
```

### 3. Use Private Storage for Sensitive Files

```php
// Configure in config/filesystems.php
'documents' => [
    'driver' => 's3',
    'visibility' => 'private',
    // ...
],

// Generate temporary URLs
$url = $document->getTemporaryUrl(30); // Valid for 30 minutes
```

## 🧪 Testing Example

```php
use App\Models\BusinessUnit;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('can upload document to business unit', function () {
    Storage::fake('local');

    $businessUnit = BusinessUnit::factory()->create();
    $file = UploadedFile::fake()->create('test.pdf', 100);

    $document = $businessUnit->addDocument($file, [
        'category' => 'policy'
    ]);

    expect($document->name)->toBe('test.pdf')
        ->and($businessUnit->documents)->toHaveCount(1);

    Storage::disk('local')->assertExists($document->file_path);
});
```

## 🔄 Extending to Other Models

To add document support to any other model:

```php
use App\Models\Concerns\HasDocuments;

class Risk extends Model
{
    use HasDocuments;

    // That's it! Now Risk has full document support
}
```

## 📝 Next Steps

1. **Run the migration**: `php artisan migrate`
2. **Add routes** from `routes/documents.example.php` to your actual route files
3. **Customize authorization** in the DocumentController based on your policies
4. **Configure storage disks** in `config/filesystems.php` if using S3 or other providers
5. **Add frontend components** for file upload and display

## 🎨 Frontend Integration Tips

### Upload Component

- Use `multipart/form-data` encoding
- Show file size limits
- Display upload progress
- Validate file types client-side

### Document List

- Show file icon based on mime type
- Display human-readable file size
- Provide download/delete actions
- Group by category if applicable

### File Preview

- Inline preview for images
- PDF viewer for PDF files
- Download button for other types

## 📚 Additional Resources

- Full documentation: `docs/DOCUMENT_ATTACHMENT_SYSTEM.md`
- Example routes: `routes/documents.example.php`
- Laravel File Storage: https://laravel.com/docs/filesystem
- Laravel Polymorphic Relations: https://laravel.com/docs/eloquent-relationships#polymorphic-relationships

## ✨ Future Enhancements

Consider adding these features as your application grows:

- 📦 **Document versioning** - Track multiple versions of the same document
- ✅ **Approval workflow** - Add approval status (pending, approved, rejected)
- 📅 **Expiration dates** - Track document validity periods
- 🔐 **File encryption** - Encrypt sensitive documents at rest
- 🖼️ **Thumbnail generation** - Auto-generate thumbnails for images
- 🛡️ **Virus scanning** - Scan uploaded files for malware
- 📊 **Activity logging** - Track who viewed/downloaded documents
- 🏷️ **Tagging system** - Add tags for better organization
- 🔍 **Full-text search** - Search document content
- 📝 **Document templates** - Pre-defined document templates for common types
