import AsyncStorage from '@react-native-async-storage/async-storage'

// 오늘의 운세 팝업을 마지막으로 띄운 날짜를 저장 → 같은 날 재실행 시 다시 안 뜨게.
const LAST_SHOWN_KEY = 'fortune.greeting.lastShownDate'

/** 운세 팝업을 마지막으로 보여준 날짜(YYYY-MM-DD). 한 번도 안 띄웠으면 null. */
export async function getFortuneGreetingShownDate(): Promise<string | null> {
  return AsyncStorage.getItem(LAST_SHOWN_KEY)
}

/** 운세 팝업 노출 날짜 기록. */
export async function markFortuneGreetingShown(date: string): Promise<void> {
  await AsyncStorage.setItem(LAST_SHOWN_KEY, date)
}
