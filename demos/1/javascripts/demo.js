var width = 400 //canvas.width
var height = 320 //canvas.height
var resolution = width*height
var imgs = $('#imgs')

// MSER parameters
var delta,
    minimum, // The smallest mser
    maximum; // The biggest mser

function main(){

  delta = parseInt($("#delta").attr("value"))
  minimum = parseInt($("#min").attr("value"))
  maximum = parseInt($("#max").attr("value"))
  set = $("#set").attr("value")
  res = $("#res").attr("value")
  $("#imgs").empty()

  for(var i=1; i<7; i++){

    var img = new Image(width, height)
    img.rel = i

    $(img)
      .load(function(){
      
        // Get the CanvasPixelArray from the given coordinates and dimensions.
        var canvas = document.createElement('canvas')
        canvas.height = height
        canvas.width = width
        
        var image_context = canvas.getContext('2d')
        image_context.drawImage(this, 0, 0)

        var li = $(document.createElement('li'))
        li.append(canvas)

        var info = $(document.createElement('div'))
        info.addClass("info")
        info.html("<b> + Object.size(mser) + </b> obszarów mser. Czasy:<br />znalezienia:  + ((new Date()).getTime() - currentTime) +  ms (?? ms)<br />neutralizacji: ?? ms (?? ms)<br /><span class='sum'>+ ?? ms (?? ms)</span>" )

        imgs.append(li.append(info))

        // Draw the ImageData at the given (x,y) coordinates.
        var layers = document.createElement('div')
        layers.className = 'layers'

        var dr = document.createElement('canvas')
        dr.height = height
        dr.width = width

        var dr_context = dr.getContext('2d')
        
        // Draw ellipses
        var ellipses = document.createElement('canvas')
        ellipses.height = height
        ellipses.width = width
        
        var ellipses_context = ellipses.getContext('2d')
        
        $(layers).append(dr)
                 .append(ellipses)
        li.append(layers)

        mser(image_context.getImageData(0, 0, width, height), dr_context.createImageData(width, height), ellipses_context.createImageData(width, height),
          function(dr_data, ellipses_data){
            dr_context.putImageData(dr_data, 0, 0)
            ellipses_context.putImageData(ellipses_data, 0, 0)
          }
        )
      })
      .attr('src', 'images/'+set+'/'+res+'/img'+i+'.png')
  }
}

$(document).ready(function() {
  $("#step1").click(function(){
    main()
  })
  
  $("#imgs").sortable()  
  $("#imgs").disableSelection()
  
})
