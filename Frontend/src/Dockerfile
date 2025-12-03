# Use a lightweight web server image
FROM nginx:alpine

# Set working directory in the container
WORKDIR /usr/share/nginx/html

# Copy all HTML files
COPY index.html .
COPY admin.html .
COPY login.html .
COPY public.html .
COPY team.html .

# Copy supporting directories
COPY img/ ./img/
COPY script/ ./script/
COPY styles/ ./styles/

# Expose port 80 for web traffic
EXPOSE 80

# Start nginx in foreground mode
CMD ["nginx", "-g", "daemon off;"]