# Dev image: Node + Angular CLI, so nothing needs to be installed on the host.
FROM node:24-bookworm

RUN npm install -g @angular/cli@22

WORKDIR /app
EXPOSE 4200
