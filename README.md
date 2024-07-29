
# Survey Management Backend

This repository contains the backend for the Survey Management application built using NestJS. It provides APIs for creating surveys, submitting responses, and managing user data.
Deployed On - https://survey-app-frontend-production.up.railway.app/surveys
Admin credentials
email: admin@example.com
password: adm!n

## Table of Contents

- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Running Tests](#running-tests)
- [Environment Variables](#environment-variables)
- [Docker Setup](#docker-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

- Node.js v20.x
- PostgreSQL
- Docker (optional, for containerization)

### Installation

1. Clone the repository
   ```sh
   git clone https://github.com/your-username/survey-app-backend.git
   cd survey-app-backend
   ```

2. Install NPM packages
   ```sh
   npm install
   ```

## Running the Application

1. Set up the PostgreSQL database and ensure it is running.

2. Configure the environment variables. See the [Environment Variables](#environment-variables) section.

3. Run the application
   ```sh
   npm run start:dev
   ```

## Running Tests

To run the tests, use the following command:

```sh
npm test
```

## Environment Variables

Create a `.env` file in the root directory and add the following environment variables:

```env
DB_HOST=your-database-host
DB_PORT=5432
DB_USERNAME=your-database-username
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
JWT_SECRET=your-jwt-secret
ADMIN_PASSWORD=admin-password
ADMIN_EMAIL=admin@example.com
FRONT_END_URL=http://localhost:3001
```

## Docker Setup

1. Build the Docker image
   ```sh
   docker build -t survey-backend-app .
   ```

2. Run the Docker container
   ```sh
   docker run -p 3000:3000 --env-file .env survey-backend-app
   ```

## CI/CD Pipeline

This project uses GitHub Actions for CI/CD. The workflow file is located at `.github/workflows/deploy.yml`.

### Deployment to Railway

To set up CI/CD with Railway:

1. Add your Railway token to the GitHub secrets as `RAILWAY_TOKEN`.

2. The deployment workflow will handle the build and deployment process.

## License

Distributed under the MIT License. See `LICENSE` for more information.
