//constants
const width = 1000;
height = 500;
margin = { top: 20, bottom: 50, left: 60, right: 40 };
defaultYear = 2017;

//state management

let state = {
  geojson: [],
  hbcdata: [],
  cbdata: [],
  pivotcb: [],
  selectedcd: null,
  selectedyear: 2017,
  activeCD: [],
};

//load in the data and call the init function

Promise.all([
  d3.json("./data/cd-boundaries-albers.geojson", d3.autoType),
  d3.csv("./data/adoptedtotal.csv", d3.autoType),
  d3.csv("./data/commboards.csv", d3.autoType),
  d3.csv("./data/cbs-rolledup.csv", d3.autoType),
]).then(([geojson, hbcdata, cbdata, pivotcb]) => {
  //setting the state with data
  state.geojson = geojson;
  state.hbcdata = hbcdata;
  state.cbdata = cbdata;
  state.pivotcb = pivotcb;
  console.log("state: ", state);
  init();
});

function init() {
  //this init function will store the execution of the individual chart functions
  //this is mostly to control the scroll when that's implemented

  //initialize treemap data here:
  //testing treemap data
  const tdata1 = d3
    .hierarchy(
      d3
        .group(
          state.cbdata.filter((d) => d.Year == 2021 && d.Modified != 0),
          //you can make the bottom one a variable that matches with a dropdown to switch the data i am a GENIUS
          (d) => d.Agency,
          (d) => d["Expense Category"]
        )
        .get("Manhattan Community Board # 6")
    )
    .copy()
    .sum((d) => d.Modified);

  console.log("hierarchical data", tdata1);
  //first treemap:
  //second treemap:

  core();
  hbc();
  heattable();
  geomap();
  treemap(tdata1, "#top-CB-treemap");

  //control scroll here

  // instantiate the scrollama
  const scroller = scrollama();

  // setup the instance, pass callback functions
  scroller
    .setup({
      step: ".step",
    })
    .onStepEnter((response) => {
      // { element, index, direction }
    })
    .onStepExit((response) => {
      // { element, index, direction }
    });
}

//functions for the thing

// PART ONE FUNCTIONS:

function core() {
  //create a 2x3 set of rectangles at approx 200 x 150 each (2:1.5 ratio)
  const coredata = [
    {
      item: "Expense",
      descrip: "What people usually think of when they think about the budget.",
      x: 0,
      y: 0,
    },
    { item: "Revenue", descrip: "Revenue description", x: 100, y: 0 },
    { item: "Contract", descrip: "Description", x: 0, y: 150 },
    { item: "Financial Plan", descrip: "Description", x: 100, y: 150 },
    { item: "Capital", descrip: "Description", x: 0, y: 300 },
    { item: "Capital Program", descrip: "Description", x: 100, y: 300 },
  ];
  console.log(coredata);
  let svg = d3
    .select("#budget-totality")
    .append("svg")
    .attr("width", width / 3.5)
    .attr("height", height);

  svg
    .append("rect")
    .attr("width", 15)
    .attr("height", 40)
    .attr("fill", "#5C3C22")
    .attr("transform", `translate(90, 0)`);

  svg
    .selectAll(".pieces")
    .data(coredata)
    .join("rect")
    .attr("width", 100)
    .attr("height", 150)
    .attr("fill", "#EEC994")
    .attr("stroke", "#EEC994")
    .attr("transform", (d) => `translate(${d.x}, ${d.y + 30})`)
    .on("mouseover", function () {
      d3.select(this).attr("fill", "#AC8245");
    })
    .on("mouseout", function () {
      d3.select(this).attr("fill", "#EEC994");
    });
}

function fiscyear(caldata, placement) {
  // this one should be a standard item that gets passed dates
  // maybe highlighting key months?
  //either way it should show a standard gregorian year first
  //then it should show the june-july fiscal year. both show up next to each other
}

function involvement() {}

function tenmil() {
  // first set up the single bar--there should be highlights for each?
  // then set up the items--how many items equal the 10 mil?
  //may need to outline this one

  const overarching = state.hbcdata.filter((d) => d.Year == 2021);

  d3.select("#tenmil");
}
function balancing() {
  // afair this one may just be for flair?
}

// PART TWO FUNCTIONS:

function hbc() {
  //axes setup
  const format = (num) => d3.format(".3s")(num).replace(/G/, "B");

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(state.hbcdata, (d) => d.Adopted)])
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleBand()
    .domain(d3.range(state.hbcdata.length))
    .rangeRound([margin.top, height - margin.bottom])
    .padding(0.1);

  const yAxis = d3
    .axisLeft(y)
    .tickFormat((i) => state.hbcdata[i].Year)
    .tickSizeOuter(0);
  const xAxis = d3
    .axisTop(x)
    .ticks(width / 80)
    .tickFormat(format);

  const svg = d3
    .select("#fiveyrHBC")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const rect = svg
    .selectAll("rect")
    .data(state.hbcdata)
    .join("rect")
    .attr("x", x(0))
    .attr("y", (d, i) => y(i))
    .attr("width", (d) => x(d.Adopted) - x(0))
    .attr("height", y.bandwidth())
    .attr("fill", "#9ECE96");

  const text = svg
    .selectAll("text")
    .data(state.hbcdata)
    .join("text")
    .attr("x", (d) => x(d.Adopted))
    .attr("y", (d, i) => y(i) + y.bandwidth() / 2)
    .attr("dy", "0.35em")
    .attr("dx", -4)
    .text((d) => format(d.Adopted))
    .attr("fill", "white")
    .attr("text-anchor", "end")
    .attr("font-family", "Asap")
    .attr("font-size", 16);

  // deactivating x-axis for stylistic purposes
  // svg
  //   .append("g")
  //   .attr("class", "axis")
  //   .attr("transform", `translate(0, ${margin.top})`)
  //   .call(xAxis);

  svg
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis);

  d3.selectAll(".tick text")
    .attr("font-family", "Asap")
    .attr("font-size", "16")
    .attr("padding-right", "10");

  d3.selectAll("path.domain").remove();
}

function heattable() {
  //create table
  //conditional formatting by value

  //need to figure out how to reorder the data or the columns
  //and then how to only take the numbers

  //color scale
  const color = d3.scaleSequential((d) => d3.interpolateBuPu(d));
  const format = d3.format(",." + d3.precisionFixed(1) + "f");
  const table = d3.select("#heatmap").append("table");
  const thead = table.append("thead");
  thead
    .append("tr")
    .selectAll("th")
    .data(Object.keys(Object.values(state.pivotcb)[0]))
    .join("th")
    .text((d) => d);

  const rows = table
    .append("tbody")
    .selectAll("tr")
    .data(state.pivotcb)
    .join("tr")
    .style("background-color", (d) => color(d));

  rows
    .selectAll("td")
    .data((d) => Object.values(d))
    .join("td")
    .text((d) => (typeof d === "string" ? d : format(d)));
}

function treemap(wrappeddata, element) {
  //this needs to be a reusable component--make sure parts are easily substituted

  //wrappeddata is the data in its final state, pulled into this function
  //the data should be hierarchical

  let scale = d3
    .scaleLinear()
    .domain(d3.extent(wrappeddata, (d) => d.value))
    .range([0.25, 1]);

  let color = d3.scaleSequential((d) => d3.interpolateGreens(scale(d)));

  let format = d3.format(",d");

  //select the html element

  let svg = d3
    .select(element)
    .append("svg")
    .attr("width", width * 1.2)
    .attr("height", height);

  let root = wrappeddata;

  console.log("hierarchy test", root.leaves());

  let tree = d3
    .treemap()
    .size([width * 1.2, height])
    .padding(1)
    .round(true);

  tree(root);

  let leaf = svg
    .selectAll("g")
    .data(root.leaves())
    .join("g")
    .attr("transform", (d) => `translate(${d.x0},${d.y0})`);

  leaf
    .append("rect")
    .attr("stroke", "white")
    .attr("fill", (d) => color(d.value))
    .attr("width", (d) => d.x1 - d.x0)
    .attr("height", (d) => d.y1 - d.y0);

  svg
    .selectAll("text")
    .data(root.leaves())
    .enter()
    .append("text")
    .attr("x", (d) => d.x0 + 5)
    .attr("y", (d) => d.y0 + 30)
    .text((d) => d.data["Expense Category"])
    .attr("font-size", "20px")
    .attr("font-family", "Asap")
    .attr("fill", "white");

  svg
    .selectAll("values")
    .data(root.leaves())
    .enter()
    .append("text")
    .attr("x", (d) => d.x0 + 5)
    .attr("y", (d) => d.y0 + 55)
    .text((d) => format(Number(Math.round(d.value + "e2") + "e-2")))
    .attr("font-size", "18px")
    .attr("font-family", "Asap")
    .attr("fill", "white");
}

function geomap() {
  //data formatting

  const years = Array.from(new Set(state.cbdata.map((d) => d.Year)));
  console.log(years);

  //set up range slider

  const selectYear = d3.select("#range").on("change", function () {
    console.log("new selected year is", this.value);
    d3.select("#selected-year").html(`${this.value}`);
    state.selectedyear = this.value;

    //update data for selection

    data = state.cbdata.filter((d) => d.Year == state.selectedyear);
    //update the aggregation

    rolledup = d3.rollups(
      data,
      (v) => d3.sum(v, (x) => x.Adopted),
      (d) => d.CBnum
    );

    color = d3.scaleSequential(d3.extent(rolledup.map((d) => d[1])), [
      "#EEC994",
      // "#D69668",
      "#D0786D",
    ]);

    //update fill
    d3.selectAll(".cd").attr("fill", (d) =>
      rolledup.find((v) => v[0] == d.properties.BoroCD) == undefined
        ? "rgba(238,201,148,0.38)"
        : color(rolledup.find((v) => v[0] == d.properties.BoroCD)[1])
    );
  });

  //select the data to create the choropleth:

  let data = state.cbdata.filter((d) => d.Year == state.selectedyear);
  //the data has to be aggregated so that we have totals per CB...

  let rolledup = d3.rollups(
    data,
    (v) => d3.sum(v, (x) => x.Adopted),
    (d) => d.CBnum
  );

  //color scale - continuous #EEC994, #D69668, #D0786D

  //revisit the colors--we want to show magnitude--is it really that much?
  let color = d3.scaleSequential(d3.extent(rolledup.map((d) => d[1])), [
    "#EEC994",
    // "#D69668",
    "#D0786D",
  ]);

  // MAP CREATION

  // create an svg
  let svg = d3
    .select("#choropleth")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  //projection
  const projection = d3
    .geoIdentity()
    .reflectY(true)
    .fitSize([width, height], state.geojson);

  //geopath
  const path = d3.geoPath().projection(projection);

  //base map
  svg
    .selectAll(".cd")
    .data(state.geojson.features)
    .join("path")
    .attr("d", path)
    .attr("class", "cd")
    .attr("fill", (d) =>
      rolledup.find((v) => v[0] == d.properties.BoroCD) == undefined
        ? "rgba(238,201,148,0.38)"
        : color(rolledup.find((v) => v[0] == d.properties.BoroCD)[1])
    )
    .attr("stroke", "white")
    .on("mouseover", function () {
      d3.select(this).attr("stroke", "#5C3C22").attr("stroke-width", "3px");
      state.selectedcd = this.__data__.properties.BoroCD;
      draw();
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke", "white").attr("stroke-width", "1px");
    })
    .on("click", function () {
      console.log(this.__data__.properties.BoroCD);
    });
}

function supplementaltrend() {
  // for an area graph per community board
}

function draw() {
  //this part is for the maps
  if (state.selectedcd) {
    if (state.selectedcd && state.selectedyear) {
      const matchup = state.cbdata.filter((d) => state.selectedcd == d.CBnum);
      state.activeCD = matchup.filter((d) => state.selectedyear == d.Year);
      console.log("active district", state.activeCD);
    }
    const numbersformat = d3.format(",d");
    const amount = numbersformat(d3.sum(state.activeCD.map((d) => d.Adopted)));

    if (state.activeCD[0] != undefined) {
      const selectedDistrict = state.activeCD[0]["Agency"];

      d3.select("#ch-details").html(
        `<p>${selectedDistrict}: $${amount} in ${state.selectedyear}</p>`
      );
    } else {
      d3.select("#ch-details").html(
        `<p>The selected community district is non-residential and has no community board.</p>`
      );
    }
  }
}
