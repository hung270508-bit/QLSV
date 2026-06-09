FROM node:20-alpine
WORKDIR /usr/src/app
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
EXPOSE 5000
CMD ["npm", "start"]
