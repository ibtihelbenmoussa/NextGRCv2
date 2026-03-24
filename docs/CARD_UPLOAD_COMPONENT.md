# CardUpload Component

A reusable file upload component with drag & drop support, file validation, progress tracking, and image previews.

## Features

- ✨ **Drag & Drop**: Intuitive drag and drop interface
- 📁 **File Type Validation**: Restrict uploads by file type
- 📏 **Size Validation**: Set maximum file size limits
- 🖼️ **Image Previews**: Automatic image preview generation
- 📊 **Progress Tracking**: Visual upload progress indicators
- 🔄 **Retry Failed Uploads**: Easy retry mechanism for failed uploads
- ⚠️ **Error Handling**: Clear error messages and validation feedback
- 🎨 **Customizable**: Flexible props for various use cases

## Installation

The component is located at `resources/js/components/card-upload.tsx` and uses the `use-file-upload` hook from `resources/js/hooks/use-file-upload.ts`.

## Basic Usage

```tsx
import { CardUpload } from '@/components/card-upload';

function MyComponent() {
    return (
        <CardUpload
            maxFiles={5}
            maxSize={10 * 1024 * 1024} // 10MB
            accept="image/*"
            onFilesChange={(files) => {
                console.log('Files changed:', files);
            }}
        />
    );
}
```

## Props

### CardUploadProps

| Prop             | Type                                | Default           | Description                                  |
| ---------------- | ----------------------------------- | ----------------- | -------------------------------------------- |
| `maxFiles`       | `number`                            | `10`              | Maximum number of files allowed              |
| `maxSize`        | `number`                            | `52428800` (50MB) | Maximum file size in bytes                   |
| `accept`         | `string`                            | `"*"`             | Accepted file types (e.g., `"image/*,.pdf"`) |
| `multiple`       | `boolean`                           | `true`            | Allow multiple file selection                |
| `className`      | `string`                            | `undefined`       | Additional CSS classes                       |
| `onFilesChange`  | `(files: FileUploadItem[]) => void` | `undefined`       | Callback when files change                   |
| `simulateUpload` | `boolean`                           | `false`           | Simulate upload progress (for demos)         |
| `initialFiles`   | `FileMetadata[]`                    | `[]`              | Initial/default files to display             |
| `showActions`    | `boolean`                           | `true`            | Show/hide add files and remove all buttons   |
| `labels`         | `object`                            | `{}`              | Custom labels (see Labels section)           |

### Labels Object

```tsx
{
  dropzone?: string;      // "Drop files here or"
  browse?: string;        // "browse files"
  maxSize?: string;       // "Maximum file size: 50 MB • Maximum files: 10"
  filesCount?: string;    // "Files (3)"
  addFiles?: string;      // "Add files"
  removeAll?: string;     // "Remove all"
}
```

### FileUploadItem Interface

```tsx
interface FileUploadItem {
    id: string;
    file: File;
    preview?: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
}
```

### FileMetadata Interface

```tsx
interface FileMetadata {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
}
```

## Examples

### Image Upload Only

```tsx
<CardUpload
    maxFiles={5}
    maxSize={5 * 1024 * 1024} // 5MB
    accept="image/jpeg,image/png,image/webp"
    onFilesChange={(files) => {
        // Handle file upload
        files.forEach((file) => {
            if (file.status === 'completed') {
                console.log('Upload completed:', file.file.name);
            }
        });
    }}
/>
```

### Document Upload with Custom Labels

```tsx
<CardUpload
    maxFiles={3}
    maxSize={20 * 1024 * 1024} // 20MB
    accept=".pdf,.doc,.docx,.xls,.xlsx"
    labels={{
        dropzone: 'Déposer les documents ici ou',
        browse: 'parcourir',
        filesCount: `Documents (${count})`,
        addFiles: 'Ajouter',
        removeAll: 'Tout supprimer',
    }}
    onFilesChange={(files) => {
        console.log('Documents:', files);
    }}
/>
```

### With Initial Files (Display Only)

```tsx
const existingFiles: FileMetadata[] = [
    {
        id: '1',
        name: 'report.pdf',
        size: 1536000,
        type: 'application/pdf',
        url: '/storage/files/report.pdf',
    },
    {
        id: '2',
        name: 'image.jpg',
        size: 2048000,
        type: 'image/jpeg',
        url: '/storage/images/image.jpg',
    },
];

<CardUpload
    initialFiles={existingFiles}
    maxFiles={10}
    onFilesChange={(files) => {
        console.log('All files:', files);
    }}
/>;
```

### Single File Upload

```tsx
<CardUpload
    maxFiles={1}
    multiple={false}
    accept="image/*"
    showActions={false}
    onFilesChange={(files) => {
        if (files.length > 0) {
            console.log('Selected file:', files[0]);
        }
    }}
/>
```

### With Upload Simulation (Demo Mode)

```tsx
<CardUpload
    simulateUpload={true}
    maxFiles={5}
    onFilesChange={(files) => {
        files.forEach((file) => {
            console.log(
                `${file.file.name}: ${file.progress}% (${file.status})`,
            );
        });
    }}
/>
```

## Integration with Backend

### Laravel + Inertia.js Example

```tsx
import { router } from '@inertiajs/react';
import { CardUpload, FileUploadItem } from '@/components/card-upload';

function DocumentUploadPage() {
    const handleFilesChange = (files: FileUploadItem[]) => {
        // Filter only completed files
        const completedFiles = files.filter((f) => f.status === 'completed');

        // Create FormData for upload
        const formData = new FormData();
        completedFiles.forEach((fileItem, index) => {
            formData.append(`files[${index}]`, fileItem.file);
        });

        // Upload to Laravel backend
        router.post('/api/documents/upload', formData, {
            forceFormData: true,
            onSuccess: () => {
                console.log('Upload successful');
            },
            onError: (errors) => {
                console.error('Upload failed:', errors);
            },
        });
    };

    return (
        <div className="mx-auto max-w-4xl p-6">
            <h1 className="mb-6 text-2xl font-bold">Upload Documents</h1>
            <CardUpload
                maxFiles={10}
                maxSize={50 * 1024 * 1024}
                accept=".pdf,.doc,.docx"
                onFilesChange={handleFilesChange}
            />
        </div>
    );
}
```

### Laravel Controller Example

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DocumentController extends Controller
{
    public function upload(Request $request)
    {
        $request->validate([
            'files.*' => 'required|file|max:51200', // 50MB
        ]);

        $uploadedFiles = [];

        foreach ($request->file('files') as $file) {
            $path = $file->store('documents', 'public');

            $uploadedFiles[] = [
                'name' => $file->getClientOriginalName(),
                'path' => $path,
                'size' => $file->getSize(),
                'type' => $file->getMimeType(),
            ];
        }

        return back()->with([
            'message' => 'Files uploaded successfully',
            'files' => $uploadedFiles,
        ]);
    }
}
```

## Styling

The component uses Tailwind CSS and is fully responsive. It adapts to different screen sizes:

- **Mobile**: Single column grid
- **Tablet (sm)**: 3 columns
- **Desktop (lg)**: 4 columns

You can customize the appearance by passing a `className` prop:

```tsx
<CardUpload
    className="mx-auto max-w-2xl"
    // ... other props
/>
```

## Accessibility

The component follows accessibility best practices:

- ✅ Keyboard navigation support
- ✅ ARIA labels and roles
- ✅ Screen reader friendly
- ✅ Focus indicators
- ✅ Semantic HTML structure

## File Type Icons

The component automatically displays appropriate icons based on file type:

- 🖼️ Images: `ImageIcon`
- 🎥 Videos: `VideoIcon`
- 🎵 Audio: `HeadphonesIcon`
- 📄 PDFs: `FileTextIcon`
- 📝 Word documents: `FileTextIcon`
- 📊 Excel spreadsheets: `FileSpreadsheetIcon`
- 📦 Archives (zip, rar): `FileArchiveIcon`
- 📄 Other files: `FileTextIcon`

## Error Handling

The component validates files and displays errors for:

- ❌ File size exceeding maximum
- ❌ Invalid file types
- ❌ Exceeding maximum file count
- ❌ Upload failures (when simulated or actual)

Errors are displayed in a destructive alert at the bottom of the component and automatically dismissed after 5 seconds.

## Browser Support

The component uses modern browser APIs:

- File API
- Drag and Drop API
- URL.createObjectURL for image previews

Supported browsers:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Tips

1. **Memory Management**: The component automatically cleans up blob URLs to prevent memory leaks
2. **File Previews**: Only image files get preview URLs generated
3. **Progress Simulation**: Set `simulateUpload={true}` for demos or when you want to show progress without actual upload
4. **Custom Upload Logic**: Use the `onFilesChange` callback to implement your own upload logic
5. **Retry Mechanism**: Failed uploads can be retried by clicking the refresh icon

## Related Components

- `use-file-upload` hook: Core upload logic and state management
- `Button`: From `@/components/ui/button`
- `Alert`: From `@/components/ui/alert`
- `Tooltip`: From `@/components/ui/tooltip`

## License

Part of the NextGRC project.
