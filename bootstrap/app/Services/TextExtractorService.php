<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Smalot\PdfParser\Parser as PdfParser;
use PhpOffice\PhpWord\IOFactory as WordFactory;
use PhpOffice\PhpSpreadsheet\IOFactory as SpreadsheetFactory;

class TextExtractorService
{
    public function extract(UploadedFile $file): string
    {
        $extension = strtolower($file->getClientOriginalExtension());

        return match ($extension) {
            'pdf'         => $this->extractPdf($file),
            'doc', 'docx' => $this->extractWord($file),
            'xls', 'xlsx' => $this->extractExcel($file),
            default       => throw new \InvalidArgumentException("Format non supporté : {$extension}"),
        };
    }

    private function extractPdf(UploadedFile $file): string
    {
        $path = $file->getPathname();

        // Attempt 1: smalot/pdfparser (no binary needed, works everywhere)
        try {
            $parser = new PdfParser();
            $pdf    = $parser->parseFile($path);
            $pages  = $pdf->getPages();
            $lines  = [];

            foreach ($pages as $page) {
                try {
                    $lines[] = $page->getText();
                } catch (\Throwable $e) {
                    continue;
                }
            }

            $text = implode("\n", $lines);
            $text = preg_replace('/[ \t]+/', ' ', $text);
            $text = preg_replace('/\n{3,}/', "\n\n", $text);
            $text = trim($text);

            if (strlen($text) > 100) {
                \Log::info('PDF extracted via smalot', ['chars' => strlen($text)]);
                return $text;
            }
        } catch (\Throwable $e) {
            \Log::warning('PdfParser (smalot) failed: ' . $e->getMessage());
        }

        // Attempt 2: spatie/pdf-to-text (needs pdftotext binary)
        try {
            $binaryPath = env('PDFTOTEXT_PATH', 'pdftotext');
            $pdf        = new \Spatie\PdfToText\Pdf($binaryPath);
            $text       = $pdf->setPdf($path)->text();
            $text       = preg_replace('/[ \t]+/', ' ', $text);
            $text       = preg_replace('/\n{3,}/', "\n\n", $text);
            $text       = trim($text);

            if (strlen($text) > 100) {
                \Log::info('PDF extracted via spatie', ['chars' => strlen($text)]);
                return $text;
            }
        } catch (\Throwable $e) {
            \Log::warning('Spatie PdfToText failed: ' . $e->getMessage());
        }

        throw new \RuntimeException(
            'Could not extract text from PDF. Try uploading a text-based PDF.'
        );
    }

    private function extractWord(UploadedFile $file): string
    {
        try {
            $phpWord = WordFactory::load($file->getPathname());
            $lines   = [];

            foreach ($phpWord->getSections() as $section) {
                foreach ($section->getElements() as $element) {
                    if (method_exists($element, 'getText')) {
                        $lines[] = $element->getText();
                    } elseif (method_exists($element, 'getElements')) {
                        foreach ($element->getElements() as $child) {
                            if (method_exists($child, 'getText')) {
                                $lines[] = $child->getText();
                            }
                        }
                    }
                }
            }

            $text = trim(implode("\n", array_filter($lines)));

            if (strlen($text) < 10) {
                throw new \RuntimeException('Word file appears to be empty');
            }

            return $text;
        } catch (\Throwable $e) {
            throw new \RuntimeException('Could not read Word file: ' . $e->getMessage());
        }
    }

    private function extractExcel(UploadedFile $file): string
    {
        ini_set('memory_limit', '512M');

        try {
            $spreadsheet = SpreadsheetFactory::load($file->getPathname());
            $lines       = [];

            foreach ($spreadsheet->getWorksheetIterator() as $worksheet) {
                $lines[] = "=== Sheet: " . $worksheet->getTitle() . " ===";

                foreach ($worksheet->getRowIterator() as $row) {
                    $cells        = [];
                    $cellIterator = $row->getCellIterator();
                    $cellIterator->setIterateOnlyExistingCells(true);

                    foreach ($cellIterator as $cell) {
                        $val = $cell->getFormattedValue();
                        if ($val !== null && trim($val) !== '') {
                            $cells[] = trim($val);
                        }
                    }

                    if (!empty($cells)) {
                        $lines[] = implode(' | ', $cells);
                    }
                }
            }

            $result = trim(implode("\n", $lines));

            if (strlen($result) < 10) {
                throw new \RuntimeException('Excel file appears to be empty');
            }

            return $result;
        } catch (\Throwable $e) {
            \Log::error('Excel extraction failed: ' . $e->getMessage());
            throw new \RuntimeException('Could not read Excel file: ' . $e->getMessage());
        }
    }
}