# Multivariate & Network Visualization — Football Dataset

An interactive data visualization dashboard built with D3.js that explores FC Barcelona player statistics from the UEFA Champions League 2017–18 season. The goal of the project was to design a multi-view system that lets users analyze high-dimensional player data from several complementary perspectives at the same time. Football players can be described by dozens of statistics — passes, tackles, goals, minutes played, and more — and no single chart type can do justice to that level of complexity on its own. The dashboard addresses this by combining three coordinated views: a Parallel Coordinates Plot, a Scatterplot Matrix, and a Force-Directed Network Graph, all linked through a shared selection mechanism so that selecting players in one view immediately highlights them across the others.

## Views

### Parallel Coordinates Plot (PCP)
This view displays each player as a polyline crossing multiple statistical axes (appearances, passes, touches, goals, etc.). The color of each line encodes the value of the first dimension, making it easy to spot high and low performers at a glance.

- **Brush filtering**: Click and drag on any axis to filter players by that statistic. Only players within all active brushes stay highlighted.
- **Axis reordering**: Hold `Ctrl` and drag an axis to reorder dimensions on the fly. The Scatterplot Matrix updates automatically to reflect the new axis order.

### Scatterplot Matrix (SPLOM)
This view shows pairwise scatterplots of the first three dimensions in the dataset. Each cell plots one dimension against another, giving an overview of correlations across all pairs simultaneously.

- **Brush selection**: Drag a selection box in any cell to highlight a subset of players across all cells and the other views.
- **Dynamic update**: This view re-renders automatically when PCP axes are reordered.

### Force-Directed Network Graph
This view renders players as nodes and their connections (e.g. pass relationships) as edges. The edge thickness reflects the strength of each connection.

- **Draggable nodes**: Click and drag any node to reposition it; the simulation adjusts in real time.
- **Click to select**: Clicking a node selects that player and highlights them across all three views.

## Cross-View Linking

All three views share a single selection state propagated via the browser's custom event system. Selecting players in any view — by brushing in the PCP or SPLOM, or clicking nodes in the network — immediately highlights the same players across all other views.

## Dataset

`data/football.json` contains player statistics (appearances, minutes played, passes, tackles, goals, and more) and edges representing player connections. It was originally sourced from [this repository](https://git.informatik.uni-rostock.de/ct/responsive-matrix-cells/-/blob/master/src/data/football.json).

## Tech Stack

- [D3.js](https://d3js.org/) v7.8.4 — scales, axes, force simulation, brush, drag
- [Bootstrap](https://getbootstrap.com/) v5.3.0 — layout
- Vanilla JavaScript (no build step)

## Running Locally

Requires [Node.js](https://nodejs.org/). Install a static file server and start it:

```bash
npm install -g serve
serve -p 8000
```

Then open [http://localhost:8000](http://localhost:8000) in your browser.

Alternatively, any static server works (Python's `http.server`, VS Code Live Server, Vite, etc.).
