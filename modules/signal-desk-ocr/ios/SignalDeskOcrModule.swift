import ExpoModulesCore
import ImageIO
import UIKit
import Vision

public class SignalDeskOcrModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SignalDeskOcr")

    AsyncFunction("recognize") { (imagePath: String) throws -> [String: Any] in
      let url: URL
      if let parsed = URL(string: imagePath), parsed.isFileURL {
        url = parsed
      } else {
        url = URL(fileURLWithPath: imagePath)
      }

      let imageData = try Data(contentsOf: url)
      guard let image = UIImage(data: imageData), let cgImage = image.cgImage else {
        throw SignalDeskOcrError.invalidImage
      }

      let request = VNRecognizeTextRequest()
      request.recognitionLevel = .accurate
      request.recognitionLanguages = ["ko-KR", "en-US"]
      request.usesLanguageCorrection = true

      let handler = VNImageRequestHandler(
        cgImage: cgImage,
        orientation: CGImagePropertyOrientation(image.imageOrientation),
        options: [:]
      )
      try handler.perform([request])

      let width = Double(cgImage.width)
      let height = Double(cgImage.height)
      let lines: [[String: Any]] = (request.results ?? []).compactMap { observation in
        guard let text = observation.topCandidates(1).first?.string.trimmingCharacters(in: .whitespacesAndNewlines),
              !text.isEmpty else {
          return nil
        }
        let box = observation.boundingBox
        return [
          "text": text,
          "left": box.minX * width,
          "top": (1 - box.maxY) * height,
          "right": box.maxX * width,
          "bottom": (1 - box.minY) * height
        ]
      }

      return ["width": width, "height": height, "lines": lines]
    }
  }
}

private enum SignalDeskOcrError: LocalizedError {
  case invalidImage

  var errorDescription: String? {
    "선택한 이미지를 읽지 못했습니다."
  }
}

private extension CGImagePropertyOrientation {
  init(_ orientation: UIImage.Orientation) {
    switch orientation {
    case .up: self = .up
    case .upMirrored: self = .upMirrored
    case .down: self = .down
    case .downMirrored: self = .downMirrored
    case .left: self = .left
    case .leftMirrored: self = .leftMirrored
    case .right: self = .right
    case .rightMirrored: self = .rightMirrored
    @unknown default: self = .up
    }
  }
}
