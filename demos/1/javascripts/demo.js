var imgs = $('#imgs');
var features = [];

// MSER parameters
var delta,
    minimum, // The smallest mser
    maximum; // The biggest mser

function main(){

  delta = parseInt($("#delta").attr("value"))
  minimum = parseInt($("#min").attr("value"))
  maximum = parseInt($("#max").attr("value"))
  set = $("#set").attr("value")
  res = $("#res").attr("value")
  $("#imgs").empty()

  var previous_descriptors = [];

  for(var i=1; i<7; i++){

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
        var mser = Mser(imageData, {delta: delta, min: minimum, max: maximum, sample: 5});
        // console.profileEnd()
        console.timeEnd("mser")
        console.log("Znaleziono "+mser.length+" regionów");
        //console.log(mser)

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

        var current = []

        var region_features = []
        var j = mser.length

        // while(i--){
        //   var r = mser[i]
        //   var x = parseInt(r[1]/ r[0])
        //   var y = parseInt(r[2]/ r[0])
        //   var pos = y*this.width + x << 2;

        //   d[pos] = 255;
        //   d[pos+1] = 0;
        //   d[pos+2] = 0;
        //   d[pos+3] = 255;

        //   // Ellipses
        //   var sumY =r[5] - Math.pow(r[2],2)/r[0];
        //   var sumX =r[3] - Math.pow(r[1],2)/r[0];

        //   var gamma = r[4] - r[1]*r[2]/r[0] // - x*y;
        //   var lambda_1 = (sumX + sumY)/2 + Math.sqrt(Math.pow(sumY-sumX, 2) + 4*Math.pow(gamma, 2))/2
        //   var lambda_2 = (sumX + sumY)/2 - Math.sqrt(Math.pow(sumY-sumX, 2) + 4*Math.pow(gamma, 2))/2
        //   var r1 = parseInt(Math.sqrt(4*lambda_1/r[0]));
        //   var r2 = parseInt(Math.sqrt(4*lambda_2/r[0]));

        //   current.push([x, y, r[0], r1, r2, parseInt(r[6]/r[0])])
        // }

        var descriptors = [];
        console.time("ismatch");

        var connections = document.createElement('canvas');
        connections.height = regions.height*2;
        connections.width = regions.width;
        connections.style.position = "absolute";
        connections.style.left = 0;
        connections.style.top = -regions.height+"px";

        var ctx = connections.getContext('2d');
        ctx.beginPath();

        // For each MSER
        while(j--){

          var region = mser[j];


          var descripion = ISMatch.describe(region);

          var match_to = ISMatch(descripion, previous_descriptors, {min: 0.2});

          // while(l--){
          //   var score = ISMatch(descripion, previous_descriptors[l]);
          //   if(min > score){
          //     min = score;
          //     match = [descripion, previous_descriptors[l]]
          //   }
          // }

          descriptors.push(descripion);

          // Draw a line between regions
          if(match_to){
            ctx.moveTo(match_to[0], match_to[1]);
            ctx.lineTo(mser[j][0][0], regions.height+mser[j][0][1]);
          }

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

        ctx.stroke();

        previous_descriptors = descriptors;
        console.timeEnd("ismatch")

        regionsConetext.putImageData(regionsData, 0, 0)
        li.append(regions)
        li.append(connections)
        imgs.append(li)

        features.push(current)
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
