# COZY 프런트엔드

React와 바닐라 JavaScript로 구성한 Vite 앱입니다. 프런트엔드와 백엔드는 별도로 개발하며, 주문 화면과 관리자 화면을 이 프로젝트에서 구현합니다.

## 시작하기

```sh
npm install
npm run dev
```

Vite가 출력하는 로컬 주소를 브라우저에서 엽니다.

## 사용 가능한 명령

```sh
npm run dev      # 개발 서버와 HMR 실행
npm run build    # 프로덕션 빌드 (dist/)
npm run preview  # 프로덕션 빌드 미리보기
npm run lint     # Oxlint 검사
```

## 프로젝트 구조

```text
ui/
├── index.html       # HTML 진입점
├── vite.config.js   # Vite 및 React 플러그인 설정
└── src/
    ├── main.jsx     # React 앱 진입점
    ├── App.jsx      # 앱 최상위 컴포넌트
    ├── App.css      # 앱 컴포넌트 스타일
    └── index.css    # 전역 스타일
```

JavaScript 파일(`.js`, `.jsx`)을 사용하며 TypeScript는 포함하지 않습니다.
