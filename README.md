# dobaos.js

NodeJS library providing dobaos client functionality.

## Usage

```text
const Dobaos = require("./index.js");

/*** 
Default params may be overwritten
    dob = Dobaos({
      redis: null, // provide redis url as a string
      req_channel: "dobaos_req",
      bcast_channel: "dobaos_cast",
      service_channel: "dobaos_service",
      res_prefix: "dobaos_res",
      req_timeout: 500
    });
***/
const dob = Dobaos();

const processDobaosValue = payload => {
  if (Array.isArray(payload)) {
    return payload.forEach(processDobaosValue);
  }

  let { id, raw, value } = payload;
  console.log("broadcasted: ", id, raw, value);
};

dob.on("datapoint value", processDobaosValue);

dob.on("ready", async _ => {
  console.log("dobaos client is ready");

  // service reqs
  console.log(await dob.reset());
  console.log(await dob.getVersion());
  // baos reqs
  console.log(await dob.getDescription([1, 2, 3]));
  console.log(await dob.getValue([1, 2, 3]));
  console.log(await dob.setValue([{ id: 10, value: 1 }, { id: 11, value: 0 }]));
  console.log(await dob.setValue([{ id: 10, value: 0 }, { id: 11, value: 0 }]));
  console.log(await dob.readValue([1, 2, 5, 6, 7, 8, 9]));
  console.log(await dob.readValue(1));
  console.log(await dob.getProgrammingMode());
  console.log(await dob.setProgrammingMode(1));
  console.log(await dob.getProgrammingMode());
  console.log(await dob.setProgrammingMode(0));
});

dob.init();
```

## Methods

```text
* getDescription(null/number/[number, number...]);
* getValue(null/number/[number, number...]);
* readValue(null/number/[number, number...]);
* setValue({id: number, value: <depends on dpt> }/[{id:..}, {id: ..}...]);
* getProgrammingMode();
* setProgrammingMode(0/1/false/true);
* getVersion(null);
* reset(null);
```

