const dataFilesCSV = {
  dogs: "data/Dogs-Database.csv",
  flights: "data/Flights-Database.csv",
};

// map svg variables
var data = {};
var dogsData = {};
var flightsData = {};
var mapSvg;
var mapMargin = { top: 20, right: 60, bottom: 80, left: 100 };
var mapHeight;
var mapWidth;
var mapInnerHeight;
var mapInnerWidth;

var earthSvg;
var rocketSvg;
var maleDog;
var femaleDog;
var bubbleSvg;
var years_to_dogs = {};
var singleDog = true;

var year = 1958;

var earth_size = 100;
var rocket_size = 90;
var bubble_size = 100;
var dog_size = 40;
var center = {};

var orbits_radius = [100, 200, 300, 400, 500];
var orbits_gap = 90;
var orbits_start = 0;
var radius_conversion = {
  100: 50,
  212: 130,
  451: 210,
  "-1": 290,
  "-2": 470,
};

document.addEventListener("DOMContentLoaded", function () {
  mapSvg = d3.select("#map");
  mapWidth = +mapSvg.style("width").replace("px", "");
  mapHeight = +mapSvg.style("height").replace("px", "");
  mapInnerWidth = mapWidth - mapMargin.left - mapMargin.right;
  mapInnerHeight = mapHeight - mapMargin.top - mapMargin.bottom;

  center = {
    x: mapWidth / 2,
    y: mapHeight / 2,
  };

  d3.select("#years").on("change", function () {
    year = this.value;
    // generateMapData();
    drawMap();
  });

  // Load both files before doing anything else
  Promise.all([
    d3.csv(dataFilesCSV.dogs),
    d3.csv(dataFilesCSV.flights),
    d3.text("./../images/earthh.svg"),
    d3.text("./../images/space-capsule.svg"),
    d3.text("./../images/dog.svg"),
    d3.text("./../images/dog.svg"),
    d3.text("./../images/speech-bubble.svg"),
  ]).then(function (values) {
    flightsData = manageFlightsData(values[1]);
    console.log("flightsData", flightsData);
    dogsData = manageDogData(values[0]);
    console.log("dogsData", dogsData);

    earthSvg = values[2];
    rocketSvg = values[3];
    maleDog = values[4];
    femaleDog = values[5];

    bubbleSvg = values[6];

    drawMap();
  });
});

drawMap = () => {
  mapSvg.select(".points").selectAll("*").remove();
  mapSvg.select(".earth-img").remove();
  mapSvg.select(".orbits-group").remove();

  drawEarth();

  mapSvg.append("g").attr("class", "points").attr("id", "one");
  let curData = [];
  curData = getCurrentData();

  let number_of_points = curData.length;
  let angle_diff = ((360 / number_of_points) * Math.PI) / 180;

  drawOrbits(curData);

  var g = mapSvg.select(".points");
  var points = g
    .selectAll("g")
    .attr("transform", `translate(${mapWidth / 2}, ${mapHeight / 2})`)
    .data(curData);
  points.join((enter) => {
    var set = enter.append("g");
    drawRocket(set, angle_diff);
    drawBubble(set, angle_diff);

    var trickingD3;
    set.attr("class", (d, i) => {
      trickingD3 = d;
    });

    if (trickingD3.dogs.length == 1) {
      drawDog(set, "dog1", angle_diff, 0, "only");
    } else {
      drawDog(set, "dog1", angle_diff, 0, "notonly");
      drawDog(set, "dog2", angle_diff, 1);
    }
  });
};

drawBubble = (set, angle_diff) => {
  set
    .append("g")
    .attr("class", "bubble-img")
    .html(bubbleSvg)
    .attr("transform", (d, i) => {
      let radius = earth_size + radius_conversion[d.altitude];
      const angle = (i + 1) * angle_diff;
      const y_dist = radius * Math.sin(angle);
      const x_dist = radius * Math.cos(angle);
      return `translate(${center.x + x_dist + 20}, ${
        center.y - y_dist - bubble_size - 30
      })`;
    })
    .style("opacity", 0.4);

  set
    .select(".bubble-img")
    .select("svg")
    .attr("height", bubble_size)
    .attr("width", bubble_size);
};

drawRocket = (set, angle_diff) => {
  set
    .append("g")
    .attr("class", "rocket-img")
    .html(rocketSvg)
    .attr("transform", (d, i) => {
      let radius = earth_size + radius_conversion[d.altitude];
      const angle = (i + 1) * angle_diff;
      const y_dist = radius * Math.sin(angle);
      const x_dist = radius * Math.cos(angle);
      return `translate(${center.x + x_dist - rocket_size / 2}, ${
        center.y - y_dist - rocket_size / 2
      })`;
    })
    .transition()
    .delay(300)
    .duration(600)
    .style("opacity", 0.5);

  set
    .select(".rocket-img")
    .select("svg")
    .attr("height", rocket_size)
    .attr("width", rocket_size);

  var rocket_tooltip = d3.select("#rocket-tooltip");
  let ats = set.select(".rocket-img");
  ats.on("mousemove", function (data) {
    let el = d3.select(this);

    el.style("opacity", 1);

    let local_altitude = data.altitude + " kms";
    if (data.altitude == -2) {
      local_altitude = "orbital";
    }
    if (data.altitude == -1) {
      local_altitude = "unknown";
    }

    rocket_tooltip.html(
      ` Rocket details:<br><br>
        Rockets: ${data.rocket} <br>
        Result: ${data.result}<br>
        Altitude: ${local_altitude}
        `
    );
  });
  ats.on("mouseout", function (data) {
    let el = d3.select(this);

    el.style("opacity", 0.5);
  });
};

drawDog = (set, whichDog, angle_diff, ind, only) => {
  let local_dog_size = {
    x: 30,
    y: 0,
  };
  if (whichDog == "dog2") {
    local_dog_size = {
      x: 40 + 30,
      y: 00,
    };
  }

  if (only == "only") {
    local_dog_size.x = 50;
  }
  set
    .append("g")
    .attr("class", whichDog)
    // .attr("class", (d) => {
    //   d.name_english;
    // })
    .html((d, i) => {
      let each_dog = d.dogs[ind];
      // console.log("i", i);
      if (dogsData[each_dog].gender == "male") {
        return maleDog;
      } else {
        return femaleDog;
      }
    })
    .attr("transform", (d, i) => {
      let radius = earth_size + radius_conversion[d.altitude];
      const angle = (i + 1) * angle_diff;
      const y_dist = radius * Math.sin(angle);
      const x_dist = radius * Math.cos(angle);

      return `translate(${center.x + x_dist + local_dog_size.x}, ${
        center.y - y_dist - bubble_size + local_dog_size.y
      })`;
    });

  set
    .select("." + whichDog)
    .select("svg")
    .style("opacity", 0.3)
    .attr("height", dog_size)
    .attr("width", dog_size);

  var dog = d3.select("#dog-tooltip");

  let ats = set.select("." + whichDog).select("svg");
  ats.on("mousemove", function (data) {
    let hovered_dog = d3.select(this);
    hovered_dog.style("transform", "scale(1.1)").style("opacity", 1);

    dog.html(
      ` Dog details:<br><br>
        Name : ${data.dogs[ind]} <br>
        Gender: ${dogsData[data.dogs[ind]].gender}
        `
    );
  });
  ats.on("mouseout", function (data) {
    ats.style("transform", "scale(1.0)").style("opacity", 0.3);
  });
};

drawOrbit = (rad) => {
  var orbits_group = mapSvg.select(".orbits-group");

  orbits_group
    .append("circle")
    .attr("class", "earthOrbit")
    .attr("r", earth_size + rad)
    .style("fill", "none")
    .attr("stroke-width", 1)
    .attr("transform", `translate(${center.x}, ${center.y})`)
    .attr("stroke", "#fff")
    .attr("stroke-opacity", 0.3);
};

drawOrbits = (data) => {
  let temp_data = new Set(data.map((x) => x.altitude));
  setRadiusConversion(temp_data);
  mapSvg.append("g").attr("class", "orbits-group");

  for (let each of temp_data) {
    drawOrbit(radius_conversion[each]);
  }
};

drawEarth = () => {
  let newSize = earth_size + 100;
  mapSvg
    .append("g")
    .attr("class", "earth-img")
    .html(earthSvg)
    .style(
      "transform",
      `translate(${center.x - newSize / 2}px, ${center.y - newSize / 2}px)`
    );

  mapSvg
    .select(".earth-img")
    .select("svg")
    .attr("height", newSize)
    .attr("width", newSize);
};
// #####################
// UTIL FUNCTIONS
// #####################

manageFlightsData = (data) => {
  var dataObject = {};
  for (let each of data) {
    let obj = {};

    obj["rocket"] = each["Rocket"].split(",");
    obj["result"] = each["Result"];

    obj["dogs"] = each["Dogs"].split(",");
    if (each["Altitude (km)"].includes("orbit")) {
      obj["altitude"] = -2;
    } else {
      let height = parseInt(each["Altitude (km)"]);
      if (!height) {
        obj["altitude"] = -1;
      } else {
        obj["altitude"] = height;
      }
    }

    dataObject[each["Date"]] = obj;
  }
  return dataObject;
};

manageDogData = (data) => {
  var dataObject = {};
  for (let each of data) {
    let obj = {};
    obj["name_english"] = each["Name (English)"];
    obj["gender"] = each["Gender"];

    let flts = each["Flights"].split(",");
    let fltObj = {};
    for (let each of flts) {
      fltObj[each] = flightsData[each];
    }
    obj["flights"] = fltObj;

    if (each["Fate"] !== "Survived") {
      let dateofdeath = each["Fate"].split(" ")[1];
      obj["fate"] = "Died";
      obj["death"] = dateofdeath;
    } else {
      obj["fate"] = "Survived";
    }

    dataObject[each["Name (Latin)"]] = obj;
  }
  return dataObject;
};

getCurrentData = () => {
  let arr = [];
  // console.log
  for (let each of Object.keys(flightsData)) {
    let currentYear = parseInt(each.substring(0, 4));
    if (currentYear == year) {
      let obj = { ...flightsData[each], date: each, year: currentYear };
      arr.push(obj);
    }
  }
  return arr;
};

setRadiusConversion = (data) => {
  console.log("data", data);
  if (data.size == 1) {
    radius_conversion = {
      100: 200,
      212: 200,
      451: 200,
      "-1": 200,
      "-2": 200,
    };
  } else if (data.size == 2) {
    radius_conversion = {
      100: 150,
      212: 150,
      451: 200,
      "-1": 250,
      "-2": 250,
    };
  } else {
    radius_conversion = {
      100: 150,
      212: 150,
      451: 240,
      "-1": 320,
      "-2": 240,
    };
  }
};
