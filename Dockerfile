FROM node:20-alpine3.19

# Instalar dependencias del sistema
RUN apk add --no-cache wget

# Descargar y configurar dockerize
RUN wget https://github.com/jwilder/dockerize/releases/download/v0.6.1/dockerize-linux-amd64-v0.6.1.tar.gz \
    && tar -xzvf dockerize-linux-amd64-v0.6.1.tar.gz \
    && mv dockerize /usr/local/bin/dockerize

# Crear el directorio de la aplicación
WORKDIR /usr/src/app

# Copiar archivos de configuración
COPY package*.json ./

# Instalar dependencias de Node.js
RUN npm install -g @nestjs/cli

# Copiar el código fuente de la aplicación
COPY . .

# Compilar la aplicación
RUN npm run build

# Exponer el puerto
EXPOSE 8080

# Usar dockerize para esperar a MySQL y luego iniciar la aplicación
CMD ["dockerize", "-wait", "tcp://mysql:3306", "-timeout", "60s", "--", "npm", "run", "start:prod"]
