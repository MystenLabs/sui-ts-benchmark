#!/bin/bash
if [ -z "$1" ]
then
    echo "Please include the version number e.g. push.sh 10"
    exit 1
fi
export VERSION="$1"
docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/cryptic-bolt-398315/sui-ts-benchmark/sui-ts-benchmark:v$VERSION -f docker/Dockerfile .
docker push us-central1-docker.pkg.dev/cryptic-bolt-398315/sui-ts-benchmark/sui-ts-benchmark:v$VERSION
