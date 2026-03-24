# Document Upload - Quick Fix Summary

## Changes Made

### ✅ Fixed Issues

1. **Added `simulateUpload={true}`** - Makes upload progress visible
2. **Added `forceFormData: true`** - Ensures files are sent correctly with Inertia.js
3. **Fixed file filtering** - Sends all files, not just completed ones
4. **Added debug logging** - Helps troubleshoot issues

## Testing Instructions

### Step 1: Start Development Server

```bash
# Terminal 1: Laravel
php artisan serve

# Terminal 2: Vite
npm run dev
```

### Step 2: Login

- Navigate to: `http://localhost:8000`
- Login with: `admin@example.com` / `password`

### Step 3: Create Business Unit with Documents

1. Go to **Business Units** → **Create** (`/business-units/create`)
2. Fill in required fields:
    - **Name**: Test Business Unit
    - **Code**: TEST
3. Scroll to **"Documents (Optional)"** section
4. Upload a test file:
    - Click "Browse files" OR drag & drop
    - Select a small file (e.g., PDF, image, < 5MB)
5. **Expected behavior:**
    - Progress bar should appear and fill up (gray → green)
    - File should show checkmark when complete
    - File name and size should be displayed
6. Click **"Create Business Unit"**
7. **Expected result:**
    - Redirect to business unit detail page
    - Success message displayed

### Step 4: Verify Upload

#### Check Database

```sql
-- Check documents table
SELECT * FROM documents ORDER BY created_at DESC LIMIT 5;

-- Check with business unit
SELECT
    bu.name AS business_unit,
    d.name AS document_name,
    d.file_size,
    d.created_at
FROM documents d
JOIN business_units bu ON d.documentable_id = bu.id
WHERE d.documentable_type = 'App\\Models\\BusinessUnit'
ORDER BY d.created_at DESC;
```

#### Check File System

```powershell
# Windows PowerShell
Get-ChildItem -Path storage\app\documents\BusinessUnit -Recurse

# Or manually navigate to:
# storage/app/documents/BusinessUnit/{id}/
```

#### Check Logs

```powershell
Get-Content storage\logs\laravel.log -Tail 20
```

Look for these log entries:

```
[timestamp] local.INFO: Documents received: {"count":1,"has_files":true,...}
[timestamp] local.INFO: Uploading document: {"index":0,"name":"test.pdf",...}
[timestamp] local.INFO: Document uploaded: {"id":1}
```

## Expected Outcomes

### ✅ Success Indicators

**Frontend:**

- [ ] File upload progress bar shows (starts gray)
- [ ] Progress bar turns green and reaches 100%
- [ ] Checkmark icon appears next to file
- [ ] File name and size are displayed correctly
- [ ] No JavaScript errors in browser console
- [ ] Form submits successfully
- [ ] Redirects to business unit detail page
- [ ] Success message shown

**Backend:**

- [ ] Log shows "Documents received: count > 0"
- [ ] Log shows "Document uploaded: id > 0"
- [ ] No errors in `storage/logs/laravel.log`

**Database:**

- [ ] New record in `documents` table
- [ ] `documentable_id` matches business unit ID
- [ ] `documentable_type` is 'App\Models\BusinessUnit'
- [ ] `name`, `file_path`, `file_size` are populated
- [ ] `uploaded_by` matches logged-in user ID

**File System:**

- [ ] Directory exists: `storage/app/documents/BusinessUnit/{id}/`
- [ ] File exists with UUID-based name (e.g., `abc123-def456...pdf`)
- [ ] File is readable and has correct size

## Troubleshooting

### Issue: Progress bar stays gray

**Cause:** `simulateUpload` not set to `true`

**Check:** `resources/js/pages/business-units/create.tsx` line ~226

```tsx
<CardUpload
    simulateUpload={true}  // ← Must be true
    ...
/>
```

### Issue: No files in backend

**Cause:** Inertia not sending FormData

**Check:** `resources/js/pages/business-units/create.tsx` line ~49

```tsx
post('/business-units', {
    forceFormData: true, // ← Must be true
});
```

### Issue: Documents table empty

**Possible causes:**

1. Files not being received (check logs)
2. Validation failing (check response errors)
3. Exception in `addDocument()` method (check logs)
4. Storage permission issue (check file system)

**Debug:**

```bash
# Check logs for errors
Get-Content storage\logs\laravel.log -Tail 50 | Select-String -Pattern "error|exception|fail" -Context 2,2
```

### Issue: "File too large" error

**Check PHP configuration:**

```ini
; php.ini
upload_max_filesize = 10M
post_max_size = 10M
max_file_uploads = 10
```

**Restart PHP after changing php.ini:**

```bash
# If using PHP built-in server, restart it
# If using Apache/Nginx, restart the service
```

## Quick Verification Script

Save this as `test-document-upload.php` and run via `php artisan tinker`:

```php
// In tinker
$bu = \App\Models\BusinessUnit::factory()->create();
echo "Business Unit created: {$bu->id}\n";

// Check if trait is working
echo "Has documents trait: " . (method_exists($bu, 'documents') ? 'YES' : 'NO') . "\n";

// Check documents relationship
echo "Documents count: " . $bu->documents()->count() . "\n";

// List all documents
$docs = \App\Models\Document::all();
echo "Total documents in DB: " . $docs->count() . "\n";
foreach ($docs as $doc) {
    echo "  - {$doc->name} ({$doc->file_size} bytes) for {$doc->documentable_type} #{$doc->documentable_id}\n";
}
```

## Common Fixes

### Clear all caches

```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Rebuild frontend

```bash
npm run build
```

### Check storage permissions

```powershell
# Windows - Give full control to storage folder
icacls storage /grant Users:F /t
```

## Support

If upload still doesn't work after following this guide:

1. **Check browser console** (F12) for JavaScript errors
2. **Check network tab** to see if files are in request payload
3. **Check Laravel logs** for backend errors
4. **Verify PHP file upload settings** in `phpinfo()`
5. **Test with a very small file** (< 100KB) to rule out size issues
6. **Try a different file type** (PDF, JPG, TXT)

## Success! 🎉

Once you see:

- ✅ Green progress bar
- ✅ Record in `documents` table
- ✅ File in `storage/app/documents/`

The upload feature is working correctly!

## Next Steps

After confirming it works:

1. Remove debug logging from controller (optional)
2. Test with different file types
3. Test with multiple files
4. Test file size limits
5. Test with maximum number of files (10)
6. Add similar functionality to Macro Processes and Processes
