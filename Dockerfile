FROM node:alpine
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
RUN npm install
EXPOSE 5000
COPY . /usr/src/app
CMD [ "npm", "start" ]