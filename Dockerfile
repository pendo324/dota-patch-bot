FROM public.ecr.aws/docker/library/node:17-alpine3.13 as build
RUN apk add --update --no-cache python3
RUN apk add build-base
WORKDIR /usr/src/app
COPY . .
RUN npm install --production

FROM public.ecr.aws/docker/library/node:17-alpine3.13
COPY --from=build /usr/src/app/dist dist
COPY --from=build /usr/src/app/node_modules node_modules

RUN npx tsc -p ./tsconfig.json
CMD ["npm", "run", "start"]
