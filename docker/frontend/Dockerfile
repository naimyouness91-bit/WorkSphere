FROM node:22-alpine AS build

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .

ARG VITE_API_URL=http://localhost:8000/api
ARG VITE_DEFAULT_LOCALE=en
ARG VITE_APP_ENV=production
ARG VITE_APP_VERSION=0.0.0
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_DEFAULT_LOCALE=$VITE_DEFAULT_LOCALE
ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_APP_VERSION=$VITE_APP_VERSION

RUN npm run build -- --mode production

FROM nginx:alpine

COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
