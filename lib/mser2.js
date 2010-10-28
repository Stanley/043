/*!
 * Maximally Stable Extremal Region - v0.1
 * Copyright 2010, Stanisław Wasiutyński
 */

(function(){
  var Mser = function(image){
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
    stack.push([level, []]);

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
            stack.push([level, []]);
          } else {
            // Queue neighbor onto heap
            heap[gray].push(neighbor);
            if(gray < heap_head) heap_head = gray;
          }
        }
      }
      // Accumulate current pixel to component on top of stack
      stack[stack.length-1][1].push(p);
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
        var gray = toGray(pix[p], pix[p+1], pix[p+2]);
        if(gray != level){ // Returned pixel is at the higher gray-level
          // We must process all components on the component stack until we reach the higher gray-level.
          // It is called the process stack sub routine
          while(true){
            var first_component = stack.pop();
            var second_component_level = stack[stack.length-2][0];
            gray = first_component[0];
            level = gray;
            if(gray >= second_component_level){
              // Merge top two components on stack
              var merged = [gray, []];
              var second_component = stack.pop();
              // Larger region wins
              if(first_component[1].length > second_component[1].length){
                merged[1] = first_component[1].concat(second_component[1]);
              } else {
                merged[1] = second_component[1].concat(first_component[1]);
              }  
              stack.push(merged);
              if(gray == second_component_level)
                break;
            } else {
              // Let the top of stack be on `gray` level
              stack.push([gray, first_component[1]]);
              break;
            }
          }
        }
      } else {
        // End if there is no more boundary pixels
        // TODO: filter for stable regions
        return stack;
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
