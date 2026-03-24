<?php

use App\Models\BusinessUnit;
use App\Models\Document;
use App\Models\MacroProcess;
use App\Models\Process;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
    $this->user = User::factory()->create();
    $this->actingAs($this->user);
});

describe('Document Upload', function () {
    it('can upload a document to a business unit', function () {
        $businessUnit = BusinessUnit::factory()->create();
        $file = UploadedFile::fake()->create('test-document.pdf', 100);

        $document = $businessUnit->addDocument($file, [
            'category' => 'policy',
            'description' => 'Test policy document',
        ]);

        expect($document)->toBeInstanceOf(Document::class)
            ->and($document->name)->toBe('test-document.pdf')
            ->and($document->category)->toBe('policy')
            ->and($document->description)->toBe('Test policy document')
            ->and($document->uploaded_by)->toBe($this->user->id)
            ->and($businessUnit->documents)->toHaveCount(1);

        Storage::disk('local')->assertExists($document->file_path);
    });

    it('can upload a document to a macro process', function () {
        $macroProcess = MacroProcess::factory()->create();
        $file = UploadedFile::fake()->create('procedure.docx', 200);

        $document = $macroProcess->addDocument($file);

        expect($document->name)->toBe('procedure.docx')
            ->and($macroProcess->documents)->toHaveCount(1);
    });

    it('can upload a document to a process', function () {
        $process = Process::factory()->create();
        $file = UploadedFile::fake()->image('flowchart.png');

        $document = $process->addDocument($file, [
            'category' => 'diagram',
        ]);

        expect($document->name)->toBe('flowchart.png')
            ->and($document->category)->toBe('diagram')
            ->and($document->isImage())->toBeTrue();
    });

    it('stores file with correct metadata', function () {
        $businessUnit = BusinessUnit::factory()->create();
        $file = UploadedFile::fake()->create('report.pdf', 1024);

        $document = $businessUnit->addDocument($file);

        expect($document->mime_type)->toBe('application/pdf')
            ->and($document->file_size)->toBe(1024 * 1024) // 1MB in bytes
            ->and($document->disk)->toBe('local')
            ->and($document->file_name)->toContain('.pdf');
    });
});

describe('Document Retrieval', function () {
    it('can retrieve all documents for an entity', function () {
        $businessUnit = BusinessUnit::factory()->create();

        $businessUnit->addDocument(UploadedFile::fake()->create('doc1.pdf', 100));
        $businessUnit->addDocument(UploadedFile::fake()->create('doc2.pdf', 100));
        $businessUnit->addDocument(UploadedFile::fake()->create('doc3.pdf', 100));

        expect($businessUnit->documents)->toHaveCount(3);
    });

    it('can retrieve documents by category', function () {
        $businessUnit = BusinessUnit::factory()->create();

        $businessUnit->addDocument(
            UploadedFile::fake()->create('policy1.pdf', 100),
            ['category' => 'policy']
        );
        $businessUnit->addDocument(
            UploadedFile::fake()->create('policy2.pdf', 100),
            ['category' => 'policy']
        );
        $businessUnit->addDocument(
            UploadedFile::fake()->create('procedure1.pdf', 100),
            ['category' => 'procedure']
        );

        $policies = $businessUnit->getDocumentsByCategory('policy');

        expect($policies)->toHaveCount(2)
            ->each->category->toBe('policy');
    });

    it('can check if entity has documents', function () {
        $businessUnit = BusinessUnit::factory()->create();

        expect($businessUnit->hasDocuments())->toBeFalse();

        $businessUnit->addDocument(UploadedFile::fake()->create('test.pdf', 100));

        expect($businessUnit->hasDocuments())->toBeTrue();
    });

    it('can calculate total documents size', function () {
        $businessUnit = BusinessUnit::factory()->create();

        $businessUnit->addDocument(UploadedFile::fake()->create('doc1.pdf', 100)); // 100KB
        $businessUnit->addDocument(UploadedFile::fake()->create('doc2.pdf', 200)); // 200KB

        $totalSize = $businessUnit->getTotalDocumentsSize();

        expect($totalSize)->toBe(300 * 1024); // 300KB in bytes
    });
});

describe('Document Deletion', function () {
    it('soft deletes document without removing file', function () {
        $businessUnit = BusinessUnit::factory()->create();
        $document = $businessUnit->addDocument(
            UploadedFile::fake()->create('test.pdf', 100)
        );

        $filePath = $document->file_path;
        Storage::disk('local')->assertExists($filePath);

        $document->delete();

        expect($document->trashed())->toBeTrue();
        Storage::disk('local')->assertExists($filePath); // File still exists
    });

    it('force deletes document and removes file from storage', function () {
        $businessUnit = BusinessUnit::factory()->create();
        $document = $businessUnit->addDocument(
            UploadedFile::fake()->create('test.pdf', 100)
        );

        $filePath = $document->file_path;
        Storage::disk('local')->assertExists($filePath);

        $document->forceDelete();

        Storage::disk('local')->assertMissing($filePath);
        expect(Document::find($document->id))->toBeNull();
    });

    it('can delete all documents for an entity', function () {
        $businessUnit = BusinessUnit::factory()->create();

        $doc1 = $businessUnit->addDocument(UploadedFile::fake()->create('doc1.pdf', 100));
        $doc2 = $businessUnit->addDocument(UploadedFile::fake()->create('doc2.pdf', 100));

        $path1 = $doc1->file_path;
        $path2 = $doc2->file_path;

        $businessUnit->deleteAllDocuments();

        Storage::disk('local')->assertMissing($path1);
        Storage::disk('local')->assertMissing($path2);
        expect($businessUnit->documents)->toHaveCount(0);
    });
});

describe('Document File Properties', function () {
    it('can detect image files', function () {
        $businessUnit = BusinessUnit::factory()->create();
        $document = $businessUnit->addDocument(
            UploadedFile::fake()->image('photo.jpg')
        );

        expect($document->isImage())->toBeTrue()
            ->and($document->isPdf())->toBeFalse();
    });

    it('can detect PDF files', function () {
        $businessUnit = BusinessUnit::factory()->create();
        $document = $businessUnit->addDocument(
            UploadedFile::fake()->create('document.pdf', 100)
        );

        expect($document->isPdf())->toBeTrue()
            ->and($document->isImage())->toBeFalse();
    });

    it('generates human readable file size', function () {
        $businessUnit = BusinessUnit::factory()->create();

        // 1MB file
        $document = $businessUnit->addDocument(
            UploadedFile::fake()->create('test.pdf', 1024)
        );

        expect($document->human_file_size)->toContain('MB');
    });
});

describe('Polymorphic Relationships', function () {
    it('correctly associates documents with different entity types', function () {
        $businessUnit = BusinessUnit::factory()->create();
        $macroProcess = MacroProcess::factory()->create();
        $process = Process::factory()->create();

        $buDoc = $businessUnit->addDocument(UploadedFile::fake()->create('bu.pdf', 100));
        $mpDoc = $macroProcess->addDocument(UploadedFile::fake()->create('mp.pdf', 100));
        $pDoc = $process->addDocument(UploadedFile::fake()->create('p.pdf', 100));

        expect($buDoc->documentable)->toBeInstanceOf(BusinessUnit::class)
            ->and($mpDoc->documentable)->toBeInstanceOf(MacroProcess::class)
            ->and($pDoc->documentable)->toBeInstanceOf(Process::class);
    });

    it('stores files in separate directories by entity type', function () {
        $businessUnit = BusinessUnit::factory()->create();
        $macroProcess = MacroProcess::factory()->create();

        $buDoc = $businessUnit->addDocument(UploadedFile::fake()->create('bu.pdf', 100));
        $mpDoc = $macroProcess->addDocument(UploadedFile::fake()->create('mp.pdf', 100));

        expect($buDoc->file_path)->toContain('BusinessUnit')
            ->and($mpDoc->file_path)->toContain('MacroProcess');
    });
});

describe('Document Upload Tracking', function () {
    it('tracks who uploaded the document', function () {
        $businessUnit = BusinessUnit::factory()->create();
        $document = $businessUnit->addDocument(
            UploadedFile::fake()->create('test.pdf', 100)
        );

        expect($document->uploaded_by)->toBe($this->user->id)
            ->and($document->uploadedBy)->toBeInstanceOf(User::class)
            ->and($document->uploadedBy->id)->toBe($this->user->id);
    });
});
