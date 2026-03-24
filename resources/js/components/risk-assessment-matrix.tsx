'use client';

import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import RiskMatrixCanvas from '@/components/risk-matrix-canvas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import FastColorPicker from '@/components/ui/fast-color-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import { Transition } from '@headlessui/react';
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

interface RiskLevel {
    id?: number;
    name: string;
    color: string;
    min_score: number;
    max_score: number;
    order: number;
}

interface RiskMatrixConfiguration {
    id?: number;
    name: string;
    matrix_dimensions: {
        rows: number;
        columns: number;
        max_score: number;
    };
    scoring_configuration: {
        number_of_levels: number;
        levels: RiskLevel[];
    };
    metadata: {
        is_active?: boolean;
        is_custom: boolean;
        preset_used?: string | null;
        created_at?: string;
        updated_at?: string;
    };
}

export function RiskMatrix({
    initialConfiguration,
    onConfigurationSaved,
}: {
    initialConfiguration?: RiskMatrixConfiguration;
    onConfigurationSaved?: (configuration: RiskMatrixConfiguration) => void;
}) {
    const [configuration, setConfiguration] =
        useState<RiskMatrixConfiguration | null>(initialConfiguration || null);
    const [rows, setRows] = useState(
        initialConfiguration?.matrix_dimensions.rows || 5,
    );
    const [columns, setColumns] = useState(
        initialConfiguration?.matrix_dimensions.columns || 5,
    );
    const [scoreScale, setScoreScale] = useState(
        initialConfiguration?.scoring_configuration.number_of_levels || 4,
    );
    const [customLevels, setCustomLevels] = useState<RiskLevel[] | undefined>(
        initialConfiguration?.scoring_configuration.levels || undefined,
    );
    const [editMode, setEditMode] = useState(false);
    const [isModified, setIsModified] = useState(!initialConfiguration);
    const [isSaving, setIsSaving] = useState(false);
    const [recentlySaved, setRecentlySaved] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const maxScore = rows * columns;

    // Initialize and update configuration from props
    useEffect(() => {
        if (initialConfiguration) {
            setConfiguration(initialConfiguration);
            setRows(initialConfiguration.matrix_dimensions.rows);
            setColumns(initialConfiguration.matrix_dimensions.columns);
            setScoreScale(
                initialConfiguration.scoring_configuration.number_of_levels,
            );
            setCustomLevels(initialConfiguration.scoring_configuration.levels);
            // Reset modification state when new config is loaded
            setIsModified(false);
            setErrors({});
        }
    }, [initialConfiguration]);

    const generateDefaultLevels = (numLevels: number): RiskLevel[] => {
        /**
         * Dynamic color assignment based on number of active levels
         *
         * Color schemes:
         * - 3 levels: Green, Yellow, Red
         * - 4 levels: Green, Yellow, Orange, Red
         * - 5+ levels: Gradual progression from Green to Dark Red
         *
         * This ensures proper visual distinction and intuitive risk perception
         * regardless of the number of configured risk levels.
         */
        const getColorsForLevels = (numLevels: number): string[] => {
            switch (numLevels) {
                case 3:
                    return ['#22c55e', '#eab308', '#ef4444']; // Green, Yellow, Red
                case 4:
                    return ['#22c55e', '#eab308', '#f97316', '#ef4444']; // Green, Yellow, Orange, Red
                case 5:
                    return [
                        '#22c55e',
                        '#84cc16',
                        '#eab308',
                        '#f97316',
                        '#ef4444',
                    ]; // Green, Light Green, Yellow, Orange, Red
                case 6:
                    return [
                        '#22c55e',
                        '#84cc16',
                        '#eab308',
                        '#f97316',
                        '#ef4444',
                        '#dc2626',
                    ]; // Green, Light Green, Yellow, Orange, Red, Dark Red
                case 7:
                    return [
                        '#22c55e',
                        '#84cc16',
                        '#eab308',
                        '#f97316',
                        '#ef4444',
                        '#dc2626',
                        '#b91c1c',
                    ]; // Green to Dark Red progression
                case 8:
                    return [
                        '#22c55e',
                        '#84cc16',
                        '#eab308',
                        '#f97316',
                        '#ef4444',
                        '#dc2626',
                        '#b91c1c',
                        '#991b1b',
                    ];
                case 9:
                    return [
                        '#22c55e',
                        '#84cc16',
                        '#eab308',
                        '#f97316',
                        '#ef4444',
                        '#dc2626',
                        '#b91c1c',
                        '#991b1b',
                        '#7f1d1d',
                    ];
                case 10:
                    return [
                        '#22c55e',
                        '#84cc16',
                        '#eab308',
                        '#f97316',
                        '#ef4444',
                        '#dc2626',
                        '#b91c1c',
                        '#991b1b',
                        '#7f1d1d',
                        '#450a0a',
                    ];
                default:
                    // For other levels, use full spectrum
                    return [
                        '#22c55e',
                        '#84cc16',
                        '#eab308',
                        '#f97316',
                        '#ef4444',
                        '#dc2626',
                        '#b91c1c',
                        '#991b1b',
                        '#7f1d1d',
                        '#450a0a',
                    ];
            }
        };

        const baseColors = getColorsForLevels(numLevels);

        const getBaseNames = (numLevels: number): string[] => {
            switch (numLevels) {
                case 3:
                    return ['Low', 'Medium', 'High'];
                case 4:
                    return ['Low', 'Medium', 'High', 'Extreme'];
                case 5:
                    return ['Low', 'Medium', 'High', 'Extreme', 'Critical'];
                default:
                    // For other levels, use default naming
                    return [
                        'Very Low',
                        'Low',
                        'Low-Medium',
                        'Medium',
                        'Medium-High',
                        'High',
                        'Very High',
                        'Extreme',
                        'Critical',
                        'Catastrophic',
                    ];
            }
        };

        const baseNames = getBaseNames(numLevels);

        const levels: RiskLevel[] = [];
        const scorePerLevel = maxScore / numLevels;

        for (let i = 0; i < numLevels; i++) {
            levels.push({
                name: baseNames[i] || `Level ${i + 1}`,
                color: baseColors[i] || baseColors[baseColors.length - 1],
                min_score: Math.floor(i * scorePerLevel) + (i === 0 ? 1 : 0),
                max_score:
                    i === numLevels - 1
                        ? maxScore
                        : Math.floor((i + 1) * scorePerLevel),
                order: i + 1,
            });
        }

        return levels;
    };

    const handleReset = () => {
        setCustomLevels(undefined);
        setEditMode(false);
        setIsModified(false);
        setErrors({});
    };

    const handleSave = async () => {
        setIsSaving(true);
        setErrors({});

        try {
            // Prepare data structure for database storage
            const riskMatrixSettings = {
                name: configuration?.name || 'Risk Matrix Configuration',
                matrix_dimensions: {
                    rows: rows,
                    columns: columns,
                    max_score: maxScore,
                },
                scoring_configuration: {
                    number_of_levels: scoreScale,
                    levels: currentLevels.map((level, index) => ({
                        name: level.name,
                        color: level.color,
                        min_score: level.min_score,
                        max_score: level.max_score,
                        order: index + 1,
                    })),
                },
                metadata: {
                    is_custom: customLevels !== undefined,
                    preset_used:
                        customLevels === undefined
                            ? `${rows}x${columns}_${scoreScale}levels`
                            : null,
                    is_active: true, // Set as active when saving
                },
            };

            console.log(
                'Risk Matrix Settings to be saved to database:',
                JSON.stringify(riskMatrixSettings, null, 2),
            );

            const url = configuration?.id
                ? `/risk-matrix/settings/${configuration.id}`
                : '/risk-matrix/settings';

            const method = configuration?.id ? 'put' : 'post';

            router[method](url, riskMatrixSettings, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: (page) => {
                    // Configuration will be updated via props (activeConfiguration)
                    // due to the back() response from controller
                    setRecentlySaved(true);
                    setTimeout(() => setRecentlySaved(false), 3000);

                    // The new configuration will come through initialConfiguration prop
                    const newConfig = (
                        page.props as {
                            activeConfiguration?: RiskMatrixConfiguration;
                        }
                    ).activeConfiguration;
                    if (newConfig && onConfigurationSaved) {
                        onConfigurationSaved(newConfig);
                    }
                },
                onError: (errors) => {
                    if (errors) {
                        // Handle validation errors
                        const flatErrors: Record<string, string> = {};
                        Object.keys(errors).forEach((key) => {
                            flatErrors[key] = Array.isArray(errors[key])
                                ? errors[key][0]
                                : errors[key];
                        });
                        setErrors(flatErrors);
                    } else {
                        setErrors({
                            general: 'Failed to save configuration',
                        });
                    }
                },
            });
        } catch (error) {
            console.error('Save error:', error);
            setErrors({
                general:
                    error instanceof Error
                        ? error.message
                        : 'An unexpected error occurred',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const currentLevels = customLevels || generateDefaultLevels(scoreScale);

    const updateLevel = useCallback(
        (
            index: number,
            field: 'min' | 'max' | 'name' | 'color',
            value: number | string,
        ) => {
            const newLevels = [...currentLevels];
            const updatedLevel = { ...newLevels[index] };

            if (field === 'min' || field === 'max') {
                const scoreField = field === 'min' ? 'min_score' : 'max_score';
                updatedLevel[scoreField] = value as number;
            } else if (field === 'name') {
                updatedLevel.name = value as string;
            } else if (field === 'color') {
                updatedLevel.color = value as string;
            }

            newLevels[index] = updatedLevel;
            setCustomLevels(newLevels);
            setIsModified(true);

            // Validate on change
            const newErrors: Record<string, string> = {};
            newLevels.forEach((level, levelIndex) => {
                if (!level.name.trim()) {
                    newErrors[`level_${levelIndex}_name`] =
                        'Level name is required';
                }
                if (level.min_score < 1 || level.min_score > maxScore) {
                    newErrors[`level_${levelIndex}_min`] =
                        `Min value must be between 1 and ${maxScore}`;
                }
                if (level.max_score < 1 || level.max_score > maxScore) {
                    newErrors[`level_${levelIndex}_max`] =
                        `Max value must be between 1 and ${maxScore}`;
                }
                if (level.min_score > level.max_score) {
                    newErrors[`level_${levelIndex}_range`] =
                        'Min value cannot be greater than max value';
                }
            });
            setErrors(newErrors);
        },
        [currentLevels, maxScore],
    );

    const debouncedUpdateLevel = useDebouncedCallback(
        (
            index: number,
            field: 'min' | 'max' | 'name' | 'color',
            value: number | string,
        ) => updateLevel(index, field, value),
        150,
        [updateLevel],
    );

    const presets = [
        { name: '2×2', rows: 2, columns: 2 },
        { name: '3×3', rows: 3, columns: 3 },
        { name: '4×4', rows: 4, columns: 4 },
        { name: '5×5', rows: 5, columns: 5 },
    ];

    const scorePresets = [
        { name: '2 Levels', value: 2 },
        { name: '3 Levels', value: 3 },
        { name: '4 Levels', value: 4 },
        { name: '5 Levels', value: 5 },
    ];

    return (
        <div className="space-y-6 p-4">
            <div>
                <HeadingSmall
                    title="Risk Assessment Matrix Configuration"
                    description="Configure your organization's risk assessment matrix parameters and scoring levels"
                />
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Left Column - Form */}
                <div className="col-span-2 space-y-6">
                    {/* Matrix Dimensions Section */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold">
                                Matrix Dimensions
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Configure the grid dimensions for likelihood and
                                consequence assessment
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Quick Presets</Label>
                                <div className="flex flex-wrap gap-2">
                                    {presets.map((preset) => (
                                        <Button
                                            key={preset.name}
                                            size="sm"
                                            variant={
                                                rows === preset.rows &&
                                                columns === preset.columns
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            onClick={() => {
                                                setRows(preset.rows);
                                                setColumns(preset.columns);
                                                handleReset();
                                            }}
                                        >
                                            {preset.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="rows">
                                        Rows (Likelihood)
                                    </Label>
                                    <Input
                                        id="rows"
                                        type="number"
                                        min={2}
                                        max={10}
                                        value={rows}
                                        onChange={(e) => {
                                            setRows(
                                                Math.min(
                                                    10,
                                                    Math.max(
                                                        2,
                                                        Number.parseInt(
                                                            e.target.value,
                                                        ) || 2,
                                                    ),
                                                ),
                                            );
                                            handleReset();
                                            setIsModified(true);
                                        }}
                                    />
                                    <InputError message={errors.rows} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="columns">
                                        Columns (Consequence)
                                    </Label>
                                    <Input
                                        id="columns"
                                        type="number"
                                        min={2}
                                        max={10}
                                        value={columns}
                                        onChange={(e) => {
                                            setColumns(
                                                Math.min(
                                                    10,
                                                    Math.max(
                                                        2,
                                                        Number.parseInt(
                                                            e.target.value,
                                                        ) || 2,
                                                    ),
                                                ),
                                            );
                                            handleReset();
                                            setIsModified(true);
                                        }}
                                    />
                                    <InputError message={errors.columns} />
                                </div>
                            </div>

                            <div className="rounded-lg border p-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">
                                            Matrix Size:
                                        </span>
                                        <Badge variant="outline">
                                            {rows} × {columns}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">
                                            Max Risk Score:
                                        </span>
                                        <Badge variant="secondary">
                                            {maxScore}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        The maximum possible risk score is
                                        calculated as rows × columns
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Risk Levels Section */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold">
                                Risk Scoring Levels
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Define the number of risk levels and their
                                scoring ranges
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Level Presets</Label>
                                <div className="flex flex-wrap gap-2">
                                    {scorePresets.map((preset) => (
                                        <Button
                                            key={preset.name}
                                            size="sm"
                                            variant={
                                                scoreScale === preset.value
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            onClick={() => {
                                                setScoreScale(preset.value);
                                                handleReset();
                                                setIsModified(true);
                                            }}
                                        >
                                            {preset.name}
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="scoreScale">
                                    Number of Risk Levels
                                </Label>
                                <Input
                                    id="scoreScale"
                                    type="number"
                                    min={2}
                                    max={10}
                                    value={scoreScale}
                                    onChange={(e) => {
                                        const newScale = Math.min(
                                            10,
                                            Math.max(
                                                2,
                                                Number.parseInt(
                                                    e.target.value,
                                                ) || 2,
                                            ),
                                        );
                                        setScoreScale(newScale);
                                        handleReset();
                                        setIsModified(true);
                                    }}
                                />
                                <InputError message={errors.scoreScale} />
                            </div>

                            <div className="rounded-lg border p-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">
                                            Active Levels:
                                        </span>
                                        <Badge variant="outline">
                                            {scoreScale}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        {currentLevels.map((level, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-2 text-xs"
                                            >
                                                <div
                                                    className="h-3 w-3 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            level.color,
                                                    }}
                                                />
                                                <span className="font-medium">
                                                    {level.name}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    ({level.min_score}-
                                                    {level.max_score})
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Risk Level Configuration */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold">
                                    Level Configuration
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Customize the names, colors, and score
                                    ranges for each risk level
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleReset}
                                    disabled={!isModified}
                                >
                                    Reset
                                </Button>
                                <Button
                                    size="sm"
                                    variant={editMode ? 'secondary' : 'default'}
                                    onClick={() => setEditMode(!editMode)}
                                >
                                    {editMode ? 'Preview' : 'Edit'}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {currentLevels.map((level, index) => (
                                <Card
                                    key={index}
                                    className="relative p-0 shadow-none"
                                >
                                    <CardContent className="p-4">
                                        {editMode ? (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <FastColorPicker
                                                        value={level.color}
                                                        onChange={(color) =>
                                                            updateLevel(
                                                                index,
                                                                'color',
                                                                color,
                                                            )
                                                        }
                                                        size="sm"
                                                    />
                                                    <Input
                                                        type="text"
                                                        value={level.name}
                                                        onChange={(e) =>
                                                            debouncedUpdateLevel(
                                                                index,
                                                                'name',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="flex-1 font-semibold"
                                                        placeholder="Level name"
                                                    />
                                                </div>
                                                <InputError
                                                    message={
                                                        errors[
                                                            `level_${index}_name`
                                                        ]
                                                    }
                                                />

                                                <div className="space-y-2">
                                                    <Label className="text-xs">
                                                        Score Range
                                                    </Label>
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            max={maxScore}
                                                            value={
                                                                level.min_score
                                                            }
                                                            onChange={(e) =>
                                                                debouncedUpdateLevel(
                                                                    index,
                                                                    'min',
                                                                    Number.parseInt(
                                                                        e.target
                                                                            .value,
                                                                    ) || 1,
                                                                )
                                                            }
                                                            className="flex-1"
                                                        />
                                                        <span className="text-xs text-muted-foreground">
                                                            to
                                                        </span>
                                                        <Input
                                                            type="number"
                                                            min={1}
                                                            max={maxScore}
                                                            value={
                                                                level.max_score
                                                            }
                                                            onChange={(e) =>
                                                                debouncedUpdateLevel(
                                                                    index,
                                                                    'max',
                                                                    Number.parseInt(
                                                                        e.target
                                                                            .value,
                                                                    ) ||
                                                                        maxScore,
                                                                )
                                                            }
                                                            className="flex-1"
                                                        />
                                                    </div>
                                                    <InputError
                                                        message={
                                                            errors[
                                                                `level_${index}_min`
                                                            ] ||
                                                            errors[
                                                                `level_${index}_max`
                                                            ] ||
                                                            errors[
                                                                `level_${index}_range`
                                                            ]
                                                        }
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="h-4 w-4 rounded"
                                                        style={{
                                                            backgroundColor:
                                                                level.color,
                                                        }}
                                                    />
                                                    <span className="font-semibold">
                                                        {level.name}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    Score range:{' '}
                                                    {level.min_score} -{' '}
                                                    {level.max_score}
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-4 pt-4">
                        <Button
                            onClick={handleSave}
                            disabled={
                                !isModified ||
                                Object.keys(errors).length > 0 ||
                                isSaving
                            }
                        >
                            {isSaving ? 'Saving...' : 'Save Configuration'}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={handleReset}
                            disabled={!isModified || isSaving}
                        >
                            Discard Changes
                        </Button>

                        {errors.general && (
                            <p className="text-sm text-red-600">
                                {errors.general}
                            </p>
                        )}

                        <Transition
                            show={recentlySaved}
                            enter="transition ease-in-out"
                            enterFrom="opacity-0"
                            leave="transition ease-in-out"
                            leaveTo="opacity-0"
                        >
                            <p className="text-sm text-green-600">
                                Configuration saved successfully
                            </p>
                        </Transition>
                    </div>
                </div>

                {/* Right Column - Matrix Preview */}
                <div className="space-y-4">
                    <div className="sticky top-4">
                        <div>
                            <h3 className="text-lg font-semibold">
                                Matrix Preview
                            </h3>
                            <p className="mb-4 text-sm text-muted-foreground">
                                Interactive preview of your configured risk
                                assessment matrix
                            </p>
                        </div>

                        <RiskMatrixCanvas
                            rows={rows}
                            columns={columns}
                            scoreScale={scoreScale}
                            customLevels={customLevels?.map((level) => ({
                                name: level.name,
                                color: level.color,
                                min: level.min_score,
                                max: level.max_score,
                            }))}
                            onCellClick={(likelihood, consequence, score) => {
                                console.log(
                                    `Cell clicked: Likelihood=${likelihood}, Consequence=${consequence}, Score=${score}`,
                                );
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
