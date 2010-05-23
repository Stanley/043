function mser(){

  var currentTime = (new Date()).getTime()

  // Get the CanvasPixelArray from the given coordinates and dimensions.
  var canvas = document.createElement('canvas')
  canvas.height = height
  canvas.width = width
  
  var li = $(document.createElement('li'))
  li.append(canvas)
  
  var context = canvas.getContext('2d')
  context.drawImage(this, 0, 0)

  var imgd = context.getImageData(0, 0, width, height)

  var pix = imgd.data
  var hist = []  

  // Intensity table
  var i=256
  do {
    hist.push([])
  } while(--i)

  var i=resolution-1
  do {
    var j=i*4
    hist[ 255 - parseInt((pix[j] + pix[j+1] + pix[j+2]) / 3) ].push(i)
  } while(i--)

  // Every pixel has a value which indicates region to which pixel belongs to (or size of region if pixel is a reference of region)
  var regionMap = []
  regionMap.length = resolution
  
  // Each pixel which belongs to region points to next pixel in region
  var roadMap = []
  roadMap.length = resolution

  // Hash of all regions on the image
  // key is position of reference pixel, value is array of sizes, speed in previous step and a boolean value indicating whether the speed of growth is increasing or decreasing
  // eg. {50: [[...], 4, true], 165: [[...], 7, false], ...}
  // region[4] pointer to the newest pixel in the region
  var regions = {}

  // Maximally stable extremal regions
  // key is position of reference pixel, value is size of region when it was maximally stable
  var mser = {}

  // Remember too big regions in order to stop them from growing
  // var too_big = {} 

  // Iterate over 255 intensity levels
  var i=255
  do {

    // Iterate over each pixel at current intensity level i
    var j = hist[i].length

    while(j--) {
      var p = hist[i][j]

      // place pixel on the map
      regionMap[p] = 0
      // Pixel root
      var reference_point_id

      var neighbours = []
      var column = p%width
      // Find all neighbours (from 2 to 4)
      if(p >= width){ neighbours.push(p-width) }
      if(column != width-1){ neighbours.push(p+1) }
      if(p+width < resolution){ neighbours.push(p+width) }
      if(column != 0){ neighbours.push(p-1) }
      
      var l = neighbours.length
      do {
        var n = neighbours[l-1]
        var neighbour = regionMap[n]
        // Only if neighbour is placed in region map 
        if(neighbour != undefined ){
        
          var pixel = regionMap[p]

          // Region member
          if(neighbour > 0){
            // A reference of region, neighbour belongs to
            var parent_id = regionMap.find_reference_point(neighbour)

            // Add pixel to neighbour's region
            if(pixel == 0){
              if(regionMap.add(p, parent_id) != false){
                reference_point_id = parent_id

                roadMap[regions[parent_id][3]] = p
                regions[parent_id][3] = p
              }              
            // Merge regions
            // Unless both points belongs to the same region
            } else if(parent_id != reference_point_id) {

              var slave
              var master = regionMap.merge(parent_id, reference_point_id)

              if(master != reference_point_id){
              
                slave = reference_point_id
                reference_point_id = parent_id

              } else {
                slave = parent_id                                                  
              }

              roadMap[regions[master][3]] = slave
              regions[master][3] = regions[slave][3]

              delete regions[slave]
            }

          // Merge pixel (==0) into neighbour region
          // n <= 0, pixel == 0
          } else if(pixel < 1) {
          
            if(pixel < 0) console.log("OMG!")

            if(regionMap.add(p, n) != false){
              reference_point_id = n
              if(regions[n] == undefined){
                regions[n] = [[1], 0, true, p]
                roadMap[n] = p               
              } else {
                roadMap[regions[n][3]] = p
                regions[n][3] = p
              }
            }              

          // Merge neighbour into pixel region
          // Unless neighbour belongs to the same region
          // n < 1, pixel > 0
          } else if(n != reference_point_id) {

            var slave
            var master = regionMap.merge(n, reference_point_id)                       

                            
            if(master != reference_point_id){
              slave = reference_point_id
              reference_point_id = n                
              if(regions[n] == undefined){
                regions[n] = [[1], 0, true, p]
                roadMap[n] = p
              }

            } else {
              slave = n
            }
              
            roadMap[regions[master][3]] = slave

            if(regions[slave] == undefined)
              regions[master][3] = slave
            else
              regions[master][3] = regions[slave][3]

            delete regions[slave]

          }
        }
      } while(--l)
    }
    

    // Szukaj lokalnych ekstremów funkcji prędkości wzrostu regionów
    $.each(regions, function(key, value){
      
      // Pixels in region
      var size = 1 - regionMap[key]
      if(size < 0){
        throw "negative size?" 
      }

      if(size < maximum) {

        var size_function = value[0]
        var last_speed = value[1]        
        var speed = last_speed
        var speed_increase = null

        // We're checking if region at j-th step was stable
        var j2 = size_function.length - (delta+1)

        // We must be at least at 2*delta+1 step        
        // update speed
        if(j2 == delta){
          var extremum = size_function[j2]
          speed = (size_function[j2+delta] - size_function[j2-delta]) / extremum         
          speed_increase = (speed - last_speed > 0)

          // If region is big enougth to be meaningful
          if(extremum > minimum){
            // if extremum is acutally "extremum"
            if(value[2] != null && value[2] != speed_increase){
              // Remember that key is mser at the size of extremum
              mser[key] = extremum              
            }
          }
          // We are not going to need this value any more
          size_function.shift()
        }
        // Remember new size
        size_function.push(size)
        regions[key] = [ size_function, speed, speed_increase, value[3] ]
      }
    })
  } while(i--)

//  $("#time"+this.rel).text( (new Date()).getTime() - currentTime )
  //$("#count"+this.rel).text( Object.size(mser) )
  
  var info = $(document.createElement('div'))
  info.addClass("info")
  info.html("<b>" + Object.size(mser) + "</b> obszarów mser. Czasy:<br />znalezienia: " + ((new Date()).getTime() - currentTime) + " ms (?? ms)<br />neutralizacji: ?? ms (?? ms)<br /><span class='sum'>+ ?? ms (?? ms)</span>" )

  imgs.append(li.append(info))

  // console.log(mser)

  // Draw the ImageData at the given (x,y) coordinates.

  var layers = document.createElement('div')
  layers.className = 'layers'

  var regions = document.createElement('canvas')
  regions.height = height
  regions.width = width
  
  var regions_context = regions.getContext('2d')
  var canvasData = regions_context.createImageData(width, height)

  $.each(mser, function(key, size){

    var pos = key
//    var regionSize = 1 - regionMap[regionMap.find_reference_point(key)]

    while(size--){

//      if(roadMap[pix] == pix || roadMap[pix] == undefined) throw "RoadMap error"

      var i = pos*4
      var gray = parseInt( key * ( 0xffffff / (resolution) ) )
      r = (gray & 0xff0000) >> 16
      g = (gray & 0x00ff00) >> 8
      b = gray & 0x0000ff
      
      canvasData.data[i] = r
      canvasData.data[i+1] = g
      canvasData.data[i+2] = b
      canvasData.data[i+3] = 255
      
      pos = roadMap[pos]
    }
  })
  regions_context.putImageData(canvasData, 0, 0)
  $(layers).append(regions)
  
  // Ellipses
  var ellipses = document.createElement('canvas')
  ellipses.height = height
  ellipses.width = width
  
  var regions_context = ellipses.getContext('2d')
  var canvasData = regions_context.createImageData(width, height)

  $.each(mser, function(key, size){

    // Finding center of mass
    var pos = key
    var count = size
    var x_sum = 0, y_sum = 0

    while(count--){
      
      x_sum += pos%width
      y_sum += Math.floor(pos/width)
                  
      pos = roadMap[pos]
    }
    
    var x = Math.round(x_sum / size)
    var y = Math.round(y_sum / size)
    
    var i = 4*(x + y*width)
    canvasData.data[i]   = 255
    canvasData.data[i+1] = 0
    canvasData.data[i+2] = 0
    canvasData.data[i+3] = 255
    
    // Ellipse semi-major and semi-minor axis
    var pos = key
    var count = size
    var a11 = 0, a21 = 0, a22 = 0

    while(count--){
      a11 += Math.pow(Math.floor(pos/width) - y, 2)
      a22 += Math.pow(pos%width - x, 2)
      a21 += (Math.floor(pos/width) - y)*(pos%width - x)
      
      pos = roadMap[pos]
    }

    a11 /= size
    a21 /= size
    a22 /= size

//   console.log([a11,a22,a21])

    var d1 = 2*Math.round( Math.sqrt( (a11+a22) / 2 + Math.sqrt(Math.pow(a11-a22,2) + 4*a21*a21 )/2) )            //Math.round(a11)
    var d2 = 2*Math.round( Math.sqrt( (a11+a22) / 2 - Math.sqrt(Math.pow(a11-a22,2) + 4*a21*a21 )/2) )           //Math.round(a22 - Math.pow(l21, 2) * d1)
    
    var sin_a = Math.sqrt( Math.pow(a21,2) / (Math.pow(a21,2) + Math.pow(a22-d1,2)) )
    var cos_a = -sin_a*((a22-d1) / a21)
 
    // console.log([d1,d2], [Math.asin(_x), Math.acos(_y)])

    var beta
    
if(sin_a > 0 && cos_a > 0)
  beta = -Math.asin(Math.abs(sin_a))
else
  beta = Math.PI + Math.asin(Math.abs(sin_a))

console.log(beta)
    
    
  // Drawing ellipse  
  var steps = 360;
 
  // Angle is given by Degree Value
//  var beta = -angle * (Math.PI / 180); //(Math.PI/180) converts Degree Value into Radians

  var sinbeta = Math.sin(beta);
  var cosbeta = Math.cos(beta);
  var a = d1
  var b = d2
 
  for (var i = 0; i < 360; i += 360 / steps) 
  {
    var alpha = i * (Math.PI / 180) ;
    var sinalpha = Math.sin(alpha);
    var cosalpha = Math.cos(alpha);
 
    var X = x + (a * cosalpha * cosbeta - b * sinalpha * sinbeta);
    var Y = y + (a * cosalpha * sinbeta + b * sinalpha * cosbeta);
    
      var j = 4*(Math.round(X) + Math.round(Y)*width)
      canvasData.data[j]   = 0
      canvasData.data[j+1] = 0
      canvasData.data[j+2] = 0
      canvasData.data[j+3] = 255
    
   }
    
    
    
//    var j=i,k=i
//    while(d1--){
//      j -= 4*width
//      canvasData.data[j]   = 255
//      canvasData.data[j+1] = 0
//      canvasData.data[j+2] = 0
//      canvasData.data[j+3] = 255
//      
//      k += 4*width
//      canvasData.data[k]   = 255
//      canvasData.data[k+1] = 0
//      canvasData.data[k+2] = 0
//      canvasData.data[k+3] = 255      
//    }
//    
//    var j=i,k=i
//    while(d2--){
//      j += 4
//      canvasData.data[j]   = 255
//      canvasData.data[j+1] = 0
//      canvasData.data[j+2] = 0
//      canvasData.data[j+3] = 255
//      
//      k -= 4
//      canvasData.data[k]   = 255
//      canvasData.data[k+1] = 0
//      canvasData.data[k+2] = 0
//      canvasData.data[k+3] = 255
//    }    
    
    //console.log([d1, d2], l21)    
  }) 
  
  regions_context.putImageData(canvasData, 0, 0)  
  $(layers).append(ellipses)
  li.append(layers)
}
