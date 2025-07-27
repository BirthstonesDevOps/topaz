FROM node:lts-alpine AS builder

ARG GH_PKG_TOKEN
RUN echo "@birthstonesdevops:registry=https://npm.pkg.github.com/"   > /root/.npmrc && \
    echo "//npm.pkg.github.com/:_authToken=${GH_PKG_TOKEN}"           >> /root/.npmrc

WORKDIR /app
RUN npm install -g @angular/cli@19.2.3
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Define the build configuration argument with a default value (e.g., production)
ARG BUILD_CONFIGURATION=production
RUN ng build --configuration=$BUILD_CONFIGURATION

FROM nginx:alpine
RUN rm -rf /usr/share/nginx/html/*
# Copy everything from the build output
COPY --from=builder /app/dist/topaz/ /usr/share/nginx/html/
# Move the files from the "browser" subdirectory up and remove the now-empty directory
RUN if [ -d /usr/share/nginx/html/browser ]; then \
      mv /usr/share/nginx/html/browser/* /usr/share/nginx/html/ && \
      rmdir /usr/share/nginx/html/browser; \
    fi
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]