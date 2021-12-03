FROM node:16-alpine as builder
WORKDIR /app/velaux
ADD . .
RUN yarn install && yarn build
RUN rm -rf /app/velaux/build/mock

FROM nginx:1.21
ARG GITVERSION
COPY --from=builder /app/velaux/build /usr/share/nginx/html
COPY web.conf /etc/nginx/nginx.conf
RUN echo "${GITVERSION}" > /tmp/version
COPY entrypoint.sh /entrypoint.sh
ENV KUBEVELA_API_URL="127.0.0.1:8000"
ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
