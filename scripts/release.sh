#!/usr/bin/env bash
# release.sh — feature 브랜치를 main 에 머지하고 push → 실기 Release 빌드/설치까지 자동화.
#
# 사용:
#   ./scripts/release.sh                         # 현재 브랜치 머지 + 기본 기기 재빌드
#   ./scripts/release.sh feat/foo                # feat/foo 머지 + 기본 기기 재빌드
#   ./scripts/release.sh feat/foo --no-build     # 머지만, 빌드는 건너뜀
#   ./scripts/release.sh feat/foo --device UDID  # 특정 UDID 로 빌드
#
# 사전조건: 현재 워킹트리가 깨끗해야 한다 (uncommitted 변경 있으면 중단).
# 기본 기기 UDID 는 DEFAULT_DEVICE_UDID (아래) 또는 RELEASE_DEVICE_UDID 환경변수로 지정.

set -euo pipefail

cd "$(dirname "$0")/.."

# 🔧 등록된 실기기 UDID. 바뀌면 여기 수정하거나 RELEASE_DEVICE_UDID 로 덮어쓰기.
DEFAULT_DEVICE_UDID="00008150-0003452E0A28401C"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "❌ working tree 가 깨끗하지 않아. 먼저 커밋/stash 해." >&2
  exit 1
fi

current_branch="$(git rev-parse --abbrev-ref HEAD)"
source_branch="${1:-$current_branch}"
shift || true

build=true
device_udid="${RELEASE_DEVICE_UDID:-$DEFAULT_DEVICE_UDID}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --no-build) build=false; shift ;;
    --device)   device_udid="$2"; shift 2 ;;
    *) echo "알 수 없는 옵션: $1" >&2; exit 1 ;;
  esac
done

if [[ "$source_branch" == "main" ]]; then
  echo "❌ main 을 main 에 머지할 수는 없어." >&2
  exit 1
fi

echo "▶ main 최신화"
git checkout main
git pull --ff-only origin main

echo "▶ $source_branch → main 머지"
git merge --no-ff "$source_branch" -m "Merge: $source_branch"

echo "▶ origin/main 푸시"
git push origin main

echo "▶ feature 브랜치 정리 (로컬)"
if [[ "$source_branch" != "$current_branch" ]]; then
  git branch -d "$source_branch" || true
fi

if ! $build; then
  echo ""
  echo "✅ 머지 + 푸시 완료. (--no-build 이므로 실기 설치 건너뜀)"
  exit 0
fi

if ! xcrun xctrace list devices 2>&1 | grep -q "$device_udid"; then
  echo "⚠️  기기 UDID $device_udid 가 연결되지 않은 것 같아." >&2
  echo "    핸드폰 연결 후 다시 실행하거나, 머지만 필요했으면 --no-build 로 호출해." >&2
  exit 2
fi

echo "▶ 실기 Release 빌드/설치 ($device_udid)"
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 \
  npx expo run:ios --device "$device_udid" --configuration Release

echo ""
echo "✅ 머지 + 푸시 + 실기 설치 완료."
