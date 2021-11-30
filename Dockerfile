FROM public.ecr.aws/docker/library/node:17-alpine3.13 as build
WORKDIR /usr/src/app
COPY package.json .
RUN npm install
COPY . .
RUN npx tsc -p ./tsconfig.json
FROM public.ecr.aws/docker/library/node:17-alpine3.13
WORKDIR /usr/src/app
RUN npm install --production
COPY package.json .
RUN npm install --production
COPY --from=build /usr/src/app/dist dist
CMD ["npm", "run", "start"]
