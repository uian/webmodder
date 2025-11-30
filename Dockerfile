# -----------------------------------------------------------------
# FINAL STAGE: Serve via Nginx
# -----------------------------------------------------------------
# We no longer build inside Docker. 
# The GitHub Action builds the app and passes the 'dist' folder.
# This eliminates "npm install" errors inside containers completely.

FROM nginx:alpine

# Copy the ALREADY BUILT artifacts from the GitHub Actions runner
# (The runner creates the 'dist' folder before running docker build)
COPY dist /usr/share/nginx/html

# Copy the environment injection script
COPY entrypoint.sh.txt /docker-entrypoint.d/env.sh

# Make it executable
RUN chmod +x /docker-entrypoint.d/env.sh

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
