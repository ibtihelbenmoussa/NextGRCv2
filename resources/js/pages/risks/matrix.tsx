import { RiskMatrixORM } from '@/components/risk-matrix-orm';
import AppLayout from '@/layouts/app-layout';
import { RiskConfiguration } from '@/types/risk-configuration';
import { Head } from '@inertiajs/react';
import { useState } from 'react';

interface Risk {
    id: number;
    name: string;
    inherent_impact: number;
    inherent_likelihood: number;
    residual_impact?: number;
    residual_likelihood?: number;
}

interface Props {
    initialConfiguration?: RiskConfiguration;
    risks?: Risk[];
}

export default function RiskMatrixPage({ initialConfiguration, risks = [] }: Props) {
    const [selectedRisk, setSelectedRisk] = useState<Risk | null>(null);

    const handleRiskClick = (risk: Risk) => {
        setSelectedRisk(risk);
    };

    const handleCellClick = (impact: number, probability: number) => {
        console.log(`Cell clicked: Impact ${impact}, Probability ${probability}`);
    };

    if (!initialConfiguration) {
        return (
            <AppLayout
                breadcrumbs={[
                    { title: 'Risks', href: '/risks' },
                    { title: 'Assessment Matrix', href: '/risks/matrix' },
                ]}
            >
                <Head title="Risk Assessment Matrix" />
                <div className="flex items-center justify-center py-16">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">No Risk Configuration</h3>
                        <p className="text-muted-foreground mb-4">
                            Please create a risk configuration first to view the assessment matrix.
                        </p>
                        <a 
                            href="/risk-configurations/create" 
                            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            Create Configuration
                        </a>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Risks', href: '/risks' },
                { title: 'Assessment Matrix', href: '/risks/matrix' },
            ]}
        >
            <Head title="Risk Assessment Matrix" />
            <RiskMatrixORM
                configuration={initialConfiguration}
                risks={risks}
                onRiskClick={handleRiskClick}
                onCellClick={handleCellClick}
                showScores={true}
            />
        </AppLayout>
    );
}
