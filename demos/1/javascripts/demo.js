var imgs = $('#imgs');
var features = [];

// MSER parameters
var delta,
    minimum, // The smallest mser
    maximum; // The biggest mser

function main(){

  var delta = parseInt($("#delta").attr("value")),
      minimum = parseInt($("#min").attr("value")),
      maximum = parseInt($("#max").attr("value")),
      set = $("#set").attr("value"),
      res = $("#res").attr("value"),
      sample = parseInt($("#sample").attr("value"))
      descriptor_delta = parseInt($("#descriptor_delta").attr("value")),
      threshold = parseInt($("#threshold").attr("value")),

  $("#imgs").empty()

  var previous_descriptors;
  var previous; // first point of the contour of previous region

  for(var i=1; i<6; i++){

    var img = new Image();
    img.rel = i;

    $(img)
      .load(function(){
        // Get the CanvasPixelArray from the given coordinates and dimensions.
        var canvas = document.createElement('canvas')
        canvas.height = this.height
        canvas.width = this.width

        var image_context = canvas.getContext('2d')
        image_context.drawImage(this, 0, 0)

        var li = $(document.createElement('li'))

        var imageData = image_context.getImageData(0, 0, this.width, this.height)

        console.time("mser")
       // console.profile()
        var mser = Mser(imageData, {delta: delta, min: minimum, max: maximum, sample: sample});
        // console.profileEnd()
        console.timeEnd("mser")
        console.log("Znaleziono "+mser.length+" regionów");

        // Draw image in black and white
        var regions = document.createElement('canvas');
        regions.height = this.height
        regions.width = this.width
        var regionsConetext = regions.getContext('2d');
        var regionsData = regionsConetext.createImageData(this.width, this.height);
        var d = regionsData.data;
        var resolution = this.width*this.height;
        var d_ = imageData.data;
        while(resolution--){
          var pos = resolution << 2;
          var p = Mser.toGray(d_[pos], d_[pos+1], d_[pos+2]) //+200;

          d[pos] = p;
          d[pos+1] = p;
          d[pos+2] = p;
          d[pos+3] = 255;
        }

        // Draw regions' sampled contours
        var j = mser.length;
        while(j--){

          var region = mser[j];
          var k = region.length;
          var red = parseInt(Math.random()*200)+56;
          var green = parseInt(Math.random()*200)+56;
          var blue = parseInt(Math.random()*200)+56;

          while(k--){
            var pos = (regions.width*region[k][1] + region[k][0]) << 2;

            d[pos] = red;
            d[pos+1] = green;
            d[pos+2] = blue;
            d[pos+3] = 255;
          }
        }

        // Find corespondences between msers
        console.time("ismatch");

        var current_descriptors = mser.map(function(m){return ISMatch.describe(m, descriptor_delta)});
        var matched_pairs = [];
        if(previous_descriptors){
          var matched_pairs = ISMatch(current_descriptors, previous_descriptors, {
            max: threshold,
            //debug: true
          });
        }

        previous_descriptors = current_descriptors;

        console.timeEnd("ismatch");

        // Prepare to draw regions' connections
        var connections = document.createElement('canvas');
        connections.height = regions.height*2;
        connections.width = regions.width;
        connections.style.position = "absolute";
        connections.style.left = 0;
        connections.style.top = -regions.height+"px";

        var ctx = connections.getContext('2d');
        ctx.strokeStyle = "rgba(255,0,0,0.5)"
        ctx.beginPath();

        var j = matched_pairs.length
        // For each connection
        while(j--){
          var match = matched_pairs[j]
            if(match){
              var from;
              var to;

              if(previous[match.matches].length > mser[match.from].length){
                from = previous[match.matches][match.offset];
                to = mser[match.from][0];
              } else {
                from = previous[match.matches][0];
                to = mser[match.from][match.offset];
              }

              // Draw a line between two regions
              ctx.moveTo(from[0], from[1]-5);
              ctx.lineTo(to[0], regions.height+to[1]);
            }
        }

        previous = mser;
        ctx.stroke();

        regionsConetext.putImageData(regionsData, 0, 0)
        li.append(regions)
        li.append(connections)
        imgs.append(li)

      })
      .attr('src', 'images/'+set+'/'+res+'/img'+i+'.png')
  }
}

function connect(){
  console.log(features)
  var i = features.length
  var previous;
  while(i--){
    var current = features[i];
    if(previous != undefined){
      var j = current.length;
      
      var connections = document.createElement('canvas');
      connections.height = 2*320;
      connections.width = 400;
      connections.style.position = "absolute";
      connections.style.left = 0;

      var ctx = connections.getContext('2d');
      ctx.beginPath();

      // Each region
      while(j--){
        var region1 = current[j]
        var k = previous.length;
        var min = 0.5;
        var matched_region;
        // Each pair
        while(k--){
          var region2 = previous[k];
          var sum = 0;
          sum += Math.abs(( region1[0] - region2[0] )/400, 2); // x
          sum += Math.abs(( region1[1] - region2[1] )/720, 2);  // y
          sum += Math.abs(( region1[2] - region2[2] )/500, 2);  // mass
          sum += Math.abs(( region1[3] - region2[3] )/20, 2);   
          sum += Math.abs(( region1[4] - region2[4] )/20, 2);
          sum += Math.abs(( region1[5] - region2[5] )/255, 2);  // illumination

          if(sum < min){
            min = sum;
            matched_region = region2;
          }
        }
        // console.log(min)
        if(min < 0.5){
          ctx.moveTo(region1[0], region1[1]);
          ctx.lineTo(matched_region[0], 320+matched_region[1]);
          console.log(min, region1, matched_region);
        }
      }
      ctx.stroke();
      console.log(ctx);
      $(imgs.find("li").get(i)).append(connections)
    }
    previous = current;
  }
}

$(document).ready(function() {
  $("#step1").click(function(){
    main()
  })

  $("#step2").click(function(){
    connect()
  })
//  $("#imgs").sortable()  
//  $("#imgs").disableSelection()
})
