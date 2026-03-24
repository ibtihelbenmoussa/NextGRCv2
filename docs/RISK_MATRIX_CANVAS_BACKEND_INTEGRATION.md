# Risk Matrix Canvas Backend Integration

## Overview
Updated the `risk-matrix-canvas.tsx` component to use the new `BackendRiskData` interface instead of hardcoded values.

## Key Changes

### 1. Interface Updates
- Added `BackendRiskData` interface with complete backend data structure
- Updated `RiskMatrixCanvasProps` to accept `riskData: BackendRiskData` instead of individual props
- Removed hardcoded props: `rows`, `columns`, `scoreScale`, `customLevels`, `onLevelsChange`

### 2. Dynamic Matrix Dimensions
- Matrix dimensions now derived from `riskData.impact_scale_max` and `riskData.probability_scale_max`
- `rows = riskData.probability_scale_max`
- `columns = riskData.impact_scale_max`

### 3. Risk Levels Integration
- Risk levels now generated from `riskData.score_levels` array
- Levels sorted by `order` field
- Each level uses `label`, `color`, `min`, and `max` from backend data

### 4. Label System
- Likelihood labels now use `riskData.probabilities` array
- Consequence labels now use `riskData.impacts` array
- Labels matched by score value using `parseInt(score)`

### 5. Calculation Method Support
- Added `calculateScore()` function supporting multiple calculation methods:
  - `multiplication`: likelihood × consequence (default)
  - `addition`: likelihood + consequence
  - `average`: (likelihood + consequence) / 2
- All score calculations throughout the component updated to use this function

### 6. UI Updates
- Header now displays `riskData.name` instead of generic "Risk Assessment Matrix"
- Subtitle shows calculation method and number of risk levels
- All tooltip and display logic updated to use backend data

### 7. Performance Optimizations
- Cache clearing logic updated to include `riskData.calculation_method`
- useEffect dependencies updated to include new data sources

## Usage Example

```tsx
const riskData: BackendRiskData = {
  id: 1,
  name: "Enterprise Risk Matrix",
  impact_scale_max: 5,
  probability_scale_max: 5,
  calculation_method: "multiplication",
  use_criterias: true,
  impacts: [
    { id: 1, label: "Very Low", score: "1", color: null, order: 1 },
    { id: 2, label: "Low", score: "2", color: null, order: 2 },
    // ... more impacts
  ],
  probabilities: [
    { id: 1, label: "Very Low", score: "1", order: 1 },
    { id: 2, label: "Low", score: "2", order: 2 },
    // ... more probabilities
  ],
  score_levels: [
    { id: 1, label: "Low", min: 1, max: 6, color: "#22c55e", order: 1 },
    { id: 2, label: "Medium", min: 7, max: 12, color: "#eab308", order: 2 },
    { id: 3, label: "High", min: 13, max: 20, color: "#ef4444", order: 3 },
    { id: 4, label: "Extreme", min: 21, max: 25, color: "#dc2626", order: 4 },
  ]
};

<RiskMatrixCanvas 
  riskData={riskData}
  onCellClick={(likelihood, consequence, score) => {
    console.log(`Clicked: L${likelihood} C${consequence} Score:${score}`);
  }}
/>
```

## Benefits
- Complete backend integration
- Flexible calculation methods
- Dynamic matrix dimensions
- Customizable risk levels and labels
- Maintains all existing functionality (tooltips, responsive design, etc.)
