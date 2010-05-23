var width = 400 //canvas.width
var height = 320 //canvas.height
var resolution = width*height
var imgs = $('#imgs')

// MSER parameters
var delta = 10
var minimum = 40  // The smallest mser
var maximum = 500 // The biggest mser


function main(){

  delta = parseInt($("#delta").attr("value"))
  minimum = parseInt($("#min").attr("value"))
  maximum = parseInt($("#max").attr("value"))
  set = $("#set").attr("value")
  $("#imgs").empty()

  for(var i=1; i<7; i++){

    var img = new Image(width, height)
    img.rel = i

    $(img)
      .load(mser)
      .attr('src', 'images/'+set+'/img'+i+'.png')

  }
}

$(document).ready(function() {
  $("#step1").click(function(){
    main()
  })
  
  $("#imgs").sortable()  
  $("#imgs").disableSelection()
  
})

