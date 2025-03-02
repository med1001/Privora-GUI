# Use Node.js base image (version 16 with Alpine for a small image size)
FROM node:16-alpine

# Set the working directory inside the container
WORKDIR /app

# Install bash (optional, but useful for interactive use)
RUN apk add --no-cache bash

# Copy package.json and package-lock.json first (for efficient caching)
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Install additional dependencies for hot reloading (optional)
RUN npm install -g nodemon

# Expose the port React uses (default is 3000)
EXPOSE 3000

# Start the development server (with live reload)
CMD ["npm", "start"]
