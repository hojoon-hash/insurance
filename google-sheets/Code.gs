/**
 * 치위선생 리드 수집 → 구글 시트 자동 기록 (Google Apps Script)
 *
 * 사용법:
 * 1. 구글 시트 새로 만들기 → 확장 프로그램 → Apps Script
 * 2. 이 파일 내용을 전부 붙여넣고 저장
 * 3. 배포 → 새 배포 → 유형: 웹 앱
 *    - 실행 사용자: 나
 *    - 액세스 권한: 모든 사용자
 * 4. 생성된 웹 앱 URL(.../exec)을 백엔드 환경변수
 *    GOOGLE_SHEETS_WEBHOOK_URL 에 입력
 *
 * 들어오는 리드의 필드가 폼마다 달라도, 새 필드는 자동으로 컬럼에 추가됩니다.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Leads') || ss.insertSheet('Leads');

    const data = JSON.parse(e.postData.contents);

    let headers =
      sheet.getLastRow() > 0
        ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
        : [];

    Object.keys(data).forEach(function (key) {
      if (headers.indexOf(key) === -1) headers.push(key);
    });
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    const row = headers.map(function (h) {
      const v = data[h];
      if (v === undefined || v === null) return '';
      return typeof v === 'object' ? JSON.stringify(v) : v;
    });
    sheet.appendRow(row);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
