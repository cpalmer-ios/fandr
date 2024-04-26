# Use the official Node.js 14 image as base
FROM node:18

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose port 4000 for the Express server
EXPOSE 4000

# Command to run the application
CMD ["node", "app.js"]