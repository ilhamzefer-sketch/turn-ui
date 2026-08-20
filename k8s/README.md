# Kubernetes deployment

The `k8s/stage` directory is the GitOps source watched by the `turn-ui-stage` Argo CD application.

The cluster must provide `ghcr-creds` with read access to the private GHCR image. CI builds an immutable image tagged with the source commit SHA, updates `k8s/stage/kustomization.yaml`, and Argo CD performs the rolling deployment automatically.
