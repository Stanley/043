/*
 * IS-Match - Integral Shape Match
 * Copyright 2010, Stanisław Wasiutyński
 */

(function(){
  
  // Takes two arrays of descriptors
  // Returns array of connected point pairs
  var ISMatch = function(a, b, options){

    var rows = ai = a.length;      // Number of regions on the first image
    var collumns = b.length;  // and second image
    var arr = Array(ai);
    var matched = []; // which region fits best. 

    var ai = rows;
    while(ai--){
      var bi = collumns;
      var row = Array(bi);

      while(bi--){
        var match = ISMatch.match(a[ai], b[bi], options.debug);
        if(match){
          var ratio = match.ratio;
          if(!options.max || ratio < options.max){
            match.matches = bi;
            match.from = ai;
            row[bi] = match;
          }
        }
      }
      arr[ai] = row.sort(function(x,y){return x.ratio > y.ratio});
    }

    var ai = rows;
    var rowi = Array(ai);
    while(ai--) rowi[ai] = ai;

    rowi.forEach(function(ai){
      var best;
      while(best = arr[ai].shift()){
        if(matched[best.matches]) {
          if(matched[best.matches].from == best.from){
            break;
          } else if(matched[best.matches].ratio > best.ratio){
            rowi.push( matched[best.matches].from );
            matched[best.matches] = best;
            break;
          } // else next best match
        } else {
          matched[best.matches] = best;
          break;
        }
      }
    })
    return matched.filter(function(m){return m})
  }
  
  // Takes two arrays of regions' chord angle based descriprion
  // Returns score (the smaller the more simillar two regions are)
  ISMatch.match = function(descr_a, descr_b, debug){
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

    // Do not compare regions with too big size difference
    if(2*m < n) return null;

    var k, min = Infinity;

    // For each diagonal element
    while(i--){
      var sum = 0;
      var width = m;

      if(debug){
        var canvas = document.createElement('canvas');
        canvas.height = m;
        canvas.width = m;
        var image_context = canvas.getContext('2d');
        var regionsData = image_context.getImageData(0, 0, m, m);
        var d = regionsData.data;
        var di = 0;
      }

      while(width--){
        var height = m;
        while(height--){
          var aa = a1[height*m+width];
          var an // index on a2 matrix
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

          var diff = Math.abs(aa - an);
          sum += diff < 1 ? diff : 2-diff;

          // The smaller difference the whiter color
          if(debug){
            var val = 255-(diff < 1 ? diff : 2-diff)/2*255;
            d[di] = val;
            d[di+1] = val;
            d[di+2] = val;
            d[di+3] = 255;
            di += 4;
          }
        }
      }

      sum /= m*m;

      if(min > sum){
        min = sum;
        k = i;
      }

      if(debug){
        image_context.putImageData(regionsData, 0, 0);
        var li = $(document.createElement('li'));
        var v = $(document.createElement('span'));
        v.text(sum);
        li.append(canvas);
        li.append(v);
        $("#desc").append(li);
      }
    }
    if(debug){
      var hr = $(document.createElement('hr'));
      $("#desc").append(hr);
    }

    return { ratio: min, offset: k };
  }
  
  // Takes array of sampled contour points
  // Returns chord angle based descriprion
  ISMatch.describe = function(region, delta){

    var points = i = region.length;
    var matrix = Array(Math.pow(points,2));

    var canvas = document.createElement('canvas');
    canvas.height = i;
    canvas.width = i;
    var image_context = canvas.getContext('2d');
    var regionsData = image_context.getImageData(0, 0, i, i);
    var d = regionsData.data;
    var di = 4*i*i-4;

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
        if(i == j){
          matrix[row+j] = 0;
        } else {

          var pj = region[j];
          var pjd;
          if(j < delta) {
            // Ruby's minus index
            pjd = region[points+j-delta];
          } else {
            pjd = region[j-delta];
          }

          var x1 = pj[0];
          try{
            var x3 = pjd[0];
          } catch(e){
            // happens when region is very small and sampled countour size < delta
            debugger 
            throw e
          }
          
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

          var a2 = Math.pow(xa, 2) + Math.pow(ya, 2)
          var a = Math.sqrt(a2)
          var b2 = Math.pow(xb, 2) + Math.pow(yb, 2)
          var b = Math.sqrt(b2)

          // Law of cosines
          var xc = x2 - x3;
          var yc = y2 - y3;
          var c2 = Math.pow(xc, 2) + Math.pow(yc, 2);
          var cos = (c2 - a2 - b2)/(-2*a*b)

          matrix[row+j] = cos > -1 ? (cos < 1 ? cos : 1) : -1;
        }

        var val = (matrix[row+j]+1)/2*255;
        d[di] = val;
        d[di+1] = val;
        d[di+2] = val;
        d[di+3] = 255;
        di -= 4;
      }
    }

    //image_context.putImageData(regionsData, 0, 0);
    //var li = $(document.createElement('li'));
    //li.addClass("descriptor")
    //li.append(canvas);
    //$("#desc").append(li);
      
    return matrix;
  }

  // Expose
  window.ISMatch = ISMatch;
})();
