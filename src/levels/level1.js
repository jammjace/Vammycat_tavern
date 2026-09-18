// One shared 2:1 diamond projection for every ground feature.
export const townPoint=(x,y)=>({x:1200+(x-1200)*.7071-(y-800)*.7071,y:800+(x-1200)*.35355+(y-800)*.35355});
export const groundPoint=(x,y)=>({x:1200+(x-1200)/1.4142+(y-800)/.7071,y:800-(x-1200)/1.4142+(y-800)/.7071});
export const windSway=(time,x,y)=>Math.sin(time*.0013+x*.013+y*.007)*.013+Math.sin(time*.0021+x*.008)*.005;
// Canopies stay north of the entire playable shadow corridor (y >= 700).
const treePositions=[
  {x:450,y:700,width:360,height:400,texture:'tree-1'},
  {x:1000,y:700,width:440,height:400,texture:'tree-2'},
  {x:1550,y:700,width:380,height:420,texture:'tree-4'},
  {x:2150,y:420,width:220,height:300,texture:'tree-3'},
];
const buildingObjects=[
  {x:300,y:290,width:300,height:245,name:'BAKERY'},
  {x:800,y:290,width:300,height:245,name:'COTTAGE'},
  {x:1300,y:290,width:300,height:245,name:'TAVERN'},
  {x:1800,y:290,width:300,height:245,name:'WORKSHOP'},
];
// Low stone benches provide a place to cool down and change time between trees.
const benchObjects=[725,1275].map(x=>({x,y:900,width:170,height:85}));
const road=(x,y,width,height)=>({...groundPoint(x,y),width,height});
export const level1={
  name:'Willowcross · The sundial garden',width:2400,height:1600,
  start:{x:150,y:900},goal:{x:1940,y:900},burnRate:1.2,
  entrances:[],
  roads:[road(1080,840,2450,115),road(1080,840,115,1350)],
  square:road(2080,1150,390,300),
  treePositions,buildingObjects,benchObjects,
  shadowCasters:[
    ...treePositions.map(t=>({...t,anchorY:.96})),
    ...buildingObjects.map(b=>({...b,texture:'house-art',anchorY:.92})),
    ...benchObjects.map(b=>({...b,texture:'bench-art',anchorY:.94})),
  ],
  solidObstacles:[
    ...treePositions.map(t=>({type:'TREE',x:t.x,y:t.y-5,radius:14,blocksMovement:true})),
    ...buildingObjects.map(b=>({type:'BUILDING',x:b.x,y:b.y-35,width:200,height:85,blocksMovement:true})),
    ...benchObjects.map(b=>({type:'BENCH',x:b.x,y:b.y-30,width:135,height:22,blocksMovement:true})),
  ],
  waterZones:[{x:2080,y:1150,width:200,height:150,groundX:groundPoint(2080,1150).x,groundY:groundPoint(2080,1150).y}],platforms:[],
  // A reference itinerary used by the gameplay test; the clock is freely controllable.
  shadowRoute:[{x:150,y:900,phase:-5/6},{x:490,y:715,phase:-5/6},{x:725,y:900,phase:5/6},{x:1040,y:715,phase:-5/6},{x:1275,y:900,phase:5/6},{x:1590,y:715,phase:-5/6},{x:1940,y:900,phase:5/6}],
};
