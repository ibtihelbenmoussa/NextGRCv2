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
        $parser = new PdfParser();
        $pdf    = $parser->parseFile($file->getPathname());
        $text   = $pdf->getText();
        $text   = preg_replace('/[ \t]+/', ' ', $text);
        $text   = preg_replace('/\n{3,}/', "\n\n", $text);
        return trim($text);
    }

    private function extractWord(UploadedFile $file): string
    {
        $phpWord  = WordFactory::load($file->getPathname());
        $sections = $phpWord->getSections();
        $lines    = [];

        foreach ($sections as $section) {
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

        return trim(implode("\n", array_filter($lines)));
    }

    private function extractExcel(UploadedFile $file): string
    {
        $spreadsheet = SpreadsheetFactory::load($file->getPathname());
        $lines       = [];

        foreach ($spreadsheet->getWorksheetIterator() as $worksheet) {
            $lines[] = "=== Sheet: " . $worksheet->getTitle() . " ===";
            foreach ($worksheet->getRowIterator() as $row) {
                $cells = [];
                foreach ($row->getCellIterator() as $cell) {
                    $val = $cell->getValue();
                    if ($val !== null && $val !== '') {
                        $cells[] = $val;
                    }
                }
                if (!empty($cells)) {
                    $lines[] = implode(' | ', $cells);
                }
            }
        }

        return trim(implode("\n", $lines));
    }
}