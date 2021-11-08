#!/bin/sh

# rewrite nginx config
sed -i "s/KUBEVELA_API_URL/${KUBEVELA_API_URL}/g" /etc/nginx/nginx.conf

exec "$@"