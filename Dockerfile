# Stage 1: Build the React application
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies (python3, make, g++) to prevent npm install failures for native modules
# This is critical for fixing "exit code: 1" during npm install on Alpine
RUN apk add --no-cache python3 make g++

# Copy ONLY package.json first.
# We INTENTIONALLY exclude package-lock.json here to force a fresh install.
# This fixes issues where a Windows/Mac lockfile fails on Linux.
COPY package.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the environment injection script.
# We explicitly copy 'entrypoint.sh.txt' to the Nginx startup directory.
COPY entrypoint.sh.txt /docker-entrypoint.d/env.sh

# Make it executable (critical)
# Since the source is a text file, we ensure the destination is treated as a script
RUN chmod +x /docker-entrypoint.d/env.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
