# Étape 1 : Build de l'app React
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev  # Plus léger que npm install
COPY . .
RUN npm run build

# Étape 2 : Serveur statique léger
FROM node:18-alpine

WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/build /app/build

EXPOSE 3000
CMD ["serve", "-s", "build", "-l", "3000"]
