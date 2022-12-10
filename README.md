# Fragments UI

Fragments UI is a web application that allows you to create and manage fragments in a simple way.

The backend is based on the repository [Fragments](https://github.com/saminarp/fragments) and needs to be running in order to use this application. Follow the instructions in the README of that repository to set up the backend.

#### Environment variables

The following environment variables are required to run the application :

```bash
# .env
# fragments microservice API URL (make sure this is the right port for you)
API_URL=http://localhost:8080
# ECS URL
#API_URL=http://EXAMPLE.us-east-1.elb.amazonaws.com:8080

# AWS Amazon Cognito User Pool ID (use your User Pool ID)
AWS_COGNITO_POOL_ID=your-user-pool-id

# AWS Amazon Cognito Client App ID (use your Client App ID)
AWS_COGNITO_CLIENT_ID=your-client-app-id

# AWS Amazon Cognito Host UI domain (user your domain)
AWS_COGNITO_HOSTED_UI_DOMAIN=your-domain.auth.us-east-1.amazoncognito.com

# OAuth Sign-In Redirect URL (use the port for your fragments-ui web app)
OAUTH_SIGN_IN_REDIRECT_URL=http://localhost:1234

# OAuth Sign-Out Redirect URL (use the port for your fragments-ui web app)
OAUTH_SIGN_OUT_REDIRECT_URL=http://localhost:1234
```

### Development

If you are using the backend in development mode locally, you can leave the `API_URL` as `http://localhost:8080`. If you are using the backend in production mode, you will need to use the URL of the Elastic Container Service (ECS) that is running the backend. You can find the URL in the AWS console under the ECS service.

#### Running the application

```bash
# install dependencies
npm install
# using parcel to run the application
npm run dev
```

### Dockerfile

Current Dockerfile uses 3 stages to build the application. The first and second stages are using `node:16.15.1-bullseye` as base image. The third stage is using `nginx:1.21.3-alpine` as base image. The first stage is used to install the dependencies and build the application. The second stage is used to copy the built application from the first stage. The third stage is used to copy the built application from the second stage and serve it using `nginx`.

#### Build the image

```bash
docker build -t saminarp/fragments:latest .  # build the image
```

#### Run the image

```bash
docker run -p 1234:80 saminarp/fragments:latest  # run the image
```

#### Push the image

```bash
docker push saminarp/fragments:latest  # push the image
```
