#!/bin/bash

echo $'\nBuilding packages'
yarn build-packages

echo $'\nPacking packages'
yarn packages:pack

echo $'\nPublishing packages'
for file in ./npm-artifacts/*.tgz; do npm publish "$file"; done

