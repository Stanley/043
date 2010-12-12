/*
 * IS-Match - Integral Shape Match
 * Copyright 2010, Stanisław Wasiutyński
 */

(function(){
  
  var ISMatch = function(descriptor, descriptors, options){
    var i = descriptors.length;
    var min = options.min;
    var position;
    while(i--){
      var score = ISMatch.match(descriptor[0], descriptors[i][0]);
      if(min > score){
        min = score;
        position = descriptors[i][1];
      }
    }
    return position;
  }
  
  // Takes to arrays of regions' chord angle based descriprion
  // Returns score (the smaller the more simillar two regions are)
  ISMatch.match = function(descr_a, descr_b){
    var a1, a2; // A1(smaller) - M x M; A2(bigger) = N x N; M <= N

    if(descr_a.length > descr_b.length){
      a1 = descr_b;
      a2 = descr_a;
    } else {
      a1 = descr_a;
      a2 = descr_b;
    }

    var i = n = Math.sqrt(a2.length);
    var m = Math.sqrt(a1.length);
    var k, min = Infinity;

    // For each diagonal element
    while(i--){
      var sum = 0;
      var width = m;
      while(width--){
        var height = m;
        while(height--){
          var aa = a1[height*m+width];
          var an // = a2[height*n+width+i];
          if(i+height < n){
            if(i+width < n){ // II
              //sum += Math.abs(a1[height*m+width%n] - an)
              an = a2[(height+i)*n+width+i];
            } else { // I
              //sum += Math.abs(a1[height*m+width] - an)
              an = a2[(height+i)*n+(width+i)%n];
            }
          } else { 
            if(i+width < n){ // III
              //sum += Math.abs(a1[(height%n)*m+width] - an)
              an = a2[((height+i)%n)*n+width+i];
            } else { // IV
              //sum += Math.abs(a1[(height%n)*m+width%n] - an)
              an = a2[((height+i)%n)*n+(width+i)%n];
            }
          }
          sum += Math.abs(aa - an)
        }
      }

      sum /= m*m;
      if(min > sum){
        min = sum;
        k = i;
      }
    }
    return min;
  }
  
  // Takes array of sampled contour points
  // Returns chord angle based descriprion
  ISMatch.describe = function(region){
    const delta = 4;

    var points = i = region.length;
    var matrix = Array(Math.pow(points,2));

    // Each point of sampled contour
    while(i--){
      var j = points;
      var row = i*points;
      var point = region[i];
      // P[i][x]
      var x2 = point[0];
      // P[i][y]
      var y2 = point[1];
      // Each point of sampled contour
      while(j--){
        if(i == j || j == delta){
          matrix[row+j] = 0;
        } else {

          var pj = region[j];
          var pjd;
          if(j < delta) {
            pjd = region[points+j-delta-1];
          } else {
            pjd = region[j-delta];
          }

          var x1 = pj[0]; //pj%width;
          var x3 = pjd[0]; //pjd%width;
          // P[i][x] - P[j][x]
          var xa = x2 - x1;
          // P[j-delta][x] - P[j][x]
          var xb = x3 - x1;

          // P[j][y]
          var y1 = pj[1]; //parseInt(pj/width);
          // P[j-delta][y]
          var y3 = pjd[1]; //parseInt(pjd/width);
          
          var ya = y2 - y1;
          var yb = y3 - y1;

          var a = Math.sqrt(Math.pow(xa, 2) + Math.pow(ya, 2))
          var b = Math.sqrt(Math.pow(xb, 2) + Math.pow(yb, 2))

          // TODO: problem with rounding
          //matrix[row+j] = (a*b==0 ? 0 : ( xa*xb + ya*yb ) / (a*b)) + 1; // a*b==0 ? Math.acos(0) : Math.acos(( xa*xb + ya*yb ) / (a*b));

          if(a*b == 0){
            matrix[row+j] = -Math.PI;
          } else {

            var ang;
            var cos = ( xa*xb + ya*yb ) / (a*b);
            var sin = ( xa*yb + xa*yb ) / (a*b);

            if(cos > 1) cos = 1;
            if(cos < -1) cos = -1;
            if(sin > 1) sin = 1;
            if(sin < -1) sin = -1;

            if(sin > 0){
              if(cos > 0){ // I
                ang = Math.acos(cos);
              } else { // II
                ang = Math.acos(cos);
              }
            } else {
              if(cos > 0){ // IV
                ang = Math.sin(sin) + Math.PI/2;
              } else { // III
                ang = Math.sin(sin) + Math.PI/2;
              }
            }

            matrix[row+j] = ang - Math.PI;
          }

          if(isNaN(matrix[row+j]))
            debugger
        }
      }
    }
    return [matrix, region[0]];
  }

  // Expose
  window.ISMatch = ISMatch;
})();
