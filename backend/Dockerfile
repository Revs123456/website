# Multi-stage build — the final image ships only the compiled dist/ +
# production dependencies, not the TypeScript toolchain and dev deps needed
# just to build it. Smaller image, smaller attack surface.

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Alpine doesn't ship bash — start:prod (package.json) runs `bash
# start-prod.sh`. Installing it here keeps start-prod.sh as the one place
# that defines "migrate then start", shared with any non-container deploy
# target, instead of duplicating that logic as an inline shell command here.
RUN apk add --no-cache bash

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/start-prod.sh ./start-prod.sh

# Matches app.listen(process.env.PORT ?? 4001) in src/main.ts, and
# apprunner.tf's image_configuration.port — change both together if this
# ever moves.
EXPOSE 4001

CMD ["npm", "run", "start:prod"]
