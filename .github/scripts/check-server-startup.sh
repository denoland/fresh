#/bin/bash

PORT=8000

declare DIRNAME=$1
if ! [ -d $DIRNAME ]; then
  exit 1
fi

# Start up a server
nohup "./${DIRNAME}/main.ts" > /dev/null &

# Wait the server
for ((i=0 ; i<5; i++))
do
  lsof -t -i "tcp:${PORT}"
  if [[ $? -eq 0 ]]; then
    break
  fi
  echo "Waiting server..."
  sleep 1
done

# Access the server
curl "localhost:${PORT}/" -o /dev/null -s
EXIT_CODE=$?

# Clean up
lsof -t -i "tcp:${PORT}" | xargs kill

exit $EXIT_CODE
