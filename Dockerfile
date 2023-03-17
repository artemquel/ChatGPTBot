FROM node:18-alpine as dependencies

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

FROM node:18-alpine as application

WORKDIR /app

COPY --from=dependencies /app/package.json ./package.json
COPY --from=dependencies /app/node_modules ./node_modules
COPY src ./src
COPY tsconfig*.json ./

RUN yarn build

CMD ["node", "dist/main.js"]