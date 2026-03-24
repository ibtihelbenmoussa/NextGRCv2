import React from "react"
import {
    Bar,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
    ResponsiveContainer,
    ComposedChart,
    Cell
} from "recharts"

interface HistoryItem {
    score: number
    resImpact: number
    resProbability: number
    created_at: string
}

interface ScoreLevel {
    min: number
    max: number
    color: string
}

interface Config {
    score_levels: ScoreLevel[]
}

interface Props {
    history: HistoryItem[]
    config: Config
}

export default function RiskHistoryChart({ history, config }: Props) {

    // detect dark mode automatically
    const isDark =
        typeof document !== "undefined" &&
        document.documentElement.classList.contains("dark")

    const axisColor = isDark ? "#cbd5f5" : "#374151"
    const gridColor = isDark ? "#374151" : "#e5e7eb"
    const tooltipBg = isDark ? "#1f2937" : "#ffffff"
    const tooltipText = isDark ? "#ffffff" : "#000000"
    const lineColor = isDark ? "#60a5fa" : "#2563eb"

    const data = [...history]
        .map((item) => {

            let color = "#6b7280"

            config.score_levels.forEach((level) => {
                if (item.score >= level.min && item.score <= level.max) {
                    color = level.color
                }
            })

            return {
                date: new Date(item.created_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short"
                }),
                score: item.score,
                impact: item.resImpact,
                probability: item.resProbability,
                color
            }
        })
        .reverse()

    const CustomTooltip = ({ active, payload }: any) => {

        if (active && payload && payload.length) {

            const item = payload[0].payload

            return (
                <div
                    style={{
                        background: tooltipBg,
                        color: tooltipText,
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        fontSize: "13px"
                    }}
                >
                    <b>Date:</b> {item.date}
                    <br />
                    <b>Score:</b> {item.score}
                    <br />
                    <b>Impact:</b> {item.impact}
                    <br />
                    <b>Probability:</b> {item.probability}
                </div>
            )
        }

        return null
    }

    return (
        <div className="w-full h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data}>

                    <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />

                    <XAxis
                        dataKey="date"
                        stroke={axisColor}
                        tick={{ fill: axisColor }}
                    />

                    <YAxis
                        stroke={axisColor}
                        tick={{ fill: axisColor }}
                    />

                    <Tooltip content={<CustomTooltip />} />

                    <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={index} fill={entry.color} />
                        ))}
                    </Bar>

                    <Line
                        type="monotone"
                        dataKey="score"
                        stroke={lineColor}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                    />

                </ComposedChart>
            </ResponsiveContainer>
        </div>
    )
}