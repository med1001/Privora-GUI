# Use a newer Node.js version (20 LTS)
FROM node:20

# Set the working directory
WORKDIR /app

# Install bash and dependencies
RUN apt-get update && apt-get install -y bash && rm -rf /var/lib/apt/lists/*

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Install additional dependencies for Tailwind CSS
RUN npm install tailwindcss @tailwindcss/postcss autoprefixer postcss postcss-loader --save-dev

# Copy the entire project (including Tailwind, PostCSS config, etc.)
COPY . .

# Install global dependencies (nodemon)
RUN npm install -g nodemon

# Expose the port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
