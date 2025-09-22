## dependency

```bash
# basic
npm i

# passive installation
npm i --save @nestjs/swagger
npm i cookie-parser
npm i -D @types/cookie-parser
```

### 실행 전 DB 마이그레이션

```bash
npx prisma generate --schema prisma/schema
npx prisma db push --schema prisma/schema
```

### 개발 서버 실행

```bash
npm run start:dev
```
