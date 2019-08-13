const Dobaos = require("./index.js");

const dob = Dobaos();

dob.on("datapoint value", console.log);

dob.on("ready", async _ => {
  console.log("dob is ready");
  console.log(await dob.getDescription([1, 2, 3]));
  console.log(await dob.getValue([1, 2, 3]));
  console.log(await dob.setValue([{ id: 10, value: 1 }, { id: 11, value: 255 }]));
  console.log(await dob.setValue([{ id: 10, value: 0 }, { id: 11, value: 255 }]));
  console.log(await dob.readValue([1, 2, 5, 6, 7, 8, 9]));
  console.log(await dob.readValue(1));
  console.log(await dob.getProgrammingMode());
  console.log(await dob.setProgrammingMode(1));
  console.log(await dob.setProgrammingMode(0));
});

dob.init();
