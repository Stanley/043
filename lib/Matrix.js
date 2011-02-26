(function(){
  var Matrix = function(arr){
    this.arr = arr;
    this.height = this.arr.length;
    this.width = this.arr[0].length;
    return this;
  }

  // Input: size (integer) or diagonal (array)
  // Output: Indentity matrix
  Matrix.I = function(diagonal){
    var i = n = diagonal.length || diagonal;
    var matrix = Array(i);
    while(i--){
      matrix[i] = Array(n);
      var j = n; while(j--) matrix[i][j] = 0;
      matrix[i][i] = diagonal[i] || 1;
    }
    return new Matrix(matrix);
  }

  // Transpose
  Matrix.prototype.t = function(){
    var i = this.width;
    var transposed = Array(i);
    while(i--){
      var j = this.height;
      transposed[i] = Array(j);
      while(j--){
        transposed[i][j] = this.arr[j][i];
      }
    }
    return new Matrix(transposed);
  }

  // Multiply (Naive implementation O(n^3))
  // Takes: matrix m x p
  // Returns: matrix n x p
  Matrix.prototype.x = function(matrix){
    var i = this.height;
    var multiplayed = Array(i);
    while(i--){
      var j = matrix.width;
      multiplayed[i] = Array(j);
      while(j--){
        var k = this.width;
        var sum = 0;
        while(k--){
          sum += this.arr[i][k] * matrix.arr[k][j];
        }
        multiplayed[i][j] = sum;
      }
    }
    return new Matrix(multiplayed);
  }

  Matrix.prototype.eigenvalues = function(){
    return this.jacobi()[0];
  }

  // Returns: normalized eigenvector of .. 
  Matrix.prototype.eigenvector = function(){
    var jacob = this.jacobi();
    var v = jacob[1].arr[0];
    return v;
  }

  // private

  // Returns: eigenvalues array and eigenvectors 2D array
  // WORKS ONLY FOR SYMMETRIC MATRIX
  Matrix.prototype.jacobi = function(){

    var eigenvectors = Matrix.I(this.width);
    // Pitagoras
    var hypot = function(x,y){ return Math.sqrt(x*x + y*y) || 0 }
    //var arr = this.arr;
    var arr = this.arr.map(function(row){ return row.slice(0) }).slice(0); // javascript's way of cloning :/

    var i, j, done;
    while(!done) {
      done = true; 
      
      var i = this.width; // == this.height
      while(i--){
        var j = i;
        while(j--){

          /* Diagonalize the diagonal 2 by 2 sub-matrix along the ith and jth axes. */ 
          var aii = arr[i][i]; 
          var aij = arr[i][j]; 
          var ajj = arr[j][j]; 
          if (Math.abs(aij)>0.000001) { 
            var discr = hypot(aii-ajj,2*aij); 
            /* Compute eigenvalues. */ 
            if (aii+ajj>0) { 
              arr[i][i] = (aii+ajj+discr)/2; 
              arr[j][j] = (aii*ajj-aij*aij)/arr[i][i]; 
            } else { 
              arr[j][j] = (aii+ajj-discr)/2; 
              arr[i][i] = (aii*ajj-aij*aij)/arr[j][j]; 
            } 
            arr[i][j] = arr[j][i] = 0; 

            /* Compute normalized eigenvector corresponding to first eigenvalue. */ 
            var v1, v2;
            if (aii>ajj) { 
              v1 = (aii-ajj+discr)/2; 
              v2 = aij; 
            } else { 
              v1 = aij; 
              v2 = (ajj-aii+discr)/2; 
            } 

            var norm = hypot(v1,v2); 
            v1 /= norm; 
            v2 /= norm; 

            var rotation = Matrix.I(this.width);
            rotation.arr[i][i] = rotation.arr[j][j] = v1;
            rotation.arr[i][j] = v2;
            rotation.arr[j][i] = -v2;

            eigenvectors = rotation.x(eigenvectors);

            /* apply change of basis to the rest of the matrix. */ 
            var k = this.width;
            while(k--){
              if (k!=i && k!=j) {
                var aik = arr[i][k]; 
                var ajk = arr[j][k]; 
                arr[i][k] = arr[k][i] = v1*aik + v2*ajk; 
                arr[j][k] = arr[k][j] = -v2*aik + v1*ajk; 
              } 
            }
            done = false; 
          }
        }
      } 
    }
    return [arr.map(function(row, i){ return row[i] }), eigenvectors];
  }

  // Expose
  window.Matrix = Matrix;
})()
