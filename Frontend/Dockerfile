# Build stage
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Pass VITE_API_URL as build arg
ARG VITE_API_URL
# Create .env.production dynamically for Vite
RUN echo "VITE_API_URL=$VITE_API_URL" > .env.production

# Build Vite
RUN npm run build

# Serve with nginx
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
