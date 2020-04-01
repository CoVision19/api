FROM node:latest

RUN mkdir /app
WORKDIR /app

ENV NODE_ENV production
ENV PORT 3000
ENV PATH /app/node_modules/.bin:$PATH

EXPOSE $PORT
ADD package.json yarn.lock /app/
RUN yarn install

COPY . /app/

CMD [ "yarn", "start" ]