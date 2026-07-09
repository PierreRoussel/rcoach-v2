import { publisherLines } from '@/content/legal/shared'
import type { LegalDocument } from '@/content/legal/types'
import { APP_VERSION, LEGAL_PUBLISHER_NAME } from '@/lib/legal/config'

export const legalNoticeDocument: LegalDocument = {
  title: 'Mentions légales',
  description: `Informations légales sur l’éditeur de ${LEGAL_PUBLISHER_NAME}.`,
  sections: [
    {
      id: 'editeur',
      title: 'Éditeur du site et de l’application',
      paragraphs: publisherLines,
    },
    {
      id: 'application',
      title: 'Application',
      paragraphs: [
        `Nom : RCoach`,
        `Version : ${APP_VERSION}`,
        `Plateformes : web, PWA, Android (Google Play).`,
      ],
    },
    {
      id: 'propriete',
      title: 'Propriété intellectuelle',
      paragraphs: [
        `L’ensemble des éléments de l’application (textes, design, logo, code) est protégé. Toute reproduction non autorisée est interdite.`,
      ],
    },
  ],
}
