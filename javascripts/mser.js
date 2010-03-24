
var canvas = document.getElementById("canvas")

var width = canvas.width
var height = canvas.height
var resolution = width*height

var img = new Image(width, height)
img.addEventListener('load', mser, false)
img.src = "images/ogorek.jpg"

// MSER parameters
var delta = 150

function mser() {

  // Get the CanvasPixelArray from the given coordinates and dimensions.
  var context = canvas.getContext('2d')
  context.drawImage(img, 0, 0)
try{
  var imgd = context.getImageData(0, 0, width, height)
}catch(e){

  netscape.security.PrivilegeManager.enablePrivilege("UniversalBrowserRead")
  var imgd = context.getImageData(0, 0, width, height)
}

  var pix = imgd.data

  var hist = []

  // Intensity table
//  for(var i=0; i<256; i++){
//    hist[i] = []
//  }

  var i=256
  do {
    hist.push([])
  } while(--i)

  var i=resolution-1
  do {
    var j=i*4
    hist[ 255 - parseInt((pix[j] + pix[j+1] + pix[j+2]) / 3) ].push(i)
  } while(--i)

  // Every pixel has a value which indicates region to which pixel belongs to (or size of region if pixel is a reference of region)
  var regionMap = []
  regionMap.length = resolution

  // Hash of all regions on the image
  // key is position of reference pixel, value is size in steps i-2, i-1 and i as well as boolean value indicate whether the speed of growth is increasing or decreasing
  // eg. {50: [[10,14,19], true], 165: [[20,20,21], false], ...}
  var regions = {}

  // Maximally stable extremal regions
  // key is position of reference pixel, value is size of region when it was maximally stable
  var mser = {}

  // Remember too big regions in order to stop them from growing
  var too_big = {}

  function find_reference_point(id){
    while(regionMap[id] > 0){
      id = regionMap[id]
    }
    return id
  } 

  // Iterate over 255 intensity levels
  var i=255
  do {

    // Iterate over each pixel at current intensity level i
    var j = hist[i].length
    do {
      var p = hist[i][j-1]

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
            var parent_id = find_reference_point(neighbour)

if(mser[parent_id] == undefined && too_big[parent_id] == undefined){
              // merge two regions
              if(pixel > 0){
                // Unless both pixels already belong to the same region
                if(parent_id != reference_point_id){
                
                  var a = regionMap[parent_id]
                  var b = regionMap[reference_point_id]
                  // Merge smaller region into bigger one
                  if(a < b){
                    regionMap[parent_id] += (b - 1)
                    regionMap[reference_point_id] = parent_id
                    reference_point_id = parent_id
                  } else {
                    regionMap[reference_point_id] += (a - 1)
                    regionMap[parent_id] = reference_point_id
                  }
                }

              // add 1 pixel to region
              } else {
                regionMap[p] =  neighbour
                regionMap[parent_id] -= 1
                reference_point_id = parent_id
if(!regions[parent_id] && too_big[parent_id] == undefined) regions[parent_id] = [[0,0,0], false]
              }
}

          // Merge pixel into neighbour region
          // Unless neighbour region is stable
          } else if(pixel < 1) {
if(mser[n] == undefined && too_big[n] == undefined){
            regionMap[p] = reference_point_id = n
            regionMap[n] -= 1
            if(!regions[n] && too_big[n] == undefined) regions[n] = [[0,0,0], false]
}
          // Merge neighbour into pixel region
          } else if(n != reference_point_id) {
            regionMap[n]  = reference_point_id
            regionMap[reference_point_id] -= 1
if(!regions[reference_point_id] && too_big[reference_point_id] == undefined) regions[reference_point_id] = [[0,0,0], false]
          }
        }
      } while(--l && mser[reference_point_id] == undefined && too_big[reference_point_id] == undefined )

    } while(--j)

      // Szukaj lokalnych minimów i maksimów funkcji prędkości wzrostu regionów
      $.each(regions, function(key, value){

        var size = 1 - regionMap[key]
        if(size < 0)
          size = 0

if(size > 400){
  too_big[key] = true
  delete regions[key]
} else {

        var size_history = value[0]

        var speed = (size_history[2] - size_history[0]) / size_history[1]
        var new_speed = (size - size_history[1]) / size_history[2]
        var speed_increase = (new_speed - speed > 0)

var maximum = size_history[2]

        if(i < 255 - delta && maximum > 10){

          if(value[1] != speed_increase){
            mser[key] = maximum
          }
        }

        if( size == 0 )
          delete regions[key]
        else
          regions[key] = [[size_history[1], size_history[2], size],speed_increase]

}
      })

  } while(i--)


console.log(regions)
console.log(mser)

  // Draw the ImageData at the given (x,y) coordinates.

  var regions = document.getElementById("mser")
  var regions_context = regions.getContext('2d')
  var canvasData = regions_context.createImageData(width, height)

  $.each(mser, function(key, value){

    var i = key*4
    canvasData.data[i] = 255
    canvasData.data[i+1] = 0
    canvasData.data[i+2] = 0
    canvasData.data[i+3] = 255

  })
  regions_context.putImageData(canvasData, 0, 0)


  var regions = document.getElementById("regions")
  var regions_context = regions.getContext('2d')
  var canvasData = regions_context.createImageData(width, height)

  for (var x = 0; x < canvasData.width; x++) {
    for (var y = 0; y < canvasData.height; y++) {
      // Index of the pixel in the array
      var idx = (x + y * width) * 4

      var r,g,b
      var val = regionMap[x+y * width]

      if(val > 0) {
        var gray = parseInt( val * ( 0xffffff / (width*height) ) )
        r = (gray & 0xff0000) >> 16
        g = (gray & 0x00ff00) >> 8
        b = gray & 0x0000ff
      } else if(val < 0) {
        r = 255
        g = 255
        b = 255
      } else {
        r = 0
        g = 0
        b = 0
      }
        
      canvasData.data[idx + 0] = r
      canvasData.data[idx + 1] = g
      canvasData.data[idx + 2] = b
      canvasData.data[idx + 3] = 255

    }
  }

  regions_context.putImageData(canvasData, 0, 0)

}

function benchmark(){

  var currentTime = (new Date()).getTime()
  for(var i=0; i<30; i++){
    mser()
  }
  console.log( ((new Date()).getTime() - currentTime) / 30 )
}

