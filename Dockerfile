FROM node:20-alpine3.19

# Creo directorio de trabajo en el docker
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

#instalo en nest (es una instalacion global que va en la maquina y no en el proyecto)
RUN npm install -g @nestjs/cli

# copio todo lo del directorio en el que estoy al directorio actual del docker
COPY . .

#buildeo la aplicacion que copie
RUN npm run build

EXPOSE 3000

#comando para iniciar aplicación
CMD ["npm", "run", "start:prod"]