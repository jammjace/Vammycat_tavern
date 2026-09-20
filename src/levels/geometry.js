// One shared 2:1 diamond projection for every ground feature.
export const townPoint=(x,y)=>({x:1200+(x-1200)*.7071-(y-800)*.7071,y:800+(x-1200)*.35355+(y-800)*.35355});
export const groundPoint=(x,y)=>({x:1200+(x-1200)/1.4142+(y-800)/.7071,y:800-(x-1200)/1.4142+(y-800)/.7071});
export const windSway=(time,x,y)=>Math.sin(time*.0013+x*.013+y*.007)*.013+Math.sin(time*.0021+x*.008)*.005;
