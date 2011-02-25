describe('Matrix', function(){

  it('should be transposable', function(){
    var matrix = new Matrix([[1,2,3], [4,5,6], [7,8,9]]);
    var transposed = matrix.t();
    expect(transposed).toEqual(new Matrix([[1,4,7], [2,5,8], [3,6,9]]));
  });

  it('should transpose vectors as well', function(){
    var matrix = new Matrix([[1,2,3]]);
    var transposed = matrix.t();
    expect(transposed).toEqual(new Matrix([[1], [2], [3]]));
  });

  it('should be multipliable', function(){
    var matrix = new Matrix([[1,2,3], [4,5,6], [7,8,9]]);
    var multiplayed = matrix.x(new Matrix([[1,1,1], [1,1,1], [1,1,1]]));
    expect(multiplayed).toEqual(new Matrix([[6,6,6], [15,15,15], [24,24,24]]));
  });

  it('should multiply matrix by vector', function(){
    var matrix = new Matrix([[1,2,3], [4,5,6], [7,8,9]]);
    var multiplayed = matrix.x(new Matrix([[1], [1], [1]]));
    expect(multiplayed).toEqual(new Matrix([[6], [15], [24]]));
  })

  it('should have eigenvalues', function(){
    var matrix = new Matrix([[1,0,1], [0,1,0], [1,0,1]]);
    expect(matrix.eigenvalues()).toEqual([0,1,2]);
  });

  it('should have eigenvectors', function(){
    var matrix = new Matrix([[1,0,1], [0,1,0], [1,0,1]]);
    expect(matrix.eigenvector()).toEqual([-1,0,1]);
  });

});

describe('Indentity Matrix', function(){

  it('should have default value 1', function(){
    var matrix = Matrix.I(2);
    expect(matrix).toEqual(new Matrix([[1,0], [0,1]]));
  });

  it('should be possible to made of diagonal values', function(){
    var matrix = Matrix.I([1,2,3]);
    expect(matrix).toEqual(new Matrix([[1,0,0], [0,2,0], [0,0,3]]));
  });
});
