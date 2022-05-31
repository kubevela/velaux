FROM node:16-alpine as builder
ARG VERSION
WORKDIR /app/velaux
ADD . .
ENV VERSION=${VERSION}
RUN apk add --no-cache git && yarn install && yarn build
RUN rm -rf /app/velaux/build/mock

FROM nginx:1.21
ARG GITVERSION
COPY --from=builder /app/velaux/build /usr/share/nginx/html
COPY web.conf /etc/nginx/nginx.conf
RUN echo "${GITVERSION}" > /tmp/version
COPY entrypoint.sh /entrypoint.sh
ENV KUBEVELA_API_URL="127.0.0.1:8000"
ENV DEX_URL="127.0.0.1:5556"
ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
