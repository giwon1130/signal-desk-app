import { requireOptionalNativeModule } from 'expo'

export type OcrLine = {
  text: string
  left: number
  top: number
  right: number
  bottom: number
}

export type OcrResult = {
  width: number
  height: number
  lines: OcrLine[]
}

type SignalDeskOcrNativeModule = {
  recognize(imagePath: string): Promise<OcrResult>
}

const nativeModule = requireOptionalNativeModule<SignalDeskOcrNativeModule>('SignalDeskOcr')

export async function recognizePortfolioScreenshot(imagePath: string): Promise<OcrResult> {
  if (!nativeModule) throw new Error('ocr-native-module-unavailable')
  return nativeModule.recognize(imagePath)
}
