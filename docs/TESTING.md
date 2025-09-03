# VelaUX Testing Guide

This guide provides instructions for running tests locally for the VelaUX project.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Database Setup](#database-setup)
- [Running Unit Tests](#running-unit-tests)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- Go 1.23.8 or higher
- Docker and Docker Compose
- Make
- Kubebuilder and test tools (for unit tests)
- Ginkgo (for some test suites)

### Installing Test Dependencies

Install Kubebuilder and other test tools:
```bash
make setup-test-server
```

This installs:
- Kubebuilder binary
- Controller runtime test environment tools
- Test binaries (etcd, kube-apiserver, kubectl)

For Ginkgo (on Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install -y golang-ginkgo-dev
```

## Database Setup

The unit tests require MySQL, PostgreSQL, and MongoDB databases running locally.

### Using Docker Compose (Recommended)

We provide a `docker-compose.test.yml` file that sets up the same database configuration as used in CI:

```bash
# Start all test databases
make test-db-up

# Verify databases are running
docker-compose -f docker-compose.test.yml ps

# View database logs if needed
make test-db-logs

# Stop and remove databases when done
make test-db-down
```

### Database Configuration

The test databases use the following configuration (matching the CI environment):

| Database   | Container Name      | Port  | Credentials                                    |
|------------|-------------------|-------|------------------------------------------------|
| MySQL 8.0  | velaux-test-mysql | 3306  | root / kubevelaSQL123 (database: kubevela)    |
| PostgreSQL 11 | velaux-test-postgres | 5432 | kubevela / Kubevela-123 (database: kubevela) |
| MongoDB 5.0 | velaux-test-mongodb | 27017 | No authentication                             |

## Running Unit Tests

### Local Development

1. **Start the test databases:**
   ```bash
   make test-db-up
   ```

2. **Run the unit tests:**
   ```bash
   make unit-test-server-local
   ```

3. **Stop the databases when done:**
   ```bash
   make test-db-down
   ```

### Test Options

```bash
# Run tests for a specific package
go test ./pkg/server/domain/service/...

# Run tests with verbose output
go test -v ./pkg/...

# Run tests with race detection
go test -race ./pkg/...

# Generate coverage report
make unit-test-server-local
go tool cover -html=coverage.txt -o coverage.html
open coverage.html  # macOS
```


## Troubleshooting

### Common Issues

#### Port Already in Use
If you get "bind: address already in use" errors:

```bash
# Check what's using the ports
lsof -i :3306  # MySQL
lsof -i :5432  # PostgreSQL
lsof -i :27017 # MongoDB

# Stop conflicting containers if any
docker ps
docker stop <container_name>
```

#### Database Connection Failed
If tests fail with connection errors:

```bash
# Check if databases are running
docker-compose -f docker-compose.test.yml ps

# Restart databases
make test-db-down
make test-db-up

# Check database logs
make test-db-logs
```

#### MySQL "Table Already Exists"
Reset the MySQL database:

```bash
docker exec velaux-test-mysql mysql -uroot -pkubevelaSQL123 -e \
  "DROP DATABASE IF EXISTS kubevela; CREATE DATABASE kubevela;"
```

#### PostgreSQL Authentication Failed
Reset the PostgreSQL database:

```bash
docker exec velaux-test-postgres psql -U postgres -c \
  "DROP DATABASE IF EXISTS kubevela; CREATE DATABASE kubevela OWNER kubevela;"
```

#### Kubebuilder Not Found
If you get "kubebuilder: command not found":

```bash
# Reinstall test tools
make setup-test-server

# Verify installation
which kubebuilder
ls -la /usr/local/kubebuilder/bin/
```

### Clean Test Environment

To completely reset your test environment:

```bash
# Stop and remove all test containers
make test-db-down

# Remove test binaries
sudo rm -rf /usr/local/kubebuilder

# Reinstall everything
make setup-test-server
```

## CI/CD Environment

The GitHub Actions workflow (`.github/workflows/server-test.yml`) uses the same database configuration but sets up databases using GitHub Actions services instead of Docker Compose. The test commands and database credentials are identical to ensure consistency between local and CI environments.

## Quick Start Script

For convenience, you can create a script to set up the entire test environment:

```bash
#!/bin/bash
set -e

echo "Setting up VelaUX test environment..."

# Install test tools
echo "Installing test dependencies..."
make setup-test-server

# Start databases
echo "Starting test databases..."
make test-db-up

echo "Running tests..."
make unit-test-server-local

echo "Cleaning up..."
make test-db-down

echo "Tests completed!"
```

Save as `run-tests.sh` and make executable: `chmod +x run-tests.sh`