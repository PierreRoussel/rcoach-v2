import { publisherLines } from '@/content/legal/shared'
import type { LegalDocument } from '@/content/legal/types'
import { LEGAL_PUBLISHER_NAME, SUPPORT_EMAIL } from '@/lib/legal/config'

export const termsDocument: LegalDocument = {
  title: 'Conditions générales d’utilisation',
  description: 'Règles d’utilisation de l’application RCoach.',
  sections: [
    {
      id: 'objet',
      title: '1. Objet',
      paragraphs: [
        `Les présentes CGU régissent l’accès et l’utilisation de l’application ${LEGAL_PUBLISHER_NAME} (web, PWA et Android).`,
        `En créant un compte, vous acceptez ces conditions.`,
      ],
    },
    {
      id: 'service',
      title: '2. Description du service',
      paragraphs: [
        `RCoach permet le suivi d’entraînement, de nutrition, de statistiques, de social entre amis et, en version Premium, des fonctionnalités avancées.`,
        `Le service est fourni « en l’état ». Nous pouvons faire évoluer les fonctionnalités sans préavis majeur.`,
      ],
    },
    {
      id: 'compte',
      title: '3. Compte utilisateur',
      paragraphs: [
        `Vous êtes responsable de la confidentialité de vos identifiants.`,
        `Vous vous engagez à fournir des informations exactes et à ne pas usurper l’identité d’un tiers.`,
        `Vous pouvez supprimer votre compte à tout moment depuis les paramètres.`,
      ],
    },
    {
      id: 'usage',
      title: '4. Usage acceptable',
      paragraphs: [
        `Interdit : utilisation frauduleuse, contournement de la sécurité, harcèlement, contenu illicite, scraping abusif.`,
        `Nous pouvons suspendre ou supprimer un compte en cas de violation grave.`,
      ],
    },
    {
      id: 'contenu',
      title: '5. Contenu utilisateur',
      paragraphs: [
        `Vous conservez vos droits sur les données que vous saisissez (séances, repas, etc.).`,
        `Vous nous accordez une licence limitée pour héberger et traiter ces données afin de fournir le service.`,
      ],
    },
    {
      id: 'sante',
      title: '6. Avertissement santé',
      paragraphs: [
        `RCoach ne remplace pas un avis médical. Consultez un professionnel de santé avant tout changement d’activité physique ou alimentaire.`,
      ],
    },
    {
      id: 'responsabilite',
      title: '7. Responsabilité',
      paragraphs: [
        `${LEGAL_PUBLISHER_NAME} ne saurait être tenu responsable des dommages indirects liés à l’utilisation du service, dans les limites autorisées par la loi.`,
      ],
    },
    {
      id: 'contact',
      title: '8. Contact',
      paragraphs: [...publisherLines, `Support : ${SUPPORT_EMAIL}`],
    },
  ],
}
