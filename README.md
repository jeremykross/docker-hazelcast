# docker-hazelcast

##About

###Description
Docker image designed to run a Hazelcast cluster on ContainerShip

###Author
ContainerShip Developers - developers@containership.io

##Usage
This image is designed to run a Hazelcast on a ContainerShip cluster. Running this image elsewhere is not recommended as the container may be unable to start.

###Configuration
This image will run as-is, with no additional environment variables set. For clustering to work properly, start the application in host networking mode.

### Recommendations
* On your ContainerShip cluster, run this application using the `constraints.per_node=1` tag. Each node in your cluster will run an instance of Hazelcast, creating a cluster of `n` hosts, where `n` is the number of follower hosts in your ContainerShip cluster.

##Contributing
Pull requests and issues are encouraged!
