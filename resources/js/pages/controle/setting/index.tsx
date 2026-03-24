import React, { useState, useEffect } from "react";
import { Head, usePage, router, Link} from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/layouts/app-layout";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, Shield } from 'lucide-react'
export default function SettingsControlsIndex() {
    const { activeConfiguration, savedMatrix } = usePage().props as any;

    const [matrix, setMatrix] = useState<any>({});
    //  const activeConfiguration = !activeConfiguration || Object.keys(activeConfiguration).length === 0;
    useEffect(() => {
        if (savedMatrix) {
            setMatrix(savedMatrix);
        }
    }, [savedMatrix]);

    const calculateScore = (impact: string, probability: string) => {
        return Number(impact) * Number(probability);
    };

    const getScoreLevel = (score: number) => {
        return activeConfiguration.score_levels.find(
            (level: any) => score >= level.min && score <= level.max
        );
    };

    const handleChange = (
        levelLabel: string,
        type: string,
        field: string,
        value: string
    ) => {
        setMatrix((prev: any) => ({
            ...prev,
            [levelLabel]: {
                ...prev[levelLabel],
                [type]: {
                    ...prev[levelLabel]?.[type],
                    [field]: value,
                },
            },
        }));
    };

    const saveSettings = () => {
        router.post(
            "/controls/settings/store",
            { matrix },
            {
                preserveScroll: true,
            }
        );
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: "Controls", href: "/controls" },
                { title: "Settings", href: "/controls/settings" },
            ]}
        >
            <Head title="Control Settings" />

            <div className="p-8 space-y-8">

                <div>
                    <h1 className="text-3xl font-bold">

                    </h1>

                    <p className="text-muted-foreground">

                    </p>
                </div>


                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold"> Control Effectiveness Matrix</h1>
                        <p className="text-muted-foreground">
                            {activeConfiguration && `Configuration: ${activeConfiguration?.name}`}
                        </p>
                    </div>

                    <Button variant="outline" asChild>
                        <Link href="/controls">
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                </div>


                <Card className="rounded-xl border shadow-md">

                    <CardHeader>
                        <CardTitle>Residual Risk Configuration</CardTitle>
                    </CardHeader>

                    <CardContent className="overflow-x-auto">
                        {!activeConfiguration ? (

                            <div className="text-center py-16 space-y-4">

                                <h2 className="text-xl font-semibold">
                                    Control Matrix Not Configured
                                </h2>

                                <p className="text-muted-foreground max-w-xl mx-auto">
                                    The control effectiveness matrix has not been configured yet.
                                    Please define the residual risk values by selecting the appropriate
                                    impact and probability levels for each control effectiveness category.
                                </p>

                                <p className="text-muted-foreground">
                                    Once the matrix is completed, you can save the configuration.
                                </p>

                            </div>

                        ) : (
                            <table className="w-full border-collapse text-sm">

                                <thead className="bg-muted/40">
                                    <tr>
                                        <th className="p-4 text-left border">Inherent Risk</th>
                                        <th className="p-4 text-center border">Effective</th>
                                        <th className="p-4 text-center border">Partial</th>
                                        <th className="p-4 text-center border">Ineffective</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {activeConfiguration?.score_levels?.map((level: any) => (

                                        <tr key={level.id} className="border-t">

                                            <td className="p-4 border">

                                                <Badge
                                                    style={{
                                                        backgroundColor: `${level.color}20`,
                                                        color: level.color,
                                                        border: `1px solid ${level.color}`,
                                                    }}
                                                >
                                                    {level.label}
                                                </Badge>

                                            </td>

                                            {["effective", "partial", "none"].map((type) => {

                                                const selectedImpact = String(
                                                    matrix[level.label]?.[type]?.impact ?? "0"
                                                );

                                                const selectedProbability = String(
                                                    matrix[level.label]?.[type]?.probability ?? "0"
                                                );

                                                const score = calculateScore(
                                                    selectedImpact,
                                                    selectedProbability
                                                );

                                                const scoreLevel = getScoreLevel(score);

                                                return (
                                                    <td key={type} className="p-4 border align-top">

                                                        <div className="space-y-4">

                                                            {/* Impact */}

                                                            <Select
                                                                value={selectedImpact}
                                                                onValueChange={(value) =>
                                                                    handleChange(level.label, type, "impact", value)
                                                                }
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Impact" />
                                                                </SelectTrigger>

                                                                <SelectContent>

                                                                    <SelectItem value="0">
                                                                        None (0)
                                                                    </SelectItem>

                                                                    {activeConfiguration.impacts.map((imp: any) => {

                                                                        const score = String(parseInt(imp.score));

                                                                        return (
                                                                            <SelectItem
                                                                                key={imp.id}
                                                                                value={score}
                                                                            >
                                                                                {imp.label} ({score})
                                                                            </SelectItem>
                                                                        );
                                                                    })}

                                                                </SelectContent>
                                                            </Select>

                                                            {/* Probability */}

                                                            <Select
                                                                value={selectedProbability}
                                                                onValueChange={(value) =>
                                                                    handleChange(level.label, type, "probability", value)
                                                                }
                                                            >
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Probability" />
                                                                </SelectTrigger>

                                                                <SelectContent>

                                                                    <SelectItem value="0">
                                                                        None (0)
                                                                    </SelectItem>

                                                                    {activeConfiguration.probabilities.map((prob: any) => {

                                                                        const score = String(parseInt(prob.score));

                                                                        return (
                                                                            <SelectItem
                                                                                key={prob.id}
                                                                                value={score}
                                                                            >
                                                                                {prob.label} ({score})
                                                                            </SelectItem>
                                                                        );
                                                                    })}

                                                                </SelectContent>
                                                            </Select>

                                                            {/* Score */}

                                                            <div
                                                                className="text-center py-2 rounded-md text-sm font-semibold text-white"
                                                                style={{
                                                                    backgroundColor:
                                                                        score === 0
                                                                            ? "#6b7280"
                                                                            : scoreLevel?.color || "#6b7280",
                                                                }}
                                                            >
                                                                {score === 0
                                                                    ? "No Risk (0)"
                                                                    : `${scoreLevel?.label} (${score})`}
                                                            </div>

                                                        </div>

                                                    </td>
                                                );
                                            })}

                                        </tr>

                                    ))}

                                </tbody>

                            </table>
                        )}
                    </CardContent>

                </Card>

                <div className="flex justify-end">

                    {activeConfiguration && (
                        <Button onClick={saveSettings}>
                            Save Configuration
                        </Button>
                    )}

                </div>

            </div>

        </AppLayout>
    );
}
