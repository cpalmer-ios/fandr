# Use the official Node.js 14 image as base
FROM node:18.13.0

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
COPY all_listings.csv ./
COPY .env ./
COPY nodemon.json ./
ENV MONGO_USER cpalmer
ENV MONGO_PASSWORD 8En2Uy5Fn
ENV MONGO_DB fandr

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy the rest of the application code to the working directory
COPY . .

# Expose port 4000 for the Express server
EXPOSE 4000

# Command to run the application
CMD ["node", "app.js"]