#!/bin/sh

# Check if API_KEY is set
if [ -z "$API_KEY" ]; then
  echo "Warning: API_KEY environment variable is not set."
fi

# Replace the placeholder in the HTML file with the actual environment variable
# We use a delimiter (|) other than / because API keys might contain / or +
sed -i "s|PLACEHOLDER_API_KEY|${API_KEY}|g" /usr/share/nginx/html/index.html

# Note: Since this script is placed in /docker-entrypoint.d/, the official Nginx image 
# will automatically execute it before starting the server.
