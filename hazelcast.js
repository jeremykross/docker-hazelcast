var fs = require("fs");
var os = require("os");
var _ = require("lodash");
var async = require("async");
var dns = require("native-dns");
var child_process = require("child_process");

async.parallel({
    HAZELCAST_MEMBERS: function(fn){
        if(_.has(process.env, "HAZELCAST_MEMBERS"))
            return fn(null, process.env.HAZELCAST_MEMBERS);

        var question = dns.Question({
          name: ["followers", process.env.CS_CLUSTER_ID, "containership"].join("."),
          type: "A"
        });

        var req = dns.Request({
            question: question,
            server: { address: "127.0.0.1", port: 53, type: "udp" },
            timeout: 2000
        });

        req.on("timeout", function(){
            return fn();
        });

        req.on("message", function (err, answer) {
            var addresses = [];
            answer.answer.forEach(function(a){
                addresses.push(a.address);
            });

            return fn(null, addresses.join(","));
        });

        req.send();
    },
    HAZELCAST_INTERFACE: function(fn){
        if(_.has(process.env, "HAZELCAST_INTERFACE"))
            return fn(null, process.env.HAZELCAST_INTERFACE);

        var question = dns.Question({
          name: [os.hostname(), process.env.CS_CLUSTER_ID, "containership"].join("."),
          type: "A"
        });

        var req = dns.Request({
            question: question,
            server: { address: "127.0.0.1", port: 53, type: "udp" },
            timeout: 2000
        });

        req.on("timeout", function(){
            return fn();
        });

        req.on("message", function (err, answer) {
            var addresses = [];
            answer.answer.forEach(function(a){
                addresses.push(a.address);
            });

            return fn(null, _.first(addresses));
        });

        req.send();

    }
}, function(err, hazelcast){
    _.merge(hazelcast, process.env);

    _.defaults(hazelcast, {
        HAZELCAST_GROUP_NAME: "dev",
        HAZELCAST_GROUP_PASSWORD: "dev-pass",
        HAZELCAST_MEMBERS: "",
        HAZELCAST_INTERFACE: ""
    });

    fs.readFile([__dirname, "hazelcast.template"].join("/"), function(err, config){
        config = config.toString();
        config = config.replace(/GROUP_NAME/g, hazelcast.HAZELCAST_GROUP_NAME);
        config = config.replace(/GROUP_PASSWORD/g, hazelcast.HAZELCAST_GROUP_PASSWORD);
        if(!_.isEmpty(hazelcast.HAZELCAST_MEMBERS))
            config = config.replace(/CLUSTER_MEMBERS/g, ["<members>", hazelcast.HAZELCAST_MEMBERS, "</members>"].join(" "));
        else
            config = config.replace(/CLUSTER_MEMBERS/g, "");

        if(!_.isEmpty(hazelcast.HAZELCAST_INTERFACE))
            config = config.replace(/INTERFACE/g, ["<interface>", hazelcast.HAZELCAST_INTERFACE, "</interface>"].join(" "));
        else
            config = config.replace(/INTERFACE/g, "");

        fs.writeFile([__dirname, "hazelcast.xml"].join("/"), config, function(err){
            if(err){
                process.stderr.write(err.message);
                process.exit(1);
            }

            var proc = child_process.spawn([hazelcast.HZ_HOME, ["hazelcast", hazelcast.HZ_VERSION].join("-"), "bin", "server.sh"].join("/"));

            proc.stdout.pipe(process.stdout);
            proc.stderr.pipe(process.stderr);

            proc.on("error", function(err){
                process.stderr.write(err.message);
                process.exit(1);
            });
        });
    });
});
