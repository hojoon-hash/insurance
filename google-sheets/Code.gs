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
 * 동작:
 * - leadId가 같은 리드가 이미 있으면 그 행을 갱신(merge)하고, 없으면 새 행으로 추가합니다.
 *   → 진단 단계(stage:diagnosis)와 상담 예약(stage:consult)이 한 사람=한 줄로 합쳐집니다.
 * - 들어오는 필드가 폼마다 달라도 새 필드는 자동으로 컬럼에 추가됩니다.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Leads') || ss.insertSheet('Leads');

    const data = JSON.parse(e.postData.contents);

    // 헤더 확보 + 새 키 추가
    let headers =
      sheet.getLastRow() > 0
        ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
        : [];
    Object.keys(data).forEach(function (key) {
      if (headers.indexOf(key) === -1) headers.push(key);
    });
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    const fmt = function (v) {
      if (v === undefined || v === null) return '';
      return typeof v === 'object' ? JSON.stringify(v) : v;
    };

    // leadId로 기존 행 찾기
    let targetRow = -1;
    const leadId = data.leadId;
    const idCol = headers.indexOf('leadId');
    const lastRow = sheet.getLastRow();
    if (leadId && idCol !== -1 && lastRow > 1) {
      const ids = sheet.getRange(2, idCol + 1, lastRow - 1, 1).getValues();
      for (let i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === String(leadId)) {
          targetRow = i + 2; // 헤더가 1행이므로 +2
          break;
        }
      }
    }

    if (targetRow === -1) {
      // 신규 리드 추가
      const row = headers.map(function (h) {
        return fmt(data[h]);
      });
      sheet.appendRow(row);
    } else {
      // 기존 리드 갱신: 들어온 키만 덮어쓰고 나머지 컬럼은 유지
      const existing = sheet.getRange(targetRow, 1, 1, headers.length).getValues()[0];
      const merged = headers.map(function (h, i) {
        return data.hasOwnProperty(h) ? fmt(data[h]) : existing[i];
      });
      sheet.getRange(targetRow, 1, 1, headers.length).setValues([merged]);
    }

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, updated: targetRow !== -1 })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
