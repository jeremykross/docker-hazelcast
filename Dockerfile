FROM java:7

MAINTAINER ContainerShip Developers <developers@containership.io>

# set environment variables
ENV HZ_VERSION 3.5.2
ENV HZ_HOME /opt/hazelcast/

RUN mkdir -p $HZ_HOME
WORKDIR $HZ_HOME
# Download hazelcast jars from maven repo.
ADD http://download.hazelcast.com/download.jsp?version=hazelcast-$HZ_VERSION&p=docker $HZ_HOME/hazelcast.zip
RUN unzip hazelcast.zip

# install dependencies
RUN apt-get update
RUN apt-get install wget npm -y

# install npm & node
RUN npm install -g n
RUN n 0.10.38

# create /app and add files
WORKDIR /app
ADD . /app

# install dependencies
RUN npm install

# expose port
EXPOSE 5701

# Execute the run script in foreground mode
CMD node hazelcast.js
