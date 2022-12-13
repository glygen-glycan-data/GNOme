#!/bin/sh
set -x
# Ensure we have the latest....
docker pull obolibrary/robot
USER="`id -u`:`id -g`"
for OWL in `find . -name "*.owl"`; do
  DIR=`dirname "$OWL"`
  BASE=`basename "$OWL" .owl`
  OBO="$DIR/$BASE.obo"
  JSON="$DIR/$BASE.json"
  if [ \( \! -f "$OBO" \) -o \( "$OWL" -nt "$OBO" \) ]; then
    docker run -u $USER -v `pwd`:/tmp/working -w /tmp/working --rm obolibrary/robot convert --input "$OWL" --format obo --output "$OBO"
  fi
  if [ \( \! -f "$JSON" \) -o \( "$OWL" -nt "$JSON" \) ]; then
    docker run -u $USER -v `pwd`:/tmp/working -w /tmp/working --rm obolibrary/robot convert --input "$OWL" --format json --output "$JSON"
  fi
done
