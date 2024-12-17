FROM node:20

# set a directory for the app
WORKDIR /usr/src/app

# copy all the files to the container
COPY . .

# install dependencies
RUN yarn

# define the port number the container should expose
EXPOSE 3022

# run the command
CMD ["npm", "run", "start:prod"]