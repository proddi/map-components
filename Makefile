.PHONY: clean
clean:
	@rm -rf package-lock.json node_modules
	@cd docs && make clean

.PHONY: build
build:
	docker run --rm --user "`id -u`":"`id -g`" -v `pwd`:/src -w /src/src rust:1.23.0 /bin/bash -c "ls -la;rustc hello.rs"

.PHONY: bash
bash:
	docker run --rm -it --user "`id -u`":"`id -g`" -v `pwd`:/src -w /src node:lts-slim /bin/bash -c "ls -la; /bin/bash -i"

.PHONY: docs
docs:
	docker run --rm -it --user "`id -u`":"`id -g`" -v `pwd`:/src -w /src node:lts-slim /bin/bash -c "npm install esdoc esdoc-standard-plugin; ./node_modules/.bin/esdoc -c docs/conf.json"
	@echo -e "\033[95m\n\nBuild successful! View the docs homepage at docs/build\n\033[0m"
	sensible-browser docs/build/index.html

.PHONY: docs-es-proposals
docs-es-proposals:
	docker run --rm -it --user "`id -u`":"`id -g`" -v `pwd`:/src -w /src node:lts-slim /bin/bash -c "npm install esdoc esdoc-ecmascript-proposal-plugin; ./node_modules/.bin/esdoc -c docs/conf-es-proposals.json"
	@echo -e "\033[95m\n\nBuild successful! View the docs homepage at docs/build\n\033[0m"
	sensible-browser docs/build/index.html

.PHONY: server
server:
	python -m SimpleHTTPServer 8082 &
	sensible-browser http://localhost:8082/
