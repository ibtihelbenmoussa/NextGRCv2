import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { RiskConfiguration, RiskImpact, RiskProbability, RiskCriteria, CriteriaImpact, RiskScoreLevel } from '@/types/risk-configuration';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2, Check, LoaderCircle } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import {
    Stepper,
    StepperContent,
    StepperIndicator,
    StepperItem,
    StepperNav,
    StepperPanel,
    StepperSeparator,
    StepperTitle,
    StepperTrigger,
} from '@/components/ui/stepper';
import { ListTodo, Grid3x3, Layers, Rows, Milestone, Sparkle, Users2 } from 'lucide-react';
import InputColor from '@/components/input-color';
import { RiskColorPresetMini } from '@/components/ui/risk-color-preset';
import FastColorPicker from '@/components/ui/fast-color-picker';

const getProgressiveColors = (count: number): string[] => {
    const colorSchemes: Record<number, string[]> = {
        2: ['#10b981', '#ef4444'],
        3: ['#10b981', '#f59e0b', '#ef4444'],
        4: ['#10b981', '#f59e0b', '#f97316', '#ef4444'],
        5: ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#dc2626'],
        6: ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#991b1b'],
        7: ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#991b1b', '#7f1d1d'],
        8: ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#991b1b', '#7f1d1d', '#450a0a'],
        9: ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#991b1b', '#7f1d1d', '#450a0a', '#000000'],
        10: ['#10b981', '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#991b1b', '#7f1d1d', '#450a0a', '#000000', '#000000'],
    };
    return colorSchemes[count] || colorSchemes[3];
};

const impactLabels = [
    'Minor', 'Moderate', 'Significant', 'Major', 'Critical',
    'Low', 'Medium', 'High', 'Very High', 'Extreme'
];

const probabilityLabels = [
    'Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain',
    'Very Low', 'Low', 'Medium', 'High', 'Very High'
];

const wizardSteps = [
    { title: 'Basic Info', icon: ListTodo },
    { title: 'Scale Config', icon: Grid3x3 },
    { title: 'Impact Levels', icon: Layers },
    { title: 'Probability Levels', icon: Rows },
    { title: 'Risk Score Levels', icon: Milestone },
];

// ─── Helper: vérifie si un score est "vide" ───
const isScoreEmpty = (score: number | undefined | null): boolean => {
    return score === undefined || score === null || isNaN(Number(score)) || String(score).trim() === '';
};

// ─── Helper: vérifie si les scores sont strictement croissants ───
const getScoreError = (
    score: number,
    prevScore: number | null,
    empty: boolean
): string | null => {
    if (empty) return 'Score is required';
    if (prevScore !== null && Number(score) <= prevScore) return `Must be > ${prevScore}`;
    return null;
};

export default function CreateRiskConfiguration() {
    const [useCriterias, setUseCriterias] = useState(false);
    const [scoreLevelCount, setScoreLevelCount] = useState<number>(3);

    const generateDefaultScoreLevels = (count: number) => {
        const progressiveColors = getProgressiveColors(count);
        return Array.from({ length: count }, (_, i) => ({
            label: ['Low', 'Medium', 'High', 'Very High', 'Critical', 'Extreme', 'Extreme+', 'Severe', 'Minor', 'Major'][i] || `Level ${i + 1}`,
            min: i + 1,
            max: i + 1,
            color: progressiveColors[i],
            order: i + 1,
        }));
    };

    const [scoreLevels, setScoreLevels] = useState(generateDefaultScoreLevels(scoreLevelCount));

    const { data, setData, processing, errors } = useForm<{
        name: string;
        impact_scale_max: number;
        probability_scale_max: number;
        calculation_method: 'avg' | 'max';
        use_criterias: boolean;
        impacts: RiskImpact[];
        probabilities: RiskProbability[];
        criterias: RiskCriteria[];
        score_levels: RiskScoreLevel[];
    }>({
        name: '',
        impact_scale_max: 5,
        probability_scale_max: 5,
        calculation_method: 'max',
        use_criterias: false,
        impacts: [],
        probabilities: [],
        criterias: [],
        score_levels: generateDefaultScoreLevels(scoreLevelCount),
    });

    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const dynamicSteps = useMemo(() => {
        return data.use_criterias
            ? [...wizardSteps, { title: 'Assessment Criteria', icon: Users2 }]
            : wizardSteps;
    }, [data.use_criterias]);

    // ─── Calcul max score (doit être avant isStepValid) ───
    const maxImpact = data.impacts.length ? Math.max(...data.impacts.map(i => Number(i.score) || 0)) : 1;
    const maxProbability = data.probabilities.length ? Math.max(...data.probabilities.map(i => Number(i.score) || 0)) : 1;
    const totalMaxScore = maxImpact * maxProbability;

    // ─── Validation par étape ───
    const isStepValid = useMemo(() => {
        switch (currentStep) {
            case 1:
                return data.name.trim() !== '';

            case 2:
                return data.impact_scale_max === data.probability_scale_max;

            case 3:
                return (
                    data.impacts.every(i => i.label.trim() !== '' && !isScoreEmpty(i.score)) &&
                    data.impacts.every((i, idx, arr) =>
                        idx === 0 || Number(i.score) > Number(arr[idx - 1].score)
                    )
                );

            case 4:
                return (
                    data.probabilities.every(p => p.label.trim() !== '' && !isScoreEmpty(p.score)) &&
                    data.probabilities.every((p, idx, arr) =>
                        idx === 0 || Number(p.score) > Number(arr[idx - 1].score)
                    )
                );

            case 5:
                return (
                    scoreLevels.every(l => l.label.trim() !== '') &&
                    scoreLevels.every(l => l.min < l.max) &&
                    scoreLevels.every((l, i, arr) =>
                        i === 0 || l.min === arr[i - 1].max + 1
                    ) &&
                    scoreLevels[scoreLevels.length - 1]?.max === totalMaxScore
                );

            default:
                return data.criterias.every(c => c.name.trim() !== '');
        }
    }, [currentStep, data, scoreLevels]);

    const generateDefaultImpacts = (count: number): RiskImpact[] =>
        Array.from({ length: count }, (_, i) => ({
            label: impactLabels[i] || `Level ${i + 1}`,
            score: i + 1,
            order: i + 1,
        }));

    const generateDefaultProbabilities = (count: number): RiskProbability[] =>
        Array.from({ length: count }, (_, i) => ({
            label: probabilityLabels[i] || `Level ${i + 1}`,
            score: i + 1,
            order: i + 1,
        }));

    const autoGenerateScoreLevels = (count: number, maxScore: number) => {
        const step = Math.floor(maxScore / count);
        const progressiveColors = getProgressiveColors(count);
        return Array.from({ length: count }, (_, i) => ({
            label: ['Low', 'Medium', 'High', 'Very High', 'Critical', 'Extreme', 'Extreme+', 'Severe', 'Minor', 'Major'][i] || `Level ${i + 1}`,
            min: i === 0 ? 1 : i * step + 1,
            max: i === count - 1 ? maxScore : (i + 1) * step,
            color: progressiveColors[i],
            order: i + 1,
        }));
    };

    const handleScoreLevelCountChange = (count: number) => {
        setScoreLevelCount(count);
        setScoreLevels(autoGenerateScoreLevels(count, totalMaxScore));
    };

    useEffect(() => {
        setScoreLevels(autoGenerateScoreLevels(scoreLevelCount, totalMaxScore));
        // eslint-disable-next-line
    }, [data.impacts, data.probabilities, scoreLevelCount]);

    const handleScoreLevelFieldChange = (levelIdx: number, field: keyof typeof scoreLevels[0], value: string | number) => {
        setScoreLevels((prev) => {
            const next = [...prev];
            next[levelIdx] = { ...next[levelIdx], [field]: value };
            return next;
        });
    };

    const handleImpactChange = (index: number, field: keyof RiskImpact, value: string | number) => {
        const newImpacts = [...data.impacts];
        newImpacts[index] = { ...newImpacts[index], [field]: value };
        setData('impacts', newImpacts);
    };

    const handleProbabilityChange = (index: number, field: keyof RiskProbability, value: string | number) => {
        const newProbabilities = [...data.probabilities];
        newProbabilities[index] = { ...newProbabilities[index], [field]: value };
        setData('probabilities', newProbabilities);
    };

    const handleCriteriaChange = (index: number, field: keyof RiskCriteria, value: string) => {
        const newCriterias = [...data.criterias];
        newCriterias[index] = { ...newCriterias[index], [field]: value };
        setData('criterias', newCriterias);
    };

    const addCriteria = () => {
        const newCriteria: RiskCriteria = {
            name: '',
            description: '',
            order: data.criterias.length + 1,
            impacts: Array.from({ length: data.impact_scale_max }).map((_, idx) => ({
                impact_label: impactLabels[idx] || `Impact ${idx + 1}`,
                score: idx + 1,
                order: idx + 1,
            })),
        };
        setData('criterias', [...data.criterias, newCriteria]);
    };

    const removeCriteria = (index: number) => {
        setData('criterias', data.criterias.filter((_, i) => i !== index));
    };

    const handleCriteriaImpactChange = (
        criteriaIndex: number,
        impactIndex: number,
        field: keyof CriteriaImpact,
        value: string | number
    ) => {
        const newCriterias = [...data.criterias];
        newCriterias[criteriaIndex].impacts[impactIndex] = {
            ...newCriterias[criteriaIndex].impacts[impactIndex],
            [field]: value,
        };
        setData('criterias', newCriterias);
    };

    const syncCriteriaImpacts = (impactCount: number) => {
        setData('criterias', data.criterias.map(c => ({
            ...c,
            impacts: Array.from({ length: impactCount }).map((_, idx) => c.impacts[idx] ?? {
                impact_label: impactLabels[idx] || `Impact ${idx + 1}`,
                score: idx + 1,
                order: idx + 1,
            })
        })));
    };

    const handleScaleChange = (type: 'impact' | 'probability', value: number) => {
        if (type === 'impact') {
            setData('impact_scale_max', value);
            setData('impacts', generateDefaultImpacts(value));
            syncCriteriaImpacts(value);
        } else {
            setData('probability_scale_max', value);
            setData('probabilities', generateDefaultProbabilities(value));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isSubmitting) return;

        if (currentStep !== dynamicSteps.length) {
            setIsSubmitting(false);
            return;
        }

        const validationErrors: Record<string, string> = {};
        if (!data.name.trim()) validationErrors.name = 'Configuration name is required';
        if (data.impacts.some(i => !i.label.trim())) validationErrors.impacts = 'All impact levels must have labels';
        if (data.probabilities.some(p => !p.label.trim())) validationErrors.probabilities = 'All probability levels must have labels';
        if (scoreLevels.some(level => !level.label.trim())) validationErrors.score_levels = 'All score levels must have labels';
        if (scoreLevels.some(level => level.min > level.max)) validationErrors.score_levels = 'Score level min cannot be greater than max';

        if (Object.keys(validationErrors).length > 0) {
            console.error(validationErrors);
            setIsSubmitting(false);
            return;
        }

        const payload = {
            name: data.name,
            impact_scale_max: data.impact_scale_max,
            probability_scale_max: data.probability_scale_max,
            calculation_method: data.calculation_method,
            use_criterias: data.use_criterias,
            impacts: data.impacts,
            probabilities: data.probabilities,
            criterias: data.criterias,
            score_levels: scoreLevels,
        };

        router.post('/risk-configurations', payload as any, {
            preserveScroll: true,
            onSuccess: () => setIsSubmitting(false),
            onError: (errors) => {
                console.error(errors);
                setIsSubmitting(false);
            },
        });
    };

    useEffect(() => {
        if (data.impacts.length === 0) setData('impacts', generateDefaultImpacts(data.impact_scale_max));
        if (data.probabilities.length === 0) setData('probabilities', generateDefaultProbabilities(data.probability_scale_max));
    }, []);

    useEffect(() => {
        if (currentStep > dynamicSteps.length) setCurrentStep(dynamicSteps.length);
    }, [dynamicSteps.length, currentStep]);

    // ─── Composant réutilisable pour les lignes Impact / Probability ───
    const renderLevelRow = (
        item: RiskImpact | RiskProbability,
        idx: number,
        arr: (RiskImpact | RiskProbability)[],
        onChange: (index: number, field: any, value: string | number) => void
    ) => {
        const prevScore = idx > 0 ? Number(arr[idx - 1].score) : null;
        const currentScore = Number(item.score);
        const scoreEmpty = isScoreEmpty(item.score);
        const scoreError = getScoreError(currentScore, prevScore, scoreEmpty);
        const labelEmpty = item.label.trim() === '';

        return (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                {/* Label */}
                <div className="space-y-1">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Label</Label>
                    <Input
                        value={item.label}
                        onChange={e => onChange(idx, 'label', e.target.value)}
                        placeholder="e.g., Minor"
                        className={`border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-rose-500 transition-colors ${labelEmpty ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : ''
                            }`}
                    />
                    {labelEmpty && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block flex-shrink-0" />
                            Label is required
                        </p>
                    )}
                </div>

                {/* Score */}
                <div className="space-y-1">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Score</Label>
                    <Input
                        type="number"
                        step="0.1"
                        value={item.score}
                        onChange={e => onChange(idx, 'score', parseFloat(e.target.value))}
                        className={`border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-rose-500 transition-colors ${scoreError ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : ''
                            }`}
                    />
                    {scoreError && (
                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block flex-shrink-0" />
                            {scoreError}
                        </p>
                    )}
                </div>

                {/* Order */}
                <div className="space-y-1">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Order</Label>
                    <Input
                        type="number"
                        value={item.order}
                        onChange={e => onChange(idx, 'order', parseInt(e.target.value))}
                        className="border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-rose-500"
                    />
                </div>
            </div>
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Risk Management', href: '/risks' },
                { title: 'Risk Configurations', href: '/risk-configurations' },
                { title: 'Create', href: '/risk-configurations/create' },
            ]}
        >
            <Head title="Create Risk Configuration" />
            <div className="min-h-screen">
                <form onSubmit={handleSubmit}>
                    <Stepper
                        value={currentStep}
                        onValueChange={(step) => {
                            if (step !== currentStep && step >= 1 && step <= dynamicSteps.length) {
                                setCurrentStep(step);
                                setIsSubmitting(false);
                            }
                        }}
                        className="space-y-4 sm:space-y-6 px-2 sm:px-4 py-3 sm:py-6"
                        indicators={{
                            completed: <Check className="size-4" />,
                            loading: <LoaderCircle className="size-4 animate-spin" />,
                        }}
                    >
                        <StepperNav className="relative flex justify-between mb-8 px-2 overflow-x-auto">
                            {dynamicSteps.map((step, idx) => (
                                <StepperItem key={idx} step={idx + 1} className="relative flex-1 text-center group min-w-[100px]">
                                    <StepperTrigger asChild>
                                        <div className="flex flex-col items-center gap-2 px-1">
                                            <div className={`flex items-center justify-center size-8 sm:size-10 rounded-full border-2 transition-all duration-300
                                                ${currentStep > idx + 1
                                                    ? 'bg-rose-500 border-rose-500 text-white'
                                                    : currentStep === idx + 1
                                                        ? 'border-rose-500 text-rose-600 bg-rose-50'
                                                        : 'border-slate-300 text-slate-400 hover:bg-slate-50 hover:border-slate-400 hover:text-slate-500'
                                                }`}>
                                                <step.icon className="size-3 sm:size-4" />
                                            </div>
                                            <StepperTitle className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300 leading-tight">
                                                {step.title}
                                            </StepperTitle>
                                        </div>
                                    </StepperTrigger>
                                    {idx < dynamicSteps.length - 1 && (
                                        <div className={`absolute top-4 sm:top-5 left-[calc(50%+1rem)] right-[calc(-50%+1rem)] h-[2px] transition-all duration-500 rounded-full
                                            ${currentStep > idx + 1 ? 'bg-rose-400' : 'bg-slate-200'}`} />
                                    )}
                                </StepperItem>
                            ))}
                        </StepperNav>

                        <StepperPanel className="mb-8">
                            {dynamicSteps.map((step, idx) => (
                                <StepperContent key={idx} value={idx + 1} className="flex flex-col gap-4 mx-auto">

                                    {/* ── Step 1 : Basic Info ── */}
                                    {idx === 0 && (
                                        <Card className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 sm:p-4">
                                            <CardHeader className="p-0 mb-3">
                                                <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">Basic Configuration</CardTitle>
                                                <CardDescription className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Set up the fundamental parameters for your risk configuration</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-0 pt-2">
                                                <div className="grid grid-cols-1 gap-3">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Configuration Name</Label>
                                                        <Input
                                                            id="name"
                                                            value={data.name}
                                                            onChange={(e) => setData('name', e.target.value)}
                                                            placeholder="e.g., Default Risk Configuration"
                                                            className={`border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition-all duration-200 ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                                                        />
                                                        {errors.name && <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2 mt-2"><span className="w-1 h-1 bg-red-500 rounded-full"></span>{errors.name}</p>}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="calculation_method" className="text-sm font-semibold text-slate-700 dark:text-slate-300">Calculation Method</Label>
                                                        <Select value={data.calculation_method} onValueChange={(value) => setData('calculation_method', value as 'avg' | 'max')}>
                                                            <SelectTrigger className="border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-rose-500">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="max">Maximum</SelectItem>
                                                                <SelectItem value="avg">Average</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="flex items-center space-x-2 p-2 bg-rose-50 dark:bg-rose-900/20 rounded-lg border border-rose-200 dark:border-rose-800">
                                                        <Checkbox
                                                            id="use_criterias"
                                                            checked={data.use_criterias}
                                                            onCheckedChange={(checked) => {
                                                                setData('use_criterias', checked as boolean);
                                                                setUseCriterias(checked as boolean);
                                                            }}
                                                            className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
                                                        />
                                                        <Label htmlFor="use_criterias" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">Use criteria-based assessment</Label>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* ── Step 2 : Scale Config ── */}
                                    {idx === 1 && (
                                        <Card className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 sm:p-4">
                                            <CardHeader className="p-0 mb-3">
                                                <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
                                                    Scale Configuration
                                                </CardTitle>
                                                <CardDescription className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                                    Define the number of levels for impact and probability scales
                                                </CardDescription>
                                            </CardHeader>

                                            <CardContent className="p-0 pt-2">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                        Scale Levels (Impact & Probability)
                                                    </Label>

                                                    <Select
                                                        value={data.impact_scale_max.toString()}
                                                        onValueChange={(value) => {
                                                            const v = parseInt(value);

                                                            // sync les deux
                                                            setData('impact_scale_max', v);
                                                            setData('probability_scale_max', v);

                                                            // regenerate
                                                            setData('impacts', generateDefaultImpacts(v));
                                                            setData('probabilities', generateDefaultProbabilities(v));

                                                            syncCriteriaImpacts(v);
                                                        }}
                                                    >
                                                        <SelectTrigger className="border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-rose-500">
                                                            <SelectValue />
                                                        </SelectTrigger>

                                                        <SelectContent>
                                                            {Array.from({ length: 9 }, (_, i) => i + 2).map(num => (
                                                                <SelectItem key={num} value={num.toString()}>
                                                                    {num} Levels
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* ── Step 3 : Impact Levels ── */}
                                    {idx === 2 && (
                                        <Card className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 sm:p-4">
                                            <CardHeader className="p-0 mb-3">
                                                <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">Impact Levels</CardTitle>
                                                <CardDescription className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                                    Define the impact levels and their corresponding scores.
                                                    <span className="ml-1 text-rose-600 dark:text-rose-400 font-medium">Scores must be strictly increasing.</span>
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-0 pt-2">
                                                <div className="grid gap-2">
                                                    {data.impacts.map((impact, impactIdx) =>
                                                        renderLevelRow(impact, impactIdx, data.impacts, handleImpactChange)
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* ── Step 4 : Probability Levels ── */}
                                    {idx === 3 && (
                                        <Card className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 sm:p-4">
                                            <CardHeader className="p-0 mb-3">
                                                <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">Probability Levels</CardTitle>
                                                <CardDescription className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                                    Define the probability levels and their corresponding scores.
                                                    <span className="ml-1 text-rose-600 dark:text-rose-400 font-medium">Scores must be strictly increasing.</span>
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-0 pt-2">
                                                <div className="grid gap-2">
                                                    {data.probabilities.map((probability, probIdx) =>
                                                        renderLevelRow(probability, probIdx, data.probabilities, handleProbabilityChange)
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* ── Step 5 : Risk Score Levels ── */}
                                    {idx === 4 && (
                                        <Card className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                                            <CardHeader className="p-0 mb-3">
                                                <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                                                    Risk Score Levels
                                                </CardTitle>
                                                <CardDescription className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                                    Define how many <span className="font-semibold text-slate-700 dark:text-slate-300">risk score levels</span> to use.
                                                    Intervals are auto-calculated based on the max score:
                                                    <span className="text-rose-600 dark:text-rose-400 font-semibold ml-1">{totalMaxScore}</span>.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-0 pt-3 space-y-3">
                                                <div className="space-y-2 max-w-xs">
                                                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Number of Levels</Label>
                                                    <Select value={scoreLevelCount.toString()} onValueChange={(val) => handleScoreLevelCountChange(Number(val))}>
                                                        <SelectTrigger className="border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-rose-500">
                                                            <SelectValue placeholder="Select number of levels" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {Array.from({ length: 9 }, (_, i) => i + 2).map((n) => (
                                                                <SelectItem key={n} value={n.toString()}>{n} Levels</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                    <span>Max Score:</span>
                                                    <span className="font-semibold text-slate-800 dark:text-slate-200 px-2 py-1 rounded-md">{totalMaxScore}</span>
                                                </div>

                                                <div className="grid gap-2">
                                                    {scoreLevels.map((level, levelIdx) => {
                                                        const prev = scoreLevels[levelIdx - 1];
                                                        const isLast = levelIdx === scoreLevels.length - 1;

                                                        const labelEmpty = level.label.trim() === '';
                                                        const minGeMax = level.min >= level.max;
                                                        const gapError = levelIdx > 0 && level.min !== prev.max + 1;
                                                        const lastMaxError = isLast && level.max !== totalMaxScore;

                                                        const minHasError = minGeMax || gapError;
                                                        const maxHasError = minGeMax || lastMaxError;

                                                        return (
                                                            <div key={levelIdx} className="flex flex-col gap-3 border border-slate-200 dark:border-slate-700 rounded-lg p-3">

                                                                {/* Label */}
                                                                <div className="space-y-1">
                                                                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Label</Label>
                                                                    <Input
                                                                        placeholder="e.g. Low"
                                                                        value={level.label}
                                                                        onChange={(e) => handleScoreLevelFieldChange(levelIdx, 'label', e.target.value)}
                                                                        className={`border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-rose-500 ${labelEmpty ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : ''}`}
                                                                    />
                                                                    {labelEmpty && (
                                                                        <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                                                                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block flex-shrink-0" />
                                                                            Label is required
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                <div className="flex flex-col sm:flex-row gap-3">

                                                                    {/* Range Slider Min/Max */}
                                                                    <div className="flex-1 space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                                                                                Range
                                                                                {isLast && (
                                                                                    <span className="text-rose-500 font-normal normal-case tracking-normal ml-1">
                                                                                        (max = {totalMaxScore})
                                                                                    </span>
                                                                                )}
                                                                            </Label>
                                                                            <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${minHasError || maxHasError ? 'text-red-500' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                                {level.min} → {level.max}
                                                                            </span>
                                                                        </div>
                                                                        {levelIdx === 0 ? (
                                                                            <div className="relative w-full">
                                                                                <Slider
                                                                                    min={1}
                                                                                    max={totalMaxScore}
                                                                                    step={1}
                                                                                    value={[1, level.max]}
                                                                                    onValueChange={([_, newMax]) => {
                                                                                        handleScoreLevelFieldChange(levelIdx, 'min', 1);
                                                                                        handleScoreLevelFieldChange(levelIdx, 'max', newMax);
                                                                                    }}
                                                                                    className="w-full"
                                                                                />
                                                                                {/* Overlay qui bloque le premier thumb visuellement et physiquement */}
                                                                                <div className="absolute left-0 top-0 w-4 h-full cursor-not-allowed" />
                                                                            </div>
                                                                        ) : (
                                                                            <Slider
                                                                                min={1}
                                                                                max={totalMaxScore}
                                                                                step={1}
                                                                                value={[level.min, level.max]}
                                                                                onValueChange={([newMin, newMax]) => {
                                                                                    handleScoreLevelFieldChange(levelIdx, 'min', newMin);
                                                                                    handleScoreLevelFieldChange(levelIdx, 'max', newMax);
                                                                                }}
                                                                                className="w-full"
                                                                            />
                                                                        )}
                                                                        {minGeMax && (
                                                                            <p className="text-xs text-red-500 flex items-center gap-1">
                                                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block flex-shrink-0" />
                                                                                Min must be &lt; Max
                                                                            </p>
                                                                        )}
                                                                        {!minGeMax && gapError && (
                                                                            <p className="text-xs text-red-500 flex items-center gap-1">
                                                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block flex-shrink-0" />
                                                                                Must start at {prev.max + 1}
                                                                            </p>
                                                                        )}
                                                                        {!minGeMax && lastMaxError && (
                                                                            <p className="text-xs text-red-500 flex items-center gap-1">
                                                                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block flex-shrink-0" />
                                                                                Last max must equal {totalMaxScore}
                                                                            </p>
                                                                        )}
                                                                    </div>

                                                                    {/* Color */}
                                                                    <div className="space-y-1 relative self-start">
                                                                        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Color</Label>
                                                                        <div className="flex items-center justify-start">
                                                                            <FastColorPicker
                                                                                value={level.color}
                                                                                onChange={(color) => handleScoreLevelFieldChange(levelIdx, 'color', color)}
                                                                                popoverSide="right"
                                                                                popoverAlign="start"
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )}
                                    {/* ── Step 6 : Assessment Criteria (conditionnel) ── */}
                                    {step.title === 'Assessment Criteria' && (
                                        <Card className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 sm:p-4">
                                            <CardHeader className="p-0 mb-3">
                                                <CardTitle className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">Assessment Criteria</CardTitle>
                                                <CardDescription className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">Define criteria for multi-dimensional risk assessment</CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-0 pt-2">
                                                {data.criterias.map((criteria, criteriaIndex) => (
                                                    <div key={criteriaIndex} className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3 mb-3">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Criteria {criteriaIndex + 1}</h4>
                                                            <Button type="button" variant="destructive" size="sm" onClick={() => removeCriteria(criteriaIndex)} className="bg-red-500 hover:bg-red-600 text-white">
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <div className="space-y-2">
                                                                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Criteria Name</Label>
                                                                <Input
                                                                    value={criteria.name}
                                                                    onChange={e => handleCriteriaChange(criteriaIndex, 'name', e.target.value)}
                                                                    placeholder="e.g., Financial"
                                                                    className={`border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-rose-500 ${criteria.name.trim() === '' ? 'border-red-500 dark:border-red-500' : ''}`}
                                                                />
                                                                {criteria.name.trim() === '' && (
                                                                    <p className="text-xs text-red-500 flex items-center gap-1">
                                                                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block flex-shrink-0" />
                                                                        Criteria name is required
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="space-y-2">
                                                                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Description</Label>
                                                                <Textarea value={criteria.description} onChange={e => handleCriteriaChange(criteriaIndex, 'description', e.target.value)} placeholder="Optional description" className="border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-rose-500 min-h-[50px]" />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Impact Levels for this Criteria</Label>
                                                            {criteria.impacts.map((impact, impactIndex) => (
                                                                <div key={impactIndex} className="grid grid-cols-1 md:grid-cols-3 gap-2 p-2 rounded border border-slate-200 dark:border-slate-600">
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Impact Label</Label>
                                                                        <Input value={impact.impact_label} onChange={e => handleCriteriaImpactChange(criteriaIndex, impactIndex, 'impact_label', e.target.value)} placeholder="e.g., Low" className="bg-slate-50 dark:bg-slate-600 border-slate-200 dark:border-slate-500 focus:ring-2 focus:ring-rose-500 text-sm" />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Score</Label>
                                                                        <Input type="number" step="0.1" value={impact.score} onChange={e => handleCriteriaImpactChange(criteriaIndex, impactIndex, 'score', parseFloat(e.target.value))} className="bg-slate-50 dark:bg-slate-600 border-slate-200 dark:border-slate-500 focus:ring-2 focus:ring-rose-500 text-sm" />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Order</Label>
                                                                        <Input type="number" value={impact.order} onChange={e => handleCriteriaImpactChange(criteriaIndex, impactIndex, 'order', parseInt(e.target.value))} className="bg-slate-50 dark:bg-slate-600 border-slate-200 dark:border-slate-500 focus:ring-2 focus:ring-rose-500 text-sm" />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                                <Button type="button" variant="outline" onClick={addCriteria} className="w-full border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300">
                                                    <Plus className="h-3 w-3 mr-2" />Add Criteria
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    )}

                                </StepperContent>
                            ))}
                        </StepperPanel>

                        {/* ── Navigation sticky ── */}
                        <div className="sticky bottom-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 py-3 sm:py-4 px-3 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
                            <Button
                                type="button"
                                variant="outline"
                                disabled={currentStep === 1}
                                onClick={() => {
                                    setCurrentStep(prev => prev - 1);
                                    setIsSubmitting(false);
                                }}
                                className="border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto order-2 sm:order-1"
                            >
                                <ArrowLeft className="mr-2 size-3" /> Previous
                            </Button>

                            <div className="flex gap-2 w-full sm:w-auto order-1 sm:order-2">
                                {currentStep < dynamicSteps.length ? (
                                    <Button
                                        type="button"
                                        disabled={!isStepValid}
                                        onClick={() => {
                                            setCurrentStep(prev => prev + 1);
                                            setIsSubmitting(false);
                                        }}
                                        className="bg-rose-600 hover:bg-rose-700 text-white flex-1 sm:flex-none disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next Step
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={processing || !isStepValid}
                                        onClick={() => setIsSubmitting(true)}
                                        className="disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {processing ? (
                                            <><LoaderCircle className="mr-2 size-3 animate-spin" />Creating...</>
                                        ) : (
                                            <><Check className="mr-2 size-3" />Create Configuration</>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Stepper>
                </form>
            </div>
        </AppLayout>
    );
}
