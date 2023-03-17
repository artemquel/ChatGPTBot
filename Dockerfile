FROM node:18-alpine as dependencies

WORKDIR /app

COPY package.json yarn.lock ./
COPY apps ./apps

RUN yarn install --frozen-lockfile

FROM node:18-alpine as backend

WORKDIR /app

COPY --from=dependencies /app/package.json ./package.json
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/backend ./apps/backend

RUN yarn backend:build

CMD ["node", "apps/backend/dist/main.js"]