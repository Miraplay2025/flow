# Usa Node.js slim para manter a imagem leve
FROM node:20-slim

# Diretório de trabalho
WORKDIR /app

# Instala dependências do sistema para Puppeteer/Chromium
RUN apt-get update && apt-get install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    xdg-utils \
    libu2f-udev \
    libvulkan1 \
    wget \
    unzip \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Atualiza npm para a versão solicitada
RUN npm install -g npm@11.6.0

# Copia package.json e instala dependências
COPY package*.json ./
RUN npm install --omit=dev

# Copia o restante do código
COPY . .

# Expõe a porta que o Render usa (3000)
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "server.js"]
