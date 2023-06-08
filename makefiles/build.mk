# Build the docker image
.PHONY: docker-build
docker-build: docker-build-velaux
	@$(OK)

.PHONY: docker-build-velaux
docker-build-velaux:
	docker build --build-arg=VERSION=$(VELAUX_VERSION) --build-arg=GITVERSION=$(GIT_COMMIT) -t $(VELAUX_IMAGE) .
