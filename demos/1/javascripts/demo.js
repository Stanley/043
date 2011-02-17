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
          matched_pairs = ISMatch(current_descriptors, previous_descriptors, {
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

        // Build fundamental matrix
        // 9 matching points are required (from 3 region pairs)
        var eigenvectors = [];
        var arr = [];
        var pairs = [];

        // For each connection
        //while(j--){
        var matched_pairs_count = matched_pairs.length
        for(var j=0; j<matched_pairs_count; j++){
          var match = matched_pairs[j]
          if(match){
            var from;
            var to;

            var s,l; // smaller and larger regions

            if(previous[match.matches].length >= mser[match.from].length){
              from = previous[match.matches][match.offset];
              to = mser[match.from][0];

              l = previous[match.matches];
              s = mser[match.from];
            } else {
              from = previous[match.matches][0];
              to = mser[match.from][match.offset];

              s = previous[match.matches];
              l = mser[match.from];
            }

            // Draw a line between two regions
            ctx.moveTo(from[0], from[1]-5);
            ctx.lineTo(to[0], regions.height+to[1]);

            var mi = Math.floor(j/3); // matrix index
            var start = j%3*3; // current position on the matrix
            var k = 3;

            // Step which will give us 3 points
            var step = Math.round(s.length/4);
            var bigger = l.length;

            while(k--){
              // Current offset
              var pos = step*k;

              // Coordinates of two corresponing points
              var u1 = s[pos][0],
                  v1 = s[pos][1],
                  u2 = l[( pos+match.offset )%bigger][0],
                  v2 = l[( pos+match.offset )%bigger][1];

              // Remeber this pair
              pairs.push([u1,v1,u2,v2]);

              arr[start+k] = [u1*u2, u1*v2, u1, v1*u2, v1*v2, v1, u2, v2, 1];
            }

            if(start == 6){ 
              // Matrix is complete; find FM
              console.log(arr)
              var matrix = new Matrix(arr);

              // Fundamental matrix
              console.log(JSON.stringify(matrix.t().x(matrix)))
              var fm = matrix.t().x(matrix).eigenvector()
              eigenvectors.push(fm)

              // New system of equasions
              arr = [];
            }
          }
        }

        eigenvectors.forEach(function(v){
          var f = new Matrix([
            [v[0],v[1],v[2]],
            [v[3],v[4],v[5]],
            [v[6],v[7],v[8]]
          ]);
          console.log(f.arr)

          var canvas2 = document.createElement('canvas')
          canvas2.height = canvas.height
          canvas2.width = canvas.width

          var image_context = canvas2.getContext('2d');
          var data = image_context.createImageData(canvas2.width, canvas2.height);
          var d = data.data;
          
          pairs.forEach(function(pair){
            // First image
            var u = new Matrix([ [pair[0], pair[1], 1] ]) // point before
            var p = f.x(u.t()) // and after transition

            var pos = (u.arr[0][0] + u.arr[0][1]*canvas2.width) << 2;
            d[pos] = 0
            d[pos+1] = 0
            d[pos+2] = 0
            d[pos+3] = 255

            // Second image
            var u = new Matrix([ [pair[2], pair[3], 1] ])
            var p = f.x(u.t())
          })

          image_context.putImageData(data, 0, 0)
          li.append(canvas2)
        })

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

$(document).ready(function() {
  $("#step1").click(function(){
    main()
  })
})
