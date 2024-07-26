#!/bin/bash
source docker/versions.sh > /dev/null 2>&1

VERSION="$1"
if [ -z "$VERSION" ]
then
    echo "No version number provided, trying to get the next version number from the latest tag"
    ((VERSION=$(get_versions | head -n1 | sed 's/^v//') + 1))
    echo "Using $VERSION as the version number"
fi
docker build --platform linux/amd64 -t us-central1-docker.pkg.dev/cryptic-bolt-398315/sui-ts-benchmark/sui-ts-benchmark:v$VERSION -f docker/Dockerfile .
docker push us-central1-docker.pkg.dev/cryptic-bolt-398315/sui-ts-benchmark/sui-ts-benchmark:v$VERSION
