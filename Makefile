.PHONY: test smoke
.DEFAULT_GOAL := test

test: ## Host/card unit tests of the DSH plugin (no backend, no network).
	node --test dsh-ai-terminal/test/

smoke: ## End-to-end smoke against the real Go backend (needs a txmlconnector checkout).
	node dsh-ai-terminal/test/proxy-smoke.mjs
