#!/bin/sh
cd ./demo
rm -rf ./dist
npm run build
cd ./dist
git init
git add .
git commit -m 'push to gh-pages'
git push --force git@github.com:anvaka/streamlines.git main:gh-pages
cd ../
git tag `date "+demo-%Y%m%d%H%M%S"`
git push --tags
cd ../
