/*!
 * Maximally Stable Extremal Region - v0.1
 * Copyright 2010, Stanisław Wasiutyński
 */

(function(){
  var Mser = function(image){

    // Configuration
    const delta = 15;
    const max = 500;
    const min = 50;
    // End of Configuration
    
    // Output
    var msers = []
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
    stack.push([level, [0,0,0,0,0,0], [0]]);

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
      if(size > max)
        return component
      
      var gray          = component[0],
          sums          = component[1],
          size_function = component[2],
          last_speed    = component[3],
          last_increase = component[4],
          speed, speed_increase;
      
      var size = sums[0];
                        
      if(size_function.length > 2*delta){
        var j2 = size_function.length - (delta+1);
        var extremum = size_function[j2];
        speed = (size_function[j2+delta] - size_function[j2-delta]) / extremum;
        if(last_speed){
          speed_increase = speed - last_speed > 0;
          // Determine if a relative growth rate minumum has occurred
          if(size >= min && last_increase != undefined && last_increase != speed_increase){
            msers.push(sums);
          }
        }
      }
      return [gray, sums, size_function, speed, speed_increase];
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
            stack.push([level, [0,0,0,0,0,0], [0]]);
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
      var c = stack[stack.length-1][1];
      var x = p%width;
      var y = parseInt(p/width);
      stack[stack.length-1][1] = [c[0]+1, c[1]+x, c[2]+y, c[3]+x*x, c[4]+x*y, c[5]+y*y]
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
            

            //

            if(gray >= second_component_level){
              // Merge top two components on stack
              var second_component = stack.pop();
              
              var raise = second_component_level - first_component_level - 1;
              //console.log([first_component[1][0], first_component[2][first_component[2].length-1] ])
              while(raise--){
                first_component[0] += 1;
                first_component[2].push(first_component[1][0]);
                first_component = maybeMser(first_component)
              }

              // Larger region wins
              var bigger, smaller;
              if(first_component[1].length > second_component[1].length){
                bigger = first_component;
                smaller = second_component;
              } else {
                bigger = second_component;
                smaller = first_component;
              }  


              level = second_component_level;
              bigger[0] = level; // Gray-level
              bigger[2] = bigger[2].concat([bigger[1][0] + smaller[1][0]]); // Size function
              bigger[1] = bigger[1].map(function(sum,i){return sum+smaller[1][i]}); // Sums

              var component = maybeMser(bigger);
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

            // CAUTION: CODE DUPLICATION
            // Add current size to size function
            // var size_function = first_component[2]
            //   var speed, speed_increase;
            // size_function.push(first_component[1][0])
            // if(size_function.length > 2*delta+1){

            //   var last_speed = first_component[3]
            //   var last_speed_increase = first_component[4]
            //   var j2 = size_function.length - (delta+1)
            //   var extremum = size_function[j2];
            //   speed = (size_function[j2+delta] - size_function[j2-delta]) / extremum;
            //   speed_increase = (speed - last_speed > 0);

            //   // Determine if a relative growth rate minumum has occurred
            //   if(first_component[1][0] >= min && first_component[1][0] <= max){
            //     if(last_speed_increase && last_speed_increase != speed_increase){
            //       msers.push(first_component[1])
            //     }
            //   }
            // }
              
              // Let the top of stack be on `gray` level
              var raise = gray - level;
              level = gray;
 //             console.log("===")
 //             console.log(first_component)
              while(raise--){
                first_component[0] += 1;
                first_component[2].push(first_component[1][0]);
                first_component = maybeMser(first_component);
              }
//              console.log(first_component)

              stack.push(first_component);
              break;
            }
          }
        }
      } else {
        // End if there is no more boundary pixels
        // TODO: filter for stable regions
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
