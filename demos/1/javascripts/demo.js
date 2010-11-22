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

    var img = new Image();
    img.rel = i;

    $(img)
      .load(function(){
        // Get the CanvasPixelArray from the given coordinates and dimensions.
        var canvas = document.createElement('canvas')
        canvas.height = this.height
        canvas.width = this.width
        
        var image_context = canvas.getContext('2d')
        image_context.drawImage(this, 0, 0)

        var li = $(document.createElement('li'))

        //var info = $(document.createElement('div'))
        //info.addClass("info")
        //info.html("<b> + Object.size(mser) + </b> obszarów mser. Czasy:<br />znalezienia:  + ((new Date()).getTime() - currentTime) +  ms (?? ms)<br />neutralizacji: ?? ms (?? ms)<br /><span class='sum'>+ ?? ms (?? ms)</span>" )

        //imgs.append(li.append(info))

        // Draw the ImageData at the given (x,y) coordinates.
        //var layers = document.createElement('div')
        //layers.className = 'layers'

        //var dr = document.createElement('canvas')
        //dr.height = height
        //dr.width = width

        //var dr_context = dr.getContext('2d')
        //
        //// Draw ellipses
        //var ellipses = document.createElement('canvas')
        //ellipses.height = height
        //ellipses.width = width
        //
        //var ellipses_context = ellipses.getContext('2d')
        //
        //$(layers).append(dr)
        //         .append(ellipses)
        //li.append(layers)

        //var before = new Date()
        //mser(image_context.getImageData(0, 0, width, height), dr_context.createImageData(width, height), ellipses_context.createImageData(width, height),
        //  function(dr_data, ellipses_data){
        //    console.log((new Date() - before) + "ms.")
        //    dr_context.putImageData(dr_data, 0, 0)
        //    ellipses_context.putImageData(ellipses_data, 0, 0)
        //  }
        //)

        var imageData = image_context.getImageData(0, 0, this.width, this.height)
        var mser = Mser(imageData);
        console.log("Znaleziono "+mser.length+" regionów");

        var regions = document.createElement('canvas');
        regions.height = this.height
        regions.width = this.width
        var regionsConetext = regions.getContext('2d');
        var regionsData = regionsConetext.createImageData(this.width, this.height);
        var d = regionsData.data;
        
        var resolution = this.width*this.height;
        var d_ = imageData.data;
        while(resolution--){
          var pos = resolution << 2;
          var p = Mser.toGray(d_[pos], d_[pos+1], d_[pos+2]);

          d[pos] = p;
          d[pos+1] = p;
          d[pos+2] = p;
          d[pos+3] = 255;
        }

        var i = mser.length
        while(i--){
          var r = mser[i]
          var sr_x = parseInt(r[1]/ r[0])
          var sr_y = parseInt(r[2]/ r[0])*this.width
          var pos = sr_x+sr_y << 2;

          d[pos] = 255;
          d[pos+1] = 0;
          d[pos+2] = 0;
          d[pos+3] = 255;
        }
        regionsConetext.putImageData(regionsData, 0, 0)
        li.append(regions)
        imgs.append(li)
        throw "shit"
      })
      .attr('src', 'images/'+set+'/'+res+'/img'+i+'.png')
  }
}

$(document).ready(function() {
  $("#step1").click(function(){
    main()
  })
  
//  $("#imgs").sortable()  
//  $("#imgs").disableSelection()
})
