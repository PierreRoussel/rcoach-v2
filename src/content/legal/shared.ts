import {
  formatLegalSiren,
  formatLegalSiret,
  LEGAL_ACTIVITY,
  LEGAL_COMPANY_FORM,
  LEGAL_FOUNDED_AT,
  LEGAL_HOSTING,
  LEGAL_PUBLISHER_ADDRESS,
  LEGAL_PUBLISHER_NAME,
  LEGAL_VAT_NUMBER,
  SUPPORT_EMAIL,
  legalUrl,
} from '@/lib/legal/config'

export const publisherLines = [
  `Éditeur : ${LEGAL_PUBLISHER_NAME}`,
  `Forme juridique : ${LEGAL_COMPANY_FORM}`,
  `Adresse du siège : ${LEGAL_PUBLISHER_ADDRESS}`,
  `SIREN : ${formatLegalSiren()}`,
  `SIRET du siège social : ${formatLegalSiret()}`,
  `Numéro de TVA intracommunautaire : ${LEGAL_VAT_NUMBER}`,
  `Date de création : ${LEGAL_FOUNDED_AT}`,
  `Activité (NAF / APE) : ${LEGAL_ACTIVITY}`,
  `Contact support : ${SUPPORT_EMAIL}`,
  `Hébergement : ${LEGAL_HOSTING}`,
]

export const privacyContactLine = `Pour exercer vos droits ou poser une question : ${SUPPORT_EMAIL}`

export const privacyPolicyUrl = legalUrl('/legal/privacy')
