export const costPerStepInStars = 1.47

export function calculateTrainingCostInStars(steps: number): number {
  const totalCostInStars = steps * costPerStepInStars

  // Округляем до одного знака после запятой
  return parseFloat(totalCostInStars.toFixed(2))
}

export function calculateTrainingCostInDollars(steps: number): number {
  const totalCostInStars = steps * costPerStepInStars

  // Округляем до одного знака после запятой
  return parseFloat(totalCostInStars.toFixed(2))
}
export function calculateTrainingCostInRub(steps: number): number {
  const totalCostInStars = steps * costPerStepInStars

  // Округляем до одного знака после запятой
  return parseFloat(totalCostInStars.toFixed(2))
}
