import Phaser from 'phaser';

// GLSL port of the supplied Campbreeze painterly.wgsl: four-sector
// variance filtering, Sobel anisotropy, soft quantization, wobble and paper grain.
const fragShader = `
precision highp float;
uniform sampler2D uMainSampler;
uniform vec2 resolution;
uniform vec2 cameraOrigin;
uniform float zoom;
uniform float enabled;
varying vec2 outTexCoord;
const float PI=3.14159265;
float hash21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);return mix(mix(hash21(i),hash21(i+vec2(1,0)),u.x),mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),u.x),u.y);}
vec3 sampleRGB(vec2 p){return texture2D(uMainSampler,clamp(p,vec2(0.001),vec2(.999))).rgb;}
float lum(vec3 c){return dot(c,vec3(.299,.587,.114));}
mat2 orientation(vec2 uv,vec2 t){
  vec3 a=sampleRGB(uv+vec2(-1,-1)*t),b=sampleRGB(uv+vec2(-1,0)*t),c=sampleRGB(uv+vec2(-1,1)*t);
  vec3 d=sampleRGB(uv+vec2(0,-1)*t),e=sampleRGB(uv+vec2(0,1)*t);
  vec3 f=sampleRGB(uv+vec2(1,-1)*t),g=sampleRGB(uv+vec2(1,0)*t),h=sampleRGB(uv+vec2(1,1)*t);
  vec3 sx=-a+f-2.0*b+2.0*g-c+h,sy=-a-2.0*d-f+c+2.0*e+h;
  float xx=dot(sx,sx),yy=dot(sy,sy),xy=dot(sx,sy),tr=xx+yy;
  float disc=sqrt(max(tr*tr*.25-(xx*yy-xy*xy),0.0));
  float l1=tr*.5+disc,l2=tr*.5-disc;
  vec2 v=vec2(0,1);if(abs(xy)>.0000001)v=normalize(vec2(-xy,xx-l1));
  float an=(l1-l2)/(tr+.0000001),gate=smoothstep(.16,.42,an)*smoothstep(.012,.08,tr);
  float ax=25.0/(an+25.0),ay=(an+25.0)/25.0;
  return mat2(mix(vec2(1,0),vec2(v.x*ax,-v.y*ax),gate),mix(vec2(0,1),vec2(v.y*ay,v.x*ay),gate));
}
vec4 sector(vec2 uv,vec2 t,float angle,mat2 aniso){
  vec3 sum=vec3(0),sq=vec3(0);float total=0.0;
  for(int ri=1;ri<=2;ri++)for(int ai=0;ai<2;ai++){
    float r=float(ri)*1.25,a=-PI*.25+float(ai)*PI*.5;
    vec2 offset=aniso*(r*vec2(cos(angle+a),sin(angle+a)));
    vec3 color=sampleRGB(uv+offset*t);vec2 local=r*vec2(cos(a),sin(a));
    float poly=local.x+.1-.5*local.y*local.y,w=poly*poly;
    sum+=color*w;sq+=color*color*w;total+=w;
  }
  vec3 mean=sum/max(total,.00001),variance=max(sq/max(total,.00001)-mean*mean,vec3(0));return vec4(mean,lum(variance));
}
float poster(float x){float q=x*11.0;return (floor(q)+smoothstep(.22,.78,fract(q)))/11.0;}
void main(){
  vec2 uv=outTexCoord;vec4 original=texture2D(uMainSampler,uv);
  if(enabled<.5){gl_FragColor=original;return;}
  vec2 t=1.0/resolution,key=cameraOrigin+vec2(uv.x,1.0-uv.y)*resolution/max(zoom,.01);
  vec2 wobble=(vec2(noise(key*.55),noise(key*.55+vec2(19.2,7.4)))-.5)*2.0*t*.65;
  vec2 suv=uv+wobble;mat2 an=orientation(suv,t);
  vec4 a=sector(suv,t,0.0,an),b=sector(suv,t,PI*.5,an),c=sector(suv,t,PI,an),d=sector(suv,t,PI*1.5,an);
  float best=min(min(a.a,b.a),min(c.a,d.a)),inv=1.0/max(best,.0001);
  vec4 weights=exp(-10.0*(vec4(a.a,b.a,c.a,d.a)-best)*inv);
  vec3 color=(a.rgb*weights.x+b.rgb*weights.y+c.rgb*weights.z+d.rgb*weights.w)/max(dot(weights,vec4(1)),.00001);
  float q=clamp(poster(lum(color)),.3,.5);
  color=q<.5?mix(vec3(0),color,q*2.0):mix(color,vec3(1),(q-.5)*2.0);
  color=mix(vec3(dot(color,vec3(.2125,.7154,.0721))),color,1.35);
  float grain=(.82+.28*noise(key*.37))*(.9+.15*noise(key*vec2(.91,.44)+vec2(3.1,1.7)));
  color=mix(color,color*grain,.2);
  gl_FragColor=vec4(mix(original.rgb,color,.65),original.a);
}`;

export class CampbreezePipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
  constructor(game){super({game,renderTarget:true,fragShader});this.paintEnabled=true;}
  onPreRender(){
    const camera=this.game.scene.getScene('GameScene').cameras.main;
    this.set2f('resolution',this.renderer.width,this.renderer.height);
    this.set2f('cameraOrigin',camera.worldView.x,camera.worldView.y);
    this.set1f('zoom',camera.zoom);this.set1f('enabled',this.paintEnabled?1:0);
  }
}
