# Development Dockerfile
FROM node:22.15.1-bookworm-slim

# Install additional tools for development
RUN apt-get update && apt-get install -y \
  vim \
  curl \
  wget \
  git \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

# Copy and install dependencies
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy the rest of the application files
COPY . .

# Set the environment variables
ARG APP_ENV=development
ENV NODE_ENV=${APP_ENV}

# Expose the application port
EXPOSE 3000
