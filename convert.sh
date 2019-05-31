#!/bin/sh
USER="`id -u`:`id -g`"
docker run -u $USER -v `pwd`:/tmp/working -w /tmp/working --rm robot convert --input GNOme.owl --format obo --output GNOme.obo
docker run -u $USER -v `pwd`:/tmp/working -w /tmp/working --rm robot convert --input GNOme.owl --format json --output GNOme.json
