// Merges smaller (slave) region into bigger one (master)
// Input: positions of two region markers (order is not important)
Array.prototype.merge = function(a, b){

  // Unless both pixels already belong to the same region
  if(a == b){
    throw "OMG!!!"
  }


  if(this[b] > 0 || this[a] > 0) throw "OMG!! Size is negative?"
//  if(1-this[b] > maximum || 1-this[a] > maximum ) throw "OMG!! Size is huge! ("+(1-this[a])+" or "+(1-this[b])+")"
                                 
  var master = a
  var slave = b
  
  if(this[b] < this[a]){
    master = b
    slave = a
  }
  
  // Master
  this[master] += (this[slave] - 1)
  // Slave
  this[slave] = master

  return master
}

// Adds one pixel to region root at 'position'
// Returns 
Array.prototype.add = function(position, root){
  var size = 1 - this[root]
  if(size < 1) throw "OMG! Size is negative?"
//  if(size < maximum){
    this[position] = root // why?
    this[root] -= 1
    return root
//  } else { return false }
}

// 
Array.prototype.find_reference_point = function(id){
  while(this[id] > 0){
    id = this[id]
  }
  return id
}

Object.size = function(obj) {
  var size = 0, key
  for (key in obj) {
    if (obj.hasOwnProperty(key)) size++
  }
  return size
}
