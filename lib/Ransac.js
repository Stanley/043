// This is LO-RANSAC implementation
// See http://en.wikipedia.org/wiki/RANSAC for more

(function(){

  var Model = function(pair, threshold){
    this.x0 = pair[0][0];
    this.x1 = pair[1][0];
    this.y0 = pair[0][1];
    this.y1 = pair[1][1];

    this.xDelta = this.x0 - this.x1;
    this.yDelta = this.y0 - this.y1;
    this.threshold = threshold;
  }

  // Input: two pionts
  // Returns: [b, m]; y = mx + b;
  Model.prototype.line = function(){
    var m = -this.yDelta / -this.xDelta;
    var b = (this.y0*this.x1 - this.y1*this.x0) / -this.xDelta;
    return [b, m]
  }

  // Returns: true if given point is close to the line
  Model.prototype.neigbour = function(point){
    var u = ((point[0] - this.x0) * this.xDelta + (point[1] - this.y0) * this.yDelta) / (this.xDelta * this.xDelta + this.yDelta * this.yDelta)
      , x = this.x0 + u*this.xDelta
      , y = this.y0 + u*this.yDelta
      , d = Math.sqrt(Math.pow(x-point[0],2) + Math.pow(y-point[1],2))

    return d < this.threshold;
  }

  var Ransac = function(data, options){
    var options = options || {};
    var n = options.n || 2 // the minimum number of data required to fit the model
      , t = options.t || 3 // a threshold value for determining when a datum fits a model

    var best_model
      , best_consensus_set = []
      , u
      , k = 10
      , l = 0
      , limit = 100 // max number of iterations

    do {
      var consensus_set = []
        , outliers = data.slice(0) // clone

      // Select n random pixels
      var i = n;
      while(i--){
        while(consensus_set[i] == undefined){
          var r = Math.floor(Math.random() * data.length);
          consensus_set[i] = outliers[r];
          delete outliers[r];
        }
      }

      var maybe_model = new Model(consensus_set, t)
        , rest = data.length;


      // add points which fits model with an error < t
      while(rest--){
        var p = outliers[rest]
        if(p && maybe_model.neigbour(p))
          consensus_set.push(p);
      }

      // we may have found a good model, now test how good it is
      better_model = new Model(consensus_set, t)
      if(consensus_set.length > best_consensus_set.length){
        // we have found a model which is better than any of the previous ones, keep it until a better one is found
        best_model = better_model;
        best_consensus_set = consensus_set;

        // TODO: LO step. Apply optimization.
      }

      var p = [null, null].map(function(_, j){ return (consensus_set.length - j) / (data.length - j)}).reduce(function(prod, val){ return prod*val })
      u = Math.pow(1-p, k);
      if(!limit--)
        return
    } while (u > 0.005)

    this.best_model = best_model.line(); // model parameters which best fit the data (or null if no good model is found)
    this.best_consensus_set = best_consensus_set; // data point from which this model has been estimated
  }

  // expose
  window.Ransac = Ransac;
  window.Model = Model;
})()
