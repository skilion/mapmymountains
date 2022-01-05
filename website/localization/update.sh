#!/bin/sh
awk -f convert.awk strings.tsv >../src/assets/loc_strings.js
