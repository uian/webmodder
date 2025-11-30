# Stage 1: Build the React application
# We use node:20-bookworm (Debian 12) to ensure maximum compatibility with glibc
# and build tools needed for node modules.
FROM node:20-bookworm AS builder

WORKDIR /app

# Copy package.json
COPY package.json ./

# Install dependencies
# --legacy-peer-deps: Prevents failures due to strict version conflicts
# --no-audit: Speeds up install
# --no-fund: Reduces output noise
RUN npm install --legacy-peer-deps --no-audit --no-fund

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
RUN chmod +x /docker-entrypoint.d/env.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
