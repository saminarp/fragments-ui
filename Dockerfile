# Base image to use
FROM node:16.15.1-bullseye@sha256:294ed7085d137d4f16fd97c0e1518f1d0386dd7fda7c4897d82c7ba65e15fdd6 AS dependencies

WORKDIR /home/node/app

ENV NO_COLOR=1 \
  PORT=1234

COPY package.json package-lock.json  ./

RUN npm ci 


#########################################################

FROM node:16.15.1-bullseye@sha256:294ed7085d137d4f16fd97c0e1518f1d0386dd7fda7c4897d82c7ba65e15fdd6 AS build

WORKDIR /home/node/app 

COPY . .

COPY --from=dependencies /home/node/app /home/node/app/

RUN npm run build


#########################################################
FROM nginx:1.22.1@sha256:38c3e37944bce3032e739a48a2310548ca33fe045108b594f2a773bc013eedfa AS deploy

COPY --from=build /home/node/app/dist/. /usr/share/nginx/html/

EXPOSE 1234

HEALTHCHECK --interval=15s --timeout=30s --start-period=10s --retries=3 \
  CMD curl --fail localhost:1234 || exit 1