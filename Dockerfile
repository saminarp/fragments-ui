# Build fragments-ui web app and serve it with parcel


FROM node:16.13.1-alpine3.14

ENV NPM_CONFIG_LOGLEVEL=warn \
  NPM_CONFIG_COLOR=false

WORKDIR /app

COPY package*.json ./

RUN npm ci


