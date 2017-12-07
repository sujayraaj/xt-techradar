function text_visualization(config) {
  $(".title").html(config.title);
  /* Rings */
  let ringsContainer = $("<div/>", { class: "rings-container" }).appendTo(
    $(".title")
  );
  for (let ring = 0; ring < config.rings.length; ring++) {
    let quadTitle = $("<span/>", {
      class: "ring-title",
      html: config.rings[ring].name
    });
    let ringDiv = $("<ul/>", {
      class: "ring",
      "data-ring": ring,
      html: quadTitle
    }).appendTo(ringsContainer);
  }
  /* Quadrants */
  let quadContainer = $("<div/>", { class: "quad-container" });
  for (let quad = 0; quad < config.quadrants.length; quad++) {
    let quadTitle = $("<span/>", {
      class: "quad-title",
      html: config.quadrants[quad].name
    });
    let quadDiv = $("<div/>", {
      class: "quad",
      "data-quad": quad,
      html: quadTitle
    }).appendTo(quadContainer);
  }
  $("#textual-data").html(quadContainer);
  $(".quad").append(ringsContainer);
  $.each(config.entries, function(index, entry) {
    let quadNumber = entry.quadrant,
      ringNumber = entry.ring,
      ringData = $("<li/>", { html: entry.label });
    $(".quad-container")
      .find("[data-quad='" + quadNumber + "']")
      .find("[data-ring='" + ringNumber + "']")
      .append(ringData);
  });
}

$(document).ready(function() {
  $.getJSON("data")
    .done(function(config) {
      radar_visualization(config);
      text_visualization(config);
    })
    .fail(function(jqxhr, textStatus, error) {
      var err = textStatus + ", " + error;
      console.log("Request Failed: " + err);
    });
});
