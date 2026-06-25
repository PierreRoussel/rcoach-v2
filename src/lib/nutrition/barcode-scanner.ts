import { Capacitor } from '@capacitor/core'

export async function scanBarcode(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) {
    const manual = window.prompt('Saisissez le code-barres')
    return manual?.trim() || null
  }

  try {
    const { BarcodeScanner } = await import('@capacitor-mlkit/barcode-scanning')

    const permission = await BarcodeScanner.checkPermissions()
    if (permission.camera !== 'granted') {
      const requested = await BarcodeScanner.requestPermissions()
      if (requested.camera !== 'granted') {
        throw new Error('Permission camera refusee.')
      }
    }

    const result = await BarcodeScanner.scan()
    const barcode = result.barcodes[0]?.rawValue?.trim()
    return barcode || null
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unable to resolve module')) {
      const manual = window.prompt('Scanner indisponible. Saisissez le code-barres')
      return manual?.trim() || null
    }

    throw error
  }
}
