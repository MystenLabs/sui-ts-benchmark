#!/bin/bash

get_versions(){
    # Define variables
    REPOSITORY="sui-ts-benchmark"
    LOCATION="us-central1"
    PACKAGE="sui-ts-benchmark"
    
    # List all tags
    gcloud artifacts tags list --repository $REPOSITORY --location $LOCATION --package $PACKAGE --format json \
    | jq '.[] | .name' \
    | grep -o -E 'v[0-9]+' \
    | sort -Vr \
    | head -n3
}
get_versions