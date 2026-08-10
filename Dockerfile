FROM node:20-slim

WORKDIR /app
COPY package*.json./
RUN npm install
COPY..

RUN mkdir -p /app/tokens
CMD ["npm", "start"]
