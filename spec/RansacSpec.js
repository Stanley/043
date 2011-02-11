describe('RANSAC', function(){

  describe('model', function(){

    var data = [[2,2], [3,4]];
    var model = new Model(data, 1);

    it('should fit a line to two points', function(){
      expect(model.line()).toEqual([-2,2]);
    });

    it('should accept close points', function(){
      expect(model.neigbour([0, 0])).toBeTruthy();
    });

    it('should not accept gross errors', function(){
      expect(model.neigbour([10, 2])).toBeFalsy();
    });

  });

  describe('model2', function(){

    it('should ..', function(){
      var data = [[3,2], [3,3]];
      var model = new Model(data, 1);
      expect(model.neigbour([10, 2])).toBeFalsy();
    });

    it('should', function(){
      var data = [[2,3], [3,3]];
      var model = new Model(data, 1);
      expect(model.neigbour([0, 0])).toBeFalsy();
    });
  });

  it('should find a best fit line', function(){
    var options = {};
    var set = [ [0, 0]
               ,[1, 1] 
               ,[2, 2] 
               ,[3, 2] 
               ,[3, 3] 
               ,[4, 4] 
               ,[10, 2] ]; // Gross error

    var ransac = new Ransac(set, options);
    expect(ransac.best_consensus_set).toContain([0,0]);
    expect(ransac.best_consensus_set).toContain([1,1]);
    expect(ransac.best_consensus_set).toContain([2,2]);
    expect(ransac.best_consensus_set).toContain([3,2]);
    expect(ransac.best_consensus_set).toContain([3,3]);
    expect(ransac.best_consensus_set).toContain([4,4]);
    expect(ransac.best_consensus_set).toNotContain([10,2]);
    expect(ransac.best_model).toEqual([0, 1]); // = 1x
  });

  it('should stop when there is no good result')
});
