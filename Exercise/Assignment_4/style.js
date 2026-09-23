// sizes of the two "special" node styles. script.js needs them too: the fisheye
// lens has to know how big a node is before it magnifies it.
export const SPARSE_NODE_SIZE = 30;
export const STAR_NODE_SIZE = 90;

const _style = [{
  "selector": "core",
  "style": {
    "selection-box-color": "#AAD8FF",
    "selection-box-border-color": "#8BB0D0",
    "selection-box-opacity": "0.5"
  }
}, {
  "selector": "node",
  "style": {
    "width": "mapData(mins, 0, 1000, 10, 100)",
    "height": "mapData(mins, 0, 1000, 10, 100)",
    "content": "data(name)",
    "font-size": "12px",
    "text-valign": "center",
    "text-halign": "center",
    "background-color": "#555",
    "text-outline-color": "#555",
    "text-outline-width": "2px",
    "color": "#fff",
    "overlay-padding": "6px",
    "z-index": "10"
  }
}, {
  "selector": "node:selected",
  "style": {
    "border-width": "6px",
    "border-color": "#AAD8FF",
    "border-opacity": "0.5",
    "background-color": "#77828C",
    "text-outline-color": "#77828C"
  }
}, {
  "selector": "edge",
  "style": {
    "curve-style": "haystack", // bezier, taxi, ...
    "haystack-radius": "0.5",
    "opacity": "0.4",
    "line-color": "#bbb",
    // the edge weights run from 1 to 3; mapData does not clamp, so the original
    // domain of 0..1 blew every edge up to 8px and beyond
    "width": "mapData(weight, 1, 3, 1, 5)",
    "overlay-padding": "3px"
  }
},

// --- semantic zoom ---------------------------------------------------------

{
  // semantic level 0: nodes with less than 10 attributes are not shown at all
  "selector": "node.hidden",
  "style": {
    "display": "none"
  }
}, {
  // semantic level 1+: nodes with less than 10 attributes get their own style.
  // They also get a fixed size, because they are the players with the fewest
  // minutes played and would otherwise be too small to tell a square from a circle.
  "selector": "node.sparse",
  "style": {
    "shape": "round-rectangle",
    "width": SPARSE_NODE_SIZE + "px",
    "height": SPARSE_NODE_SIZE + "px",
    "background-color": "#B85C38",
    "text-outline-color": "#B85C38"
  }
}, {
  // semantic level 2 (and the node-alteration lens): a d3 star plot per node
  "selector": "node.star",
  "style": {
    "shape": "ellipse",
    "width": STAR_NODE_SIZE + "px",
    "height": STAR_NODE_SIZE + "px",
    "background-color": "#fff",
    "background-image": "data(star)",
    "background-fit": "cover",
    "background-opacity": "1",
    "text-valign": "bottom",
    "font-size": "10px",
    "text-outline-color": "#000",
    "text-outline-width": "2px",
    "z-index": "30"
  }
},

// --- magic lens ------------------------------------------------------------

{
  // nodes currently under the lens
  "selector": "node.magic",
  "style": {
    "border-width": "4px",
    "border-color": "#F2C14E",
    "border-opacity": "1",
    "z-index": "40"
  }
}, {
  // edges connected to a node under the lens
  "selector": "edge.magic",
  "style": {
    "line-color": "#E8871A",
    "opacity": "1",
    "width": "mapData(weight, 1, 3, 3, 8)",
    "z-index": "20"
  }
}]

export default _style;
