import { useCallback, useRef, useState } from 'react';

export interface FileMetadata {
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
}

export interface FileWithPreview {
    id: string;
    file: File;
    preview?: string;
}

interface UseFileUploadOptions {
    maxFiles?: number;
    maxSize?: number;
    accept?: string;
    multiple?: boolean;
    initialFiles?: FileMetadata[];
    onFilesChange?: (files: FileWithPreview[]) => void;
}

interface UseFileUploadState {
    files: FileWithPreview[];
    isDragging: boolean;
    errors: string[];
}

interface UseFileUploadActions {
    addFiles: (newFiles: File[]) => void;
    removeFile: (fileId: string) => void;
    clearFiles: () => void;
    handleDragEnter: (e: React.DragEvent) => void;
    handleDragLeave: (e: React.DragEvent) => void;
    handleDragOver: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
    openFileDialog: () => void;
    getInputProps: () => React.InputHTMLAttributes<HTMLInputElement> & {
        ref: React.RefObject<HTMLInputElement | null>;
    };
}

export function formatBytes(bytes: number, decimals: number = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function useFileUpload({
    maxFiles = 10,
    maxSize = 50 * 1024 * 1024, // 50MB default
    accept = '*',
    multiple = true,
    initialFiles = [],
    onFilesChange,
}: UseFileUploadOptions = {}): [UseFileUploadState, UseFileUploadActions] {
    // Convert initial files to FileWithPreview format
    const initialFilesWithPreview: FileWithPreview[] = initialFiles.map(
        (file) => ({
            id: file.id,
            file: {
                id: file.id,
                name: file.name,
                size: file.size,
                type: file.type,
            } as unknown as File,
            preview: file.url,
        }),
    );

    const [files, setFiles] = useState<FileWithPreview[]>(
        initialFilesWithPreview,
    );
    const [isDragging, setIsDragging] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragCounterRef = useRef(0);

    const validateFile = useCallback(
        (file: File): string | null => {
            // Check file size
            if (file.size > maxSize) {
                return `${file.name} exceeds maximum size of ${formatBytes(maxSize)}`;
            }

            // Check file type if accept is specified
            if (accept !== '*') {
                const acceptedTypes = accept
                    .split(',')
                    .map((type) => type.trim());
                const fileExtension =
                    '.' + file.name.split('.').pop()?.toLowerCase();
                const mimeType = file.type.toLowerCase();

                const isAccepted = acceptedTypes.some((type) => {
                    if (type.startsWith('.')) {
                        return fileExtension === type.toLowerCase();
                    }
                    if (type.endsWith('/*')) {
                        return mimeType.startsWith(type.slice(0, -2));
                    }
                    return mimeType === type;
                });

                if (!isAccepted) {
                    return `${file.name} is not an accepted file type`;
                }
            }

            return null;
        },
        [maxSize, accept],
    );

    const addFiles = useCallback(
        (newFiles: File[]) => {
            const validationErrors: string[] = [];
            const validFiles: FileWithPreview[] = [];

            // Check if adding files would exceed maxFiles
            if (files.length + newFiles.length > maxFiles) {
                validationErrors.push(`Cannot add more than ${maxFiles} files`);
                setErrors(validationErrors);
                return;
            }

            newFiles.forEach((file) => {
                const error = validateFile(file);
                if (error) {
                    validationErrors.push(error);
                } else {
                    // Check for duplicates
                    const isDuplicate = files.some(
                        (f) =>
                            f.file.name === file.name &&
                            f.file.size === file.size,
                    );
                    if (!isDuplicate) {
                        const fileWithPreview: FileWithPreview = {
                            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            file,
                            preview: file.type.startsWith('image/')
                                ? URL.createObjectURL(file)
                                : undefined,
                        };
                        validFiles.push(fileWithPreview);
                    }
                }
            });

            if (validFiles.length > 0) {
                const updatedFiles = [...files, ...validFiles];
                setFiles(updatedFiles);
                onFilesChange?.(updatedFiles);
            }

            setErrors(validationErrors);

            // Clear errors after 5 seconds
            if (validationErrors.length > 0) {
                setTimeout(() => setErrors([]), 5000);
            }
        },
        [files, maxFiles, validateFile, onFilesChange],
    );

    const removeFile = useCallback(
        (fileId: string) => {
            setFiles((prevFiles) => {
                const fileToRemove = prevFiles.find((f) => f.id === fileId);
                if (
                    fileToRemove?.preview &&
                    fileToRemove.preview.startsWith('blob:')
                ) {
                    URL.revokeObjectURL(fileToRemove.preview);
                }
                const updatedFiles = prevFiles.filter((f) => f.id !== fileId);
                onFilesChange?.(updatedFiles);
                return updatedFiles;
            });
        },
        [onFilesChange],
    );

    const clearFiles = useCallback(() => {
        files.forEach((file) => {
            if (file.preview && file.preview.startsWith('blob:')) {
                URL.revokeObjectURL(file.preview);
            }
        });
        setFiles([]);
        onFilesChange?.([]);
    }, [files, onFilesChange]);

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current++;
        if (dragCounterRef.current === 1) {
            setIsDragging(true);
        }
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounterRef.current--;
        if (dragCounterRef.current === 0) {
            setIsDragging(false);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            dragCounterRef.current = 0;

            const droppedFiles = Array.from(e.dataTransfer.files);
            if (droppedFiles.length > 0) {
                addFiles(droppedFiles);
            }
        },
        [addFiles],
    );

    const openFileDialog = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFiles = Array.from(e.target.files || []);
            if (selectedFiles.length > 0) {
                addFiles(selectedFiles);
            }
            // Reset input value to allow selecting the same file again
            e.target.value = '';
        },
        [addFiles],
    );

    const getInputProps =
        useCallback((): React.InputHTMLAttributes<HTMLInputElement> & {
            ref: React.RefObject<HTMLInputElement | null>;
        } => {
            return {
                ref: fileInputRef,
                type: 'file',
                accept,
                multiple,
                onChange: handleFileInputChange,
            };
        }, [accept, multiple, handleFileInputChange]);

    return [
        { files, isDragging, errors },
        {
            addFiles,
            removeFile,
            clearFiles,
            handleDragEnter,
            handleDragLeave,
            handleDragOver,
            handleDrop,
            openFileDialog,
            getInputProps,
        },
    ];
}
