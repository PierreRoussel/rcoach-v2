/**
 * Auto-entrepreneur — prestations de services libérales (BNC), dont SaaS / logiciel.
 * Taux de cotisations sociales sur le chiffre d'affaires encaissé (URSSAF).
 * @see https://www.autoentrepreneur.urssaf.fr/portail/accueil/une-question/toutes-les-fiches-pratiques/demarrer/monter-son-activite/les-cotisations-sociales.html
 */
export const AUTO_ENTREPRENEUR_BNC_URSSAF_RATE = 0.22

export function revenueCentsAfterUrssaf(grossCents: number): number {
  return Math.round(grossCents * (1 - AUTO_ENTREPRENEUR_BNC_URSSAF_RATE))
}

export function displayRevenueCents(
  grossCents: number,
  showNetAfterUrssaf: boolean,
): number {
  return showNetAfterUrssaf ? revenueCentsAfterUrssaf(grossCents) : grossCents
}

export function revenueDisplaySuffix(showNetAfterUrssaf: boolean): string {
  return showNetAfterUrssaf ? 'net URSSAF' : 'brut'
}
