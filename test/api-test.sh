#!/bin/bash
path=$2
method=$1
loginRequest="{\"username\": \"admin\", \"password\":\"$UX_PASSWORD\"}"
loginResponse=$(curl -s -H Content-Type:application/json -X POST -d "$loginRequest" http://127.0.0.1:8001/api/v1/auth/login)
accessToken=$(echo "$loginResponse"| jq -r '.accessToken')

echo "$accessToken"

curl -H Content-Type:application/json -H "Authorization: Bearer ${accessToken}" -X "$method" -v "http://127.0.0.1:8001$path"