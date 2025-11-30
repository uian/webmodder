# Stage 1: Build the React application
# We use node:20 (Debian-based) instead of Alpine to ensure full compatibility 
# with npm packages that require native build tools (like esbuild/vite).
FROM node:20 AS builder

WORKDIR /app

# Copy package.json
# We do not copy package-lock.json to ensure dependencies resolve correctly for the Linux architecture
COPY package.json ./

# Install dependencies (much more reliable on Debian than Alpine)
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
