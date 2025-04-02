# Use a newer Node.js version (20 LTS)
FROM node:20

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json before installing dependencies
COPY package*.json ./

# Install dependencies, including missing ones
RUN npm install 

# Install additional dependencies that were missing
RUN npm install react-router-dom lucide-react framer-motion 

# Install TypeScript type definitions for those dependencies
#RUN npm install --save-dev @types/react-router-dom @types/lucide-react @types/framer-motion

# Copy the rest of the application files
COPY . .

# Install global dependencies (nodemon)
RUN npm install -g nodemon

# Expose the port
EXPOSE 3000

# Start the app
#CMD ["npm", "start"]
