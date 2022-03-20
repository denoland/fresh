#!/bin/bash

declare DIRNAME=$1
if ! [ -d $DIRNAME ]; then
  exit 1
fi
cd $DIRNAME

# Check files
declare -a TARGET_FILES=(
  "README.md"
  "client_deps.ts"
  "fresh.gen.ts"
  "main.ts"
  "server_deps.ts"
)

for filename in "${TARGET_FILES[@]}"
do
  if ! [ -f $filename ]; then
    exit 1
  fi
done

# Check sub-dires
declare -a TARGET_SUB_DIRS=(
  "islands"
  "routes"
)
for subdir in "${TARGET_SUB_DIRS[@]}"
do
  if ! [ -d $subdir ]; then
    exit 1
  fi
done

exit 0

