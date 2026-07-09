import { publisherLines } from '@/content/legal/shared'
import type { LegalDocument } from '@/content/legal/types'
import { LEGAL_PUBLISHER_NAME, SUPPORT_EMAIL } from '@/lib/legal/config'

export const cgvDocument: LegalDocument = {
  title: 'Conditions générales de vente — Premium',
  description: 'Conditions applicables à l’abonnement RCoach Premium.',
  sections: [
    {
      id: 'offre',
      title: '1. Offre Premium',
      paragraphs: [
        `L’abonnement Premium débloque des fonctionnalités avancées décrites dans l’application.`,
        `Un essai gratuit peut être proposé une seule fois par compte, sauf indication contraire.`,
        `Les tarifs en vigueur sont affichés avant tout achat (mensuel ou annuel).`,
      ],
    },
    {
      id: 'commande',
      title: '2. Souscription',
      paragraphs: [
        `Sur Android : paiement via Google Play selon les conditions Google.`,
        `Sur le web : paiement via Stripe selon les conditions Stripe.`,
        `La souscription prend effet après confirmation du paiement ou activation de l’essai.`,
      ],
    },
    {
      id: 'retractation',
      title: '3. Droit de rétractation',
      paragraphs: [
        `Pour les contrats conclus à distance, vous disposez d’un délai de 14 jours à compter de la souscription, sauf renonciation expresse lors de l’accès immédiat au service numérique.`,
        `Pour les achats via Google Play, les remboursements suivent la politique Google Play.`,
      ],
    },
    {
      id: 'resiliation',
      title: '4. Résiliation',
      paragraphs: [
        `Vous pouvez annuler à tout moment depuis l’application ou la plateforme de paiement (Google Play / Stripe).`,
        `L’accès Premium reste actif jusqu’à la fin de la période en cours, sauf indication contraire.`,
      ],
    },
    {
      id: 'remboursement',
      title: '5. Remboursements',
      paragraphs: [
        `Hors droit légal de rétractation, les sommes versées pour une période entamée ne sont en principe pas remboursées.`,
        `Pour toute réclamation : ${SUPPORT_EMAIL}.`,
      ],
    },
    {
      id: 'editeur',
      title: '6. Éditeur',
      paragraphs: [...publisherLines, `${LEGAL_PUBLISHER_NAME} — CGV Premium`],
    },
  ],
}
