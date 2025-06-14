# Development Dockerfile for React
FROM node:18-alpine

WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose default React dev port
EXPOSE 3000

# Start the dev server
CMD ["npm", "start"]
