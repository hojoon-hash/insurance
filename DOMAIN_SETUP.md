# 🌐 가비아 도메인 연결 가이드

## 📌 현재 상황
- **프로젝트**: 치위선생 (치아보험 진단 플랫폼)
- **도메인 구매**: 가비아
- **목표**: 가비아 도메인을 프로젝트에 연결

---

## 🚀 **추천 방법: Vercel + Railway**

### **장점**
- ✅ 무료 티어 제공
- ✅ 자동 HTTPS 지원
- ✅ 가비아 도메인 연결 간단
- ✅ CI/CD 자동화
- ✅ 글로벌 CDN

---

## 📋 **단계별 가이드**

### **STEP 1: 백엔드 배포 (Railway)**

#### 1-1. Railway 계정 생성
1. https://railway.app 접속
2. GitHub 계정으로 로그인

#### 1-2. 백엔드 배포
1. "New Project" 클릭
2. "Deploy from GitHub repo" 선택
3. `hojoon-hash/insurance` 저장소 선택
4. Root Directory: `/backend` 입력
5. Start Command: `node server.js`
6. 환경변수 설정:
   ```
   PORT=5000
   NODE_ENV=production
   ```

#### 1-3. 백엔드 URL 확인
- Railway가 자동으로 생성한 URL 복사
- 예: `https://치위선생-backend-production.up.railway.app`

---

### **STEP 2: 프론트엔드 배포 (Vercel)**

#### 2-1. Vercel 계정 생성
1. https://vercel.com 접속
2. GitHub 계정으로 로그인

#### 2-2. 프론트엔드 배포
1. "Add New Project" 클릭
2. `hojoon-hash/insurance` 저장소 Import
3. 설정:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

#### 2-3. 환경변수 설정
```
VITE_API_URL=https://치위선생-backend-production.up.railway.app
```

#### 2-4. 배포 완료
- Vercel이 자동으로 생성한 URL 확인
- 예: `https://insurance-omega.vercel.app`

---

### **STEP 3: 가비아 도메인 연결**

가비아에서 구매한 도메인 이름을 알려주시면 정확한 설정을 안내드리겠습니다.

예: `chiwiseonsaeng.com`, `치위선생.com` 등

#### 3-1. 가비아 DNS 설정
1. 가비아 로그인: https://www.gabia.com
2. My가비아 → 서비스 관리 → 도메인
3. 도메인 선택 → "DNS 정보" 클릭
4. "DNS 관리" 클릭

#### 3-2. DNS 레코드 추가 (Vercel)

**A. 루트 도메인 (예: chiwiseonsaeng.com)**
```
타입: A
호스트: @
값: 76.76.21.21 (Vercel IP)
TTL: 600
```

**B. www 서브도메인**
```
타입: CNAME
호스트: www
값: cname.vercel-dns.com
TTL: 600
```

#### 3-3. Vercel에서 도메인 추가
1. Vercel 프로젝트 → Settings → Domains
2. 구매한 도메인 입력 (예: `chiwiseonsaeng.com`)
3. "Add" 클릭
4. Vercel이 제공하는 DNS 설정 확인
5. 가비아 DNS 설정과 일치하는지 확인

#### 3-4. 도메인 확인 (10분~24시간 소요)
```bash
# DNS 전파 확인
nslookup 구매한도메인.com

# 또는
dig 구매한도메인.com
```

---

## 🔧 **프론트엔드 API URL 수정 필요**

현재 프론트엔드는 `localhost:5000`으로 API를 호출하고 있습니다.
프로덕션 환경을 위해 수정이 필요합니다.

### **frontend/.env.production 파일 생성**
```env
VITE_API_URL=https://백엔드URL.railway.app
```

### **frontend/vite.config.js 수정**
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: ['.sandbox.novita.ai', 'localhost', '127.0.0.1'],
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
```

---

## 📊 **배포 후 확인사항**

### ✅ **체크리스트**
- [ ] 백엔드 Health Check: `https://백엔드URL/health`
- [ ] 프론트엔드 접속: `https://도메인.com`
- [ ] 진단 플로우 테스트
- [ ] 상담 신청 폼 작동 확인
- [ ] 모바일 반응형 확인

---

## 🎯 **대안: Cloudflare Pages (올인원 솔루션)**

프론트엔드와 백엔드를 모두 Cloudflare에서 호스팅하는 방법:

### **장점**
- ✅ 가비아 도메인 연결 매우 간단
- ✅ 무제한 대역폭
- ✅ 자동 HTTPS
- ✅ Cloudflare Workers로 백엔드 실행

### **단계**
1. Cloudflare 계정 생성
2. 가비아 네임서버를 Cloudflare 네임서버로 변경
3. Cloudflare Pages로 프론트엔드 배포
4. Cloudflare Workers로 백엔드 배포

---

## 💡 **빠른 시작 (가장 간단한 방법)**

### **Netlify 사용**
1. https://netlify.com 접속
2. GitHub 연동
3. `hojoon-hash/insurance` 저장소 선택
4. Base directory: `frontend`
5. Build command: `npm run build`
6. Publish directory: `dist`
7. Netlify 대시보드 → Domain settings → Add custom domain
8. 가비아에서 제공하는 네임서버 입력

---

## 🔐 **보안 권장사항**

### **환경변수 관리**
- `.env` 파일은 절대 GitHub에 업로드 금지
- Vercel/Railway 대시보드에서만 환경변수 설정

### **CORS 설정**
백엔드 `server.js`에 프로덕션 도메인 추가:
```javascript
app.use(cors({
  origin: [
    'https://구매한도메인.com',
    'https://www.구매한도메인.com',
    'http://localhost:5173'
  ]
}));
```

---

## 📞 **추가 지원이 필요하신가요?**

다음 정보를 알려주시면 더 정확한 가이드를 제공해드리겠습니다:

1. **구매하신 도메인 이름** (예: chiwiseonsaeng.com)
2. **선호하는 배포 플랫폼** (Vercel, Netlify, Cloudflare)
3. **백엔드 호스팅 예산** (무료 티어 / 유료)

---

## 🚀 **즉시 시작하기**

가장 빠른 방법:
1. 구매하신 **도메인 이름**을 알려주세요
2. 제가 정확한 DNS 설정값을 제공해드리겠습니다
3. Vercel + Railway로 5분 안에 배포 가능합니다!

---

**문의사항이 있으시면 언제든 말씀해주세요!** 🙌
