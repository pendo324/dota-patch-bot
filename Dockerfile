FROM public.ecr.aws/docker/library/node:17-alpine3.13 as build
RUN apk add --update --no-cache python3
RUN apk add build-base
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY tsconfig.json tsconfig.json
COPY src src
RUN npm run build
RUN rm -rf ./node_modules && npm install --production

FROM public.ecr.aws/docker/library/node:17-alpine3.13
WORKDIR /usr/src/app
COPY package*.json ./
COPY --from=build /usr/src/app/node_modules node_modules
COPY --from=build /usr/src/app/dist dist
RUN mkdir data
VOLUME ["data/"]

CMD ["npm", "run", "start"]
