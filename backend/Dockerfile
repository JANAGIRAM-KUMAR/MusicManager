FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ENV NODE_ENV=production
ENV PORT=6001
EXPOSE 6001
CMD ["npm", "start"]