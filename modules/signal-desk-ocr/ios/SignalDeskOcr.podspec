require 'json'

package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))

Pod::Spec.new do |s|
  s.name           = 'SignalDeskOcr'
  s.version        = package['version']
  s.summary        = 'On-device OCR for Signal Desk portfolio screenshots'
  s.description    = 'Recognizes Korean and English text locally without uploading screenshots.'
  s.license        = { :type => 'MIT' }
  s.author         = 'Signal Desk'
  s.homepage       = 'https://github.com/giwon1130'
  s.platforms      = { :ios => '15.1' }
  s.swift_version  = '5.9'
  s.source         = { :git => 'https://github.com/giwon1130/signal-desk-app.git' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.source_files = '**/*.{h,m,swift}'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
end
