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
    var int_size = 32;
    // A binary mask of avalible pixels
    var accessible = [1];
    accessible[parseInt(resolution/int_size)-1] = null;
    // A heap of boundary pixels
    // A priority queue of boundary pixels, where priority is minus the gray-level
    var heap = {};
    // Prelocate memory for each of 256 gray-levels
    for(var i=255; i>=0; i--){
      heap[i] = [];
    }
    // A stack of components. Each entry holds: ...
    var stack = [];
    // Dummy component
    stack.push([ 256 ]);
    // Current pixel index
    var p = 0;
    // Current pixel gray-level
    var level = toGray(pix[p], pix[p+1], pix[p+2]);
    stack.push([level, []]);

    while(true){
      // Visited neighbours counter
      var i = 0;

      // Exploring the remaining neighbours
      for(; i<4; i++){
        var neighbor;
        // TODO: case
        if(i==0 && p > width)
          neighbor = p - width
        else if(i==1 && p < resolution - width)
          neighbor = p + width
        else if(i==2 && parseInt(p%width) < width - 1)
          neighbor = p + 1
        else if(i==3 && parseInt(p%width) > 0)
          neighbor = p - 1
        else
          continue;

        var pos = neighbor*4 // pixel position on the pixels array
        var rest = neighbor%int_size; // pixel collumn
        var flags = accessible[parseInt(neighbor/int_size)] || 0

        // Check if neighbour is accessible
        if(!(flags & (~flags | 1 << rest))){
          // Mark neighbor as accessible
          accessible[parseInt(neighbor/int_size)] = flags | (1 << rest);

          var gray = toGray(pix[pos], pix[pos+1], pix[pos+2]);
          if(gray < level){
            // Queue current pixel onto heap
            heap[level].push(p);
            // Find next pixel to consider
            i = 0;
            p = neighbor;
            level = gray;
            // Push empty component onto stack
            stack.push([level, []]);
          } else {
            // Queue neighbor onto heap
            heap[gray].push(neighbor);
          }
        }
      }
      // Accumulate current pixel to component on top of stack
      stack[stack.length-1][1].push(p);
      p = null;
      
      // Pop heap of boundary pixels
      // TODO: fasten
      for(var j=0; j<256; j++){
        // console.log(heap[j].length)
        // TODO: consider `i`
        if(heap[j].length){
          p = heap[j].pop();
          break;
        }
      }

      if(p != null){
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
    return parseInt(0.3*r + 0.59*g + 0.11*b);
  }

  // Expose
  window.Mser = Mser;
})();
