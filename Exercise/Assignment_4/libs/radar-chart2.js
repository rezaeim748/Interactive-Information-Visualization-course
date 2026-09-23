// from https://yangdanny97.github.io/misc/spider_chart/, combined with
// https://gist.github.com/nbremer/21746a9668ffdf6d8242
// adapted to use dynamic objects

function RadarChart2(id, data, options) {
  var cfg = {
    w: 600, //Width of the circle
    h: 600, //Height of the circle
    maxValue: 0, //What is the value that the biggest circle will represent
    _filter: () => true,
    labels: false,
  };

  if ("undefined" !== typeof options) {
    for (var i in options) {
      if ("undefined" !== typeof options[i]) {
        cfg[i] = options[i];
      }
    } //for i
  } //if

  const width = cfg.w;
  const height = cfg.h;
  const radius = width / 2;
  const features = Object.keys(data[0]).filter(cfg._filter);
  const maxValue = Math.max(
    cfg.maxValue,
    d3.max(data, i => d3.max(features.map(o => i[o])))
  );

  d3.select(id).select("svg").remove();

  var svg = d3
    .select(id)
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("class", "radar" + id);

  let radialScale = d3.scaleLinear().domain([0, maxValue]).range([0, radius]);
  let ticks = [
    maxValue / 64,
    maxValue / 16,
    maxValue / 4,
    maxValue / 2,
    maxValue,
  ];

  // draw grid lines (circles)
  svg
    .selectAll("circle")
    .data(ticks)
    .join((enter) =>
      enter
        .append("circle")
        .attr("cx", width / 2)
        .attr("cy", height / 2)
        .attr("fill", "none")
        .attr("stroke", "gray")
        .attr("r", (d) => radialScale(d))
    );

  // draw axis for each feature
  function angleToCoordinate(angle, value) {
    let x = Math.cos(angle) * radialScale(value);
    let y = Math.sin(angle) * radialScale(value);
    return { x: width / 2 + x, y: height / 2 - y };
  }

  let featureData = features.map((f, i) => {
    let angle = Math.PI / 2 + (2 * Math.PI * i) / features.length;
    return {
      name: f,
      angle: angle,
      line_coord: angleToCoordinate(angle, maxValue),
      label_coord: angleToCoordinate(angle, maxValue + 0.5),
    };
  });

  // draw axis line
  svg
    .selectAll("line")
    .data(featureData)
    .join((enter) =>
      enter
        .append("line")
        .attr("x1", width / 2)
        .attr("y1", height / 2)
        .attr("x2", (d) => d.line_coord.x)
        .attr("y2", (d) => d.line_coord.y)
        .attr("stroke", "black")
    );

  // draw axis label
  if (cfg.labels) {
    svg
      .selectAll(".axislabel")
      .data(featureData)
      .join((enter) =>
        enter
          .append("text")
          .attr("x", (d) => d.label_coord.x)
          .attr("y", (d) => d.label_coord.y)
          .text((d) => d.name)
      );
  }
  // drawing the line for the spider chart
  let line = d3
    .line()
    .x((d) => d.x)
    .y((d) => d.y);
  let colors = ["darkorange", "gray", "navy"];

  // get coordinates for a data point
  function getPathCoordinates(data_point) {
    let coordinates = [];
    for (var i = 0; i < features.length; i++) {
      let ft_name = features[i];
      let angle = Math.PI / 2 + (2 * Math.PI * i) / features.length;
      console.log(data_point[ft_name]);
      coordinates.push(angleToCoordinate(angle, data_point[ft_name]));
    }
    return coordinates;
  }

  // draw the path element
  svg
    .selectAll("path")
    .data(data)
    .join((enter) =>
      enter
        .append("path")
        .datum((d) => getPathCoordinates(d))
        .attr("d", line)
        .attr("stroke-width", 3)
        .attr("stroke", (_, i) => colors[i])
        .attr("fill", (_, i) => colors[i])
        .attr("stroke-opacity", 1)
        .attr("opacity", 0.5)
    );
} //RadarChart
