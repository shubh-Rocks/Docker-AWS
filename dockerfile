# build Frontend

FROM  node:20-alpine AS frontend-builder

COPY ./Frontend /app

WORKDIR /app 

RUN npm install 

RUN npm run build


# build Backend

FROM  node:20-alpine AS backend-builder 

COPY  ./Backend /app 

WORKDIR /app

RUN  npm install

COPY  --from=frontend-builder /app/dist  /app/public

CMD ["node","server.js"]
