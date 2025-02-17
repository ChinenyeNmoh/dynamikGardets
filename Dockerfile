FROM node:18

# Setworking directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./

# Install the app dependencies
RUN npm install

# Copy the application code to the container
COPY . .



# Compile TypeScript files to JavaScript
RUN npm run build

# Expose the port the app runs on
EXPOSE 5000

# Command to run the app
CMD ["node", "dist/src/server.js"]