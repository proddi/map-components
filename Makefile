.PHONY: init
init:
	docker run --rm -it --user "`id -u`":"`id -g`" -v `pwd`:/src -w /src node:lts-slim /bin/bash -c "npm install"

.PHONY: clean
clean:
	@rm -rf package-lock.json node_modules docs build

.PHONY: build
build:
	docker run --rm -it --user "`id -u`":"`id -g`" -v `pwd`:/src -w /src node:lts-slim /bin/bash -c "node node_modules/polymer-cli/bin/polymer.js build --entrypoint examples/material/routing-app.html"

.PHONY: bash
bash: init
	docker run --rm -it --net host --user "`id -u`":"`id -g`" -v `pwd`:/src -w /src node:lts-slim /bin/bash -c "npm run; /bin/bash -i"

.PHONY: docs
docs:
	docker run --rm -it --user "`id -u`":"`id -g`" -v `pwd`:/src -w /src node:lts-slim /bin/bash -c "npm run build:docs"
	@echo -e "\033[95m\n\nBuild successful! View the docs homepage at docs\n\033[0m"
	sensible-browser http://localhost:8082/docs/

.PHONY: docs-publish
docs-publish:
	git checkout master
	git subtree split --prefix build -b gh-pages
	git checkout gh-pages
	git add -f build/docs
	git commit -m "Updated docs."
	git checkout master
	git push -f origin gh-pages:gh-pages
	git branch -D gh-pages

.PHONY: server
server:
	sensible-browser http://localhost:8082/
	python -m SimpleHTTPServer 8082
