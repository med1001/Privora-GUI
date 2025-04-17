# Step 1: Use Node.js base image (version 18 with Alpine for a small image size)
FROM node:18-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Install bash (optional, but useful for interactive use)
RUN apk add --no-cache bash

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install npm dependencies
RUN npm install

# Install additional dependencies for hot reloading (optional)
RUN npm install -g nodemon
# Copy the rest of the application files
COPY . .

# Debug: List files before running the build
RUN ls -al /app

# Step 2: Run the build process (will generate the build/ directory)
#RUN npm run build

# Debug: List files after build to check if build is created
#RUN ls -al /app/build
# Expose the port React uses (default is 3000)
EXPOSE 3000

# Start the development server (with live reload)
CMD ["npm", "start"]
