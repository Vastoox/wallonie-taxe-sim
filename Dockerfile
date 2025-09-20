FROM node:20-alpine AS backend
WORKDIR /app
COPY backend/package.json ./
RUN npm install --omit=dev
COPY backend ./
ENV PORT=3000
EXPOSE 3000
CMD ["npm","start"]
