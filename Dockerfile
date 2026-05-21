FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache bash chromium font-noto-cjk git

ENV PLAYWRIGHT_BROWSERS_PATH=/usr/bin
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

EXPOSE 19006

CMD ["sh", "-lc", "if [ -f package.json ]; then npx expo start --web --host lan; else sleep infinity; fi"]
