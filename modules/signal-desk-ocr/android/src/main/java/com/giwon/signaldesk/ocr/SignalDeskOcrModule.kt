package com.giwon.signaldesk.ocr

import android.net.Uri
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.text.TextRecognition
import com.google.mlkit.vision.text.korean.KoreanTextRecognizerOptions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SignalDeskOcrModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("SignalDeskOcr")

        AsyncFunction("recognize") { imagePath: String, promise: Promise ->
            val context = appContext.reactContext
            if (context == null) {
                promise.reject("ERR_OCR_CONTEXT", "앱 화면을 준비하지 못했습니다.", null)
                return@AsyncFunction
            }

            val image = try {
                InputImage.fromFilePath(context, Uri.parse(imagePath))
            } catch (error: Exception) {
                promise.reject("ERR_OCR_IMAGE", "선택한 이미지를 읽지 못했습니다.", error)
                return@AsyncFunction
            }

            val recognizer = TextRecognition.getClient(KoreanTextRecognizerOptions.Builder().build())
            recognizer.process(image)
                .addOnSuccessListener { result ->
                    val lines = result.textBlocks.flatMap { block ->
                        block.lines.mapNotNull { line ->
                            val box = line.boundingBox ?: return@mapNotNull null
                            mapOf(
                                "text" to line.text,
                                "left" to box.left,
                                "top" to box.top,
                                "right" to box.right,
                                "bottom" to box.bottom,
                            )
                        }
                    }
                    promise.resolve(
                        mapOf(
                            "width" to image.width,
                            "height" to image.height,
                            "lines" to lines,
                        )
                    )
                    recognizer.close()
                }
                .addOnFailureListener { error ->
                    promise.reject("ERR_OCR_RECOGNIZE", "화면의 글자를 인식하지 못했습니다.", error)
                    recognizer.close()
                }
        }
    }
}
