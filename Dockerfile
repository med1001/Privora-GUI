# Use Node.js base image (version 16 with Alpine for a small image size)
FROM node:16-alpine

# Set the working directory inside the container
WORKDIR /app

# Install bash (optional, but useful for interactive use)
RUN apk add --no-cache bash

# Expose the port React uses (default is 3000)
EXPOSE 3000

# Command to start the container and run npm commands
CMD ["sh"]
