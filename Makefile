.PHONY: e2e-setup-core
e2e-setup-core: install-vela install-core install-addon

.PHONY: install-vela
install-vela: 
	curl -fsSl https://kubevela.net/script/install.sh | bash 
install-core:
	vela install -y
install-addon:
	vela addon enable fluxcd
	vela addon enable vela-workflow --override-definitions
	timeout 600s bash -c -- 'while true; do kubectl get ns flux-system; if [ $? -eq 0 ] ; then break; else sleep 5; fi;done'
	kubectl wait --for=condition=Ready pod -l app=source-controller -n flux-system --timeout=600s
	kubectl wait --for=condition=Ready pod -l app=helm-controller -n flux-system --timeout=600s
	kubectl wait --for=condition=Ready pod -l app.kubernetes.io/name=vela-workflow -n vela-system --timeout=600s

.PHONY: e2e-server-test
e2e-server-test:
	go test -v -coverpkg=./... -coverprofile=/tmp/e2e_apiserver_test.out ./e2e-test
	@$(OK) tests pass

