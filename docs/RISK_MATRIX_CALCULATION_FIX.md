# Risk Matrix Canvas Calculation Fix

## Issues Identified and Fixed

### 1. **Score Calculation Method Issue**
**Problem**: The `max` calculation method was incorrectly calculating the maximum possible score.

**Before**: 
- `maxScore = rows * columns` (always multiplication)
- For 5x5 matrix with `max` method: `maxScore = 25` ❌

**After**:
- `maxScore` now depends on calculation method:
  - `max` method: `maxScore = Math.max(rows, columns)` = 5 ✅
  - `avg` method: `maxScore = Math.max(rows, columns)` = 5 ✅  
  - Default (multiplication): `maxScore = rows * columns` = 25 ✅

### 2. **Score Data Type Mismatch**
**Problem**: TypeScript types defined `score: number` but actual data had `score: string` (e.g., `"1.00"`, `"2.00"`).

**Before**:
```typescript
interface RiskImpact {
    score: number; // ❌ Wrong type
}
```

**After**:
```typescript
interface RiskImpact {
    score: string; // ✅ Correct type
}
```

### 3. **Score Parsing in Component**
**Problem**: Component was comparing string scores directly with numbers.

**Before**:
```typescript
const probability = activeConfiguration.probabilities.find(p => p.score === likelihood);
```

**After**:
```typescript
const probability = activeConfiguration.probabilities.find(p => parseFloat(p.score) === likelihood);
```

## Expected Results

With your data:
- **Matrix**: 5x5 (probability_scale_max: 5, impact_scale_max: 5)
- **Method**: `max`
- **Max Score**: 5 (not 25)
- **Score Levels**: 
  - Low: 1-9 (but max score is 5, so only 1-5 will be used)
  - Medium: 10-19 (unreachable with max method)
  - High: 20-25 (unreachable with max method)

## Matrix Scores with Max Method

For a 5x5 matrix with `max` calculation:
```
     C1  C2  C3  C4  C5
L5   5   5   5   5   5
L4   4   4   4   4   5
L3   3   3   3   4   5
L2   2   2   3   4   5
L1   1   2   3   4   5
```

## Recommendation

Your score_levels configuration seems to be designed for multiplication method (1-25 range), but you're using `max` method (1-5 range). You should either:

1. **Change calculation method to multiplication**:
   ```json
   "calculation_method": "multiplication"
   ```

2. **Or update score_levels for max method**:
   ```json
   "score_levels": [
     {"label": "Low", "min": 1, "max": 2, "color": "#10b981", "order": 1},
     {"label": "Medium", "min": 3, "max": 4, "color": "#f59e0b", "order": 2},
     {"label": "High", "min": 5, "max": 5, "color": "#ef4444", "order": 3}
   ]
   ```

The component now correctly handles both scenarios!
