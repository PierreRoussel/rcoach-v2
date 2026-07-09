import { publisherLines, privacyContactLine } from '@/content/legal/shared'
import type { LegalDocument } from '@/content/legal/types'
import { LEGAL_PUBLISHER_NAME, SUPPORT_EMAIL } from '@/lib/legal/config'

export const privacyPolicyDocument: LegalDocument = {
  title: 'Politique de confidentialité',
  description:
    'Comment RCoach collecte, utilise et protège vos données personnelles (RGPD).',
  sections: [
    {
      id: 'responsable',
      title: '1. Responsable du traitement',
      paragraphs: [...publisherLines],
    },
    {
      id: 'donnees',
      title: '2. Données collectées',
      paragraphs: [
        `Compte : email, nom affiché, photo de profil (optionnelle), identifiant technique.`,
        `Entraînement : séances, exercices, charges, répétitions, notes, modèles de séance.`,
        `Nutrition : journal alimentaire, objectifs, mesures corporelles (poids, tour de taille).`,
        `Social : code ami, invitations, messages de motivation entre amis.`,
        `Abonnement Premium : statut d’abonnement, période d’essai, identifiants de facturation (Google Play ou Stripe).`,
        `Santé (optionnel, Android) : données d’activité synchronisées via Health Connect si vous activez la fonctionnalité.`,
        `Technique : jetons de session, préférences d’affichage, logs techniques limités.`,
      ],
    },
    {
      id: 'finalites',
      title: '3. Finalités et bases légales',
      paragraphs: [
        `Fourniture du service (exécution du contrat) : compte, suivi sportif, nutrition, social.`,
        `Abonnement Premium (exécution du contrat) : essai, facturation, gestion de l’abonnement.`,
        `Amélioration et sécurité (intérêt légitime) : prévention des abus, support, fiabilité.`,
        `Consentement : connexion Google, Health Connect, notifications si vous les activez.`,
        `Obligations légales : conservation des données de facturation le cas échéant.`,
      ],
    },
    {
      id: 'sous-traitants',
      title: '4. Sous-traitants',
      paragraphs: [
        `Nhost (authentification, base de données, fonctions) — région UE configurée pour le projet.`,
        `Cloudflare Pages (hébergement web/PWA).`,
        `Google (connexion OAuth, Google Play Billing sur Android, Health Connect si activé).`,
        `Stripe (paiement web, le cas échéant).`,
        `Open Food Facts (recherche de produits alimentaires — données de recherche, pas d’identité directe).`,
      ],
    },
    {
      id: 'conservation',
      title: '5. Durées de conservation',
      paragraphs: [
        `Données de compte et d’activité : tant que le compte est actif.`,
        `Après suppression du compte : suppression ou anonymisation sous 30 jours, sauf obligation légale contraire.`,
        `Données de facturation : selon les obligations comptables applicables.`,
        `Journaux techniques : durée limitée (quelques semaines à quelques mois).`,
      ],
    },
    {
      id: 'droits',
      title: '6. Vos droits (RGPD)',
      paragraphs: [
        `Vous disposez des droits d’accès, de rectification, d’effacement, de limitation, d’opposition et de portabilité.`,
        `Vous pouvez supprimer votre compte depuis les paramètres de l’application.`,
        `Pour une demande d’export de données, contactez ${SUPPORT_EMAIL}.`,
        privacyContactLine,
        `Vous pouvez introduire une réclamation auprès de la CNIL (www.cnil.fr).`,
      ],
    },
    {
      id: 'securite',
      title: '7. Sécurité',
      paragraphs: [
        `${LEGAL_PUBLISHER_NAME} met en œuvre des mesures techniques et organisationnelles adaptées (HTTPS, authentification, permissions par rôle).`,
        `Aucune transmission sur Internet n’est totalement sûre ; nous nous efforçons de protéger vos données de manière raisonnable.`,
      ],
    },
    {
      id: 'mineurs',
      title: '8. Mineurs',
      paragraphs: [
        `RCoach n’est pas destiné aux personnes de moins de 16 ans sans consentement parental vérifiable.`,
      ],
    },
    {
      id: 'modifications',
      title: '9. Modifications',
      paragraphs: [
        `Cette politique peut être mise à jour. La date de dernière mise à jour figure en haut de la page.`,
      ],
    },
  ],
}
