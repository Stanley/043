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

    while(ai--){
      arr[ai] = {};
      bi = collumns;
      while(bi--){
        var ratio = ISMatch.match(a[ai][0], b[bi][0]);
        if(ratio != null)
          arr[ai][ratio] = bi;
      }
    }

    var ai = rows;
    var matched = []; // which region fits best. 

    // For each row
    while(ai--){
      var keys = Object.keys(arr[ai]).sort();
      arr[ai] = keys.map(function(key){return arr[ai][key]})
      var bi = arr[ai][0]; // index of b array: best match for ai region
      var ix = ai;
      if(bi == undefined) continue;
      //console.log("bi: "+bi)
      while(true){
        if(matched[bi] == ix){ // Doesn't happen TODO: remove
          console.log("???")
          break
        } else if(matched[bi] != null){
        // There is already region x matching the same region y
          //console.log("konflikt ("+bi+": jest "+matched[bi]+", a chce być "+ix+")")
          // Choose better fit for collumn
          var match_to = b[bi].length; // TODO
          var better;
          var worst;
          if(Math.abs(match_to - a[ix].length) > Math.abs(match_to - a[matched[bi]].length)){
            // Previous region is better
            better = matched[bi];
            worst = ix;
          } else {
            // Current region is better
            worst = matched[bi];
            better = ix; 

            matched[bi] = ix;
            ix = worst;
            //console.log(ix)
          }

          // Choose second best fit for lost row
          arr[worst].shift();
          bi = arr[worst][0];

          if(bi == undefined)
            break
        } else {
          matched[bi] = ix;
          break;
        }
      }
    }

    //console.log(matched)
    return matched.map(function(j,i){return [ b[i][1][0], b[i][1][1], a[j][1][0], a[j][1][1]]})

    // var i = descriptors.length;
    // var min = options.min;
    // var position;
    // // For each match candidate
    // while(i--){
    //   var score = ISMatch.match(descriptor[0], descriptors[i][0]);
    //   if(score && min > score){
    //     min = score;
    //     position = descriptors[i][1];
    //   }
    // }
    // //console.log(min)
    // return position;
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

    // Do not compare regions with too big size difference
    if(2*m < n) return null;

    var k, min = Infinity;

    // For each diagonal element
    while(i--){
      var sum = 0;
      var width = m;

      //var canvas = document.createElement('canvas');
      //canvas.height = m;
      //canvas.width = m;
      //var image_context = canvas.getContext('2d');
      //var regionsData = image_context.getImageData(0, 0, m, m);
      //var d = regionsData.data;
      //var di = 0;

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

          var diff = Math.abs(aa - an);
          sum += diff;


          // debugger
          // The smaller difference the whiter color
          //var val = 255-diff/Math.PI*255;
          //d[di] = val;
          //d[di+1] = val;
          //d[di+2] = val;
          //d[di+3] = 255;
          //di += 4;
        }
      }

      sum /= m*m;
      //debugger

      if(min > sum){
        min = sum;
        k = i;
      }

      // console.log(sum);
      //image_context.putImageData(regionsData, 0, 0);
      //var li = $(document.createElement('li'));
      //var v = $(document.createElement('span'))
      //v.text(sum)
      //li.append(canvas);
      //li.append(v);
      //$("#desc").append(li);
    }
    //var hr = $(document.createElement('hr'))
    //$("#desc").append(hr);

    return min;
  }
  
  // Takes array of sampled contour points
  // Returns chord angle based descriprion
  ISMatch.describe = function(region){
    const delta = 4;

    var points = i = region.length;
    var matrix = Array(Math.pow(points,2));

    //var canvas = document.createElement('canvas');
    //canvas.height = i;
    //canvas.width = i;
    //var image_context = canvas.getContext('2d');
    //var regionsData = image_context.getImageData(0, 0, i, i);
    //var d = regionsData.data;
    //var di = 4*i*i-4;

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

          var x1 = pj[0]; //pj%width;
          try{
            var x3 = pjd[0]; //pjd%width;
          } catch(e){
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
          //var ang = cos > -1 ? cos < 1 ? Math.acos(cos) : 0 : Math.PI
          var ang = cos > -1 ? (cos < 1 ? cos : 1) : -1

          if(isNaN(ang))
            debugger
          matrix[row+j] = ang;
        }

        //var val = (matrix[row+j]+1/2)*255;
        //d[di] = val;
        //d[di+1] = val;
        //d[di+2] = val;
        //d[di+3] = 255;
        //di -= 4;
      }
    }

    //image_context.putImageData(regionsData, 0, 0);
    //var li = $(document.createElement('li'));
    //li.addClass("descriptor")
    //li.append(canvas);
    //$("#desc").append(li);
      
    return [matrix, region[0]];
  }

  // Expose
  window.ISMatch = ISMatch;
})();
