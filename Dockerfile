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

# run the command
CMD ["npm", "run", "start:prod"]