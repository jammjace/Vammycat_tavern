// Shared ground projection: east streets slope down-right, north streets up-right.
export const townPoint=(x,y)=>({x:1200+(x-1200)*.86-(y-800)*.36,y:800+(x-1200)*.20+(y-800)*.80});
const treePositions = [
  [440,920,290,340], [720,920,290,340], [1000,920,290,340],
  [1450,920,290,340], [1730,920,290,340], [2010,920,290,340],
  [330,1320,300,350], [490,1380,260,310], [630,1280,290,340],
  [1770,1330,280,330], [1950,1370,300,350], [2160,1300,270,320],
  [1120,380,250,290], [1370,380,250,290],
].map(([x,y,width,height])=>({...townPoint(x,y),width,height}));
const buildingObjects=[
  {x:380,y:570,width:440,height:360,name:'BAKERY'},
  {x:850,y:570,width:440,height:360,name:'COTTAGE'},
  {x:1650,y:570,width:440,height:360,name:'TAVERN'},
  {x:2120,y:570,width:440,height:360,name:'WORKSHOP'},
].map(b=>({...b,...townPoint(b.x,b.y)}));
const benchObjects=[{x:1080,y:1130,width:200,height:80},{x:1450,y:1130,width:200,height:80}].map(b=>({...b,...townPoint(b.x,b.y)}));
export const level1={
  name:'Willowcross',width:2400,height:1600,
  start:{x:treePositions[0].x+45,y:treePositions[0].y+5},goal:townPoint(2110,660),
  entrances:[380,850,1650,2120].map(x=>({x,y:635,width:80,height:160})),
  roads:[{x:1200,y:720,width:2280,height:170},{x:1240,y:960,width:160,height:1160}],
  square:{x:1240,y:1040,width:470,height:350},
  treePositions,buildingObjects,benchObjects,
  shadowCasters:[
    ...treePositions.map(t=>({...t,texture:'tree-art',anchorY:.9})),
    ...buildingObjects.map(b=>({...b,texture:'house-art',anchorY:.92})),
    ...benchObjects.map(b=>({...b,texture:'bench-art',anchorY:.94})),
  ],
  solidObstacles:[
    ...treePositions.map(t=>({type:'TREE',x:t.x,y:t.y-5,radius:14,blocksMovement:true})),
    ...buildingObjects.map(b=>({type:'BUILDING',x:b.x,y:b.y-50,width:285,height:125,blocksMovement:true})),
    ...benchObjects.map(b=>({type:'BENCH',x:b.x,y:b.y-15,width:175,height:40,blocksMovement:true})),
  ],
  waterZones:[{...townPoint(1240,1040),width:200,height:105}],platforms:[],
};
