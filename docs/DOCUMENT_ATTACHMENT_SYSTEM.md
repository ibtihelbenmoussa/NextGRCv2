# Document Attachment System

## Overview

The document attachment system uses **polymorphic relationships** to allow Business Units, Macro Processes, and Processes (and potentially other entities) to have files attached to them without creating separate tables for each entity type.

## Database Structure

### `documents` Table

| Column              | Type      | Description                                                       |
| ------------------- | --------- | ----------------------------------------------------------------- |
| `id`                | bigint    | Primary key                                                       |
| `documentable_id`   | bigint    | ID of the parent entity (BusinessUnit, MacroProcess, or Process)  |
| `documentable_type` | string    | Class name of the parent entity                                   |
| `name`              | string    | Original filename                                                 |
| `file_path`         | string    | Path where file is stored in the filesystem                       |
| `file_name`         | string    | Unique stored filename (UUID-based)                               |
| `mime_type`         | string    | File MIME type (e.g., `application/pdf`, `image/png`)             |
| `file_size`         | bigint    | File size in bytes                                                |
| `disk`              | string    | Storage disk used (`local`, `s3`, etc.) - default: `local`        |
| `category`          | string    | Optional categorization (e.g., `policy`, `procedure`, `evidence`) |
| `description`       | text      | Optional description                                              |
| `uploaded_by`       | bigint    | Foreign key to `users` table (who uploaded the document)          |
| `created_at`        | timestamp | Creation timestamp                                                |
| `updated_at`        | timestamp | Last update timestamp                                             |
| `deleted_at`        | timestamp | Soft delete timestamp                                             |

**Indexes:**

- Composite index on `(documentable_type, documentable_id)` for efficient querying
- Index on `category` for filtering by category

## Model Structure

### Document Model

**Location:** `app/Models/Document.php`

**Key Methods:**

- `documentable()` - Get the parent model (BusinessUnit, MacroProcess, or Process)
- `uploadedBy()` - Get the user who uploaded the document
- `getFullPathAttribute()` - Get the full storage path
- `getUrlAttribute()` - Get the public URL
- `getTemporaryUrl($minutes)` - Get a temporary download URL (useful for S3)
- `getHumanFileSizeAttribute()` - Get human-readable file size (e.g., "2.5 MB")
- `isImage()` - Check if the document is an image
- `isPdf()` - Check if the document is a PDF

### HasDocuments Trait

**Location:** `app/Models/Concerns/HasDocuments.php`

This trait is applied to models that can have documents attached (BusinessUnit, MacroProcess, Process).

**Key Methods:**

- `documents()` - Get all documents relationship
- `addDocument($file, $attributes, $disk)` - Upload and attach a document
- `getDocumentsByCategory($category)` - Get documents filtered by category
- `hasDocuments()` - Check if the model has any documents
- `getTotalDocumentsSize()` - Get total size of all documents in bytes
- `deleteAllDocuments()` - Delete all documents (including physical files)

## Usage Examples

### 1. Uploading a Document

```php
use App\Models\BusinessUnit;
use Illuminate\Http\UploadedFile;

// Get the business unit
$businessUnit = BusinessUnit::find(1);

// Upload a document (e.g., from a form request)
$document = $businessUnit->addDocument(
    file: $request->file('document'),
    attributes: [
        'category' => 'policy',
        'description' => 'Annual compliance policy document'
    ]
);

// Or specify a custom storage disk
$document = $businessUnit->addDocument(
    file: $request->file('document'),
    attributes: ['category' => 'procedure'],
    disk: 's3'  // Use S3 instead of local storage
);
```

### 2. Retrieving Documents

```php
// Get all documents for a business unit
$documents = $businessUnit->documents;

// Get documents with uploader information
$documents = $businessUnit->documents()->with('uploadedBy')->get();

// Get documents by category
$policies = $businessUnit->getDocumentsByCategory('policy');

// Get only active (non-deleted) documents
$activeDocuments = $businessUnit->documents()->whereNull('deleted_at')->get();

// Check if has documents
if ($businessUnit->hasDocuments()) {
    // Do something
}
```

### 3. Working with Document Files

```php
// Get the document
$document = $businessUnit->documents()->first();

// Get the full storage path
$path = $document->full_path;

// Get public URL (for public disks)
$url = $document->url;

// Get temporary download URL (for private disks like S3)
$tempUrl = $document->getTemporaryUrl(60); // Valid for 60 minutes

// Get human-readable file size
$size = $document->human_file_size; // e.g., "2.5 MB"

// Check file type
if ($document->isImage()) {
    // Display as image
} elseif ($document->isPdf()) {
    // Show PDF viewer
}
```

### 4. Deleting Documents

```php
// Soft delete (keeps file on disk)
$document->delete();

// Force delete (removes file from disk)
$document->forceDelete();

// Delete all documents for an entity
$businessUnit->deleteAllDocuments();
```

### 5. In a Controller

```php
namespace App\Http\Controllers;

use App\Models\BusinessUnit;
use Illuminate\Http\Request;

class BusinessUnitDocumentController extends Controller
{
    public function upload(Request $request, BusinessUnit $businessUnit)
    {
        $request->validate([
            'document' => 'required|file|max:10240', // 10MB max
            'category' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $document = $businessUnit->addDocument(
            $request->file('document'),
            $request->only(['category', 'description'])
        );

        return response()->json([
            'message' => 'Document uploaded successfully',
            'document' => $document
        ]);
    }

    public function download(BusinessUnit $businessUnit, Document $document)
    {
        // Ensure document belongs to this business unit
        if ($document->documentable_id !== $businessUnit->id) {
            abort(403);
        }

        return Storage::disk($document->disk)->download(
            $document->file_path,
            $document->name
        );
    }

    public function destroy(BusinessUnit $businessUnit, Document $document)
    {
        // Ensure document belongs to this business unit
        if ($document->documentable_id !== $businessUnit->id) {
            abort(403);
        }

        $document->forceDelete();

        return response()->json([
            'message' => 'Document deleted successfully'
        ]);
    }
}
```

## File Storage

### Storage Path Structure

Files are automatically organized by model type and entity ID:

```
storage/app/
  ├── documents/
      ├── BusinessUnit/
      │   ├── 1/
      │   │   ├── a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf
      │   │   └── f1e2d3c4-b5a6-9870-dcba-fe0987654321.docx
      │   └── 2/
      ├── MacroProcess/
      │   └── 5/
      └── Process/
          └── 10/
```

### Supported Storage Disks

Configure storage disks in `config/filesystems.php`:

- **local** (default) - Stores files locally in `storage/app/`
- **public** - Stores files in `storage/app/public/` (publicly accessible)
- **s3** - Stores files on Amazon S3
- Any custom disk you configure

## Security Considerations

1. **File Validation**: Always validate uploaded files in your controllers:

    ```php
    $request->validate([
        'document' => 'required|file|mimes:pdf,doc,docx,jpg,png|max:10240'
    ]);
    ```

2. **Access Control**: Check permissions before allowing download:

    ```php
    if (!auth()->user()->can('view', $businessUnit)) {
        abort(403);
    }
    ```

3. **Private Storage**: For sensitive documents, use a private disk and generate temporary URLs:
    ```php
    $url = $document->getTemporaryUrl(30); // Valid for 30 minutes
    ```

## Migration Command

Run the migration to create the `documents` table:

```bash
php artisan migrate
```

## Testing

### Example Test

```php
use App\Models\BusinessUnit;
use App\Models\Document;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('can upload document to business unit', function () {
    Storage::fake('local');

    $businessUnit = BusinessUnit::factory()->create();
    $file = UploadedFile::fake()->create('test.pdf', 100);

    $document = $businessUnit->addDocument($file, [
        'category' => 'policy',
        'description' => 'Test policy'
    ]);

    expect($document)->toBeInstanceOf(Document::class)
        ->and($document->name)->toBe('test.pdf')
        ->and($document->category)->toBe('policy')
        ->and($businessUnit->documents)->toHaveCount(1);

    Storage::disk('local')->assertExists($document->file_path);
});

test('deleting document removes file from storage', function () {
    Storage::fake('local');

    $businessUnit = BusinessUnit::factory()->create();
    $file = UploadedFile::fake()->create('test.pdf', 100);

    $document = $businessUnit->addDocument($file);
    $filePath = $document->file_path;

    Storage::disk('local')->assertExists($filePath);

    $document->forceDelete();

    Storage::disk('local')->assertMissing($filePath);
});
```

## Extending to Other Models

To add document support to other models (e.g., `Risk`, `Control`, `AuditMission`):

1. Add the trait to the model:

    ```php
    use App\Models\Concerns\HasDocuments;

    class Risk extends Model
    {
        use HasDocuments;
        // ...
    }
    ```

2. That's it! The model now has full document support.

## Query Performance

The `documents` table includes indexes on:

- `(documentable_type, documentable_id)` - For efficient retrieval of documents by entity
- `category` - For filtering by category

When querying documents with relationships:

```php
// Eager load to avoid N+1 queries
$businessUnits = BusinessUnit::with('documents.uploadedBy')->get();

// Count documents without loading them
$count = $businessUnit->documents()->count();
```

## Additional Features to Consider

### Future Enhancements

1. **Versioning**: Track document versions
2. **Approval Workflow**: Add approval status (pending, approved, rejected)
3. **Expiration Dates**: Track document validity periods
4. **File Encryption**: Encrypt sensitive documents
5. **Thumbnail Generation**: Auto-generate thumbnails for images
6. **Virus Scanning**: Scan uploaded files for malware
7. **Activity Logging**: Track who viewed/downloaded documents
