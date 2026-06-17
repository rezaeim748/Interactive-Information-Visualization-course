# Assignment 2 — Visualization Tools

## Overview
This assignment explores different visualization tools and their capabilities for analyzing data.

The tools used in this assignment are:
- Tableau Public
- RAWGraphs

## Dataset
I used the **Sample-Superstore** dataset from Tableau Sample Data.

Short description:  
- Number of rows: ~10,000  
- Main attributes: Order Date, Sales, Profit, Quantity, Category, Segment, State  
- Purpose: Analyze sales performance, profitability, and customer behavior across regions and product categories

---

## Tableau Visualizations

### Visualization 1 — Bar Chart

![Bar Chart](images/Tableau_Bar_Chart.png)

**Observation:**  
Sales fluctuate significantly over time, with several peaks and drops across the months. An overall increasing trend can be observed, especially toward late 2025 and 2026, where sales reach their highest values.

### Visualization 2 — Dashboard

![Filled map](images/Tableau_Dashboard.png)
This visualization shows profit by region, sales trends over time, and sales differences between customer segments.
![Filled map](images/Tableau_Dashboard_State_selected.png)
This dashboard shows the same information as the previous one, but only for the selected state, making the analysis more focused.

**Observation:**  
*First dashboard:* Profitability varies across states, with some regions generating losses while others remain profitable. Sales generally increase over time, although there are noticeable fluctuations. Among customer segments, the Consumer segment contributes the highest sales, while Home Office contributes the least.

*Second dashboard:* After filtering to a single state, sales values become smaller and more irregular over time, showing stronger fluctuations. The selected state experiences both profitable and unprofitable periods, indicating less stable performance. The Consumer segment still contributes most of the sales.

## Reflection
- Tableau was easier for interactive analysis and filtering.
- RAWGraphs provided useful advanced chart types.
- Different visualizations revealed different patterns in the dataset.

---

## PCP Interaction Analysis

In this part, I analyzed how a **Parallel Coordinates Plot (PCP)** supports Yi’s seven categories of interaction.

### Select
PCP supports selection by allowing users to highlight specific lines or value ranges. This helps identify important data records while reducing distraction from other records.

### Explore
Users can explore the dataset by inspecting different line patterns, clusters, and outliers. This makes it easier to discover hidden relationships between variables.

### Reconfigure
PCP supports reconfiguration through axis reordering. Changing the order of axes helps reveal correlations between selected attributes more clearly.

### Encode
Additional attributes can be represented using visual encodings such as color, opacity, or line thickness. This adds more information without changing the basic structure of the plot.

### Abstract / Elaborate
PCP partially supports abstraction and elaboration. Users can either focus on general trends or inspect individual records in more detail. However, this becomes difficult when many lines overlap.

### Filter
Filtering is strongly supported through brushing on axes. Users can display only records within selected value ranges, making the visualization less cluttered.

### Connect
PCP naturally supports connection because each polyline links the values of one data record across all dimensions, helping users understand relationships between variables.

### Reflection on Limitations
One weakness of PCP is limited support for **Abstract / Elaborate**, especially for large datasets where heavy overlap creates visual clutter.

### Proposed Extension
A useful improvement would be **cluster-based aggregation with drill-down interaction**.

This extension would:
- Group similar records into clusters
- Display clusters as summarized bands instead of many individual lines
- Allow users to click a cluster to expand and inspect individual records

This would reduce clutter, improve readability, and make PCP more effective for large datasets.
