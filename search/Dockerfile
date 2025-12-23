# A lightweight Node.js 20 image based on alpine linux
FROM node:20-alpine

# Sets the working directory inside the container
WORKDIR /app

# Copies package.json and package-lock.json files to the working directory
COPY package*.json ./

# Installs the dependencies defined in package.json
RUN npm install

# Copies the rest of the application code to the working directory
COPY . .

# Compiles the TypeScript code to JavaScript (output goes to /app/dist)
RUN npm run build


# Run the compiled JavaScript entrypoint
CMD ["node", "dist/main.js"]