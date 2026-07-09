/**
 * Phase B — push distant (FCM) — hors scope MVP.
 *
 * Prérequis futurs :
 * - Firebase projet + google-services.json (Android)
 * - @capacitor/push-notifications
 * - Table user_push_tokens (user_id, token, platform, updated_at)
 * - Nhost Function send-trial-reminders + cron Hasura quotidien
 *
 * Les rappels J-5/J-2 sont couverts par les notifications locales Capacitor
 * (`trial-reminder-scheduler.ts`) tant que l'utilisateur a accordé la permission.
 */

export const PUSH_INFRA_PHASE = 'deferred' as const
