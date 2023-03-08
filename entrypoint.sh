#!/bin/sh

if [ "$1" = "server" ]; then
    shift # "apiserver"
    set -- /velaux/server "$@"
fi

exec "$@"
