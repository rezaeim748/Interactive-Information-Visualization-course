// Semantic zoom + magic lenses on a co-player network of 95 soccer players.
//
//  * semantic zoom  : level 0 -> only "rich" nodes, level 1 -> all nodes with two
//                     visual styles, level 2 -> a d3 star plot on every visible node
//  * magic lenses   : node change (star plots under the lens), edge highlight,
//                     and a fisheye distortion lens as the extra task

/* global fetch, cytoscape, d3, RadarChart, XMLSerializer */
import _style, { SPARSE_NODE_SIZE, STAR_NODE_SIZE } from "./style.js";
import { default as d3Fisheye } from "./libs/d3-fisheye-2.1.2.js";
import { default as _ } from "./libs/underscore-1.13.6.js";

// a node is "rich" once it carries at least this many data attributes
const MIN_ATTRIBUTES = 10;

// resolution of the star plot images that are painted onto the nodes
const STAR_SIZE = 200;

// semantic levels, expressed as multiples of the zoom factor that fits the
// whole graph into the viewport (so they do not depend on the window size)
const LEVEL_1_ZOOM = 2;
const LEVEL_2_ZOOM = 5;

const state = {
  ready: false, // the layout has settled and the base zoom is known
  baseZoom: 1,
  level: 0,
  semantic: true,
  lens: "nodes", // off | nodes | edges | fisheye
  radius: 120, // in rendered (screen) pixels, like the lens circle
  distortion: 3,
  mouse: null, // rendered position of the cursor, null while it is outside
  dragging: false, // the user is moving a node, so the fisheye keeps its hands off
  distorted: false, // node positions are currently displaced by the fisheye
};

async function getData() {
  const football = await (await fetch("data/football.json")).json();
  const data = [];

  // every attribute that occurs anywhere in the data set, minus the identifiers
  const attributes = [
    ...new Set(football.nodes.flatMap((n) => Object.keys(n))),
  ].filter((k) => k !== "id" && k !== "label");

  // the attributes live on very different scales (touches in the thousands,
  // punches in single digits), so each star plot axis is normalised by the
  // maximum of that attribute over all players
  const maxima = {};
  attributes.forEach((a) => {
    maxima[a] = d3.max(football.nodes, (n) => n[a] || 0) || 1;
  });

  football.nodes.forEach((n) => {
    const values = {};
    attributes.forEach((a) => {
      if (typeof n[a] === "number") values[a] = n[a];
    });

    data.push({
      data: {
        id: n.id,
        name: n.label,
        mins: n.mins_played || 0,
        values,
        attributeCount: Object.keys(values).length,
      },
      group: "nodes",
    });
  });

  football.edges.forEach((n) => {
    data.push({
      data: {
        id: n.id,
        source: n.src,
        target: n.dst,
        weight: n.val,
      },
      group: "edges",
    });
  });

  return { elements: data, attributes, maxima };
}

// returns true if the point "p" is inside the circle defined by "c" (center) and "r" (radius)
function isInCircle(c, r, p) {
  return Math.pow(p.x - c.x, 2) + Math.pow(p.y - c.y, 2) <= Math.pow(r, 2);
}

// returns the nodes that are visible
function nodesInView(cy) {
  const ext = cy.extent();

  return cy.nodes().filter(n => {
    const bb = n.boundingBox()
    return bb.x1 > ext.x1 && bb.x2 < ext.x2 && bb.y1 > ext.y1 && bb.y2 < ext.y2
  })
}

// Draws a star plot for one node with the RadarChart function from /libs and
// turns the resulting svg into a data uri that cytoscape can use as a node
// background. The uri is cached on the node, so every plot is only built once.
function starPlot(node, attributes, maxima) {
  const cached = node.scratch("_star");
  if (cached) return cached;

  const values = node.data("values");
  const axes = attributes.map((a) => ({
    axis: a,
    value: (values[a] || 0) / maxima[a],
  }));

  RadarChart("#star-factory", [axes], {
    w: STAR_SIZE,
    h: STAR_SIZE,
    maxValue: 1,
    levels: 3,
    dotRadius: 2,
    strokeWidth: 2,
    opacityArea: 0.6,
    roundStrokes: false,
  });

  const svg = document.querySelector("#star-factory svg");
  const uri =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(new XMLSerializer().serializeToString(svg));

  node.scratch("_star", uri);
  return uri;
}

async function main() {
  const { elements, attributes, maxima } = await getData();

  const cy = cytoscape({
    container: document.getElementById("cy"),
    elements,
    wheelSensitivity: 0.3, // the default is quite twitchy on a touchpad
  });

  const layout = cy.layout({
    name: "cola",
    nodeSpacing: 50,
    edgeLength: 800,
    animate: true,
    randomize: false,
    maxSimulationTime: 2000,
  });

  layout.run(); // emits special events!

  cy.style(_style);

  // players with few attributes are the ones the semantic zoom hides first
  cy.nodes().forEach((n) => {
    if (n.data("attributeCount") < MIN_ATTRIBUTES) n.addClass("few");
  });

  const lens = document.getElementById("lens");
  const out = {
    zoom: document.getElementById("zoom-out"),
    level: document.getElementById("level-out"),
    lensCount: document.getElementById("lens-count-out"),
  };

  // ---------------------------------------------------------------- semantic zoom

  // the levels are relative to the zoom factor that fits the whole graph, so
  // they behave the same in a small window and on a large screen
  function semanticLevel() {
    const relative = cy.zoom() / state.baseZoom;
    if (relative < LEVEL_1_ZOOM) return 0;
    if (relative < LEVEL_2_ZOOM) return 1;
    return 2;
  }

  function applySemanticLevel() {
    // with the semantic zoom switched off, cytoscape's plain geometric zoom is
    // all that is left: every node is shown, and all of them look the same
    if (!state.semantic) {
      state.level = null;
      cy.nodes().removeClass("hidden sparse");
      return;
    }

    state.level = semanticLevel();

    // level 0 shows only the nodes with >= 10 attributes, and all of them in the
    // same style; from level 1 on, the sparse nodes come back as rounded squares
    if (state.level === 0) {
      cy.nodes(".few").addClass("hidden").removeClass("sparse");
    } else {
      cy.nodes(".few").removeClass("hidden").addClass("sparse");
    }
  }

  // ---------------------------------------------------------------- lens

  // the nodes currently covered by the lens circle (screen space, so the lens
  // keeps its size on screen no matter how far we are zoomed in)
  function nodesInLens() {
    if (!state.mouse) return cy.collection();

    return cy
      .nodes()
      .filter(
        (n) =>
          !n.hasClass("hidden") &&
          isInCircle(state.mouse, state.radius, n.renderedPosition())
      );
  }

  // star plots are expensive, so we only ever want them on the nodes that
  // actually need one: the ones in the viewport at semantic level 2, plus the
  // ones under the node-change lens. Everything else has its plot removed.
  function updateStarPlots(inLens) {
    let wanted = cy.collection();

    if (state.semantic && state.level === 2) {
      wanted = wanted.union(nodesInView(cy));
    }
    if (state.lens === "nodes") {
      wanted = wanted.union(inLens);
    }
    wanted = wanted.not(".hidden");

    cy.nodes(".star").not(wanted).removeClass("star");

    wanted.not(".star").forEach((n) => {
      n.data("star", starPlot(n, attributes, maxima));
      n.addClass("star");
    });
  }

  function updateEdgeHighlight(inLens) {
    cy.elements(".magic").removeClass("magic");

    if (state.lens === "edges" && inLens.length > 0) {
      inLens.addClass("magic");
      inLens.connectedEdges().addClass("magic");
    }
  }

  // ---------------------------------------------------------------- fisheye (extra)

  // The fisheye works on rendered coordinates (that is where the cursor and the
  // lens radius live), so we push every node through the distortion and convert
  // the result back into model coordinates. The undistorted position of each
  // node is kept in its scratchpad so we can always go back.
  // the size a node has when the fisheye does not touch it - the stylesheet
  // gives star plots and sparse nodes a fixed size, everything else is scaled
  // by the minutes played
  function undistortedSize(node) {
    if (node.hasClass("star")) return STAR_NODE_SIZE;
    if (node.hasClass("sparse")) return SPARSE_NODE_SIZE;
    return node.scratch("_size");
  }

  function applyFisheye() {
    const fisheye = d3Fisheye()
      .radius(state.radius)
      .distortion(state.distortion);
    fisheye.focus([state.mouse.x, state.mouse.y]);

    const zoom = cy.zoom();
    const pan = cy.pan();

    cy.nodes().forEach((n) => {
      const home = n.scratch("_home");
      if (!home) return;

      const rendered = { x: home.x * zoom + pan.x, y: home.y * zoom + pan.y };
      const [x, y, scale] = fisheye([rendered.x, rendered.y]);

      n.position({ x: (x - pan.x) / zoom, y: (y - pan.y) / zoom });

      // magnifying the nodes themselves makes the distortion far easier to read.
      // Outside of the lens the scale is exactly 1, and there we must not set an
      // inline size at all - it would override the size from the stylesheet.
      const size = undistortedSize(n);
      if (scale > 1.001 && size) {
        n.style({ width: size * scale, height: size * scale });
      } else {
        n.removeStyle("width height");
      }
    });

    state.distorted = true;
  }

  function resetFisheye() {
    if (!state.distorted) return;

    cy.nodes().forEach((n) => {
      const home = n.scratch("_home");
      if (home) n.position({ x: home.x, y: home.y });
      n.removeStyle("width height");
    });

    state.distorted = false;
  }

  // ---------------------------------------------------------------- update loop

  function update() {
    if (!state.ready) return;

    cy.startBatch();

    applySemanticLevel();

    const inLens = state.lens === "off" ? cy.collection() : nodesInLens();

    updateStarPlots(inLens);
    updateEdgeHighlight(inLens);

    if (state.lens === "fisheye" && state.mouse && !state.dragging) {
      applyFisheye();
    } else {
      resetFisheye();
    }

    cy.endBatch();

    // the circle follows the cursor
    if (state.mouse && state.lens !== "off") {
      lens.classList.remove("off");
      lens.setAttribute("cx", state.mouse.x);
      lens.setAttribute("cy", state.mouse.y);
      lens.setAttribute("r", state.radius);
    } else {
      lens.classList.add("off");
    }

    out.zoom.textContent = cy.zoom().toFixed(2);
    out.level.textContent = state.semantic ? state.level : "off";
    out.lensCount.textContent = inLens.length;
  }

  // ---------------------------------------------------------------- events

  cy.on("zoom", () => update());
  cy.on("pan", _.throttle(() => update(), 100));

  cy.on(
    "mousemove",
    _.throttle((e) => {
      state.mouse = e.renderedPosition; // same space as node.renderedPosition()
      update();
    }, 30)
  );

  // when the cursor leaves the graph, the lens leaves with it
  cy.container().addEventListener("mouseleave", () => {
    state.mouse = null;
    update();
  });

  // while a node is dragged the fisheye must not fight the user for its position
  cy.on("grab", "node", () => {
    state.dragging = true;
    resetFisheye();
  });

  // a node that was dragged by the user has a new home position
  cy.on("free", "node", (e) => {
    e.target.scratch("_home", { ...e.target.position() });
    state.dragging = false;
    update();
  });

  layout.one("layoutstop", () => {
    cy.fit(50);

    state.baseZoom = cy.zoom();
    cy.minZoom(state.baseZoom * 0.4);
    cy.maxZoom(state.baseZoom * 12);

    // remember where every node belongs and how big it is, so the fisheye lens
    // can distort them and put them back afterwards
    cy.nodes().forEach((n) => {
      n.scratch("_home", { ...n.position() });
      n.scratch("_size", n.width());
    });

    state.ready = true;
    update();
  });

  // ---------------------------------------------------------------- controls

  const mode = document.getElementById("lens-mode");
  const radius = document.getElementById("lens-radius");
  const radiusOut = document.getElementById("lens-radius-out");
  const distortion = document.getElementById("distortion");
  const distortionOut = document.getElementById("distortion-out");
  const semantic = document.getElementById("semantic");

  mode.value = state.lens;
  radius.value = state.radius;
  distortion.value = state.distortion;
  semantic.checked = state.semantic;

  mode.addEventListener("change", () => {
    state.lens = mode.value;
    update();
  });

  radius.addEventListener("input", () => {
    state.radius = +radius.value;
    radiusOut.textContent = radius.value;
    update();
  });

  distortion.addEventListener("input", () => {
    state.distortion = +distortion.value;
    distortionOut.textContent = distortion.value;
    update();
  });

  semantic.addEventListener("change", () => {
    state.semantic = semantic.checked;
    update();
  });
}

main();
