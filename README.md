# Collaborative Code Editor

A small real-time collaborative code editor built as a hands-on project for learning Docker and AWS. The React/Vite frontend is built into a Node.js/Express image, while Socket.IO and Yjs handle live editor collaboration.

**Project:** [http://shubh-docker-aws-977622643.ap-northeast-1.elb.amazonaws.com]

## Screenshot

The supplied image shows the name-entry screen. Add the image to `docs/join-screen.png` to display it in this section:

<!-- ![Collaborative editor join screen](docs/join-screen.png) -->

## What It Does

- Join the editor by entering a display name.
- Edit JavaScript in a Monaco editor.
- Share document changes and connected-user presence in real time with Yjs and Socket.IO.
- Serve the built frontend and a health endpoint from the Express backend.

## Stack

- React 19, Vite, Tailwind CSS, and Monaco Editor
- Node.js 20, Express, and Socket.IO
- Yjs with `y-socket.io` for collaboration
- Docker multi-stage build
- AWS learning path: Amazon ECR for images and Amazon ECS on AWS Fargate for running the container

## Run With Docker

From the repository root:

```bash
docker build -f dockerfile -t collaborative-editor:local .
docker run --rm --name collaborative-editor -p 3100:3100 collaborative-editor:local
```

```bash
curl http://localhost:3100/health
```

It should return JSON with `success: true`. Stop the container with `Ctrl+C`.

The Docker build first compiles the Vite app, then copies its output into the backend image, which serves the static files on port `3100`.

## Run Frontend Checks

The frontend package has build and lint scripts:

```bash
cd Frontend
npm ci
npm run build
npm run lint
```

## Docker Learning Notes

- The build context is the repository root, so run `docker build` from there.
- The root `dockerfile` uses Node.js 20 Alpine and builds the frontend before assembling the backend runtime image.
- `.dockerignore` excludes dependency folders, build output, Git files, and `.env` files.
- The app listens on container port `3100`; `-p 3100:3100` maps it to the same port on your computer.
- Useful practice: inspect the image with `docker image ls`, view a running container with `docker ps`, and review logs with `docker logs collaborative-editor`.

## AWS Learning Path: ECR and ECS

The repository currently contains a Docker build but no AWS deployment configuration. These steps are a learning path for publishing the image to Amazon ECR and running one task on Amazon ECS with AWS Fargate.

Prerequisites: AWS CLI configured for your account, Docker running, and permission to create ECR and ECS resources. AWS resources can incur charges; delete the resources when finished.

Set the region and repository name in a Bash-compatible terminal (including Git Bash):

```bash
AWS_REGION=us-east-1
ECR_REPOSITORY=collaborative-editor
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY"
```

Create the repository once, authenticate Docker, then build and push the image:

```bash
aws ecr create-repository --repository-name "$ECR_REPOSITORY" --region "$AWS_REGION"
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
docker build -f dockerfile -t "$ECR_REPOSITORY:latest" .
docker tag "$ECR_REPOSITORY:latest" "$ECR_URI:latest"
docker push "$ECR_URI:latest"
```

In ECS, create a Fargate task definition using the pushed image. Configure an `awsvpc` network, container port `3100` with TCP, and a health check that requests `/health`. Run a single task in a service while learning. For a temporary test, use a security group restricted to your IP; for a more realistic setup, put the service behind an Application Load Balancer with HTTPS. Socket.IO uses WebSockets, so allow WebSocket connections through the load balancer.

Keep AWS credentials out of the repository. Use IAM roles for AWS services rather than placing access keys in the image or source code.

## Current Limitations

- The app has no sign-in or access control; display names are not identities.
- Collaborative document state is not backed by persistent storage. Restarting the server can lose it.
- Run one backend task for this learning setup. Multiple tasks require shared persistence and an appropriate Socket.IO scaling configuration.
- The backend currently allows cross-origin Socket.IO connections from any origin; review this before making a public deployment.
