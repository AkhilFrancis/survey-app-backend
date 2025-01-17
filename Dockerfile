# Use the official Node.js image
# https://hub.docker.com/_/node
FROM node:20-alpine

# Create and change to the app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000

# Start the application
CMD ["node", "dist/src/main"]
