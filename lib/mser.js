function mser(canvas, dr_imageData, ellipses_imageData, callback){
  
  //var currentTime = (new Date()).getTime()
  
  var dr_data = dr_imageData.data
  var ellipses_data = ellipses_imageData.data
  var pix = canvas.data
  
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

  // $("#time"+this.rel).text( (new Date()).getTime() - currentTime )
  // $("#count"+this.rel).text( Object.size(mser) )

  // Draw MSERs
  $.each(mser, function(key, size){
    var pos = key
//    var regionSize = 1 - regionMap[regionMap.find_reference_point(key)]

    while(size--){

//      if(roadMap[pix] == pix || roadMap[pix] == undefined) throw "RoadMap error"

      var i = pos*4
      var gray = parseInt( key * ( 0xffffff / (resolution) ) )
      r = (gray & 0xff0000) >> 16
      g = (gray & 0x00ff00) >> 8
      b =  gray & 0x0000ff
      
      dr_data[i] = r
      dr_data[i+1] = g
      dr_data[i+2] = b
      dr_data[i+3] = 255
      
      pos = roadMap[pos]
    }
  })
  
  
//  // All neutralized regions
//  var neutral = {}
//  
//  // Each mser produces one ellipse
//  $.each(mser, function(key, size){
//return;
//
//    // Finding center of mass
//    var pos = key
//    var count = size
//    var x_sum = 0, y_sum = 0
//
//    while(count--){
//      x_sum += pos%width
//      y_sum += Math.floor(pos/width)
//
//      pos = roadMap[pos]
//    }
//
//    // Coordinates of center of the mass    
//    var x = Math.round(x_sum / size)
//    var y = Math.round(y_sum / size)
//    
//    // Ellipse semi-major and semi-minor axis
//    var pos = key
//    var count = size
//    var a11 = 0, a21 = 0, a22 = 0
//
//    while(count--){
//      a11 += Math.pow(Math.floor(pos/width) - y, 2)
//      a22 += Math.pow(pos%width - x, 2)
//      a21 += (Math.floor(pos/width) - y)*(pos%width - x)
//      
//      pos = roadMap[pos]
//    }
//
//    a11 /= size
//    a21 /= size
//    a22 /= size
//
//    // Second order algebraic moment
//    var d1 = 2*Math.round( Math.sqrt( (a11+a22) / 2 + Math.sqrt(Math.pow(a11-a22,2) + 4*a21*a21 )/2) )
//    var d2 = 2*Math.round( Math.sqrt( (a11+a22) / 2 - Math.sqrt(Math.pow(a11-a22,2) + 4*a21*a21 )/2) )
//    
//    var sin_a = Math.sqrt( Math.pow(a21,2) / (Math.pow(a21,2) + Math.pow(a22-d1,2)) )
//    var cos_a = sin_a*((a22-d1) / a21) 
//    
//    // Check if ellipse fits image boundries
//    // beta = 0, 90, 180, 270; sin_b = 0, 1, 0, -1; cos_b = 1, 0, -1, 0
//
//    // beta = 0
//    var X = x + d1*cos_a
//    var Y = y + d1*sin_a
//    
//    if(X >= width || X < 0 || Y >= height || Y < 0) {
//      return
//    }
//    
//    // b = 180
//    var X = x - d1*cos_a
//    var Y = y - d1*sin_a
//    
//    if(X >= width || X < 0 || Y >= height || Y < 0) {
//      return
//    }    
//    
//    // beta = 90
//    var X = x - d2*sin_a
//    var Y = y + d2*cos_a
//    
//    if(X >= width || X < 0 || Y >= height || Y < 0) {
//      return
//    }
//
//    // 270
//    var X = x + d2*sin_a
//    var Y = y - d2*cos_a
//    
//    if(X >= width || X < 0 || Y >= height || Y < 0) {
//      return
//    }
//    
//    // Draw red point in the center of the mass
////    var i = 4*(x + y*width)
////    ellipses_data[i]   = 255
////    ellipses_data[i+1] = 0
////    ellipses_data[i+2] = 0
////    ellipses_data[i+3] = 255
//    
//    // Draw an ellipse
//    var beta = 0
//    var steps = 72
//    var step = 360 / steps
//    
//    // Store neutralized radiuses
//    var radiuses = []
//    
//    while(steps--){
//      beta += step
//      var sin_b = Math.sin(beta)
//      var cos_b = Math.cos(beta)
//   
//      var X = Math.round(x + (d1*cos_b*cos_a - d2*sin_b*sin_a))
//      var Y = Math.round(y + (d1*cos_b*sin_a + d2*sin_b*cos_a))
//      
//      // TODO Stwórz warunek przed iteracją na podstawie półosi
////      if(X < 0 || X >= width){
////        console.log(X)
////        break
////      }      
////      if(Y < 0 || Y >= height){
////        console.log(Y)
////        break
////      }
//      
//      var j = 4*(Math.round(X) + Math.round(Y)*width)
//      ellipses_data[j]   = 0
//      ellipses_data[j+1] = 0
//      ellipses_data[j+2] = 0
//      ellipses_data[j+3] = 255
//
//      var p = X + Y*width
//
//      var Xj = X
//      var Yj = Y
//      var Xj_d, Yj_d
//      
//      if(X == x){
//      
//      
//      } else {
//      
//        if(X-x > 0)  // I or IV
//          Xj_d = 1
//        else          // II or III
//          Xj_d = -1
//        
//        
//        if( regionMap[p] == key){
//          // Increase
//          while(regionMap[Xj + Yj*width] == key) {
//            Xj += Xj_d
//            Yj = Math.round((Xj - x)/(X-x) * (Y-y)) + y
//          }
//          Xj -= Xj_d
//          Yj = Math.round((Xj - x)/(X-x) * (Y-y)) + y
//          
//        } else {
//          // Decrease
//          while(((Xj-x)*Xj_d>0) && (regionMap[Xj + Yj*width] != key)) {
//            Xj -= Xj_d
//            Yj = Math.round((Xj - x)/(X-x) * (Y-y) + y)
//          }
//        }
//      }
//      
//      var j = 4*(Xj + Yj*width)
//      ellipses_data[j]   = 255
//      ellipses_data[j+1] = 0
//      ellipses_data[j+2] = 0
//      ellipses_data[j+3] = 255
//
////      radiuses.push(Math.sqrt(Math.pow(x-Xj,2) + Math.pow(y-Yj,2)))
//    }
//
//    neutral[key] = radiuses
//    
//  })
  
  //console.log(neutral)

  callback(dr_imageData, ellipses_imageData)   
}
