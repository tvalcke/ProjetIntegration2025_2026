FROM nginx:alpine

# Install envsubst for runtime env replacement
RUN apk add --no-cache gettext

WORKDIR /usr/share/nginx/html

# Copy HTML and static assets
COPY index.html admin.html login.html public.html team.html ./
COPY img/ ./img/
COPY scripts/ ./scripts/
COPY styles/ ./styles/

# Copy Nginx template
COPY nginx.conf /etc/nginx/templates/nginx.conf.template

# Expose port 80
EXPOSE 80

# Use entrypoint to replace env vars at container start
CMD sh -c "envsubst '\$VITE_API_URL' < /etc/nginx/templates/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"


