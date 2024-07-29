# Stage 1: Build the application
FROM node:20.15.1 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Run the application
FROM node:20.15.1-alpine
WORKDIR /app
COPY --from=builder /app .
RUN npm install --only=production
EXPOSE 3000
CMD ["node", "dist/main"]
