# !/bin/bash

# rewrite nginx config
env2file conversion -f /etc/nginx/nginx.conf

exec "$@"