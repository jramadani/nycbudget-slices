//constants
const width = 1000;
height = 500;
margin = { top: 20, bottom: 50, left: 60, right: 40 };

//state management

let state = {
  geojson: [],
  hbcdata: [],
  cbdata: [],
  tenmil: [],
  d21: [],
  dhalf1: [],
  dhalf2: [],
  selectedcd: null,
  selectedyear: 2017,
  activeCD: [],
  toptenmod: [],
  index: null,
};

//load in the data and call the init function

Promise.all([
  d3.json("./data/cd-boundaries-albers.geojson", d3.autoType),
  d3.csv("./data/adoptedtotal.csv", d3.autoType),
  d3.csv("./data/commboards.csv", d3.autoType),
  d3.csv("./data/tenmil.csv", d3.autoType),
  d3.csv("./data/dates21.csv", (d) => ({
    date: new Date(d.date),
  })),
  d3.csv("./data/dates-partial-half1.csv", (d) => ({
    date: new Date(d.date),
  })),
  d3.csv("./data/dates-partial-half2.csv", (d) => ({
    date: new Date(d.date),
  })),
  d3.csv("./data/toptenpct-modified.csv", d3.autoType),
]).then(
  ([geojson, hbcdata, cbdata, tenmil, d21, dhalf1, dhalf2, toptenmod]) => {
    //setting the state with data
    state.geojson = geojson;
    state.hbcdata = hbcdata;
    state.cbdata = cbdata;
    state.tenmil = tenmil;
    state.d21 = d21;
    state.dhalf1 = dhalf1;
    state.dhalf2 = dhalf2;
    state.toptenmod = toptenmod;
    console.log("state: ", state);
    init();
  }
);

function init() {
  //this init function will store the execution of the individual chart functions
  //this is mostly to control the scroll when that's implemented

  //rework the HTML body for this part
  //control scroll here
  const main = d3.select("main");
  const scrolly = main.select("#scrolly");
  const figure = scrolly.select("figure");
  const article = scrolly.select("article");
  const step = article.selectAll(".step");

  // instantiate the scrollama
  const scroller = scrollama();

  // generic window resize listener event
  function handleResize() {
    // 1. update height of step elements
    var stepH = Math.floor(window.innerHeight * 0.75);
    step.style("height", stepH + "px");

    var figureHeight = window.innerHeight / 2;
    var figureMarginTop = (window.innerHeight - figureHeight) / 2;

    figure
      .style("height", figureHeight + "px")
      .style("top", figureMarginTop + "px");

    // 3. tell scrollama to update new element dimensions
    scroller.resize();
  }

  // handleResize();
  // setup the instance, pass callback functions
  scroller
    .setup({
      step: ".step",
      offset: 0.2,
      debug: false,
    })
    .onStepEnter((response) => {
      console.log(response.index);
      state.index = response.index;
      coreupdate();
    })
    .onStepExit((response) => {
      // { element, index, direction }
      d3.selectAll("#budget-totality .corepieces").attr("fill", "#EEC994");
      d3.selectAll("#budget-totality text").remove();
    });

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
  fiscyear(state.d21, "#fisc1", "#DCA4B0");
  fiscyear(state.dhalf1, "#fisc2", "#D69668");
  fiscyear(state.dhalf2, "#fisc3", "#D69668");
  involvement();
  hbc(state.hbcdata, "#fiveyrHBC");
  tenmil();
  // heattable();
  // commenting heattable out temporarily while i get the right data in there
  geomap();
  treemap(tdata1, "#top-CB-treemap", "#summs");
  comparative(
    "#tmc-1-select",
    "#tm-compare-1",
    "#tmc1-details",
    state.cbdata,
    "Manhattan Community Board # 12"
  );
  comparative(
    "#tmc-2-select",
    "#tm-compare-2",
    "#tmc2-details",
    state.cbdata,
    "Bronx Community Board # 5"
  );
}

//functions for the visualizations

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
    { item: "FinancialPlan", descrip: "Description", x: 100, y: 150 },
    { item: "Capital", descrip: "Description", x: 0, y: 300 },
    { item: "CapitalProgram", descrip: "Description", x: 100, y: 300 },
  ];
  console.log(coredata);
  let svg = d3
    .select("#budget-totality")
    .append("svg")
    .attr("width", width / 3.5)
    .attr("height", height);

  svg
    .append("rect")
    .attr("class", "tenyearcap")
    .attr("width", 15)
    .attr("height", 40)
    .attr("fill", "#5C3C22")
    .attr("transform", `translate(90, 0)`)
    .on("mouseover", function () {
      d3.select(this).attr("fill", "#B19E52");
    })
    .on("mouseout", function () {
      d3.select(this).attr("fill", "#5C3C22");
    });

  svg
    .selectAll(".pieces")
    .data(coredata)
    .join("rect")
    .attr("class", (d) => d.item + " corepieces")
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

function coreupdate() {
  switch (state.index) {
    case 0:
      return updater(".Expense", 20, 60, "Expense");
    case 1:
      return updater(".Capital", 20, 360, "Capital");
    case 2:
      return updater(".Contract", 20, 210, "Contract");
    case 3:
      return updater(".FinancialPlan", 120, 210, "Financial Plan");
    case 4:
      return updater(".CapitalProgram", 120, 360, "Capital Program");
    case 5:
      return d3.select(".tenyearcap").attr("fill", "#B19E52");
    case 6:
      return updater(".Revenue", 120, 60, "Revenue");
  }
  function updater(itemclass, x, y, text) {
    d3.selectAll(itemclass)
      .attr("fill", "#AC8245")
      .transition()
      .duration(2000)
      .ease(d3.easeLinear);

    d3.selectAll("#budget-totality svg")
      .append("text")
      .attr("x", x)
      .attr("y", y)
      .text(text)
      .attr("fill", "white");
  }
}

function fiscyear(caldata, placement, color) {
  // calendar base from Mike Bostock, adapted for vertical use

  const cellSize = 17;
  weekday = "monday";
  countDay = weekday === "sunday" ? (i) => i : (i) => (i + 6) % 7;
  timeWeek = weekday === "sunday" ? d3.utcSunday : d3.utcMonday;
  formatMonth = d3.utcFormat("%b");
  formatDay = (i) => "SMTWTFS"[i];
  formatDate = d3.utcFormat("%x");
  formatIso = d3.utcParse("%Y-%m-%dT%H:%M:%S.%LZ");

  function pathMonth(t) {
    const n = weekday === "weekday" ? 5 : 7;
    const d = Math.max(0, Math.min(n, countDay(t.getUTCDay())));
    const w = timeWeek.count(d3.utcYear(t), t);
    return `${
      d === 0
        ? `M-100,${w * cellSize}`
        : d === n
        ? `M-100,${(w + 1) * cellSize}`
        : `M-100,${(w + 1) * cellSize}H${d * cellSize}V${w * cellSize}`
    }H${n * cellSize}`;
  }

  //

  let years = d3.groups(caldata, (d) => new Date(d.date).getUTCFullYear());
  console.log("here are the years", years);

  const container = d3.select(placement).style("position", "relative");

  let svg = container
    .append("svg")
    .attr("class", "calendarsvg")
    .attr("width", width / 5)
    .attr("height", height * 2)
    .attr("font-family", "sans-serif")
    .attr("font-size", 10);

  const year = svg
    .selectAll("g")
    .data(years)
    .join("g")
    .attr(
      "transform",
      (d, i) => `translate(40.5,${height * i + cellSize * 1.5})`
    );

  year
    .append("text")
    .attr("x", -15)
    .attr("y", -15)
    .attr("font-weight", "bold")
    .attr("text-anchor", "end")
    .text(([key]) => key);

  year
    .append("g")
    .attr("text-anchor", "end")
    .selectAll("text")
    .data(weekday === "weekday" ? d3.range(1, 6) : d3.range(7))
    .join("text")
    .attr("x", (i) => (countDay(i) + 0.5) * cellSize)
    .attr("y", -5)
    .attr("dy", "0.31em")
    .text(formatDay);

  year
    .append("g")
    .selectAll("rect")
    .data(
      weekday === "weekday"
        ? ([, values]) =>
            values.filter((d) => ![0, 6].includes(d.date.getUTCDay()))
        : ([, values]) => values
    )
    .join("rect")
    .attr("width", cellSize - 1)
    .attr("height", cellSize - 1)
    .attr("x", (d) => countDay(d.date.getUTCDay()) * cellSize + 0.5)
    .attr(
      "y",
      (d) => timeWeek.count(d3.utcYear(d.date), d.date) * cellSize + 0.5
    )
    .attr("fill", color)
    .attr("stroke", "none")
    .append("title")
    .text((d) => d.date);

  const month = year
    .append("g")
    .selectAll("g")
    .data(([, values]) =>
      d3.utcMonths(d3.utcMonth(values[0].date), values[values.length - 1].date)
    )
    .join("g");

  month
    .filter((d, i) => i)
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "#fff")
    .attr("stroke-width", 3)
    .attr("d", pathMonth);

  month
    .append("text")
    .attr("x", -25)
    .attr(
      "y",
      (d) => timeWeek.count(d3.utcYear(d), timeWeek.ceil(d)) * cellSize + 10
    )
    .text(formatMonth);

  if (placement == "#fisc2") {
    svg
      .append("polygon")
      .attr("points", "0.5,0.5 118.5,0.5 118.5,438.5 0.5,438.5")
      .attr("fill", "transparent")
      .attr("stroke", "black")
      .attr("stroke-dasharray", 4)
      .attr("transform", `translate(40.5, 25.5)`);

    svg
      .append("text")
      .attr("x", 45.5)
      .attr("y", 50)
      .text("This is the previous")
      .attr("fill", "black");
    svg
      .append("text")
      .attr("x", 45.5)
      .attr("y", 62)
      .text("fiscal year!")
      .attr("fill", "black");
  }
}

function involvement() {
  //data setup
  const parties = {
    nodes: [
      {
        id: 1,
        name: "Mayor",
        color: "#D69668",
      },
      {
        id: 2,
        name: "City Council",
        color: "#9ECE96",
      },
      {
        id: 3,
        name: "Lobbyists",
        color: "#DCA4B0",
      },
    ],
    links: [
      {
        source: 1,
        target: 2,
      },
      {
        source: 2,
        target: 1,
      },
      {
        source: 3,
        target: 1,
      },
      {
        source: 3,
        target: 2,
      },
    ],
  };

  // for 12/4 - nodes aren't showing where they need to, double check the positioning/force
  //nodemap

  const svg = d3
    .select("#involved")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Initialize the links
  const link = svg
    .selectAll("line")
    .data(parties.links)
    .join("line")
    .style("stroke", "#aaa")
    .style("stroke-style", "dashed");

  // Initialize the nodes
  const node = svg
    .selectAll("circle")
    .data(parties.nodes)
    .join("circle")
    .attr("r", 20)
    .attr("fill", (d) => d.color);

  const simulation = d3
    .forceSimulation(parties.nodes) // Force algorithm is applied to data.nodes
    .force(
      "link",
      d3
        .forceLink() // This force provides links between nodes
        .id((d) => d.id)
        .links(parties.links) // and this the list of links
    )
    .force("charge", d3.forceManyBody().strength(-400)) // This adds repulsion between nodes. Play with the -400 for the repulsion strength
    .force("center", d3.forceCenter(width / 2, height / 2)) // This force attracts nodes to the center of the svg area
    .on("end", ticked);

  // This function is run at each iteration of the force algorithm, updating the nodes position.
  function ticked() {
    link
      .attr("x1", function (d) {
        return d.source.x;
      })
      .attr("y1", function (d) {
        return d.source.y;
      })
      .attr("x2", function (d) {
        return d.target.x;
      })
      .attr("y2", function (d) {
        return d.target.y;
      });

    node
      .attr("cx", function (d) {
        return d.x + 6;
      })
      .attr("cy", function (d) {
        return d.y - 6;
      });
  }
}

function tenmil() {
  // first set up the single bar--there should be highlights for each?
  // then set up the items--how many items equal the 10 mil?
  //may need to outline this one

  const overarching = state.hbcdata.filter((d) => d.Year == 2021);

  const thisdiv = d3
    .select("#tenmil")
    .append("div")
    .style("width", "500px")
    .style("height", "500px")
    .style("background-color", "#9ECE96");

  thisdiv
    .append("div")
    .style("width", "5px")
    .style("height", "5px")
    .style("background-color", "#EEC994")
    .style("border", "1px dotted black");

  // d3.select("#tenmil");

  //the below is temporary
  // hbc(overarching, "#tenmil");

  // d3.select("#tenmil rect").attr("height", "70px");
  // d3.select("#tenmil g.tick").remove();
}

// PART TWO FUNCTIONS:

function hbc(data, placement) {
  //axes setup
  const format = (num) => d3.format(".3s")(num).replace(/G/, "B");

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.Adopted)])
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleBand()
    .domain(d3.range(data.length))
    .rangeRound([margin.top, height - margin.bottom])
    .padding(0.1);

  const yAxis = d3
    .axisLeft(y)
    .tickFormat((i) => data[i].Year)
    .tickSizeOuter(0);
  const xAxis = d3
    .axisTop(x)
    .ticks(width / 80)
    .tickFormat(format);

  const svg = d3
    .select(placement)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const rect = svg
    .selectAll("rect")
    .data(data)
    .join("rect")
    .attr("x", x(0))
    .attr("y", (d, i) => y(i))
    .attr("width", (d) => x(d.Adopted) - x(0))
    .attr("height", y.bandwidth())
    .attr("fill", "#9ECE96");

  const text = svg
    .selectAll("text")
    .data(data)
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
    .data()
    .join("tr")
    .style("background-color", (d) => color(d));

  rows
    .selectAll("td")
    .data((d) => Object.values(d))
    .join("td")
    .text((d) => (typeof d === "string" ? d : format(d)));
}

function comparative(dropdown, location, details, data, default_selection) {
  // set up the data first
  //tmc-1-select controls tm-compare-1 and the same for 2

  // dropdown changing

  const selectElement = d3.select(dropdown).on("change", function () {
    console.log(this.value);
    const newdata = this.value;
    rolleddata = d3
      .hierarchy(
        d3
          .group(
            data.filter((d) => d.Year == 2021 && d.Modified != 0),
            //you can make the bottom one a variable that matches with a dropdown to switch the data i am a GENIUS
            (d) => d.Agency,
            (d) => d["Expense Category"]
          )
          .get(newdata)
      )
      .copy()
      .sum((d) => d.Modified);
    treemap(rolleddata, location, details, location);
  });

  // add in dropdown options from the unique values in the data
  selectElement
    .selectAll("option")
    .data(Array.from(new Set(data.map((d) => d.Agency).sort(d3.ascending))))
    .join("option")
    .attr("value", (d) => d)
    .text((d) => d);

  selectElement.property("value", default_selection);

  let rolleddata = d3
    .hierarchy(
      d3
        .group(
          data.filter((d) => d.Year == 2021 && d.Modified != 0),
          (d) => d.Agency,
          (d) => d["Expense Category"]
        )
        .get(default_selection)
    )
    .copy()
    .sum((d) => d.Modified);

  treemap(rolleddata, location, details);
}

function treemap(wrappeddata, element, item, reusable) {
  //this needs to be a reusable component--make sure parts are easily substituted
  // to get the item to redraw

  const localwidth = window.innerWidth;
  if (reusable) {
    d3.selectAll(`${reusable} svg`).remove();
  }
  //wrappeddata is the data in its final state, pulled into this function
  //the data should be hierarchical

  let logScale = d3.scaleLog().domain([153, 229152]).range([-0.5, 1.5]);

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
    .attr("width", localwidth / 2.5)
    .attr("height", height);

  let root = wrappeddata;

  console.log("hierarchy test", root.leaves());

  let tree = d3
    .treemap()
    .size([localwidth / 2.5, height])
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
    .attr("height", (d) => d.y1 - d.y0)
    .on("mouseover", function () {
      d3.select(item).html(
        `<p>${this.__data__.data.Agency}<br><br>${
          this.__data__.data["Expense Category"]
        }<br>
        <br>$${format(
          Number(Math.round(this.__data__.data.Modified + "e2") + "e-2")
        )}</p>`
      );
    });

  svg
    .selectAll("text")
    .data(root.leaves())
    .enter()
    .append("text")
    .attr("x", (d) => d.x0 + 5)
    .attr("y", (d) => d.y0 + 30)
    .text((d) => d.data["Expense Category"])
    .attr("font-size", (d) => `${logScale((d.x1 - d.x0) * (d.y1 - d.y0))}em`)
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
    .attr(
      "font-size",
      (d) => `${logScale((d.x1 - d.x0) * (d.y1 - d.y0)) - 0.1}em`
    )
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
      const border = d3.select(this);
      border.raise().attr("stroke", "#5C3C22").attr("stroke-width", "3px");
      state.selectedcd = this.__data__.properties.BoroCD;
      draw();
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke", "white").attr("stroke-width", "1px");
    })
    .on("click", function () {
      console.log(this.__data__.properties.BoroCD);
      //filter the data here, pass it through to the function
      const cbarea = state.cbdata.filter(
        (d) => d.CBnum == this.__data__.properties.BoroCD
      );

      const summarized = d3
        .rollups(
          cbarea,
          (xs) => d3.sum(xs, (x) => x.Modified),
          (d) => d.Year
        )
        .map(([y, v]) => ({ Year: y, Modified: v }));

      supplementaltrend(summarized);
    });
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

function supplementaltrend(data) {
  // for an area graph per community board
  d3.selectAll("#cbarea").remove();

  const yearFormat = d3.format(".4");

  let svg = d3
    .select("#ch-area")
    .append("svg")
    .attr("id", "cbarea")
    .attr("width", width)
    .attr("height", height);

  //set up scales & axes
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(data, (d) => d.Year))
    .range([margin.left, width - margin.right]);

  const yScale = d3
    .scaleLinear()
    .domain([d3.min(data, (d) => d.Modified), 600000])
    .range([height - margin.bottom, margin.top]);

  const xAxis = d3.axisBottom(xScale).tickFormat(yearFormat);
  const yAxis = d3.axisLeft(yScale);

  //draw the area
  const areaFunc = d3
    .area()
    .x((d) => xScale(d.Year))
    .y1((d) => yScale(d.Modified))
    .y0((d) => yScale(d3.min(data, (d) => d.Modified)));

  const area = svg
    .append("path")
    .datum(data)
    .attr("fill", "#EEC994")
    .attr("stroke", "none")
    .attr("stroke-width", 1.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round")
    .attr("d", areaFunc);

  //call axes

  svg
    .append("g")
    .attr("class", "axis x-axis")
    .attr("transform", `translate(0,${height - margin.bottom})`)
    .call(xAxis)
    .append("text")
    .attr("class", "axis-label")
    .attr("x", "50%")
    .attr("dy", "3em")
    .attr("fill", "#259D98");

  svg
    .append("g")
    .attr("class", "axis y-axis")
    .attr("transform", `translate(${margin.left},0)`)
    .call(yAxis)
    .append("text")
    .attr("transform", "rotate(0)")
    .attr("y", 0)
    .attr("x", 0)
    .attr("dy", "1em")
    .style("text-anchor", "middle")
    .text("Budget Allocation ($)")
    .attr("fill", "#5C3C22");
}
