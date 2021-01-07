// client library for dobaos application
// (c) Vladimir Shabunin, 2019
const EE = require("events");
const redis = require("redis");

const Dobaos = params => {
  let _params = {
    redis: null,
    prefix: "dobaos",
    res_prefix: "dobaos_res",
    req_timeout: 5000
  };
  Object.assign(_params, params);

  const self = new EE();
  self.requests = [];

  self.init = _ => {
    self.pub = redis.createClient(_params.redis);
    self.sub = redis.createClient(_params.redis);
    self.bcast = redis.createClient(_params.redis);

    self.pub.get(`${_params.prefix}:config:req_channel`, (err, reply) => {
      if (err)
        throw err;
      if (!reply)
        throw new Error("wrong prefix");

      _params.req_channel = reply;
    });
    self.pub.get(`${_params.prefix}:config:bcast_channel`, (err, reply) => {
      if (err)
        throw err;
      _params.bcast_channel = reply;
      if (!reply)
        throw new Error("wrong prefix");

      self.bcast.subscribe(_params.bcast_channel);
    });

    // subscribe to broadcast events
    self.bcast.on("message", (channel, message) => {
      if (channel === _params.bcast_channel) {
        try {
          const msg = JSON.parse(message);
          self.emit(msg.method, msg.payload);
        } catch (e) {
          //console.log("error processing broadcast message", e);
        }
      }
    });

    // work with subscriber object
    self.sub.on("psubscribe", _ => {
      self.emit("ready");
    });
    self.sub.on("pmessage", (pattern, channel, message) => {
      // on response
      // find callback in requests array and resolve
      const reqIndex = self.requests.findIndex(t => t.response_channel === channel);
      if (reqIndex > -1) {
        const req = self.requests[reqIndex];
        const cb = req.cb;
        try {
          const res = JSON.parse(message);
          if (res.method === "success") {
            cb(null, res.payload);
          } else {
            cb(new Error(res.payload));
          }
          clearTimeout(self.requests[reqIndex].req_timeout);
          self.requests.splice(reqIndex, 1);
        } catch (e) {
          return cb(e);
        }
      }
    });
    self.sub.psubscribe(`${_params.res_prefix}_*`);
  };

  self._commonReq = (channel, method, payload) => {
    return new Promise((resolve, reject) => {
      const response_channel = `${_params.res_prefix}_${Math.random() * 255}`;
      // request to send
      const request = {};
      request.method = method;
      request.payload = payload;
      request.response_channel = response_channel;
      const cb = (err, payload) => {
        if (err) {
          return reject(err);
        }
        resolve(payload);
      };

      // object to store until response
      let req = {};
      req.response_channel = response_channel;
      req.cb = cb;
      // timeout
      req.timeout = setTimeout(_ => {
        // find in array and destroy
        const reqIndex = self.requests.findIndex(t => t.response_channel === response_channel);
        if (reqIndex > -1) {
          const req = self.requests[reqIndex];
          const cb = req.cb;
          self.requests.splice(reqIndex, 1);

          return cb(new Error("ERR_TIMEOUT"));
        }
      }, _params.req_timeout);

      // store request
      self.requests.push(req);
      // publish and await response
      self.pub.publish(channel, JSON.stringify(request));
    });
  };
  // sdk reqs
  self.getDescription = payload => {
    return self._commonReq(_params.req_channel, "get description", payload);
  };
  self.getValue = payload => {
    return self._commonReq(_params.req_channel, "get value", payload);
  };
  self.getStored = payload => {
    return self._commonReq(_params.req_channel, "get stored", payload);
  };
  self.readValue = payload => {
    return self._commonReq(_params.req_channel, "read value", payload);
  };
  self.setValue = payload => {
    return self._commonReq(_params.req_channel, "set value", payload);
  };
  self.putValue = payload => {
    return self._commonReq(_params.req_channel, "put value", payload);
  };
  self.getProgrammingMode = _ => {
    return self._commonReq(_params.req_channel, "get programming mode", null);
  };
  self.setProgrammingMode = payload => {
    return self._commonReq(_params.req_channel, "set programming mode", payload);
  };
  self.getServerItems = _ => {
    return self._commonReq(_params.req_channel, "get server items", null);
  };
  // service reqs
  self.getVersion = _ => {
    return self._commonReq(_params.req_channel, "version", null);
  };
  self.reset = _ => {
    return self._commonReq(_params.req_channel, "reset", null);
  };
  self.setName = (id, name) => {
    return  self.pub.hset(`${_params.prefix}:config:names`, `${name}`, `${id}`);
  };
  self.delName = (name) => {
    return  self.pub.hdel(`${_params.prefix}:config:names`, `${name}`);

  }
  self.getName = async (id) => {
    let d = await self.getDescription(id);
    if (Array.isArray(d)) d = d[0];
    return d.name;
  };

  return self;
};

module.exports = Dobaos;
