import {
  LEGAL_HOSTING,
  LEGAL_PUBLISHER_ADDRESS,
  LEGAL_PUBLISHER_NAME,
  LEGAL_SIRET,
  SUPPORT_EMAIL,
  legalUrl,
} from '@/lib/legal/config'

export const publisherLines = [
  `Éditeur : ${LEGAL_PUBLISHER_NAME}`,
  `Adresse : ${LEGAL_PUBLISHER_ADDRESS}`,
  `SIRET : ${LEGAL_SIRET}`,
  `Contact support : ${SUPPORT_EMAIL}`,
  `Hébergement : ${LEGAL_HOSTING}`,
]

export const privacyContactLine = `Pour exercer vos droits ou poser une question : ${SUPPORT_EMAIL}`

export const privacyPolicyUrl = legalUrl('/legal/privacy')
