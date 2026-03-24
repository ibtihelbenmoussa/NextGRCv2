import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';

interface RiskLevel {
    name: string;
    color: string;
    min_score: number;
    max_score: number;
    order: number;
}

interface FormData {
    name: string;
    matrix_dimensions: {
        rows: number;
        columns: number;
    };
    scoring_configuration: {
        number_of_levels: number;
        levels: RiskLevel[];
    };
    metadata: {
        is_custom: boolean;
        preset_used?: string;
    };
    is_active: boolean;
}

const defaultColors = [
    '#22c55e', // Green
    '#eab308', // Yellow
    '#f97316', // Orange
    '#ef4444', // Red
    '#b91c1c', // Dark Red
    '#3b82f6', // Blue
];

const matrixPresets = [
    { name: '3×3', rows: 3, columns: 3 },
    { name: '3×5', rows: 3, columns: 5 },
    { name: '5×5', rows: 5, columns: 5 },
];

export default function CreateRiskMatrix() {
    const [selectedPreset, setSelectedPreset] = useState<string>('3×3');
    const [levelsAreCustomized, setLevelsAreCustomized] = useState(false);
    const [levelsWereEverCustomized, setLevelsWereEverCustomized] = useState(false);
    const [debugData, setDebugData] = useState<any>(null);

    const { data, setData, post, processing, errors } = useForm<FormData>({
        name: '',
        matrix_dimensions: {
            rows: 3,
            columns: 3,
        },
        scoring_configuration: {
            number_of_levels: 3,
            levels: [],
        },
        metadata: {
            is_custom: false,
        },
        is_active: false,
    });

    const maxPossibleScore = data.matrix_dimensions.rows * data.matrix_dimensions.columns;

    const generateDefaultLevels = (numLevels: number, maxScore: number): RiskLevel[] => {
        if (numLevels < 1 || maxScore < 1) return [];

        const levels: RiskLevel[] = [];
        const baseRange = Math.floor(maxScore / numLevels);
        let remainder = maxScore % numLevels;
        let currentMin = 1;

        for (let i = 0; i < numLevels; i++) {
            const extra = remainder > 0 ? 1 : 0;
            const rangeSize = baseRange + extra;
            const currentMax = Math.min(currentMin + rangeSize - 1, maxScore);

            levels.push({
                name: i === 0 ? 'Low' : i === numLevels - 1 ? 'High' : `Level ${i + 1}`,
                color: defaultColors[i % defaultColors.length],
                min_score: currentMin,
                max_score: currentMax,
                order: i + 1,
            });

            currentMin = currentMax + 1;
            if (extra) remainder--;
        }

        return levels;
    };

    
    useEffect(() => {
        if (levelsWereEverCustomized || levelsAreCustomized) return;

        const newLevels = generateDefaultLevels(
            data.scoring_configuration.number_of_levels,
            maxPossibleScore
        );
        setData('scoring_configuration.levels', newLevels);
    }, [
        maxPossibleScore,
        data.scoring_configuration.number_of_levels,
        levelsWereEverCustomized,
        levelsAreCustomized,
    ]);

    const handlePresetChange = (presetName: string) => {
        setSelectedPreset(presetName);
        setLevelsAreCustomized(false);

        const preset = matrixPresets.find((p) => p.name === presetName);
        if (preset) {
            setData((prev) => ({
                ...prev,
                matrix_dimensions: {
                    rows: preset.rows,
                    columns: preset.columns,
                },
                metadata: {
                    ...prev.metadata,
                    is_custom: false,
                    preset_used: presetName,
                },
            }));
        }
    };

    const handleLevelsCountChange = (value: string) => {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 2 || num > 6) return;

        setLevelsAreCustomized(false);
        setData('scoring_configuration.number_of_levels', num);
    };

    const updateLevel = (index: number, field: keyof RiskLevel, value: string | number) => {
       
        if (!levelsWereEverCustomized) {
            setLevelsWereEverCustomized(true);
        }
        setLevelsAreCustomized(true);

        const newLevels = [...data.scoring_configuration.levels];
        const parsedValue =
            field === 'min_score' || field === 'max_score' || field === 'order'
                ? Number(value)
                : value;

        newLevels[index] = {
            ...newLevels[index],
            [field]: parsedValue,
        };

        setData('scoring_configuration.levels', newLevels);
    };

    const handleDimensionChange = (field: 'rows' | 'columns', valueStr: string) => {
        const value = parseInt(valueStr, 10);
        if (isNaN(value) || value < 2 || value > 10) return;

        const newDimensions = {
            ...data.matrix_dimensions,
            [field]: value,
        };

        const isPreset = matrixPresets.some(
            (p) => p.rows === newDimensions.rows && p.columns === newDimensions.columns
        );

        const newPresetName = isPreset
            ? matrixPresets.find((p) => p.rows === newDimensions.rows && p.columns === newDimensions.columns)?.name
            : 'custom';

        setSelectedPreset(newPresetName || 'custom');
        setLevelsAreCustomized(false);

        setData((prev) => ({
            ...prev,
            matrix_dimensions: newDimensions,
            metadata: {
                ...prev.metadata,
                is_custom: !isPreset,
                preset_used: newPresetName,
            },
        }));
    };

    const resetToAutoCalculated = () => {
        setLevelsAreCustomized(false);
        setLevelsWereEverCustomized(false);
        // useEffect va régénérer automatiquement
    };

    const hasValidScoreRanges = () => {
        const levels = data.scoring_configuration.levels;
        if (levels.length === 0) return false;

        let prevMax = 0;
        for (const level of levels) {
            if (level.min_score <= prevMax) return false;
            if (level.max_score < level.min_score) return false;
            if (!Number.isInteger(level.min_score) || !Number.isInteger(level.max_score)) return false;
            prevMax = level.max_score;
        }

        return prevMax >= maxPossibleScore && (levels[0]?.min_score ?? 999) <= 1;
    };

    const getPayloadForBackend = () => {
        return {
            ...data,
            matrix_dimensions: {
                rows: Number(data.matrix_dimensions.rows),
                columns: Number(data.matrix_dimensions.columns),
            },
            scoring_configuration: {
                number_of_levels: Number(data.scoring_configuration.number_of_levels),
                levels: data.scoring_configuration.levels.map((level) => ({
                    name: level.name.trim(),
                    min_score: Number(level.min_score),
                    max_score: Number(level.max_score),
                    color: level.color,
                    order: Number(level.order),
                })),
            },
            metadata: {
                ...data.metadata,
            },
        };
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!hasValidScoreRanges()) {
            alert(
                `Les plages de scores sont invalides.\n` +
                `Vérifiez qu'il n'y a pas de chevauchement, que le score commence à 1\n` +
                `et que le score maximum (${maxPossibleScore}) est couvert.`
            );
            return;
        }

        const payload = getPayloadForBackend();
        console.log('Payload envoyé :', JSON.stringify(payload, null, 2));
        setDebugData(payload);

        post('/risks/matrix', {
            onError: (err) => {
                console.error('Erreur Inertia :', err);
            },
        });
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Risks', href: '/risks' },
                { title: 'Matrix Configurations', href: '/risks/matrix' },
                { title: 'Create', href: '/risks/matrix/create' },
            ]}
        >
            <Head title="Create Risk Matrix Configuration" />

            <div className="space-y-6 max-w-5xl mx-auto">
                <div className="flex items-center space-x-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href="/risks/matrix">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold">Create Risk Matrix</h1>
                        <p className="mt-1 text-sm text-gray-600">
                            Configurez une nouvelle matrice d'évaluation des risques
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Informations de base */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations de base</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nom de la configuration</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Ex : Matrice standard 5×5"
                                />
                                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', !!checked)}
                                />
                                <Label htmlFor="is_active">Définir comme configuration active</Label>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Dimensions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Dimensions de la matrice</CardTitle>
                            <CardDescription>
                                Probabilité (lignes) × Gravité (colonnes)
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Prédéfini</Label>
                                <Select value={selectedPreset} onValueChange={handlePresetChange}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {matrixPresets.map((p) => (
                                            <SelectItem key={p.name} value={p.name}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                        {selectedPreset === 'custom' && (
                                            <SelectItem value="custom" disabled>
                                                Personnalisé
                                            </SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="rows">Lignes (Probabilité)</Label>
                                    <Input
                                        id="rows"
                                        type="number"
                                        min={2}
                                        max={10}
                                        value={data.matrix_dimensions.rows}
                                        onChange={(e) => handleDimensionChange('rows', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="columns">Colonnes (Gravité)</Label>
                                    <Input
                                        id="columns"
                                        type="number"
                                        min={2}
                                        max={10}
                                        value={data.matrix_dimensions.columns}
                                        onChange={(e) => handleDimensionChange('columns', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="text-sm font-medium">
                                Score maximum possible : <span className="text-lg">{maxPossibleScore}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Niveaux de risque */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Niveaux de risque</CardTitle>
                            <CardDescription>
                                Les valeurs sont recalculées automatiquement seulement si vous n'avez jamais modifié manuellement les plages.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-end gap-6 flex-wrap">
                                <div className="space-y-2">
                                    <Label>Nombre de niveaux</Label>
                                    <Select
                                        value={data.scoring_configuration.number_of_levels.toString()}
                                        onValueChange={handleLevelsCountChange}
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {[2, 3, 4, 5, 6].map((n) => (
                                                <SelectItem key={n} value={n.toString()}>
                                                    {n} niveaux
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={resetToAutoCalculated}
                                    className="flex items-center gap-1"
                                >
                                    <RotateCcw className="h-4 w-4" />
                                    Reset auto
                                </Button>

                                <div className="text-sm text-muted-foreground">
                                    Score maximum : {maxPossibleScore}
                                </div>
                            </div>

                            <div className="space-y-5">
                                {data.scoring_configuration.levels.map((level, idx) => (
                                    <div
                                        key={idx}
                                        className="border rounded-lg p-5 bg-slate-50/70 dark:bg-slate-900/30"
                                    >
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                            <div className="space-y-1.5">
                                                <Label>Nom / Label</Label>
                                                <Input
                                                    value={level.name}
                                                    onChange={(e) => updateLevel(idx, 'name', e.target.value)}
                                                    placeholder="Ex : Faible, Moyen, Critique..."
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label>Couleur</Label>
                                                <div className="flex gap-2 items-center">
                                                    <input
                                                        type="color"
                                                        value={level.color}
                                                        onChange={(e) => updateLevel(idx, 'color', e.target.value)}
                                                        className="w-10 h-10 rounded border"
                                                    />
                                                    <Input
                                                        value={level.color}
                                                        onChange={(e) => updateLevel(idx, 'color', e.target.value)}
                                                        className="font-mono"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label>Score minimum</Label>
                                                <Input
                                                    type="number"
                                                    min={1}
                                                    value={level.min_score}
                                                    onChange={(e) => updateLevel(idx, 'min_score', e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-1.5">
                                                <Label>Score maximum</Label>
                                                <Input
                                                    type="number"
                                                    min={level.min_score}
                                                    value={level.max_score}
                                                    onChange={(e) => updateLevel(idx, 'max_score', e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {!hasValidScoreRanges() && (
                                <p className="text-red-600 text-sm font-medium bg-red-50 dark:bg-red-950/30 p-3 rounded">
                                    Les plages sont invalides : chevauchement, trou, ne commence pas à 1
                                    ou ne couvre pas le score maximum ({maxPossibleScore}).
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                const payload = getPayloadForBackend();
                                console.log(payload);
                                setDebugData(payload);
                            }}
                        >
                            Voir payload (console)
                        </Button>

                        <div className="flex gap-4">
                            <Button variant="outline" asChild>
                                <Link href="/risks/matrix">Annuler</Link>
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || !hasValidScoreRanges() || !data.name?.trim()}
                            >
                                {processing ? 'Création...' : 'Créer la matrice'}
                            </Button>
                        </div>
                    </div>

                    {debugData && (
                        <Card className="mt-8">
                            <CardHeader>
                                <CardTitle>Données envoyées (debug)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <pre className="text-xs bg-slate-900 text-slate-100 p-4 rounded overflow-auto max-h-96">
                                    {JSON.stringify(debugData, null, 2)}
                                </pre>
                            </CardContent>
                        </Card>
                    )}
                </form>
            </div>
        </AppLayout>
    );
}