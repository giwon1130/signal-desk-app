#!/usr/bin/env bash
# App Store 릴리스 — 검사 → EAS production 빌드 → App Store Connect 업로드.
# Apple 심사 제출은 App Store Connect에서 처리 완료·메타데이터를 확인한 뒤 별도로 진행한다.

set -euo pipefail

cd "$(dirname "$0")/.."

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "변경된 트래킹 파일이 남아 있어요. 커밋 후 릴리스해 주세요." >&2
  exit 1
fi

echo "▶ TypeScript 검사"
npm run check:types

echo "▶ iOS production 빌드 및 App Store Connect 업로드"
# eas.json의 production submit 프로필(ASC 앱/팀)을 사용한다.
# EAS가 관리하는 원격 build number를 자동 증가시킨다.
npx eas build --platform ios --profile production --auto-submit --non-interactive

echo "✅ 빌드와 App Store Connect 업로드 요청이 완료됐어요."
