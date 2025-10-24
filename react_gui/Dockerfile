# Use an official Node.js image to build the React app
FROM node:18 AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the React app for production
RUN npm run build

# Use Apache httpd to serve the build
FROM httpd:2.4-alpine

# Copy the build output to Apache's htdocs directory
COPY --from=build /app/build/ /usr/local/apache2/htdocs/

# Copy .htaccess for SPA fallback routing
COPY .htaccess /usr/local/apache2/htdocs/.htaccess

# Enable mod_rewrite and allow .htaccess overrides
RUN sed -ri 's|#\s*LoadModule rewrite_module modules/mod_rewrite.so|LoadModule rewrite_module modules/mod_rewrite.so|' /usr/local/apache2/conf/httpd.conf \
 && sed -ri 's|AllowOverride None|AllowOverride All|' /usr/local/apache2/conf/httpd.conf

# Expose port 80
EXPOSE 80

# Start Apache httpd
CMD ["httpd-foreground"]
