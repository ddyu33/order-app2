# COZY API 서버

Express와 JavaScript로 구성한 백엔드 개발 환경입니다. PostgreSQL 연결에는 `pg`를 사용하며, 프런트엔드와 별도 프로세스로 실행합니다.

## 시작하기

Node.js 20.13 이상이 필요합니다.

```powershell
cd server
npm install
```

`.env`의 `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD`를 로컬 PostgreSQL 연결 정보에 맞게 설정합니다. 연결 풀은 `pg`의 표준 `PG*` 환경 변수를 사용합니다.

```powershell
npm run dev
```

서버 기본 주소는 `http://localhost:3000`입니다. PostgreSQL 연결을 확인하는 `GET /api/health` 엔드포인트가 제공됩니다. DB 연결이 되지 않으면 해당 요청은 오류를 반환합니다.

최초 실행 또는 스키마 변경 시 마이그레이션을 적용합니다. 메뉴와 옵션의 초기 예시 데이터도 함께 등록됩니다.

```powershell
npm run db:migrate
```

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/menus` | 주문 화면용 메뉴 및 옵션 목록 |
| `POST` | `/api/orders` | 주문 생성 및 트랜잭션 재고 차감 |
| `GET` | `/api/orders/:orderId` | 주문 단건 조회 |
| `GET` | `/api/admin/menus` | 관리자 메뉴 및 재고 조회 |
| `PATCH` | `/api/admin/menus/:menuId/stock` | 메뉴 재고 증감 |
| `GET` | `/api/admin/orders` | 최신 주문 목록 |
| `PATCH` | `/api/admin/orders/:orderId/status` | 주문 상태 전이 |
| `GET` | `/api/admin/dashboard` | 전체·상태별 주문 수 |

## 명령

```sh
npm run dev    # Node.js 내장 watch 모드 개발 서버
npm start      # 서버 실행
npm run check  # JavaScript 문법 확인
npm run db:migrate # 데이터베이스 스키마 및 초기 데이터 적용
```

## 구성

```text
server/
├── src/
│   ├── app.js          # Express 앱, CORS, JSON 및 오류 처리
│   ├── server.js       # 환경 변수 로드 및 HTTP 서버 실행
│   ├── db/pool.js      # PostgreSQL 연결 풀
│   ├── lib/            # HTTP 오류 및 주문 조회 로직
│   └── routes/
│       ├── health.js   # DB 연결 상태 확인
│       ├── menus.js    # 메뉴 조회
│       ├── orders.js   # 주문 생성 및 조회
│       └── admin.js    # 관리자 메뉴, 재고, 주문, 대시보드 API
├── migrations/         # PostgreSQL 스키마 및 초기 메뉴 데이터
├── .env                # 로컬 환경 변수 (Git 제외)
└── package.json
```

`.env`에는 개인 데이터베이스 자격 증명을 넣고 저장소에 커밋하지 마세요.
