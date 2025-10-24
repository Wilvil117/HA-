# Use official Node.js LTS image as the base
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application source code
COPY . .

# Expose the port your API runs on (default 3000)
EXPOSE 3000

# Start the Node.js API
CMD ["node", "index.js"]
