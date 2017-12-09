(function($) {
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
  function createFilterTags(entries) {
    /*saving all array of tags */
    let tags = [];
    $.each(entries, function(index, value) {
      if (value.platform) tags = tags.concat(value.platform);
    });
    let uniqueTags = [...new Set(tags)];
    return uniqueTags;
  }
  function generatefilterTemplate(filterTags) {
    let filterOptionsBox = $("<select/>");
    $.each(filterTags, function(index, tag) {
      $(filterOptionsBox).append(
        $("<option>", {
          value: tag,
          text: tag
        })
      );
    });
    filterOptionsBox.appendTo($(".filter-box"));
  }
  $(document).ready(function() {
    $.getJSON("data")
      .done(function(data) {
        radar_visualization(data);
        text_visualization(data);
        let uniqueTags = createFilterTags(data.entries);
        generatefilterTemplate(uniqueTags);
      })
      .fail(function(jqxhr, textStatus, error) {
        var err = textStatus + ", " + error;
        console.log("Request Failed: " + err);
      });
  });
})(jQuery);
