var d3, drawPCP, drawSPLOM, ForceGraph; // workaround to avoid error messages in editors

// Waiting until document has loaded
window.onload = async () => {
  // Loading the dataset
  /*const data = fetch('data/football.json')
    .then((response) => response.json())
    .then((json) => console.log(json));*/

  const all_data = await (await fetch("data/football.json")).json();
  const data = all_data.nodes.map((d) => {
    Object.keys(d).forEach((k) => {
      if (typeof d[k] === "string") {
        delete d[k];
      }
    });

    return d;
  });

  const keys = Object.keys(data[0]);
  const keyz = keys[0];
  const svg_pcp = d3.select("#pcp");
  const svg_splom = d3.select("#splom");
  const svg_nld = d3.select("#nld");

  drawPCP(svg_pcp, keys, keyz, data, () => {
      d3.select('#splom').html(null)
      drawSPLOM(svg_splom, keys, data)
  });
  drawSPLOM(svg_splom, keys, data);
  
  console.log(all_data)
  ForceGraph({
    nodes: all_data.nodes, 
    links: all_data.edges.map(e => { return { source: e.src, target: e.dst, value: e.val }}), 
    svg: svg_nld
  });
};
