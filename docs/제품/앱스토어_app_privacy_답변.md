# App Store Connect — App Privacy 양식 답변 가이드

> **누가 봄**: 출시 담당
> **언제 봄**: App Store Connect → App Privacy → Get Started 클릭 시
> **이걸 보면서**: 양식 그대로 답변 복붙

App Store Connect 의 Privacy 양식은 단계별 질문이 많고 잘못 답변하면 출시 후 수정 어려움.
이 가이드는 Signal Desk 의 실제 데이터 수집 패턴 기준 정확한 답변.

---

## 1. Data Collection 첫 질문

> "Do you or your third-party partners collect data from this app?"

→ **Yes, we collect data from this app**

(이메일, 사용자 콘텐츠, 푸시 토큰 수집하므로 Yes)

---

## 2. 어떤 데이터 수집하는지 (Select all that apply)

### Contact Info
- ☑️ **Email Address** — 회원가입/로그인 식별

### User Content
- ☑️ **Other User Content** — 관심종목, 보유 종목, AI 추천 로그

### Identifiers
- ☑️ **Device ID** — Expo Push Token (알림 발송용)

### **선택 안 함** (수집하지 않음)
- ❌ Name
- ❌ Phone Number
- ❌ Physical Address
- ❌ Other Contact Info
- ❌ Health, Fitness, Financial Info
- ❌ Location (Precise / Coarse)
- ❌ Sensitive Info
- ❌ Contacts
- ❌ Photos / Videos / Audio
- ❌ Search History
- ❌ Browsing History
- ❌ User ID (이건 자체 발급 UUID 인데 Apple 정의상 외부에서 추적 가능한 ID 가 아니라 선택 안 함)
- ❌ Purchases
- ❌ Customer Support
- ❌ Crash Data, Performance Data, Other Diagnostic Data (analytics 안 씀)
- ❌ Advertising Data (광고 안 씀)
- ❌ Product Interaction
- ❌ Other Data Types

---

## 3. 각 데이터 항목별 상세 (선택한 3개에 대해 반복)

### 3-A. Email Address

**질문**: How is this data used?
- ☑️ **App Functionality** — 로그인 식별

**나머지 모두 NO**:
- ❌ Analytics
- ❌ Developer's Advertising or Marketing
- ❌ Third-Party Advertising
- ❌ Product Personalization
- ❌ Other Purposes

**Is this data linked to the user's identity?** → **Yes, linked**
(이메일이 사용자 계정과 연결되어 있으니까)

**Is this data used for tracking purposes?** → **No, not used for tracking**
(우리는 광고 추적 / 외부 데이터 매칭 안 함)

---

### 3-B. Other User Content (관심종목·보유·AI 로그)

**Use**:
- ☑️ **App Functionality** — 사용자 데이터 제공·갱신

**Linked to user?** → **Yes, linked**
**Used for tracking?** → **No, not used for tracking**

---

### 3-C. Device ID (Expo Push Token)

**Use**:
- ☑️ **App Functionality** — 푸시 알림 발송

**Linked to user?** → **Yes, linked**
(Push token 이 user 의 push_devices 테이블 row 에 저장됨)

**Used for tracking?** → **No, not used for tracking**

---

## 4. Privacy Policy URL

App Store Connect 별도 필드:
- `https://signal-desk-web-production.up.railway.app/privacy`

---

## 5. 빠뜨리기 쉬운 함정

### Funding 관련 (해당 없음)
- ❌ Apple 의 financial info 카테고리는 "신용카드/계좌 정보 같은 결제 관련" 의미. 우리는 결제 안 받으니 N/A.

### Stocks/Investing 카테고리 = 자동 12+
- App Information → Age Rating 양식에서 "Frequent/Intense Mature/Suggestive Themes" 만 No 처리하면 자동 4+ 인데
- "Unrestricted Web Access" 도 No
- Stocks 컨텐츠는 Apple 정책상 12+ 권장 (성숙한 판단 필요한 정보)
- 직접 12+ 로 올려두는 게 안전

### "Tracking" 정의 (헷갈림 주의)
Apple 의 tracking = "다른 회사의 앱/웹사이트에서의 사용자 행동 데이터를 우리 앱 데이터와 연결" 또는 "데이터 브로커에 공유". **우리는 둘 다 안 함**. 그래서 모두 "No tracking".

### IDFA / 광고 식별자
- 우리 앱은 IDFA 사용 안 함 → ATT prompt 도 안 띄움
- App Privacy 양식에서 Advertising Data 선택 안 함

---

## 6. 검증 (제출 전)

App Privacy 페이지 미리보기 시 다음과 같이 보여야 함:

> **Data Linked to You**
> The following data may be collected and linked to your identity:
> - Contact Info: Email Address
> - User Content: Other User Content
> - Identifiers: Device ID

> **Data Not Linked to You**
> (없음)

> **Data Used to Track You**
> (없음)

이 형태면 OK.

---

## 7. 변경 시기

데이터 수집 패턴 변경하면 **24시간 내** App Privacy 갱신 필요. 예:
- Analytics 도입 → "Diagnostics → Performance Data" 추가
- Crashlytics → "Diagnostics → Crash Data" 추가
- 광고 SDK → "Advertising Data" + "Tracking" Yes 로 변경

지금은 위 3개만 수집 → 변경 사항 발생 시 이 문서도 갱신.
