import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    formatBytes,
    useFileUpload,
    type FileMetadata,
    type FileWithPreview,
} from '@/hooks/use-file-upload';
import { cn } from '@/lib/utils';
import {
    CloudUpload,
    FileArchiveIcon,
    FileSpreadsheetIcon,
    FileTextIcon,
    HeadphonesIcon,
    ImageIcon,
    RefreshCwIcon,
    Trash2,
    TriangleAlert,
    Upload,
    VideoIcon,
    XIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

// Extend FileWithPreview to include upload status and progress
export interface FileUploadItem extends FileWithPreview {
    progress: number;
    status: 'uploading' | 'completed' | 'error';
    error?: string;
}

export interface CardUploadProps {
    /** Maximum number of files allowed */
    maxFiles?: number;
    /** Maximum file size in bytes */
    maxSize?: number;
    /** Accepted file types (e.g., "image/*,.pdf") */
    accept?: string;
    /** Allow multiple file selection */
    multiple?: boolean;
    /** Additional CSS classes */
    className?: string;
    /** Callback when files change */
    onFilesChange?: (files: FileUploadItem[]) => void;
    /** Whether to simulate upload progress (useful for demos) */
    simulateUpload?: boolean;
    /** Initial/default files to display */
    initialFiles?: FileMetadata[];
    /** Show/hide the add files and remove all buttons */
    showActions?: boolean;
    /** Custom labels for the upload area */
    labels?: {
        dropzone?: string;
        browse?: string;
        maxSize?: string;
        filesCount?: string;
        addFiles?: string;
        removeAll?: string;
    };
}

/**
 * CardUpload - A reusable file upload component with drag & drop support
 *
 * Features:
 * - Drag and drop file upload
 * - File type and size validation
 * - Image preview
 * - Upload progress simulation
 * - Error handling
 * - Retry failed uploads
 *
 * @example
 * ```tsx
 * <CardUpload
 *   maxFiles={5}
 *   maxSize={10 * 1024 * 1024} // 10MB
 *   accept="image/*,.pdf"
 *   onFilesChange={(files) => console.log(files)}
 * />
 * ```
 */
export function CardUpload({
    maxFiles = 10,
    maxSize = 50 * 1024 * 1024, // 50MB
    accept = '*',
    multiple = true,
    className,
    onFilesChange,
    simulateUpload = false,
    initialFiles = [],
    showActions = true,
    labels = {},
}: CardUploadProps) {
    // Convert initial files to FileUploadItem format
    const initialUploadFiles: FileUploadItem[] = initialFiles.map((file) => ({
        id: file.id,
        file: {
            id: file.id,
            name: file.name,
            size: file.size,
            type: file.type,
        } as unknown as File,
        preview: file.url,
        progress: 100,
        status: 'completed' as const,
    }));

    const [uploadFiles, setUploadFiles] =
        useState<FileUploadItem[]>(initialUploadFiles);

    const [
        { isDragging, errors },
        {
            removeFile,
            clearFiles,
            handleDragEnter,
            handleDragLeave,
            handleDragOver,
            handleDrop,
            openFileDialog,
            getInputProps,
        },
    ] = useFileUpload({
        maxFiles,
        maxSize,
        accept,
        multiple,
        initialFiles,
        onFilesChange: (newFiles) => {
            // Convert to upload items when files change, preserving existing status
            const newUploadFiles = newFiles.map((file) => {
                // Check if this file already exists in uploadFiles
                const existingFile = uploadFiles.find(
                    (existing) => existing.id === file.id,
                );

                if (existingFile) {
                    // Preserve existing file status and progress
                    return {
                        ...existingFile,
                        ...file, // Update any changed properties from the file
                    };
                } else {
                    // New file - set to uploading
                    return {
                        ...file,
                        progress: 0,
                        status: 'uploading' as const,
                    };
                }
            });

            setUploadFiles(newUploadFiles);
            onFilesChange?.(newUploadFiles);
        },
    });

    // Simulate upload progress for new files
    useEffect(() => {
        if (!simulateUpload) return;

        const uploadingFiles = uploadFiles.filter(
            (file) => file.status === 'uploading',
        );
        if (uploadingFiles.length === 0) return;

        const interval = setInterval(() => {
            setUploadFiles((prev) =>
                prev.map((file) => {
                    if (file.status !== 'uploading') return file;

                    const increment = Math.random() * 20 + 5; // Random increment between 5-25%
                    const newProgress = Math.min(
                        file.progress + increment,
                        100,
                    );

                    if (newProgress >= 100) {
                        // Simulate occasional failures (10% chance)
                        const shouldFail = Math.random() < 0.1;
                        return {
                            ...file,
                            progress: 100,
                            status: shouldFail
                                ? ('error' as const)
                                : ('completed' as const),
                            error: shouldFail
                                ? 'Upload failed. Please try again.'
                                : undefined,
                        };
                    }

                    return { ...file, progress: newProgress };
                }),
            );
        }, 500);

        return () => clearInterval(interval);
    }, [uploadFiles, simulateUpload]);

    const removeUploadFile = (fileId: string) => {
        const fileToRemove = uploadFiles.find((f) => f.id === fileId);
        if (fileToRemove) {
            removeFile(fileToRemove.id);
        }
    };

    const retryUpload = (fileId: string) => {
        setUploadFiles((prev) =>
            prev.map((file) =>
                file.id === fileId
                    ? {
                          ...file,
                          progress: 0,
                          status: 'uploading' as const,
                          error: undefined,
                      }
                    : file,
            ),
        );
    };

    const getFileIcon = (file: File | FileMetadata) => {
        const type = file instanceof File ? file.type : file.type;
        if (type.startsWith('image/')) return <ImageIcon className="size-6" />;
        if (type.startsWith('video/')) return <VideoIcon className="size-6" />;
        if (type.startsWith('audio/'))
            return <HeadphonesIcon className="size-6" />;
        if (type.includes('pdf')) return <FileTextIcon className="size-6" />;
        if (type.includes('word') || type.includes('doc'))
            return <FileTextIcon className="size-6" />;
        if (type.includes('excel') || type.includes('sheet'))
            return <FileSpreadsheetIcon className="size-6" />;
        if (type.includes('zip') || type.includes('rar'))
            return <FileArchiveIcon className="size-6" />;
        return <FileTextIcon className="size-6" />;
    };

    return (
        <div className={cn('w-full space-y-4', className)}>
            {/* Upload Area */}
            <div
                className={cn(
                    'relative cursor-pointer rounded-lg border border-dashed p-6 text-center transition-colors',
                    isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-muted-foreground/25 hover:border-muted-foreground/50',
                )}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={openFileDialog}
            >
                <input {...getInputProps()} className="sr-only" />

                <div className="flex flex-col items-center gap-4">
                    <div
                        className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-full bg-muted transition-colors',
                            isDragging
                                ? 'border-primary bg-primary/10'
                                : 'border-muted-foreground/25',
                        )}
                    >
                        <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="space-y-2">
                        <p className="text-sm font-medium">
                            {labels.dropzone || 'Drop files here or'}{' '}
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    openFileDialog();
                                }}
                                className="cursor-pointer text-primary underline-offset-4 hover:underline"
                            >
                                {labels.browse || 'browse files'}
                            </button>
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {labels.maxSize ||
                                `Maximum file size: ${formatBytes(maxSize)} • Maximum files: ${maxFiles}`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Files Grid */}
            {uploadFiles.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">
                            {labels.filesCount ||
                                `Files (${uploadFiles.length})`}
                        </h3>
                        {showActions && (
                            <div className="flex gap-2">
                                <Button
                                    onClick={openFileDialog}
                                    variant="outline"
                                    size="sm"
                                >
                                    <CloudUpload />
                                    {labels.addFiles || 'Add files'}
                                </Button>
                                <Button
                                    onClick={clearFiles}
                                    variant="outline"
                                    size="sm"
                                >
                                    <Trash2 />
                                    {labels.removeAll || 'Remove all'}
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                        {uploadFiles.map((fileItem) => (
                            <div key={fileItem.id} className="group relative">
                                {/* Remove button */}
                                <Button
                                    onClick={() =>
                                        removeUploadFile(fileItem.id)
                                    }
                                    variant="outline"
                                    size="icon"
                                    className="absolute -end-1 -top-1 z-10 size-5 rounded-full opacity-0 transition-opacity group-hover:opacity-100"
                                >
                                    <XIcon className="size-2.5" />
                                </Button>

                                {/* Wrapper */}
                                <div className="relative overflow-hidden rounded-lg border bg-card transition-colors">
                                    {/* Image preview or file icon area */}
                                    <div className="relative h-20 border-b border-border bg-muted">
                                        {fileItem.file.type.startsWith(
                                            'image/',
                                        ) && fileItem.preview ? (
                                            <>
                                                {/* Image cover */}
                                                <img
                                                    src={fileItem.preview}
                                                    alt={fileItem.file.name}
                                                    className="h-full w-full object-cover"
                                                />
                                                {/* Progress overlay for uploading images */}
                                                {fileItem.status ===
                                                    'uploading' && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                                        <div className="relative">
                                                            <svg
                                                                className="size-8 -rotate-90"
                                                                viewBox="0 0 48 48"
                                                            >
                                                                <circle
                                                                    cx="24"
                                                                    cy="24"
                                                                    r="20"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="3"
                                                                    className="text-muted/60"
                                                                />
                                                                <circle
                                                                    cx="24"
                                                                    cy="24"
                                                                    r="20"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="3"
                                                                    strokeDasharray={`${2 * Math.PI * 20}`}
                                                                    strokeDashoffset={`${2 * Math.PI * 20 * (1 - fileItem.progress / 100)}`}
                                                                    className="text-white transition-all duration-300"
                                                                    strokeLinecap="round"
                                                                />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            /* File icon area for non-images */
                                            <div className="flex h-full items-center justify-center text-muted-foreground/80">
                                                {fileItem.status ===
                                                'uploading' ? (
                                                    <div className="relative">
                                                        <svg
                                                            className="size-8 -rotate-90"
                                                            viewBox="0 0 48 48"
                                                        >
                                                            <circle
                                                                cx="24"
                                                                cy="24"
                                                                r="20"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="3"
                                                                className="text-muted-foreground/20"
                                                            />
                                                            <circle
                                                                cx="24"
                                                                cy="24"
                                                                r="20"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="3"
                                                                strokeDasharray={`${2 * Math.PI * 20}`}
                                                                strokeDashoffset={`${2 * Math.PI * 20 * (1 - fileItem.progress / 100)}`}
                                                                className="text-primary transition-all duration-300"
                                                                strokeLinecap="round"
                                                            />
                                                        </svg>
                                                        <div className="absolute inset-0 flex items-center justify-center text-xl">
                                                            {getFileIcon(
                                                                fileItem.file,
                                                            )}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-2xl">
                                                        {getFileIcon(
                                                            fileItem.file,
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* File info footer */}
                                    <div className="p-2">
                                        <div className="space-y-0.5">
                                            <p className="truncate text-xs font-medium">
                                                {fileItem.file.name}
                                            </p>
                                            <div className="relative flex items-center justify-between gap-1">
                                                <span className="text-[10px] text-muted-foreground">
                                                    {formatBytes(
                                                        fileItem.file.size,
                                                    )}
                                                </span>

                                                {fileItem.status === 'error' &&
                                                    fileItem.error && (
                                                        <Tooltip>
                                                            <TooltipTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    onClick={() =>
                                                                        retryUpload(
                                                                            fileItem.id,
                                                                        )
                                                                    }
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="absolute end-0 -top-1 size-4 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                                >
                                                                    <RefreshCwIcon className="size-2.5 opacity-100" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                Upload failed.
                                                                Retry
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Error Messages */}
            {errors.length > 0 && (
                <Alert variant="destructive" className="mt-5">
                    <TriangleAlert />
                    <AlertTitle>File upload error(s)</AlertTitle>
                    <AlertDescription>
                        {errors.map((error, index) => (
                            <p key={index} className="last:mb-0">
                                {error}
                            </p>
                        ))}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}

export default CardUpload;
