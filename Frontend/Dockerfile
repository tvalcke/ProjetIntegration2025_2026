FROM node:20-alpine AS build
WORKDIR /app

# Copier package.json
COPY package*.json ./
RUN npm install

# Copier le frontend uniquement
COPY . .

# Passer VITE_API_URL depuis docker-compose
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Build Vite
RUN npm run build

# Serveur statique
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
