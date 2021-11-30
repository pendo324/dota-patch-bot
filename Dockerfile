FROM public.ecr.aws/docker/library/node:17-alpine3.13
WORKDIR /usr/src/app
COPY . .
RUN npm install --legacy-peer-deps
RUN npx tsc -p ./tsconfig.json
CMD ["npm", "run", "start"]
