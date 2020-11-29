
export const purchases = [
  {key: 'bathroom', category: 'room', price: 3000, requirements: [], x: 140, y: 160},
  {key: 'room1', category: 'room', price: 5000, requirements: ['bathroom'], x: 500, y: 128},
  {key: 'kitchen', category: 'room', price: 8000, requirements: ['room1'], x: 685, y: 128},
  {key: 'room2', category: 'room', price: 10000, requirements: ['kitchen'], x: 480, y: 512},
  {key: 'room3', category: 'room', price: 12000, requirements: ['kitchen'], x: 615, y: 512},
  {key: 'room4', category: 'room', price: 15000, requirements: ['kitchen'], x: 215, y: 512},
  {key: 'worker1', category: 'worker', id: 1, price: 6000, requirements: ['room1'], x: 500, y: 128},
  {key: 'worker2', category: 'worker', id: 2, price: 15000, requirements: ['room2'], x: 480, y: 512},
  {key: 'worker3', category: 'worker', id: 3, price: 18000, requirements: ['room3'], x: 615, y: 512},
  {key: 'worker4', category: 'worker', id: 4, price: 20000, requirements: ['room4'], x: 215, y: 512},
];

export const workerPositions = [
  {x: 256, y: 128, type: 0},
  {x: 480, y: 128, type: 2},
  {x: 464, y: 512, type: 5},
  {x: 592, y: 512, type: 1},
  {x: 208, y: 512, type: 6},
];

export const purchaseMasks = [
  {id: 'bathroom', x: 0, y: 0, width: 180, height: 235},
  {id: 'bathroom', x: 0, y: 235, width: 415, height: 120},
  {id: 'room1', x: 415, y: 0, width: 235, height: 335},
  {id: 'kitchen', x: 650, y: 0, width: 150, height: 335},

  {id: 'room2', x: 285, y: 335, width: 298, height: 305},
  {id: 'room3', x: 583, y: 335, width: 217, height: 305},
  {id: 'room4', x: 0, y: 335, width: 285, height: 305},

]
