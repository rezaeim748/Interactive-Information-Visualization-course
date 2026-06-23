var d3; 

  function drawPCP(svg, keys, keyz, data, on_drag) {
    // adapted from https://observablehq.com/@d3/brushable-parallel-coordinates 
    // Specify the chart’s dimensions.
    const width = 500;
    const height = 500; //keys.length * 60;
    const marginTop = 20;
    const marginRight = 10;
    const marginBottom = 20;
    const marginLeft = 10;

    // Create an scale for each key. // In the original, this was only horizontal (*x*) 
    const val_extent = new Map(Array.from(keys, key => [key, d3.scaleLinear(d3.extent(data, d => d[key]), [marginLeft, width - marginRight])]));

    // Create the axes scale. // In the original, this was only vertical (*y*) 
    const var_extent = d3.scalePoint(keys, [marginTop, height - marginBottom]);

    // Create the color scale.
    const color = d3.scaleSequential(val_extent.get(keyz).domain(), t => d3.interpolateBrBG(1 - t));

    // Create the SVG container.
    svg.attr("viewBox", [0, 0, width, height])
        .attr("width", width)
        .attr("height", height)
        .attr("style", "max-width: 100%; height: auto;");

    
    // extract line function over a data point, avoids code duplication
    const linePath = (d) => line(d3.cross(keys, [d], (key, d) => [key, d[key]]));
    
    // Append the lines.
    const line = d3.line()
      .defined(([, value]) => value != null)
      .y(([key, value]) => val_extent.get(key)(value))
      .x(([key]) => var_extent(key));

    const path = svg.append("g")
        .attr("fill", "none")
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.4)
      .selectAll("path")
      .data(data.slice().sort((a, b) => d3.ascending(a[keyz], b[keyz])))
      .join("path")
        .attr("stroke", d => color(d[keyz]))
        .attr("d", linePath)
      .call(path => path.append("title")
          .text(d => d.name));

    // Append the axis for each key.
    const axes = svg.append("g")
      .selectAll("g")
      .data(keys)
      .join("g")
        .attr("transform", d => `translate(${var_extent(d)}, 0)`)
        .each(function(d) { d3.select(this).call(d3.axisLeft(val_extent.get(d))); })
        .call(g => g.append("text")
          .attr("y", marginLeft)
          .attr("x", -6)
          .attr("text-anchor", "start")
          .attr("fill", "currentColor")
          .text(d => d))
        .call(g => g.selectAll("text")
          .clone(true).lower()
          .attr("fill", "none")
          .attr("stroke-width", 5)
          .attr("stroke-linejoin", "round")
          .attr("stroke", "white"))
        // axes re-ordering based on https://observablehq.com/@matthewnunes/parallel-coordinates-plot/2
        .call(d3.drag()
          .filter(e => e.ctrlKey)
          .on("drag", (e, d) => {
              dragging[d] = e.x;
              path.attr("d", linePath);
              keys.sort(basic_sort);
              var_extent.domain(keys);
              axes.attr("transform", d => `translate(${position(d)}, 0)`)
          })
          .on("end", (e, d) => {
              delete dragging[d];
          
              axes.filter(a => a === d)
                  .transition().duration(500) // animation! 
                  .attr("transform", `translate(${var_extent(d)}, 0)`);
              path.attr("d", linePath);
          
              on_drag();
          }));
    

    // keep track of dragging events
    const dragging = {};

    // sort dimensions
    const position = (d) => dragging[d] || var_extent(d);
    const basic_sort = (a, b) => position(a) - position(b);

    // create the brush behavior
    const deselectedColor = "#ddd";
    const brushHeight = 50;
    const brush = d3.brushY()
      .extent([
        [-(brushHeight / 2), marginLeft],
        [ brushHeight / 2, width - marginRight]
      ])
      .on("start brush end", brushed);

    axes.call(brush);

    const selections = new Map();

    function brushed({ selection }, key) {
      if (selection === null) selections.delete(key);
      else selections.set(key, selection.map(val_extent.get(key).invert));
      const selected = {};
      path.each(function(d) {
        const active = Array.from(selections).every(([key, [min, max]]) => d[key] >= min && d[key] <= max);
        if (active) {
          selected["id-" + d.id] = d;
        }
      });
      svg.property("value", Object.values(selected)).dispatch("input");
      document.dispatchEvent(
        new CustomEvent("selection", {
          detail: {
            selected,
          },
        })
      );
    }
   
    document.addEventListener("selection", (e) => {
      path.each(function(d) {
        if (e.detail.selected["id-" + d.id]) {
          d3.select(this).style("stroke", color(d[keyz]));
          d3.select(this).raise();
        } else {
          d3.select(this).style("stroke", deselectedColor);
        }
      });
    });
  }