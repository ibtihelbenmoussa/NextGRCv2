# Document Upload Troubleshooting Guide

## Issue: Files Not Uploading / Documents Table Empty

### Symptoms

- File upload shows gray loading state
- Files don't show as completed
- `documents` table remains empty after submission
- No errors displayed to user

### Root Causes & Solutions

## 1. Frontend Issues

### Problem: CardUpload Component Not Simulating Upload

**Symptom:** Files remain in gray/uploading state forever

**Solution:** Add `simulateUpload={true}` to CardUpload component

```tsx
<CardUpload
    simulateUpload={true} // ← Add this
    maxFiles={10}
    maxSize={10 * 1024 * 1024}
    onFilesChange={handleFilesChange}
/>
```

### Problem: Inertia Not Sending Files as FormData

**Symptom:** Backend receives empty file array

**Solution:** Add `forceFormData: true` to Inertia post request

```tsx
const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/business-units', {
        forceFormData: true, // ← Add this
    });
};
```

### Problem: Only Completed Files Being Sent

**Symptom:** Files aren't marked as completed, so they're filtered out

**Solution:** Send all files regardless of status

```tsx
const handleFilesChange = (files: FileUploadItem[]) => {
    setData({
        ...data,
        documents: files.map((f) => f.file), // All files, not just completed
    });
};
```

## 2. Backend Issues

### Problem: Validation Failing Silently

**Check:** Look for validation errors in response

**Debug:**

```php
dd($request->all()); // Check what's being received
dd($request->file('documents')); // Check files specifically
dd($request->hasFile('documents')); // Boolean check
```

### Problem: Files Not Being Saved

**Check:** Verify file storage permissions

**Debug:**

```php
// In BusinessUnitController@store
\Log::info('Documents received:', [
    'count' => count($request->file('documents', [])),
    'has_files' => $request->hasFile('documents'),
]);
```

### Problem: Wrong Field Name

**Check:** Frontend sends `documents[]` but backend expects `documents`

**Solution:** Ensure field name matches

```tsx
// Frontend
documents: files.map((f) => f.file)

// Backend validation
'documents' => 'nullable|array',
'documents.*' => 'file|max:10240',
```

## 3. Storage Issues

### Problem: Storage Directory Not Writable

**Check:** Directory permissions

```bash
# Windows
icacls storage\app /grant Users:F

# Linux/Mac
chmod -R 775 storage/app
chown -R www-data:www-data storage/app
```

### Problem: Disk Not Configured

**Check:** `config/filesystems.php`

```php
'default' => env('FILESYSTEM_DISK', 'local'),

'disks' => [
    'local' => [
        'driver' => 'local',
        'root' => storage_path('app'),
    ],
],
```

## 4. Database Issues

### Problem: Documents Table Doesn't Exist

**Check:** Migration ran successfully

```bash
php artisan migrate:status
```

**Solution:** Run migration

```bash
php artisan migrate
```

### Problem: Foreign Key Constraint

**Check:** `uploaded_by` field references non-existent user

**Solution:** Ensure user is authenticated

```php
// In HasDocuments trait
'uploaded_by' => auth()->id(), // Make sure user is logged in
```

## Debugging Steps

### Step 1: Check Frontend Console

1. Open browser DevTools (F12)
2. Go to Network tab
3. Submit form
4. Look at the request payload
5. Verify files are included in FormData

### Step 2: Check Backend Logs

```bash
# View logs
tail -f storage/logs/laravel.log

# Or on Windows
Get-Content storage\logs\laravel.log -Tail 50 -Wait
```

### Step 3: Verify Database

```sql
-- Check if documents table exists
SHOW TABLES LIKE 'documents';

-- Check table structure
DESCRIBE documents;

-- Check for any records
SELECT * FROM documents;

-- Check business units
SELECT * FROM business_units ORDER BY created_at DESC LIMIT 5;
```

### Step 4: Check File System

```bash
# Check if files are being stored
ls -la storage/app/documents/

# On Windows
dir storage\app\documents\ /s
```

## Common Fixes

### Fix 1: Clear Cache

```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Fix 2: Rebuild Frontend

```bash
npm run build
# or for development
npm run dev
```

### Fix 3: Check File Size Limits

**PHP Configuration** (`php.ini`):

```ini
upload_max_filesize = 10M
post_max_size = 10M
max_file_uploads = 10
```

**Nginx Configuration**:

```nginx
client_max_body_size 10M;
```

**Apache Configuration** (`.htaccess`):

```apache
php_value upload_max_filesize 10M
php_value post_max_size 10M
```

### Fix 4: Verify Model Has Trait

```php
// In BusinessUnit model
use App\Models\Concerns\HasDocuments;

class BusinessUnit extends Model
{
    use HasDocuments; // ← Must have this
}
```

## Testing the Fix

### Manual Test

1. Login to application
2. Navigate to Business Units → Create
3. Fill in required fields (Name, Code)
4. Upload a small test file (e.g., 1MB PDF)
5. Check file shows progress bar turning green
6. Submit form
7. Verify success message
8. Check database: `SELECT * FROM documents;`
9. Check file system: `storage/app/documents/BusinessUnit/{id}/`

### Automated Test

```php
// tests/Feature/DocumentUploadTest.php
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('can upload document when creating business unit', function () {
    Storage::fake('local');

    $user = User::factory()->create();
    $this->actingAs($user);

    $response = $this->post('/business-units', [
        'name' => 'Test Unit',
        'code' => 'TEST',
        'documents' => [
            UploadedFile::fake()->create('test.pdf', 100),
        ],
    ]);

    $response->assertRedirect();

    $businessUnit = BusinessUnit::latest()->first();
    expect($businessUnit->documents)->toHaveCount(1);

    Storage::disk('local')->assertExists($businessUnit->documents->first()->file_path);
});
```

## Verification Checklist

- [ ] `simulateUpload={true}` in CardUpload component
- [ ] `forceFormData: true` in Inertia post request
- [ ] Files are mapped to `data.documents` array
- [ ] Backend validation includes `'documents' => 'nullable|array'`
- [ ] Backend retrieves files with `$request->file('documents')`
- [ ] BusinessUnit model has `HasDocuments` trait
- [ ] Storage directory is writable
- [ ] Documents table exists in database
- [ ] User is authenticated
- [ ] File size within limits (10MB)
- [ ] Log files show file upload attempts

## Still Not Working?

### Enable Full Debug Mode

**Frontend:**

```tsx
const handleFilesChange = (files: FileUploadItem[]) => {
    console.log('Files changed:', files);
    console.log('File count:', files.length);
    files.forEach((f, i) => {
        console.log(`File ${i}:`, f.file.name, f.file.size, f.status);
    });
    // ... rest of code
};

const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting form with data:', data);
    console.log('Documents:', data.documents);
    // ... rest of code
};
```

**Backend:**

```php
public function store(Request $request)
{
    \Log::info('=== BusinessUnit Store ===');
    \Log::info('All input:', $request->all());
    \Log::info('All files:', $request->allFiles());
    \Log::info('Has documents:', $request->hasFile('documents'));
    \Log::info('Documents:', $request->file('documents'));

    // ... rest of code

    \Log::info('BusinessUnit created:', ['id' => $businessUnit->id]);
    \Log::info('Document count:', ['count' => $businessUnit->documents()->count()]);
}
```

Then check logs while testing:

```bash
tail -f storage/logs/laravel.log
```

## Success Indicators

✅ **Frontend:**

- Files show green progress bar (100%)
- Files show checkmark icon
- No errors in browser console

✅ **Backend:**

- Log shows "Documents received: count > 0"
- Log shows "Document uploaded: id > 0"
- Success redirect occurs

✅ **Database:**

- `SELECT COUNT(*) FROM documents;` returns > 0
- Records show correct business_unit_id
- File paths are populated

✅ **File System:**

- Files exist in `storage/app/documents/BusinessUnit/{id}/`
- Files have UUID-based names
- Files are readable

## Contact & Support

If issues persist after trying all troubleshooting steps:

1. Check Laravel logs: `storage/logs/laravel.log`
2. Check browser console for JavaScript errors
3. Verify PHP version (>= 8.1)
4. Verify Laravel version (>= 11.0)
5. Check file system permissions
6. Try with a very small file (< 1MB) to rule out size issues
