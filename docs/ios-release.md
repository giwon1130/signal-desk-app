# iOS 릴리스 자동화

`main` 푸시마다 심사본을 만들지 않는다. 대신 Git 태그 `ios-v*`를 푸시하거나 GitHub Actions의 **Release iOS**를 수동 실행하면 아래 흐름이 자동 실행된다.

1. TypeScript 검사
2. EAS production iOS 빌드 번호 자동 증가
3. App Store Connect 업로드

Apple의 심사 통과 여부와 최종 **Submit for Review**는 Apple 측 처리 상태·릴리스 노트·심사 질문을 확인한 뒤 진행한다.

## GitHub Secrets (한 번만 설정)

저장소 **Settings → Secrets and variables → Actions**에 다음을 등록한다.

| Secret | 용도 |
|---|---|
| `EXPO_TOKEN` | EAS 프로젝트 빌드 권한 |
| `EXPO_APPLE_APP_SPECIFIC_PASSWORD` | App Store Connect 업로드용 Apple 앱 전용 비밀번호 |

EAS가 iOS 서명 자격증명을 이미 관리하고 있으므로 인증서/프로비저닝 파일을 저장소에 넣지 않는다.

## Codex/로컬 릴리스

GitHub Secret 설정 전이거나 즉시 릴리스할 때는 아래를 실행한다.

```bash
./scripts/release-store.sh
```

현재 로그인된 EAS 세션을 이용해 같은 production 빌드·업로드를 수행한다.
