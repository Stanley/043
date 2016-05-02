"use strict";

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
      sample = parseInt($("#sample").attr("value")),
      descriptor_delta = parseInt($("#descriptor_delta").attr("value")),
      threshold = parseInt($("#threshold").attr("value"));

  $("#imgs").empty()

  var previous_descriptors;
  var previous; // first point of the contour of previous region

  for(var i=1; i<3; i++){

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

        // Epipolar lines canvas
        var epipolarConetext = [];
        var epipolar = [
          document.createElement('canvas'),
          document.createElement('canvas')
        ];
        epipolar.forEach(function(e){
          e.height = canvas.height;
          e.width = canvas.width;
          var c = e.getContext('2d');
          c.strokeStyle = "rgba(0,0,255,1)";
          c.beginPath();
          epipolarConetext.push(c);
        })

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
        console.profile("ismatch");

        var current_descriptors = mser.map(function(m){return ISMatch.describe(m, descriptor_delta)});
        var matched_pairs = [];
        if(previous_descriptors){
          matched_pairs = ISMatch(current_descriptors, previous_descriptors, {
            max: threshold,
            //debug: true
          });
        }

        previous_descriptors = current_descriptors;

        console.profileEnd("ismatch");

        // Prepare to draw regions' connections
        //var connections = document.createElement('canvas');
        //connections.height = regions.height*2;
        //connections.width = regions.width;
        //connections.style.position = "absolute";
        //connections.style.left = 0;
        //connections.style.top = -regions.height+"px";

        //var ctx = connections.getContext('2d');
        //ctx.strokeStyle = "rgba(255,0,0,0.5)"
        //ctx.beginPath();

        // For each connection
        var matched_pairs_count = matched_pairs.length;
        var pairs = Array(matched_pairs_count*3);
        var centroid_a = [0, 0], // avg. x & y of previous image
            centroid_b = [0, 0]; // avg. x & y of current image

        //while(j--){
        for(var j=0; j<matched_pairs_count; j++){
          var match = matched_pairs[j]
          if(match){
            var from, to,
                s, l, // smaller and larger regions
                shrinked; // true if current region is smaller

            if(previous[match.matches].length >= mser[match.from].length){
              l = previous[match.matches];
              s = mser[match.from];
              shrinked = true;
            } else {
              s = previous[match.matches];
              l = mser[match.from];
            }

            // Shift larger region by match.offset
            l = l.slice(match.offset).concat( l.slice(0, match.offset-1) );

            // Draw a line between two regions
            //ctx.moveTo(s[0][0], regions.height+s[0][1]);
            //ctx.lineTo(l[0][0], l[0][1]);

            //var mi = Math.floor(j/3); // matrix index

            // number of points extracted from each region
            var k = 3;
            // Step which will give us k points
            var step = Math.round(s.length/4);

            while(k--){
              // Current offset
              var pos = step*k;
              // Point from previous region first
              var pair = shrinked ? [l[pos], s[pos]] : [s[pos], l[pos]];
              pairs[j*3+k] = pair

              // Accumulate coordinates
              centroid_a[0] += pair[0][0];
              centroid_a[1] += pair[0][1];

              centroid_b[0] += pair[1][0];
              centroid_b[1] += pair[1][1];
            }
          }
        }

        var j = pairs.length;

        // Calculate centroids
       var centroids = [
          centroid_a.map(function(x){ return Math.round(x/j) }),
          centroid_b.map(function(x){ return Math.round(x/j) })
        ];

        // Find avg. distance from centroid on both pictures
        var distance = [0, 0];
        // Normalize coordinates
        while(j--){
          var hypot = function(x,y){ return Math.sqrt(x*x + y*y) || 0 }
          var pair = pairs[j].map(function(point, k){ return [point[0]-centroids[k][0], point[1]-centroids[k][1]] });

          // Accumulate distances
          distance = distance.map(function(sum, k){ return sum + hypot.apply(this, pair[k]) });
        }

        var j = pairs.length;
        pairs.shuffle();
        distance = distance.map(function(x){ return Math.round(x/j) });

        // Build fundamental matrix
        // 9 matching points are required (from 3 region pairs)
        var eigenvectors = [];
        var rows = 8;
        j = Math.floor( j/rows );
        while(j--){

          // Calculate fundamental matrix from `rows` points
          var k = rows;
          var arr = [];
          while(k--){
            // Choose random pair
            var pair = pairs[j*rows + k];
            // Coordinates of two corresponing points
            var u1 = pair[0][0]/distance[0],
                v1 = pair[0][1]/distance[0],
                u2 = pair[1][0]/distance[1],
                v2 = pair[1][1]/distance[1];

            arr[k] = [u1*u2, u1*v2, u1, v1*u2, v1*v2, v1, u2, v2, 1];
          }
          
          var matrix = new Matrix(arr);
          eigenvectors.push(matrix.t().x(matrix).eigenvector())
        }

        // Draw one epipolar line per each Fx
        eigenvectors.forEach(function(v){

          // Fundamental matrix Fx
          var f = new Matrix([
            [v[0],v[1],v[2]],
            [v[3],v[4],v[5]],
            [v[6],v[7],v[8]]
          ]);

          var canvas2 = document.createElement('canvas')
          canvas2.height = canvas.height
          canvas2.width = canvas.width

          var image_context = canvas2.getContext('2d');
          var data = image_context.createImageData(canvas2.width, canvas2.height);
          var d = data.data;

          // Points of interest to be transformed with Fx (both images)
          var images_points = [[],[]]; // TODO WTF?? OMG?! WHY? FYI
          
          images_points.forEach(function(points, k){
            pairs.forEach(function(pair){
              
              var u = new Matrix([ [pair[k][0]/distance[0], pair[k][1]/distance[0], 1] ]) // point before
              var p = f.x(u.t()) // and after transition

              var x = Math.round(p.arr[0][0]*distance[0] + centroids[0][0] ),
                  y = Math.round(p.arr[1][0]*distance[0] + centroids[0][1] ) 

              points.push([x,y]);

              //var pos = (x + y*canvas2.width) << 2;
              //d[pos] = 0
              //d[pos+1] = 0
              //d[pos+2] = 0
              //d[pos+3] = 255
            })

            // Find best fit for transformed points
            var model = (new Ransac(points).best_model);
            if(model){
              // Draw polyline
              epipolarConetext[k].moveTo(0, model[0]);
              epipolarConetext[k].lineTo(canvas.width, model[0] + model[1]*canvas.width );
            }
          });

          image_context.putImageData(data, 0, 0)
        })

        previous = mser;

        regionsConetext.putImageData(regionsData, 0, 0)
        li.append(regions)
        imgs.append(li)

        epipolar.forEach(function(e,k){
          epipolarConetext[k].stroke();
          li.append(e);
        })
      })
      .attr('src', 'images/'+set+'/'+res+'/img'+i+'.png')
  }
}

$(document).ready(function() {
  $("#step1").click(function(){
    main()
  })
})
