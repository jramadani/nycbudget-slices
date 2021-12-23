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
  commboardtotals: [],
  commsmod: [],
  index: null,
};

//load in the data and call the init function

Promise.all([
  d3.json("../data/cd-boundaries-albers.geojson", d3.autoType),
  d3.csv("../data/adoptedtotal.csv", d3.autoType),
  d3.csv("../data/commboards.csv", d3.autoType),
  d3.csv("../data/tenmil-withpercent.csv", d3.autoType),
  d3.csv("../data/dates21.csv", (d) => ({
    date: new Date(d.date),
  })),
  d3.csv("../data/dates-partial-half1.csv", (d) => ({
    date: new Date(d.date),
  })),
  d3.csv("../data/dates-partial-half2.csv", (d) => ({
    date: new Date(d.date),
  })),
  d3.csv("../data/topten-mod-total.csv", d3.autoType),
  d3.csv("../data/commboard-totals.csv", d3.autoType),
  d3.csv("../data/commsmod.csv", d3.autoType),
]).then(
  ([
    geojson,
    hbcdata,
    cbdata,
    tenmil,
    d21,
    dhalf1,
    dhalf2,
    toptenmod,
    commboardtotals,
    commsmod,
  ]) => {
    //setting the state with data
    state.geojson = geojson;
    state.hbcdata = hbcdata;
    state.cbdata = cbdata;
    state.tenmil = tenmil;
    state.d21 = d21;
    state.dhalf1 = dhalf1;
    state.dhalf2 = dhalf2;
    state.toptenmod = toptenmod;
    state.commboardtotals = commboardtotals;
    state.commsmod = commsmod;
    console.log("state: ", state);
    init();
  }
);

function init() {
  //this init function will control scroll
  //and store the execution of the individual chart functions

  //scrollama code from official documentation - https://github.com/russellgoldenberg/scrollama
  // instantiate the scrollama
  const scroller = scrollama();

  // setup the instance, pass callback functions
  scroller
    .setup({
      step: ".step",
      offset: 0.3,
      debug: false,
    })
    .onStepEnter((response) => {
      console.log(response.index);
      state.index = response.index;
      //calling the update functions
      coreupdate();
      calupdate();
      if (state.index == 7 && response.direction == "up") {
        d3.selectAll("#fisc1 svg").attr("opacity", 1);
        d3.selectAll("#fisc2 svg").remove();
        d3.selectAll("#fisc3 svg").remove();
      }
      involveUpdate();
      if (state.index == 26) {
        d3.selectAll("#sani-cal svg").remove();
        fiscyear(state.d21, "#sani-cal", "#EEC994");
        calColorRange("#sani-cal rect", "1/11/2021", "1/17/2021");
        d3.selectAll("#sani-cal svg").classed("prefade", false);
      }
      switch (state.index) {
        case 28:
          return tenmilcategories();
        case 29:
          return d3
            .select("div .tenmillion")
            .transition()
            .duration(2000)
            .style("width", "200px")
            .style("height", "200px");
        case 30:
          return hbc(state.hbcdata, "#fiveyrHBC");
      }
      if (state.index == 27 && response.direction == "down") {
        d3.selectAll("#sani-cal svg").remove();
      }
      if (state.index == 28 && response.direction == "down") {
        d3.select("div .tenmillion")
          .transition()
          .duration(2000)
          .style("width", "5px")
          .style("height", "5px");
      }
      hbcupdater("#fiveyrHBC");
    })
    .onStepExit((response) => {
      // { element, index, direction }
      //resets
      d3.selectAll("#budget-totality .corepieces").style(
        "background-color",
        "#EEC994"
      );
      d3.selectAll("#budget-totality .corelabels").remove();
      d3.selectAll("#fisc2 rect").attr("fill", "#D69668");
      d3.selectAll("#fisc3 rect").attr("fill", "#D69668");
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

  //part one initial function calls
  core();
  fiscyear(state.d21, "#fisc1", "#DCA4B0");
  involvement();
  tenmil();

  // part two initial function calls

  heattable(
    "#heatmap",
    ["Budget Agency", "2017", "2018", "2019", "2020", "2021"],
    state.toptenmod
  );
  heattable(
    "#heatmap2",
    ["Community Board Borough", "2017", "2018", "2019", "2020", "2021"],
    state.commboardtotals
  );
  geomap();
  jitterplot();
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

  let core = d3
    .select("#budget-totality")
    .append("div")
    .attr("class", "cored")
    .style("width", width / 3.5)
    .style("height", height);

  // this is the stem / 10 year capital program
  core
    .append("div")
    .attr("class", "tenyearcap")
    .style("width", "15px")
    .style("height", "40px")
    .style("background-color", "#5C3C22")
    .style("transform", `translate(90px,30px)`);

  // this is the rest of the pieces
  core
    .selectAll(".pieces")
    .data(coredata)
    .join("div")
    .attr("class", (d) => d.item + " corepieces")
    .style("width", "100px")
    .style("height", "150px")
    .style("position", "absolute")
    .style("background-color", "#EEC994")
    .style("border", "solid 2px #EEC994")
    .style("transform", (d) => `translate(${d.x}px, ${d.y + 30}px)`);
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
      return d3.select(".tenyearcap").style("background-color", "#B19E52");
    case 6:
      d3.select(".tenyearcap").style("background-color", "#5C3C22");
      updater(".Revenue", 120, 60, "Revenue");
  }

  function updater(itemclass, x, y, text) {
    d3.selectAll(itemclass)
      .style("background-color", "#AC8245")
      .transition()
      .duration(2000)
      .ease(d3.easeLinear);

    d3.selectAll("#budget-totality " + itemclass)
      .append("div")
      .attr("class", "corelabels")
      .html(`${text}`)
      .style("color", "white")
      .style("text-align", "center")
      .style("padding", "10px");
  }
}

function fiscyear(caldata, placement, color) {
  // calendar base from Mike Bostock, adapted for vertical use
  if (placement == "#fisc2" || placement == "#fisc3") {
    d3.selectAll(placement + " svg").remove();
  }

  const cellSize = 17;
  weekday = "monday";
  countDay = weekday === "sunday" ? (i) => i : (i) => (i + 6) % 7;
  timeWeek = weekday === "sunday" ? d3.utcSunday : d3.utcMonday;
  formatMonth = d3.utcFormat("%b");
  formatDay = (i) => "SMTWTFS"[i];
  formatDate = d3.utcFormat("%x");
  formatIso = d3.utcParse("%Y-%m-%dT%H:%M:%S.%LZ");

  //pathMonth has its path-drawing formula reversed for vertical use
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

  const container = d3.select(placement);

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

    svg.classed("prefade fadein", true);
  }

  if (placement == "#fisc3" || placement == "#sani-cal") {
    svg.classed("prefade fadein", true);
  }
}

function involvement() {
  //data setup
  const parties = {
    nodes: [
      {
        id: 1,
        name: "Mayor",
        color: "#9ECE96",
        phase: "one",
      },
      {
        id: 2,
        name: "City Council",
        color: "#DCA4B0",
        phase: "one",
      },
      {
        id: 3,
        name: "Office of Management and Budget",
        color: "#9ECE96",
        phase: "two",
      },
      {
        id: 4,
        name: "Lobbyists",
        color: "#D69668",
        phase: "three",
      },
      {
        id: 5,
        name: "Activist Groups",
        color: "#D69668",
        phase: "three",
      },
      {
        id: 6,
        name: "Other Interested Parties",
        color: "#D69668",
        phase: "three",
      },
      {
        id: 7,
        name: "You!",
        color: "#D69668",
        phase: "four",
      },
    ],
    links: [
      {
        source: 1,
        target: 2,
        phase: "one",
      },
      {
        source: 2,
        target: 1,
        phase: "one",
      },
      {
        source: 3,
        target: 1,
        phase: "two",
      },
      {
        source: 3,
        target: 2,
        phase: "two",
      },
      {
        source: 4,
        target: 1,
        phase: "three",
      },
      {
        source: 4,
        target: 2,
        phase: "three",
      },
      {
        source: 5,
        target: 1,
        phase: "three",
      },
      {
        source: 5,
        target: 2,
        phase: "three",
      },
      {
        source: 6,
        target: 1,
        phase: "three",
      },
      {
        source: 6,
        target: 2,
        phase: "three",
      },
      {
        source: 7,
        target: 1,
        phase: "four",
      },
      {
        source: 7,
        target: 2,
        phase: "four",
      },
      {
        source: 7,
        target: 3,
        phase: "four",
      },
      {
        source: 7,
        target: 4,
        phase: "four",
      },
    ],
  };
  //set up the svg
  const svg = d3
    .select("#involved")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  //add legend

  svg
    .append("rect")
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", "#9ECE96")
    .attr("transform", `translate(10, 10)`);
  svg.append("text").attr("dx", 25).attr("dy", 20).text("Executive");
  svg
    .append("rect")
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", "#DCA4B0")
    .attr("transform", `translate(100, 10)`);
  svg.append("text").attr("dx", 115).attr("dy", 20).text("Legislative");
  svg
    .append("rect")
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", "#D69668")
    .attr("transform", `translate(200, 10)`);
  svg
    .append("text")
    .attr("dx", 215)
    .attr("dy", 20)
    .text("Non-government entities");

  // add a section for identifying the entity

  d3.select("#involved")
    .append("p")
    .attr("id", "entityid")
    .html(`Interact with one of the entities to find out who it is!`);

  //nodemap

  // Initialize the links
  const link = svg
    .selectAll("line")
    .data(parties.links)
    .join("line")
    .attr("class", (d) => d.phase)
    .style("stroke", "#aaa")
    .style("stroke-style", "dashed")
    .style("visibility", "hidden");

  // Initialize the nodes
  const node = svg
    .selectAll("circle")
    .data(parties.nodes)
    .join("circle")
    .attr("r", 20)
    .attr("fill", (d) => d.color)
    .attr("class", (d) => d.phase)
    .style("visibility", "hidden")
    .on("mouseover", function () {
      d3.select("#entityid").html(`${this.__data__.name}`);
      d3.select(this).attr("stroke", "#180D05").attr("stroke-width", "5px");
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke", "none");
    });

  const simulation = d3
    .forceSimulation(parties.nodes) // Force algorithm is applied to data.nodes
    .force(
      "link",
      d3
        .forceLink() // This force provides links between nodes
        .id((d) => d.id)
        .links(parties.links) // and this the list of links
    )
    .force("charge", d3.forceManyBody().strength(-700)) // This adds repulsion between nodes. Play with the -400 for the repulsion strength
    .force("center", d3.forceCenter(width / 2, height / 2)) // This force attracts nodes to the center of the svg area
    .on("end", ticked);

  // this updates the node position
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
  const thisdiv = d3
    .select("#tenmil")
    .append("div")
    .style("width", "500px")
    .style("height", "500px")
    .style("background-color", "#9ECE96")
    .classed("backdrop", true);

  thisdiv
    .append("div")
    .classed("tenmillion", true)
    .style("width", "5px")
    .style("height", "5px")
    .style("background-color", "#5C3C22");
}

function tenmilcategories() {
  // create bars for the categories
  // use the percentages to calculate width of total

  d3.selectAll(".bar-outer").remove();
  d3.selectAll(".bar-inner").remove();

  const format = d3.format(",d");
  const formatpercent = d3.format(".2");

  d3.select("#tenmil").append("div").attr("id", "explanation-central");

  const thisdiv = d3
    .select("#sani-cal")
    .append("div")
    .classed("cat-container", true)
    .style("position", "relative")
    .style("margin-left", "-200px");

  thisdiv
    .selectAll(".bar-outer")
    .data(state.tenmil)
    .join("div")
    .style("width", "250px")
    .style("height", "30px")
    .style("background-color", "#EEC994")
    .style("position", "absolute")
    .style("top", (d, i) => `${i * 40}px`)
    .style("left", "0px")
    .on("mouseover", function () {
      d3.select("#explanation-central").html(
        `<p><b>${
          this.__data__.division
        }:</b><br> $10 million pays for <span class="highlighted">${format(
          this.__data__.part
        )} of ${format(this.__data__.total)} ${
          this.__data__.unit
        }</span>, which is ${formatpercent(
          this.__data__.percent
        )}% of what's needed for the year.</p>`
      );
    });

  thisdiv
    .selectAll("div .bar-outer")
    .data(state.tenmil)
    .join("div")
    .style("width", (d) => `${(d.percent * 250) / 100}px`)
    .style("height", "30px")
    .style("background-color", "#6E9D68")
    .style("position", "absolute")
    .style("z-index", 99999)
    .style("top", (d, i) => `${i * 40}px`)
    .style("left", "0px");

  const overalltotal = d3.sum(state.tenmil.map((d) => d.totalprice));

  console.log(
    "this is how much you have left",
    state.hbcdata[4].Adopted - overalltotal
  );
  console.log("how many squares", overalltotal / 10000000);
}

//step update functions

function calupdate() {
  //initial if statement calls multiple items so isn't in the switch-case
  if (state.index == 8) {
    d3.selectAll("#fisc1 svg").attr("opacity", "0.3");
    fiscyear(state.dhalf1, "#fisc2", "#D69668");
    fiscyear(state.dhalf2, "#fisc3", "#D69668");
    d3.selectAll("#fisc2 svg").classed("prefade", false);
    d3.selectAll("#fisc3 svg").classed("prefade", false);
  }
  // the below are in a switch-case because they include one line executables

  switch (state.index) {
    case 9:
      return calcolorupdate("#fisc2 rect", "7/1/2021");
    case 10:
      return calcolorupdate("#fisc2 rect", "9/3/2021");
    case 11:
      return calcolorupdate("#fisc2 rect", "10/31/2021");
    case 12:
      return calcolorupdate("#fisc2 rect", "12/31/2021");
    case 13:
      return calcolorupdate("#fisc3 rect", "1/16/2022");
    case 14:
      return calColorRange("#fisc3 rect", "01/16/2022", "02/16/2022");
    case 15:
      return calcolorupdate("#fisc3 rect", "2/25/2022");
    case 16:
      return calcolorupdate("#fisc3 rect", "3/10/2022");
    case 17:
      return calcolorupdate("#fisc3 rect", "3/25/2022");
    case 18:
      return calcolorupdate("#fisc3 rect", "4/26/2022");
    case 19:
      return calColorRange("#fisc3 rect", "5/6/2022", "5/25/2022");
    case 20:
      return calcolorupdate("#fisc3 rect", "6/5/2022");
    case 21:
      return calcolorupdate("#fisc3 rect", "6/30/2022");
  }
}

//calcolorupdate and calColorRange select the div and all of its rects
//compare the dates to the given date, and then change the fill color
//the first function is for singular dates, the second is for ranges

function calcolorupdate(selecting, datecompare) {
  d3.selectAll(selecting)
    .filter(
      (d) => new Date(d.date).getTime() == new Date(datecompare).getTime()
    )
    .attr("fill", "#9ECE96");
}

function calColorRange(selecting, first, last) {
  //create array of dates
  const start = new Date(first);
  const end = new Date(last);
  const dt = new Date(start);
  const thismonth = [];

  while (dt <= end) {
    thismonth.push(new Date(dt).getTime());
    dt.setDate(dt.getDate() + 1);
  }
  //then:
  return d3
    .selectAll(selecting)
    .filter((d) => thismonth.includes(new Date(d.date).getTime()))
    .attr("fill", "#9ECE96");
}

function involveUpdate() {
  switch (state.index) {
    case 22:
      return d3
        .selectAll(".one")
        .classed(".one fadein", true)
        .style("visibility", "visible");
    case 23:
      return d3
        .selectAll(".two")
        .classed(".two fadein", true)
        .style("visibility", "visible");
    case 24:
      return d3
        .selectAll(".three")
        .classed(".three fadein", true)
        .style("visibility", "visible");
    case 25:
      return d3
        .selectAll(".four")
        .classed(".four fadein", true)
        .style("visibility", "visible");
  }
}

// PART TWO FUNCTIONS:

function hbc(data, placement) {
  d3.selectAll(placement + " svg").remove();

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
    .attr("class", (d, i) => "bar" + i)
    .attr("x", x(0))
    .attr("y", (d, i) => y(i))
    .attr("width", 0)
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

//hbc needs its own updater function
function hbcupdater(placement) {
  // necessary items from the original function
  const x = d3
    .scaleLinear()
    .domain([0, d3.max(state.hbcdata, (d) => d.Adopted)])
    .range([margin.left, width - margin.right]);

  //switch case for each year of the bar

  switch (state.index) {
    case 31:
      return hbcreuse(".bar0");
    case 32:
      return hbcreuse(".bar1");
    case 33:
      return hbcreuse(".bar2");
    case 34:
      return hbcreuse(".bar3");
    case 35:
      return hbcreuse(".bar4");
  }

  function hbcreuse(placer) {
    d3.selectAll(placement + " " + placer)
      .transition()
      .duration(3000)
      .attr("width", (d) => x(d.Adopted) - x(0));
    // .delay((d, i) => i * 500);
  }
}

function heattable(placement, columns, data) {
  //create table
  //conditional formatting by value

  //color scale
  const color = d3
    .scaleSequential()
    .domain([917436, 29169188823])
    .range(["#EEC994", "#D0786D", "#700D03"]);
  // const format = d3.format(",d");
  const format = (num) => d3.format(".3s")(num).replace(/G/, "B");
  const table = d3.select(placement).append("table");
  const thead = table.append("thead");
  thead
    .append("tr")
    .selectAll("th")
    .data(columns)
    .join("th")
    .text((d) => d);

  const rows = table.append("tbody").selectAll("tr").data(data).join("tr");

  rows
    .selectAll("td")
    .data((d) => {
      const vals = Object.values(d);
      const item = vals.pop();
      vals.unshift(item);
      return vals;
    })
    .join("td")
    .text((d) => (typeof d != "string" ? format(d) : d))
    .style("background-color", (d) =>
      typeof d != "string" ? color(d) : "none"
    );
}

function comparative(dropdown, location, details, data, default_selection) {
  // set up the data first
  //tmc-1-select controls tm-compare-1 and the same for 2

  // dropdown changing

  const selectElement = d3.select(dropdown).on("change", function () {
    //remove existing treemap
    d3.select(location + " .treemapped").remove();
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
    .text((d) => d)
    .style("font-family", "Asap");

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
    d3.selectAll(`${reusable} .treemapped`).remove();
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
    .append("div")
    .attr("class", "treemapped")
    .style("width", `${localwidth / 2.5}px`)
    .style("height", `${height}px`)
    .style("position", "relative");

  let root = wrappeddata;

  let tree = d3
    .treemap()
    .size([localwidth / 2.5, height])
    .padding(1)
    .round(true);

  tree(root);

  let leaf = svg.selectAll("div").data(root.leaves()).join("g");

  leaf
    .append("div")
    .style("border", "white")
    .style("background-color", (d) => color(d.value))
    .style("width", (d) => `${d.x1 - d.x0}px`)
    .style("height", (d) => `${d.y1 - d.y0}px`)
    .style("position", "absolute")
    .style("top", (d) => `${d.y0}px`)
    .style("left", (d) => `${d.x0}px`)
    .on("mouseover", function (e) {
      d3.select(item)
        .html(
          `${this.__data__.data.Agency}<br><br>${
            this.__data__.data["Expense Category"]
          }<br>
        <br>$${format(
          Number(Math.round(this.__data__.data.Modified + "e2") + "e-2")
        )}`
        )
        .style("visibility", "visible")
        .style(
          "transform",
          `translate(${
            this.__data__.x0 + (this.__data__.x1 - this.__data__.x0) / 2
          }px, ${
            this.__data__.y0 + (this.__data__.y1 - this.__data__.y0) / 2
          }px)`
        )
        .style("padding", "20px");
    })
    .on("mouseout", function () {
      d3.select(item).style("visibility", "hidden");
    });

  leaf
    .append("span")
    .html(
      (d) =>
        `${d.data["Expense Category"]} <br> ${format(
          Number(Math.round(d.value + "e2") + "e-2")
        )}`
    )
    .style("font-size", (d) => `${logScale((d.x1 - d.x0) * (d.y1 - d.y0))}em`)
    .style("font-family", "Asap")
    .style(
      "color",
      "white"
      // (d) => (isDark(color(d.value)) ? "white" : "black")
    )
    .style("position", "absolute")
    .style("top", (d) => `${d.y0}px`)
    .style("left", (d) => `${d.x0}px`)
    .style("padding", "10px");
}

function geomap() {
  //data formatting

  const years = Array.from(new Set(state.cbdata.map((d) => d.Year)));

  //set up range slider

  const selectYear = d3.select("#range").on("change", function () {
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

  const width = 500;
  const height = 300;

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

function jitterplot() {
  //local constants
  const width = 800;
  const margin = { top: 25, right: 20, bottom: 35, left: 70 };
  let format = d3.format(",d");
  //scales
  const x = d3
    .scaleBand()
    .domain(state.commsmod.map((d) => d.Borough))
    .range([margin.left, width - margin.right]);

  const y = d3
    .scaleLinear()
    .domain(d3.extent(state.commsmod, (d) => d.Modified))
    .nice()
    .range([height - margin.bottom, margin.top]);
  //axes
  const xAxis = d3.axisBottom(x);
  const yAxis = d3.axisLeft(y);

  //color

  const color = d3.scaleOrdinal(
    Array.from(new Set(state.commsmod.map((d) => d.Borough))),
    ["#DCA4B0", "#D0786D", "#D69668", "#9ECE96", "#B19E52"]
  );

  //build visual
  const svg = d3
    .select("#jitterplot")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  svg
    .append("g")
    .selectAll("circle")
    .data(state.commsmod)
    .join("circle")
    .attr("cx", (d) => x(d.Borough) + margin.left - 10 + Math.random() * 20)
    .attr("cy", (d) => y(d.Modified))
    .attr("r", 3)
    .attr("stroke", "none")
    .attr("fill", (d) => color(d.Borough))
    .on("mouseover", function () {
      d3.select(this).attr("stroke", "#180D05").attr("stroke-width", 2);
      d3.select("#jitter-tooltip")
        .html(
          `In ${this.__data__.Year}, ${
            this.__data__.Agency
          } received a total of $${format(
            Number(Math.round(this.__data__.Modified + "e2") + "e-2")
          )} in allocated funds.`
        )
        .style("visibility", "visible")
        .style(
          "transform",
          `translate(${+this.attributes.cx.value + 400 + margin.left}px, ${+this
            .attributes.cy.value}px)`
        );
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke", "none");
      d3.select("#jitter-tooltip").style("visibility", "hidden");
    });
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
    .text("Modified Budget Allocation ($)")
    .attr("fill", "#5C3C22");
}
