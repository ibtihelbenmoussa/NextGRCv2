import { router } from '@inertiajs/react';
import { useState } from 'react';

/**
 * Example React component for uploading documents
 * This demonstrates how to integrate the document system with your Inertia.js frontend
 */

interface Document {
    id: number;
    name: string;
    file_size: string;
    mime_type: string;
    category: string | null;
    description: string | null;
    uploaded_by: string;
    uploaded_at: string;
    is_image: boolean;
    is_pdf: boolean;
}

interface DocumentUploadProps {
    entityType: 'business-units' | 'macro-processes' | 'processes';
    entityId: number;
    documents: Document[];
}

export default function DocumentUpload({
    entityType,
    entityId,
    documents: initialDocuments,
}: DocumentUploadProps) {
    const [documents, setDocuments] = useState<Document[]>(initialDocuments);
    const [uploading, setUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedFile) return;

        setUploading(true);

        const formData = new FormData();
        formData.append('document', selectedFile);
        if (category) formData.append('category', category);
        if (description) formData.append('description', description);

        router.post(`/${entityType}/${entityId}/documents`, formData, {
            preserveScroll: true,
            onSuccess: (page) => {
                // Refresh the documents list
                setSelectedFile(null);
                setCategory('');
                setDescription('');
                setUploading(false);

                // You can also show a success message here
                alert('Document uploaded successfully!');
            },
            onError: (errors) => {
                setUploading(false);
                console.error('Upload failed:', errors);
                alert('Failed to upload document');
            },
        });
    };

    const handleDownload = (documentId: number) => {
        window.location.href = `/documents/${documentId}/download`;
    };

    const handleDelete = (documentId: number) => {
        if (!confirm('Are you sure you want to delete this document?')) {
            return;
        }

        router.delete(`/documents/${documentId}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDocuments(documents.filter((doc) => doc.id !== documentId));
                alert('Document deleted successfully!');
            },
            onError: () => {
                alert('Failed to delete document');
            },
        });
    };

    return (
        <div className="space-y-6">
            {/* Upload Form */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h3 className="mb-4 text-lg font-semibold">Upload Document</h3>
                <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            File
                        </label>
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                            disabled={uploading}
                            required
                        />
                        {selectedFile && (
                            <p className="mt-1 text-sm text-gray-500">
                                Selected: {selectedFile.name} (
                                {(selectedFile.size / 1024 / 1024).toFixed(2)}{' '}
                                MB)
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Category (Optional)
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                            disabled={uploading}
                        >
                            <option value="">Select a category...</option>
                            <option value="policy">Policy</option>
                            <option value="procedure">Procedure</option>
                            <option value="evidence">Evidence</option>
                            <option value="report">Report</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Description (Optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                            rows={3}
                            disabled={uploading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!selectedFile || uploading}
                        className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {uploading ? 'Uploading...' : 'Upload Document'}
                    </button>
                </form>
            </div>

            {/* Documents List */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
                <h3 className="mb-4 text-lg font-semibold">
                    Documents ({documents.length})
                </h3>

                {documents.length === 0 ? (
                    <p className="text-gray-500">No documents uploaded yet.</p>
                ) : (
                    <div className="space-y-2">
                        {documents.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center justify-between rounded border border-gray-200 p-3 hover:bg-gray-50"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        {/* File icon based on type */}
                                        {doc.is_image && (
                                            <span className="text-blue-500">
                                                🖼️
                                            </span>
                                        )}
                                        {doc.is_pdf && (
                                            <span className="text-red-500">
                                                📄
                                            </span>
                                        )}
                                        {!doc.is_image && !doc.is_pdf && (
                                            <span className="text-gray-500">
                                                📎
                                            </span>
                                        )}

                                        <div>
                                            <p className="font-medium">
                                                {doc.name}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {doc.file_size}
                                                {doc.category && (
                                                    <> • {doc.category}</>
                                                )}
                                                {' • '}
                                                Uploaded by {
                                                    doc.uploaded_by
                                                } on {doc.uploaded_at}
                                            </p>
                                            {doc.description && (
                                                <p className="text-sm text-gray-600">
                                                    {doc.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleDownload(doc.id)}
                                        className="rounded bg-blue-100 px-3 py-1 text-sm text-blue-700 hover:bg-blue-200"
                                    >
                                        Download
                                    </button>
                                    <button
                                        onClick={() => handleDelete(doc.id)}
                                        className="rounded bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * Example usage in a page component:
 *
 * import DocumentUpload from '@/components/document-upload';
 *
 * export default function BusinessUnitShow({ businessUnit, documents }) {
 *     return (
 *         <div>
 *             <h1>{businessUnit.name}</h1>
 *
 *             <DocumentUpload
 *                 entityType="business-units"
 *                 entityId={businessUnit.id}
 *                 documents={documents}
 *             />
 *         </div>
 *     );
 * }
 */
