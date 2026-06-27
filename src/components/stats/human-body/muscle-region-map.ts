/** SVG region ids from rcoach-admin human-body model → stats intensity keys. */
export const SVG_MUSCLE_TO_INTENSITY_KEY: Record<string, string> = {
  chest: 'chest',
  abdominals: 'abs',
  obliques: 'abs',
  shoulders: 'shoulders',
  traps: 'shoulders',
  biceps: 'biceps',
  triceps: 'triceps',
  'upper-back': 'back',
  lats: 'back',
  'middle-back': 'back',
  glutes: 'glutes',
  quadriceps: 'legs',
  hamstrings: 'legs',
  forearms: 'forearms',
  calves: 'calves',
}

export const SVG_MUSCLE_LABELS: Record<string, string> = {
  chest: 'Pectoraux',
  abdominals: 'Abdos',
  obliques: 'Obliques',
  shoulders: 'Epaules',
  traps: 'Trapèzes',
  biceps: 'Biceps',
  triceps: 'Triceps',
  'upper-back': 'Dos haut',
  lats: 'Dorsaux',
  'middle-back': 'Lombaires',
  glutes: 'Fessiers',
  quadriceps: 'Quadriceps',
  hamstrings: 'Ischio-jambiers',
  forearms: 'Avant-bras',
  calves: 'Mollets',
}

export function regionFill(intensity: number) {
  const clamped = Math.min(1, Math.max(0, intensity))
  const alpha = 0.14 + clamped * 0.76
  return `color-mix(in srgb, var(--primary) ${Math.round(alpha * 100)}%, var(--muted))`
}

export function applyHumanBodyIntensities(
  svg: SVGSVGElement,
  intensities: Record<string, number>,
) {
  const groups = svg.querySelectorAll<SVGGElement>('.muscle')

  groups.forEach((group) => {
    const muscleId = group.id
    if (!muscleId || muscleId.startsWith('Group_')) {
      return
    }

    const intensityKey = SVG_MUSCLE_TO_INTENSITY_KEY[muscleId]
    const intensity = intensityKey ? (intensities[intensityKey] ?? 0) : 0
    const fill = intensity > 0 ? regionFill(intensity) : 'transparent'
    const label = SVG_MUSCLE_LABELS[muscleId] ?? muscleId
    const percent = Math.round(intensity * 100)

    let title = group.querySelector<SVGTitleElement>('title')
    if (!title) {
      title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
      group.appendChild(title)
    }
    title.textContent = `${label} · ${percent}% d'intensité relative`

    if (intensity > 0) {
      group.dataset.intensity = String(intensity)
      group.style.setProperty('--muscle-fill', fill)
    } else {
      delete group.dataset.intensity
      group.style.removeProperty('--muscle-fill')
    }

    group.querySelectorAll('path').forEach((path) => {
      if (intensity > 0) {
        path.style.fill = fill
        path.style.fillOpacity = '0.82'
      } else {
        path.style.removeProperty('fill')
        path.style.removeProperty('fill-opacity')
      }
    })
  })
}
