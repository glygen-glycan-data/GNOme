#!/bin/sh
docker run -u 501:501 -v `pwd`:/tmp/working -w /tmp/working --rm robot convert --input GNOme.owl --format obo --output GNOme.obo
docker run -u 501:501 -v `pwd`:/tmp/working -w /tmp/working --rm robot convert --input GNOme.owl --format json --output GNOme.json
