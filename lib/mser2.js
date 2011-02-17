/*!
 * Maximally Stable Extremal Region - v0.1
 * Copyright 2010, Stanisław Wasiutyński
 */

(function(){
  var Mser = function(image, options){

    // Sample every x pixel od boundary
    const sample = options.sample;
    const delta  = options.delta; //15;
    const max    = options.max; //500;
    const min    = options.min; //100;
    
    // Output
    var msers = [];
    var toGray = Mser.toGray;
    // Canvas width
    var width = image.width;
    // Canvas height
    var height = image.height;
    //
    var resolution = width * height;
    // Array of image pixels
    var pix = image.data;
    // A number of bits used to store integers
    var int_size = 5; // = 2^5 = 32 bits
    var int_range = (1 << int_size) - 1
    // A binary mask of available pixels
    var accessible = Array(resolution >> int_size);
    // A heap of boundary pixels
    // A priority queue of boundary pixels, where priority is minus the gray-level
    var heap = Array(256);
    for(var j=255; j>=0; j--)
      heap[j] = [];
    // Keeps the index of first not-empty element in the heap
    var heap_head = 256;
    // 1 if stack[i] is not an empty array. Otherwise 0.
    // var heap_bitmask = Array(256/int_size);
    // A stack of components. Each entry holds: ...
    var stack = Array(); // TODO: prelocate memory
    // Dummy component
    stack.push([ 256 ]);
    // Current pixel index
    var p = 0;
    // Current pixel gray-level
    var level = toGray(pix[p], pix[p+1], pix[p+2]);
    stack.push([level, [], [0]]);

    var getNeighbor = function(i){
      switch(i){
        case 0:
          if(p > width)
            return p - width;
          break;
        case 1:
          if(p < resolution - width)
            return p + width;
          break;
        case 2:
          if(p%width < width - 1)
            return p + 1;
          break;
        default:
          if(p%width > 0)
            return p - 1;
      }
    }

    // Updates component size_function and speed_increase flag
    // Checks if given component is a mser and if so adds to global msers array
    // Returns new component
    var maybeMser = function(component){
      
      var gray          = component[0],
          pixels        = component[1],
          size_function = component[2],
          //last_speed    = component[3] || 0,
          last_mser     = component[3] || 0,
          size          = size_function[0];
          //speed, speed_increase;
      
      if(size > max) // TODO: shouldn't happen
        return component
                        
      if(size_function.length > delta){
        var extremum = size_function[delta];
        //speed = (size_function[0] - (size_function[2*delta]) || 0) // / 2*delta //extremum;
        //speed_increase = speed - last_speed > 0;
        // Determine if a relative growth rate minumum has occurred
        //if(extremum >= min && last_increase == false && true == speed_increase ){
        if(size_function[0] == extremum && extremum > min && extremum > 2*last_mser){

          //console.log(extremum, last_mser)
          // We've found MSER delta steps ego
          // Find outer boundary of the region
          // Begin with top-left pixel
          var stable_pixels = pixels

          //console.log(stable_pixels.length, extremum)
          var start = Math.min.apply(null, stable_pixels);
          // Save outer boundary as pairs of x,y
          var boundary = [];
          var i = j = 0;
          // Order of visiting neigbour pixels
          var d = [width, width+1, 1, -width+1, -width, -width-1, -1, width-1];
          // Current position
          var position = start;
          var last_pix;

          // Until full boundary is reached
          while(boundary.length < 2 || start != last_pix){
            // If pixel belongs to the region
            if(stable_pixels.indexOf(position) != -1){
              last_pix = position;
              if(j%sample == 0)
                boundary.push([last_pix%width, parseInt(last_pix/width)])
              j += 1;
              i += 6;
            } else {
              i += 1;
            }
            i = i%8;
            position = last_pix + d[i];
          }

            //var boundary = stable_pixels.map(function(p){return [p%width, parseInt( p/width )]})
          msers.push(boundary);
          last_mser = extremum;
          //size_function = []; // ... TODO: does it really help?
        }
      }
      return [gray, pixels, size_function, last_mser];
    }

    while(true){
      // Visited neighbours counter
      var i = 0;

      // Mark current pixel as accessible
      // var row = p >> int_size;
      // accessible[row] = (accessible[row] || 0) | (1 << (p & int_range) );

      // Exploring the remaining neighbours
      for(; i<4; i++){
        var neighbor = getNeighbor(i);
        if(neighbor == undefined) continue;

        var rest = neighbor & int_range; // neighbor%int_size; // pixel's column
        var row = neighbor >> int_size;  // (neighbor-rest)/int_size;
        var flags = accessible[row] || 0
          
        // Check if neighbour is accessible
        if(!(flags & (~flags | 1 << rest))){
          // Mark neighbor as accessible
          accessible[row] = flags | (1 << rest);

          var pos = neighbor << 2 // *= 4 // pixel position on the pixels array
          var gray = toGray(pix[pos], pix[pos+1], pix[pos+2]);

          if(gray < level){
            // Queue current pixel onto heap
            heap[level].push(p);
            if(level < heap_head) heap_head = level;
            // Find next pixel to consider
            i = 0;
            p = neighbor;
            level = gray;
            // Push empty component onto stack
            stack.push([level, [], [0]]);
          } else {
            // Queue neighbor onto heap
            heap[gray].push(neighbor);
            if(gray < heap_head) heap_head = gray;
          }
        }
      }
          // This is temporary!
          // TODO find out why level doesnt post p's gray-level
          var pos = p << 2 // *= 4 // pixel position on the pixels array
          level = toGray(pix[pos], pix[pos+1], pix[pos+2]);
                                      
      // Accumulate current pixel to component on top of stack
      // var c = stack[stack.length-1][1];
      // var x = p%width;
      // var y = parseInt(p/width);
      stack[stack.length-1][1].push(p) // [c[0]+1, c[1]+x, c[2]+y, c[3]+x*x, c[4]+x*y, c[5]+y*y, c[6]+level]
      p = null;
      
      // Pop heap of boundary pixels
      if(heap[heap_head].length){
        p = heap[heap_head].pop();
      } else {
        for(var j=0; j<256; j++){
          // TODO: consider `i`
          if(heap[j].length){
            p = heap[j].pop();
            heap_head = j;
            break;
          }
        }
      }

      if(p != undefined){
        var gray = heap_head;
        if(gray != level){ // Returned pixel is at the higher gray-level
          // We must process all components on the component stack until we reach the higher gray-level.
          // It is called the process stack sub routine
            
          while(true){
            var first_component = stack.pop();
            var first_component_level = first_component[0];
            var second_component_level = stack[stack.length-1][0];
            
            if(gray >= second_component_level){
              // Merge top two components on stack
              var component;
              var second_component = stack.pop();

              if(first_component[2][0] < max ){
                var raise = second_component_level - first_component_level - 1;
                while(raise--){
                  first_component[0] += 1;
                  first_component[2].unshift(first_component[1].length);
                  first_component = maybeMser(first_component)
                }
              }

              if(first_component[2][0] < max && second_component[2][0] < max){

                // Larger region wins
                var bigger, smaller;
                if(first_component[1].length > second_component[1].length){
                  bigger = first_component;
                  smaller = second_component;
                } else {
                  bigger = second_component;
                  smaller = first_component;
                }

                // TODO rename bigger
                bigger[0] = second_component_level; // Gray-level
                //bigger[2] = bigger[2].concat([bigger[1].length + smaller[1].length]); // Size function
                var b = bigger[2].length

                  if(b == 1) // TODO wtf?
                    bigger[2] = [bigger[2][0]]
                  else
                    bigger[2] = Array.apply(null, bigger[2]) // clone

                bigger[2].unshift(bigger[1].length + smaller[1].length)
                bigger[1] = bigger[1].concat(smaller[1])

                component = bigger // maybeMser(bigger);
              } else {
                // We are removing pixels from region which is too big to be interesting
                component = [second_component_level, [], [max+1]]
              }
              level = second_component_level;
              stack.push(component);

//              var region = isMser(bigger[2], bigger[3], bigger[4])
//              if(region[0])
//                msers.push(bigger[1])
//
//              // Push merged component onto the stack
//              stack.push([level, first_component[1].map(function(sum,i){return sum+second_component[1][i]}), size, region[1], region[2]]);
              if(gray <= level)
                break;
            } else {
              // The new pixel is at a gray-level for which there is not yet a component instantiated
              // Let the top of stack be on `gray` level
              if(first_component[2][0] <= max){
                var raise = gray - level;
                //if(raise > 0){
                  while(raise--){
                    first_component[0] += 1;
                    first_component[2].unshift(first_component[2][0]);
                  }
                  first_component = maybeMser(first_component); // TODO: if raise > 0 maybe?
                //}

                stack.push(first_component);
              } else {
                stack.push([gray, [], [max+1]])
              } 
              level = gray;
              break;
            }
          }
        }
      } else {
        // End if there is no more boundary pixels
        return msers;
      }
    }
  }

  // Converts RGB color to gray-scale
  Mser.toGray = function(r,g,b){
    // return parseInt(0.3*r + 0.59*g + 0.11*b);
    return (r >> 2) + (g >> 1) + (b >> 2)
  }

  // Expose
  window.Mser = Mser;
})();
