# Risk Level Presets - NextGRC Canvas Risk Matrix

## Overview

The NextGRC risk matrix components use standardized preset naming conventions to ensure consistency across all risk assessment tools. This document outlines the exact naming schemes and color progressions used for different risk level configurations.

## Preset Naming Convention

### 3 Risk Levels
**Names:** Low → Medium → High  
**Colors:** Green → Yellow → Red

```typescript
const threeLevelPreset = [
    { name: "Low", color: "#22c55e" },      // Green
    { name: "Medium", color: "#eab308" },   // Yellow
    { name: "High", color: "#ef4444" }      // Red
];
```

**Use Case:** Simple risk assessments, basic compliance frameworks

### 4 Risk Levels (Most Common)
**Names:** Low → Medium → High → Extreme  
**Colors:** Green → Yellow → Orange → Red

```typescript
const fourLevelPreset = [
    { name: "Low", color: "#22c55e" },      // Green
    { name: "Medium", color: "#eab308" },   // Yellow
    { name: "High", color: "#f97316" },     // Orange
    { name: "Extreme", color: "#ef4444" }   // Red
];
```

**Use Case:** Standard enterprise risk management, most GRC frameworks

### 5 Risk Levels
**Names:** Low → Medium → High → Extreme → Critical  
**Colors:** Green → Yellow → Orange → Red → Dark Red

```typescript
const fiveLevelPreset = [
    { name: "Low", color: "#22c55e" },      // Green
    { name: "Medium", color: "#eab308" },   // Yellow
    { name: "High", color: "#f97316" },     // Orange
    { name: "Extreme", color: "#ef4444" },  // Red
    { name: "Critical", color: "#dc2626" }  // Dark Red
];
```

**Use Case:** Complex risk frameworks, high-stakes environments, detailed risk analysis

## Color Progression System

### Primary Color Palette
The risk matrix uses a scientifically-based color progression from green (safe) to red (dangerous):

1. **#22c55e** - Green (Low Risk)
2. **#84cc16** - Light Green (transition)
3. **#eab308** - Yellow (Medium Risk)
4. **#f97316** - Orange (High Risk)
5. **#ef4444** - Red (Extreme Risk)
6. **#dc2626** - Dark Red (Critical Risk)
7. **#b91c1c** - Darker Red (extended scale)
8. **#991b1b** - Very Dark Red (extended scale)
9. **#7f1d1d** - Darkest Red (extended scale)
10. **#450a0a** - Maroon (maximum risk)

### Color Selection Logic
- **Accessibility**: All colors meet WCAG contrast requirements
- **Cultural Sensitivity**: Universal green-to-red risk progression
- **Professional Appearance**: Suitable for executive presentations
- **Print Compatibility**: Colors maintain distinction in grayscale

## Extended Presets (6+ Levels)

For organizations requiring more granular risk categorization:

### 6 Risk Levels
**Names:** Very Low → Low → Medium → High → Extreme → Critical

### 7+ Risk Levels
**Names:** Very Low → Low → Low-Medium → Medium → Medium-High → High → Very High → Extreme → Critical → Catastrophic

## Implementation Examples

### Basic Implementation
```typescript
import { RiskMatrix } from '@/components/risk-assessment-matrix';

// Uses preset system automatically
<RiskMatrix />
```

### Custom Risk Levels
```typescript
import RiskMatrixCanvas from '@/components/risk-matrix-canvas';

const customLevels = [
    { name: "Low", color: "#22c55e", min: 1, max: 6 },
    { name: "Medium", color: "#eab308", min: 7, max: 12 },
    { name: "High", color: "#f97316", min: 13, max: 18 },
    { name: "Extreme", color: "#ef4444", min: 19, max: 25 }
];

<RiskMatrixCanvas
    scoreScale={4}
    customLevels={customLevels}
/>
```

## Score Distribution

### 5×5 Matrix Examples

#### 3 Risk Levels (25 max score)
- **Low (Green)**: Scores 1-8
- **Medium (Yellow)**: Scores 9-16
- **High (Red)**: Scores 17-25

#### 4 Risk Levels (25 max score)
- **Low (Green)**: Scores 1-6
- **Medium (Yellow)**: Scores 7-12
- **High (Orange)**: Scores 13-18
- **Extreme (Red)**: Scores 19-25

#### 5 Risk Levels (25 max score)
- **Low (Green)**: Scores 1-5
- **Medium (Yellow)**: Scores 6-10
- **High (Orange)**: Scores 11-15
- **Extreme (Red)**: Scores 16-20
- **Critical (Dark Red)**: Scores 21-25

## Best Practices

### Organizational Alignment
1. **Choose appropriate level count** based on risk management maturity
2. **Maintain consistency** across all organizational risk assessments
3. **Document decisions** for audit and compliance purposes
4. **Train users** on the specific terminology used

### Visual Design
1. **Consistent color usage** across all risk matrices
2. **Clear legend display** with risk level names and score ranges
3. **Accessible design** meeting WCAG 2.1 AA standards
4. **Professional presentation** suitable for board-level reporting

### Technical Implementation
1. **Use preset functions** for consistent naming
2. **Document custom modifications** when deviating from presets
3. **Test color combinations** for accessibility compliance
4. **Validate score distributions** match organizational requirements

## Migration Guide

### From Legacy Systems
If migrating from systems with different naming conventions:

1. **Map existing levels** to new preset names
2. **Update documentation** to reflect new terminology
3. **Retrain users** on new risk level names
4. **Maintain historical data** with conversion mapping

### Custom Implementation
For organizations requiring non-standard naming:

```typescript
const organizationLevels = [
    { name: "Negligible", color: "#22c55e", min: 1, max: 5 },
    { name: "Minor", color: "#eab308", min: 6, max: 10 },
    { name: "Moderate", color: "#f97316", min: 11, max: 15 },
    { name: "Major", color: "#ef4444", min: 16, max: 20 },
    { name: "Catastrophic", color: "#dc2626", min: 21, max: 25 }
];
```

## Validation Tools

### Visual Testing
Use the `risk-matrix-color-test.tsx` component to validate:
- Color accuracy across all risk levels
- Score distribution correctness
- Visual accessibility compliance
- Interactive tooltip functionality

### Integration Testing
Verify preset behavior in:
- Risk assessment matrices
- Canvas-based visualizations
- Interactive configuration interfaces
- Export and reporting features

## Compliance Standards

### Industry Frameworks
The preset system aligns with:
- **ISO 31000** - Risk Management Guidelines
- **COSO ERM** - Enterprise Risk Management Framework
- **NIST Cybersecurity Framework**
- **Basel III** - Banking Regulations
- **Solvency II** - Insurance Regulations

### Regulatory Requirements
- **SOX Compliance** - Risk assessment documentation
- **GDPR** - Data protection risk assessments
- **HIPAA** - Healthcare risk management
- **PCI DSS** - Payment card industry security

## Conclusion

The standardized preset system ensures that NextGRC risk matrices provide consistent, professional, and accessible risk visualization across all organizational contexts. By following these presets, organizations can maintain coherent risk communication while benefiting from proven color psychology and accessibility standards.

For questions or custom requirements, consult the NextGRC development team or refer to the comprehensive API documentation.

---

*Last updated: December 2024*
*Version: 2.0*