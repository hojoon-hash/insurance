// 배포 시 VITE_API_URL(예: https://xxx.up.railway.app)을 설정하면 해당 백엔드로 호출.
// 미설정(개발 환경)이면 빈 문자열 → 상대경로로 Vite 프록시(localhost:5000)를 사용.
const API_BASE = import.meta.env.VITE_API_URL || '';

export const apiUrl = (path) => `${API_BASE}${path}`;
