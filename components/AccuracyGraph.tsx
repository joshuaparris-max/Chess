import React from 'react'

type Props = { accuracy: number[] }

export default function AccuracyGraph({ accuracy }: Props) {
  // Minimal, dependency-free SVG sparkline for move accuracy
  const width = 600
  const height = 120
  const max = Math.max(...accuracy, 100)
  const min = Math.min(...accuracy, 0)
  const points = accuracy.map((v, i) => {
    const x = (i / Math.max(1, accuracy.length - 1)) * width
    const y = height - ((v - min) / Math.max(1, max - min)) * height
    return `${x},${y}`
  })
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        fill="none"
        stroke="#2563eb"
        strokeWidth={2}
        points={points.join(' ')}
      />
    </svg>
  )
}
