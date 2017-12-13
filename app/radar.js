// The MIT License (MIT)

// Copyright (c) 2017 Zalando SE

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

function radar_visualization(config) {
  // custom random number generator, to make random sequence reproducible
  // source: https://stackoverflow.com/questions/521295
  var seed = 42;
  function random() {
    var x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  }

  function random_between(min, max) {
    return min + random() * (max - min);
  }

  function normal_between(min, max) {
    return min + (random() + random()) * 0.5 * (max - min);
  }

  // radial_min / radial_max are multiples of PI
  const quadrants = [
    { radial_min: 0, radial_max: 0.5, factor_x: 1, factor_y: 1 },
    { radial_min: 0.5, radial_max: 1, factor_x: -1, factor_y: 1 },
    { radial_min: -1, radial_max: -0.5, factor_x: -1, factor_y: -1 },
    { radial_min: -0.5, radial_max: 0, factor_x: 1, factor_y: -1 }
  ];

  const rings = [{ radius: 130*2 }, { radius: 220*2 }, { radius: 310*2 }];

  function polar(cartesian) {
    var x = cartesian.x;
    var y = cartesian.y;
    return {
      t: Math.atan2(y, x),
      r: Math.sqrt(x * x + y * y)
    };
  }

  function cartesian(polar) {
    return {
      x: polar.r * Math.cos(polar.t),
      y: polar.r * Math.sin(polar.t)
    };
  }

  function bounded_interval(value, min, max) {
    var low = Math.min(min, max);
    var high = Math.max(min, max);
    return Math.min(Math.max(value, low), high);
  }

  function bounded_ring(polar, r_min, r_max) {
    return {
      t: polar.t,
      r: bounded_interval(polar.r, r_min, r_max)
    };
  }

  function bounded_box(point, min, max) {
    return {
      x: bounded_interval(point.x, min.x, max.x),
      y: bounded_interval(point.y, min.y, max.y)
    };
  }

  function segment(quadrant, ring) {
    var polar_min = {
      t: quadrants[quadrant].radial_min * Math.PI,
      r: ring == 0 ? 30 : rings[ring - 1].radius
    };
    var polar_max = {
      t: quadrants[quadrant].radial_max * Math.PI,
      r: rings[ring].radius
    };
    var cartesian_min = {
      x: 15 * quadrants[quadrant].factor_x,
      y: 15 * quadrants[quadrant].factor_y
    };
    var cartesian_max = {
      x: rings[2].radius * quadrants[quadrant].factor_x,
      y: rings[2].radius * quadrants[quadrant].factor_y
    };
    return {
      clipx: function(d) {
        var c = bounded_box(d, cartesian_min, cartesian_max);
        var p = bounded_ring(polar(c), polar_min.r + 15, polar_max.r - 15);
        d.x = cartesian(p).x; // adjust data too!
        return d.x;
      },
      clipy: function(d) {
        var c = bounded_box(d, cartesian_min, cartesian_max);
        var p = bounded_ring(polar(c), polar_min.r + 15, polar_max.r - 15);
        d.y = cartesian(p).y; // adjust data too!
        return d.y;
      },
      random: function() {
        return cartesian({
          t: random_between(polar_min.t, polar_max.t),
          r: normal_between(polar_min.r, polar_max.r)
        });
      }
    };
  }

  // position each entry randomly in its segment
  for (var i = 0; i < config.entries.length; i++) {
    var entry = config.entries[i];
    entry.segment = segment(entry.quadrant, entry.ring);
    var point = entry.segment.random();
    entry.x = point.x;
    entry.y = point.y;
    entry.color =
      entry.active || config.print_layout
        ? config.rings[entry.ring].color
        : config.colors.inactive;
  }

  // partition entries according to segments
  var segmented = new Array(config.quadrants.length);
  for (var quadrant = 0; quadrant < config.quadrants.length; quadrant++) {
    segmented[quadrant] = new Array(config.quadrants.length);
    for (var ring = 0; ring < rings.length; ring++) {
      segmented[quadrant][ring] = [];
    }
  }
  for (var i = 0; i < config.entries.length; i++) {
    var entry = config.entries[i];
    segmented[entry.quadrant][entry.ring].push(entry);
  }

  // assign unique sequential id to each entry
  var id = 1;
  for (var quadrant of [2, 3, 1, 0]) {
    for (var ring = 0; ring < 3; ring++) {
      var entries = segmented[quadrant][ring];
      entries.sort(function(a, b) {
        return a.label.localeCompare(b.label);
      });
      for (var i = 0; i < entries.length; i++) {
        entries[i].id = "" + id++;
      }
    }
  }

  function translate(x, y) {
    return "translate(" + x + "," + y + ")";
  }

  function viewbox(quadrant) {
    return [
      Math.max(0, quadrants[quadrant].factor_x * 400) - 420,
      Math.max(0, quadrants[quadrant].factor_y * 400) - 420,
      440,
      440
    ].join(" ");
  }

  var svg = d3
    .select("svg#" + config.svg_id)
    .style("background-color", config.colors.background)
    .attr("width", config.width)
    .attr("height", config.height);

  var radar = svg.append("g");
  if ("zoomed_quadrant" in config) {
    svg.attr("viewBox", viewbox(config.zoomed_quadrant));
  } else {
    radar.attr("transform", translate(config.width / 2, config.height / 2));
  }

  var grid = radar.append("g");
  var defs = grid.append("defs");
  // draw rings
  for (var i = rings.length - 1; i >= 0; i--) {
    let rectX = [0, -rings[i].radius, 0, -rings[i].radius],
      rectY = [0, 0, -rings[i].radius, -rings[i].radius],
      rectsContainer = grid
        .append("g")
        .attr("clip-path", "url(#quad" + i + ")");
    defs
      .append("clipPath")
      .attr("id", "quad" + i)
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", rings[i].radius);
    for (var j = 0; j < config.quadrants.length; j++) {
      rectsContainer
        .append("rect")
        .attr("x", rectX[j])
        .attr("y", rectY[j])
        .attr("width", rings[i].radius)
        .attr("height", rings[i].radius)
        .attr("stroke", "#FFF")
        .attr("stroke-width", 0)
        .attr("fill", config.quadrants[j].bgcolor)
        .attr("fill-opacity", 1 / (i + 1));
    }
    /* Circle to draw Outline */
    grid
      .append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", rings[i].radius)
      .attr("stroke", "#fff")
      .attr("stroke-width", 3)
      .attr("fill", "none");
    if (config.print_layout) {
      grid
        .append("text")
        .text(config.rings[i].name)
        .attr("y", -rings[i].radius + 62)
        .attr("text-anchor", "middle")
        .style("fill", "#e5e5e5")
        .style("font-family", "Arial, Helvetica")
        .style("font-size", 30)
        .style("font-weight", "bold")
        .style("pointer-events", "none")
        .style("user-select", "none");
    }
  }
  /* Draw Lines */
  grid
    .append("line")
    .attr("x1", 0)
    .attr("y1", -310*2)
    .attr("x2", 0)
    .attr("y2", 310*2)
    .style("stroke", "#FFF")
    .style("stroke-width", 3);
  grid
    .append("line")
    .attr("x1", -310*2)
    .attr("y1", 0)
    .attr("x2", 310*2)
    .attr("y2", 0)
    .style("stroke", "#FFF")
    .style("stroke-width", 3);
  function legend_transform(quadrant, ring, index = null) {
    var dx = ring < 2 ? 0 : 120;
    var dy = index == null ? -16 : index * 12;
    if (ring % 2 == 1) {
      dy = dy + 36 + segmented[quadrant][ring - 1].length * 12;
    }
    return translate(
      legend_offset[quadrant].x + dx,
      legend_offset[quadrant].y + dy
    );
  }

  // layer for entries
  var rink = radar.append("g").attr("id", "rink");

  // rollover bubble (on top of everything else)
  var bubble = radar
    .append("g")
    .attr("id", "bubble")
    .attr("x", 0)
    .attr("y", 0)
    .style("opacity", 0)
    .style("pointer-events", "none")
    .style("user-select", "none");
  bubble
    .append("rect")
    .attr("rx", 4)
    .attr("ry", 4)
    .style("fill", "#333");
  bubble
    .append("text")
    .style("font-family", "sans-serif")
    .style("font-size", "10px")
    .style("fill", "#fff");
  bubble
    .append("path")
    .attr("d", "M 0,0 10,0 5,8 z")
    .style("fill", "#333");

  function showBubble(d) {
    if (d.active || config.print_layout) {
      var tooltip = d3.select("#bubble text").text(d.label);
      var bbox = tooltip.node().getBBox();
      d3
        .select("#bubble")
        .attr("transform", translate(d.x - bbox.width / 2, d.y - 16))
        .style("opacity", 0.8);
      d3
        .select("#bubble rect")
        .attr("x", -5)
        .attr("y", -bbox.height)
        .attr("width", bbox.width + 10)
        .attr("height", bbox.height + 4);
      d3
        .select("#bubble path")
        .attr("transform", translate(bbox.width / 2 - 5, 3));
    }
  }

  function hideBubble(d) {
    var bubble = d3
      .select("#bubble")
      .attr("transform", translate(0, 0))
      .style("opacity", 0);
  }

  // draw blips on radar
  var blips = rink
    .selectAll(".blip")
    .data(config.entries)
    .enter()
    .append("g")
    .attr("class", "blip")
    .on("mouseover", showBubble)
    .on("mouseout", hideBubble);

  // configure each blip
  blips.each(function(d) {
    var blip = d3.select(this);
    var i = 0;
    // blip link
    if (!config.print_layout && d.hasOwnProperty("link")) {
      blip = blip.append("a").attr("xlink:href", d.link);
    }

    // blip shape
    if (d.moved > 0) {
      blip
        .append("path")
        .attr("d", "M -11,5 11,5 0,-13 z") // triangle pointing up
        .style("fill", d.color);
    } else if (d.moved < 0) {
      blip
        .append("path")
        .attr("d", "M -11,-5 11,-5 0,13 z") // triangle pointing down
        .style("fill", d.color);
    } else {
      var blipCircle = blip
        .append("circle")
        .attr("r", 30)
        .attr("fill", d.color)
        .attr("stroke", "#000")
        .attr("stroke-width", 0.5);
    }
    blipCircle
      .transition()
      .duration(600)
      .attr("r", 30);
    // blip text
    if (config.print_layout) {
      var blip_text = config.print_layout ? d.id : d.label.match(/[a-z]/i);
      var blipText = blip
        .append("text")
        .text(blip_text)
        .attr("y", 3)
        .attr("text-anchor", "middle")
        .style("fill", "#000")
        .style("font-family", "Arial, Helvetica")
        .attr("font-size", "0")
        .style("pointer-events", "none")
        .style("user-select", "none")
        .style("font-weight", "bold");
    }
    blipText
      .transition()
      .duration(700)
      .attr("font-size", function(d) {
        return blip_text.length > 2 ? "9" : "10";
      });
  });

  // make sure that blips stay inside their segment
  function ticked() {
    blips.attr("transform", function(d) {
      return translate(d.segment.clipx(d), d.segment.clipy(d));
    });
  }

  // distribute blips, while avoiding collisions
  d3
    .forceSimulation()
    .nodes(config.entries)
    .velocityDecay(0.19) // magic number (found by experimentation)
    .force(
      "collision",
      d3
        .forceCollide()
        .radius(12)
        .strength(0.85)
    )
    .on("tick", ticked);
}
