# Use a stable Node.js image with Debian Bullseye
FROM node:16-bullseye

# Set the working directory inside the container
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Install Chromium and dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libnspr4 \
    libnss3 \
    libx11-6 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    libgbm1 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Copy the rest of the project files
COPY . .

# ✅ Expose the correct port dynamically
EXPOSE ${PORT}

# ✅ Start the app
CMD ["npm", "start"]
