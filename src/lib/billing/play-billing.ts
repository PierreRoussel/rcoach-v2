import type { BillingPeriod } from '@/lib/billing/product-ids'
import {
  billingPeriodFromPlayProductId,
  playProductIdForBillingPeriod,
  readPlayProductIds,
} from '@/lib/billing/product-ids'
import { verifyPlayPurchase } from '@/lib/billing/billing-api'

type CdvStore = {
  ready(): Promise<void>
  register(product: CdvProductDefinition): void
  initialize(platforms: CdvPlatform[]): Promise<void>
  get(productId: string, platform: CdvPlatform): CdvProduct | undefined
  order(offer: CdvOffer): Promise<void>
  update(): Promise<void>
  when(): CdvStoreWhen
  error(callback: (error: unknown) => void): void
}

type CdvProduct = {
  id: string
  offers: CdvOffer[]
  getOffer(platform?: CdvPlatform): CdvOffer | undefined
}

type CdvOffer = {
  id: string
  pricingPhases?: Array<{ price?: string }>
}

type CdvProductDefinition = {
  id: string
  type: string
  platform: CdvPlatform
}

type CdvPlatform = 'google_play'
type CdvTransaction = {
  products: Array<{ id: string }>
  purchaseId?: string
  transactionId?: string
  nativePurchase?: {
    purchaseToken?: string
  }
  finish(): Promise<void>
  verify(): Promise<void>
}

type CdvReceipt = {
  finish(): Promise<void>
}

type CdvStoreWhen = {
  productUpdated(callback: (product: CdvProduct) => void): CdvStoreWhen
  approved(callback: (transaction: CdvTransaction) => void): CdvStoreWhen
  verified(callback: (receipt: CdvReceipt) => void): CdvStoreWhen
}

type CdvPurchaseNamespace = {
  Platform: { GOOGLE_PLAY: CdvPlatform }
  ProductType: { PAID_SUBSCRIPTION: string }
  store: CdvStore
}

declare global {
  interface Window {
    CdvPurchase?: CdvPurchaseNamespace
  }
}

let storeInitPromise: Promise<CdvStore> | null = null
let pendingAccessToken: string | null = null

function getCdvPurchase(): CdvPurchaseNamespace {
  const cdv = window.CdvPurchase
  if (!cdv?.store) {
    throw new Error('Google Play Billing indisponible sur cet appareil.')
  }

  return cdv
}

async function getInitializedStore(): Promise<CdvStore> {
  if (!storeInitPromise) {
    storeInitPromise = (async () => {
      const cdv = getCdvPurchase()
      const store = cdv.store
      const productIds = readPlayProductIds()

      store.register({
        id: productIds.monthly,
        type: cdv.ProductType.PAID_SUBSCRIPTION,
        platform: cdv.Platform.GOOGLE_PLAY,
      })
      store.register({
        id: productIds.annual,
        type: cdv.ProductType.PAID_SUBSCRIPTION,
        platform: cdv.Platform.GOOGLE_PLAY,
      })

      store.when().approved(async (transaction) => {
        const productId = transaction.products[0]?.id
        const purchaseToken = transaction.nativePurchase?.purchaseToken
        const billingPeriod = productId
          ? billingPeriodFromPlayProductId(productId)
          : null

        if (productId && purchaseToken && billingPeriod && pendingAccessToken) {
          await verifyPlayPurchase(pendingAccessToken, {
            productId,
            purchaseToken,
            billingPeriod,
          })
        }

        await transaction.finish()
      })

      store.error((error) => {
        console.error('Play Billing error', error)
      })

      await store.initialize([cdv.Platform.GOOGLE_PLAY])
      await store.ready()
      await store.update()

      return store
    })()
  }

  return storeInitPromise
}

export async function purchasePlaySubscription(
  accessToken: string,
  billingPeriod: BillingPeriod,
): Promise<void> {
  pendingAccessToken = accessToken
  const store = await getInitializedStore()
  const cdv = getCdvPurchase()
  const productId = playProductIdForBillingPeriod(billingPeriod)
  const product = store.get(productId, cdv.Platform.GOOGLE_PLAY)
  const offer = product?.getOffer(cdv.Platform.GOOGLE_PLAY)

  if (!offer) {
    throw new Error('Offre Google Play introuvable. Vérifiez la configuration Play Console.')
  }

  await store.order(offer)
}

export async function restorePlayPurchases(accessToken: string): Promise<void> {
  pendingAccessToken = accessToken
  const store = await getInitializedStore()
  await store.update()
}

export function openPlaySubscriptionManagement(): void {
  const url = 'https://play.google.com/store/account/subscriptions'
  window.open(url, '_blank', 'noopener,noreferrer')
}
