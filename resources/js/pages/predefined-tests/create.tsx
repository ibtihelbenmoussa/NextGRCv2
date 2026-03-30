import AppLayout from '@/layouts/app-layout'
import { Head, Link, router, useForm } from '@inertiajs/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { ChevronLeft, FileText } from 'lucide-react'
import React, { useEffect, useMemo, useState } from 'react'
import { Editor } from '@tinymce/tinymce-react'

export default function CreatePredefinedTest() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        code: '',
        test_objective: '',
        test_result: '',
        risk: '',
        echantillon: '',
        is_active: true,
    })

    const submit = (e: React.FormEvent) => {
        e.preventDefault()
        post('/predefined-tests')
    }

    const [isDark, setIsDark] = useState(false)

    useEffect(() => {
        const updateTheme = () => {
            setIsDark(document.documentElement.classList.contains('dark'))
        }

        updateTheme()

        const observer = new MutationObserver(updateTheme)
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        })

        return () => observer.disconnect()
    }, [])

    const tinymceConfig = useMemo(() => ({
        height: 400,
        menubar: true,
        branding: false,
        promotion: false,

        skin: isDark ? 'oxide-dark' : 'oxide',
        content_css: isDark ? 'dark' : 'default',

        plugins: [
            'anchor',
            'autolink',
            'charmap',
            'codesample',
            'emoticons',
            'link',
            'lists',
            'media',
            'searchreplace',
            'table',
            'visualblocks',
            'wordcount',
            'textcolor' 
        ],

        toolbar:
            'undo redo | blocks fontfamily fontsize | ' +
            'bold italic underline strikethrough | ' +
            'forecolor backcolor | ' +   
            'link media table | ' +
            'alignleft aligncenter alignright alignjustify | ' +
            'bullist numlist indent outdent | ' +
            'emoticons charmap | removeformat',

        color_map: [
            '000000', 'Black',
            'FF0000', 'Red',
            'FFA500', 'Orange',
            'FFFF00', 'Yellow',
            '008000', 'Green',
            '0000FF', 'Blue',
            '800080', 'Purple',
            'FFFFFF', 'White'
        ],

        content_style: `
        body {
            font-family: Inter, sans-serif;
            font-size: 14px;
            background: ${isDark ? '#0f172a' : '#ffffff'};
            color: ${isDark ? '#f1f5f9' : '#0f172a'};
        }
    `
    }), [isDark])

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Predefined Tests', href: '/predefined-tests' },
                { title: 'Create', href: '/predefined-tests/create' },
            ]}
        >
            <Head title="Create Predefined Test" />

            <div className="space-y-6 p-4 max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            Create Predefined Test
                        </h1>
                        <p className="text-muted-foreground">
                            Define a predefined audit/control test template
                        </p>
                    </div>

                    <Button variant="outline" asChild>
                        <Link href="/predefined-tests">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                </div>

                <form onSubmit={submit} className="space-y-6">

                    <Card>
                        <CardHeader className="flex flex-row items-center gap-2">
                            <FileText className="h-5 w-5" />
                            <CardTitle>Test Details</CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-6">

                            {/* Test Name */}
                            <div className="space-y-2">
                                <Label>Test Name <span className="text-destructive">*</span></Label>
                                <Input
                                    placeholder="Test name..."
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name}</p>
                                )}
                            </div>

                            {/* Code */}
                            <div className="space-y-2">
                                <Label>Test Code <span className="text-destructive">*</span></Label>
                                <Input
                                    placeholder="TEST-001"

                                    value={data.code}
                                    onChange={(e) =>
                                        setData('code', e.target.value.toUpperCase())
                                    }
                                />
                                {errors.code && (
                                    <p className="text-sm text-destructive">{errors.code}</p>
                                )}
                            </div>

                            {/* Objective */}
                            <div className="space-y-2">
                                <Label>Test Objective <span className="text-destructive">*</span></Label>
                                <Input

                                    placeholder="Describe the objective of this test..."
                                    value={data.test_objective}
                                    onChange={(e) =>
                                        setData('test_objective', e.target.value)
                                    }
                                />
                                {errors.test_objective && (
                                    <p className="text-sm text-destructive">
                                        {errors.test_objective}
                                    </p>
                                )}
                            </div>

                            {/* Expected Result */}
                            <div className="space-y-2">
                                <Label>Expected Result <span className="text-destructive">*</span></Label>
                                <Editor
                                    key={`result-${isDark}`}
                                    apiKey="i8enuw9h67be6mg8ofdpfyh7kvjwxyf86knhotppfotjlhd0"
                                    value={data.test_result}
                                    init={tinymceConfig}
                                    onEditorChange={(content) =>
                                        setData('test_result', content)
                                    }
                                />
                                {errors.test_result && (
                                    <p className="text-sm text-destructive">
                                        {errors.test_result}
                                    </p>
                                )}
                            </div>

                            {/* Risk */}
                            <div className="space-y-2">
                                <Label>Related Risk <span className="text-destructive">*</span></Label>
                                <Editor
                                    key={`risk-${isDark}`}
                                    apiKey="i8enuw9h67be6mg8ofdpfyh7kvjwxyf86knhotppfotjlhd0"
                                    value={data.risk}
                                    init={tinymceConfig}
                                    onEditorChange={(content) =>
                                        setData('risk', content)
                                    }
                                />
                                {errors.risk && (
                                    <p className="text-sm text-destructive">
                                        {errors.risk}
                                    </p>
                                )}
                            </div>

                            {/* Sample */}
                            <div className="space-y-2">
                                <Label>Sample (Echantillon) <span className="text-destructive">*</span></Label>
                                <Editor
                                    key={`sample-${isDark}`}
                                    apiKey="i8enuw9h67be6mg8ofdpfyh7kvjwxyf86knhotppfotjlhd0"
                                    value={data.echantillon}
                                    init={tinymceConfig}
                                    onEditorChange={(content) =>
                                        setData('echantillon', content)
                                    }
                                />
                                {errors.echantillon && (
                                    <p className="text-sm text-destructive">
                                        {errors.echantillon}
                                    </p>
                                )}
                            </div>

                            {/* Active Switch */}
                            <div className="flex items-center justify-between border rounded-lg p-4">
                                <div>
                                    <Label>Active Status</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enable or disable this predefined test
                                    </p>
                                </div>
                                <Switch
                                    checked={data.is_active}
                                    onCheckedChange={(checked) =>
                                        setData('is_active', checked)
                                    }
                                />
                            </div>

                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/predefined-tests')}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Test'}
                        </Button>
                    </div>

                </form>
            </div>
        </AppLayout>
    )
}