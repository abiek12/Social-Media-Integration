FROM node:20

# set a directory for the app
WORKDIR /usr/src/app

# copy package.json to the container
COPY package*.json ./

# install dependencies
RUN yarn

# copy all the files to the container
COPY . .

# define the port number the container should expose
EXPOSE 3027

# Default environment variables (optional, for debugging purposes)
ENV FACEBOOK_CLIENT_ID=524739536656987
ENV FACEBOOK_CLIENT_SECRET=7cac79f29be10f374e897bac77bde8f4

# run the command
CMD ["npm", "run", "start:prod"]