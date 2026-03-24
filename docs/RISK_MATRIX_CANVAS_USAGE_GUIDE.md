# Risk Matrix Canvas Usage Guide

## Overview
The `RiskMatrixCanvas` component has been updated to work with the existing `RiskConfiguration` type from your risk configuration system.

## Basic Usage

### 1. Simple Integration
```tsx
import RiskMatrixCanvas from '@/components/risk-matrix-canvas';
import { RiskConfiguration } from '@/types/risk-configuration';

// In your component
<RiskMatrixCanvas
    activeConfiguration={activeConfiguration}
    onCellClick={(likelihood, consequence, score) => {
        console.log(`Clicked: L${likelihood} C${consequence} Score:${score}`);
    }}
/>
```

### 2. With Conditional Rendering
```tsx
{activeConfiguration ? (
    <Card>
        <CardHeader>
            <CardTitle>Risk Matrix</CardTitle>
        </CardHeader>
        <CardContent>
            <RiskMatrixCanvas
                activeConfiguration={activeConfiguration}
                onCellClick={(likelihood, consequence, score) => {
                    // Handle cell click
                }}
            />
        </CardContent>
    </Card>
) : (
    <Card>
        <CardContent>
            <p>No active configuration available</p>
        </CardContent>
    </Card>
)}
```

### 3. With Custom Styling
```tsx
<RiskMatrixCanvas
    activeConfiguration={activeConfiguration}
    width={800}
    height={800}
    showScores={true}
    className="my-custom-class"
    onCellClick={(likelihood, consequence, score) => {
        // Handle click
    }}
/>
```

## Advanced Usage Examples

### 1. Filter Risks by Matrix Cell
```tsx
const handleMatrixCellClick = (likelihood: number, consequence: number, score: number) => {
    // Filter risks that match this likelihood and consequence
    const filteredRisks = risks.data.filter(risk => 
        risk.likelihood === likelihood && risk.consequence === consequence
    );
    
    // Update your state or trigger a search
    setFilteredRisks(filteredRisks);
    
    // Or navigate to a filtered view
    router.visit(`/risks?likelihood=${likelihood}&consequence=${consequence}`);
};
```

### 2. Risk Creation from Matrix
```tsx
const handleMatrixCellClick = (likelihood: number, consequence: number, score: number) => {
    // Pre-fill risk creation form with matrix values
    router.visit(`/risks/create?likelihood=${likelihood}&consequence=${consequence}&score=${score}`);
};
```

### 3. Risk Analysis Dashboard
```tsx
const [selectedCell, setSelectedCell] = useState<{
    likelihood: number;
    consequence: number;
    score: number;
} | null>(null);

const handleMatrixCellClick = (likelihood: number, consequence: number, score: number) => {
    setSelectedCell({ likelihood, consequence, score });
    
    // Fetch risks for this cell
    fetchRisksForCell(likelihood, consequence);
};

// Display selected cell info
{selectedCell && (
    <div className="mt-4 p-4 bg-muted rounded-lg">
        <h3 className="font-semibold">Selected Risk Level</h3>
        <p>Likelihood: {selectedCell.likelihood}</p>
        <p>Consequence: {selectedCell.consequence}</p>
        <p>Score: {selectedCell.score}</p>
    </div>
)}
```

## RiskConfiguration Structure

The component expects a `RiskConfiguration` object with this structure:

```typescript
interface RiskConfiguration {
    id?: number;
    name: string;
    impact_scale_max: number;        // Number of columns
    probability_scale_max: number;  // Number of rows
    calculation_method: 'avg' | 'max'; // How scores are calculated
    use_criterias: boolean;
    impacts: RiskImpact[];           // Consequence levels
    probabilities: RiskProbability[]; // Likelihood levels
    score_levels?: RiskScoreLevel[]; // Risk level definitions
}

interface RiskImpact {
    id?: number;
    label: string;      // e.g., "Very Low", "Low", "Medium"
    score: number;      // Numeric score (1, 2, 3, etc.)
    order: number;      // Display order
    color?: string;     // Optional color
}

interface RiskProbability {
    id?: number;
    label: string;      // e.g., "Very Low", "Low", "Medium"
    score: number;      // Numeric score (1, 2, 3, etc.)
    order: number;      // Display order
    color?: string;     // Optional color
}

interface RiskScoreLevel {
    label: string;      // e.g., "Low Risk", "Medium Risk"
    min: number;        // Minimum score for this level
    max: number;        // Maximum score for this level
    color: string;      // Color for this risk level
    order: number;      // Display order
}
```

## Calculation Methods

The component supports different calculation methods based on `activeConfiguration.calculation_method`:

- **`'avg'`**: Average of likelihood and consequence
  - Score = (likelihood + consequence) / 2
- **`'max'`**: Maximum of likelihood and consequence
  - Score = max(likelihood, consequence)
- **Default**: Multiplication (if method not specified)
  - Score = likelihood × consequence

## Component Props

```typescript
interface RiskMatrixCanvasProps {
    width?: number;                    // Canvas width (default: 600)
    height?: number;                   // Canvas height (default: 600)
    showScores?: boolean;              // Show score numbers in cells (default: true)
    activeConfiguration: RiskConfiguration; // Required: Risk configuration data
    onCellClick?: (likelihood: number, consequence: number, score: number) => void;
    className?: string;                 // Additional CSS classes
}
```

## Features

- **Responsive Design**: Automatically adjusts to container size
- **Interactive Tooltips**: Hover to see detailed cell information
- **Click Handling**: Click cells to trigger custom actions
- **Dynamic Colors**: Uses colors from your risk configuration
- **Smooth Interpolation**: Beautiful color gradients between risk levels
- **Accessibility**: Keyboard navigation and screen reader support

## Integration Tips

1. **Always check for activeConfiguration**: The component requires a valid configuration
2. **Handle missing score_levels**: The component gracefully handles missing score levels
3. **Use onCellClick for interactivity**: This is where you add your business logic
4. **Consider performance**: The component caches calculations for better performance
5. **Responsive containers**: Wrap in responsive containers for best results

## Example Complete Integration

```tsx
import { useState } from 'react';
import RiskMatrixCanvas from '@/components/risk-matrix-canvas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function RiskDashboard({ activeConfiguration, risks }) {
    const [selectedRiskLevel, setSelectedRiskLevel] = useState(null);

    const handleCellClick = (likelihood, consequence, score) => {
        setSelectedRiskLevel({ likelihood, consequence, score });
        
        // Filter risks for this level
        const risksAtLevel = risks.filter(risk => 
            risk.likelihood === likelihood && risk.consequence === consequence
        );
        
        console.log(`Found ${risksAtLevel.length} risks at this level`);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Risk Assessment Matrix</CardTitle>
                </CardHeader>
                <CardContent>
                    {activeConfiguration ? (
                        <RiskMatrixCanvas
                            activeConfiguration={activeConfiguration}
                            onCellClick={handleCellClick}
                        />
                    ) : (
                        <p>No active configuration</p>
                    )}
                </CardContent>
            </Card>
            
            {selectedRiskLevel && (
                <Card>
                    <CardHeader>
                        <CardTitle>Selected Risk Level</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Likelihood: {selectedRiskLevel.likelihood}</p>
                        <p>Consequence: {selectedRiskLevel.consequence}</p>
                        <p>Score: {selectedRiskLevel.score}</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
```
