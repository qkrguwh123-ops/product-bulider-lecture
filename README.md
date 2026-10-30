# 🐶🐱 AI 동물상 테스트 (강아지상 vs 고양이상)

> 구글 Teachable Machine 인공지능 이미지 분류 모델과 TensorFlow.js를 활용하여 사진 한 장으로 강아지상과 고양이상을 정밀 판별하고 성향과 닮은꼴 연예인을 분석해주는 인터랙티브 웹 서비스

![AI Animal Face Test Preview](https://img.shields.io/badge/AI-ANIMAL_FACE_TEST-f59e0b?style=for-the-badge&logo=google)
![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)
![Teachable Machine](https://img.shields.io/badge/Teachable_Machine-4285F4?style=for-the-badge&logo=google&logoColor=white)

---

## 🌟 주요 기능 (Key Features)

### 1. 🤖 Teachable Machine 비전 모델 기반 동물상 분석
- **강아지상 🐶 vs 고양이상 🐱 판별**: 인공지능이 안면 윤곽, 눈매 각도, 이목구비 비율을 종합 분석
- **맞춤형 Teachable Machine URL 연동**: 상단 "⚙️ AI 모델 설정" 드로어를 통해 본인이 학습시킨 구글 Teachable Machine 모델 URL을 손쉽게 붙여넣고 즉시 교체 가능
- **하이브리드 스마트 폴백**: 사용자 모델 URL이 비어있거나 플레이스홀더인 상태에서도 즉각 동작할 수 있도록 스마트 안면 분석 엔진 탑재

### 2. 📸 드래그 앤 드롭 & 실시간 페이스 스캐닝
- 직관적인 사진 파일 업로드 드롭존(Drop Zone) 및 드래그 앤 드롭 지원
- 업로드 즉시 작동하는 미래지향적 **AI 레이저 페이스 스캐너 라인 및 타깃 박스 애니메이션**
- 클라이언트 브라우저 기반 연산으로 사진이 서버에 저장되지 않아 철저한 프라이버시 보호 🔒

### 3. 📊 상세 분석 리포트 & 소셜 인터랙션
- **일치도 게이지 바**: 강아지상 / 고양이상 일치 확률을 보여주는 부드러운 애니메이션 프로그레스 바
- **성향 및 연애 스타일 분석**: 동물상에 따른 성향 특징 및 찰떡궁합 동물상 안내
- **닮은꼴 연예인 매칭**: 대표 강아지상(박보검, 송중기, 츄 등) / 고양이상(강동원, 카리나, 제니 등) 가이드
- **원클릭 공유 & 다시하기**: 결과 링크 복사 및 즉각적인 재테스트 지원
- **축하 파티클 컨페티 폭죽**: 판정 결과 노출 시 화면 전체에 화려한 축하 폭죽 연출

### 4. 💬 Disqus 실시간 댓글 & 커뮤니티
- 하단 Disqus 댓글 스레드(`product-builder-lecture`) 탑재로 방문자 간 결과 공유 및 소통
- 다크/화이트 테마 전환 시 댓글 창 자동 동기화 리로드

### 5. 🤝 Formspree 비즈니스 제휴 문의 폼
- Formspree 엔드포인트(`https://formspree.io/f/mqppdbpl`) 연동
- 페이지 새로고침 없는 비동기(AJAX) 전송 및 스팸 방지(Honeypot) 필터링

### 6. 🌓 다크 & 라이트 럭셔리 글래스모피즘 테마
- 세련된 다크 글래스모피즘 테마 및 산뜻한 화이트 테마 지원 (로컬스토리지 영구 보관)

---

## 📁 파일 구조

```
product-bulider-lecture/
├── index.html        # 시맨틱 마크업, 업로드 드롭존, 결과 카드, Disqus/Formspree 연동
├── style.css         # 다크/라이트 테마, 글래스모피즘, 스캐닝 애니메이션, 반응형 스타일
├── app.js            # Teachable Machine SDK 연동, 캔버스 폭죽 엔진, 테마 제어
└── README.md         # 프로젝트 안내 문서
```

---

## 🚀 로컬 실행 방법

외부 패키지 설치나 빌드 과정 없이 순수 정적 웹 환경(HTML/CSS/JS)으로 구동됩니다.
`index.html` 파일을 웹 브라우저에서 직접 열거나 로컬 웹 서버(Live Server, `python3 -m http.server 3000`)를 통해 즉시 확인하실 수 있습니다.
