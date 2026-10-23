export function workArea(width, height) { return { width, height: Math.max(0,height-48) }; }
export function clampRect(rect, area) {
  const width = Math.min(Math.max(340,rect.width),area.width);
  const height = Math.min(Math.max(240,rect.height),area.height);
  return { width, height, x: Math.max(0,Math.min(rect.x,area.width-width)), y:Math.max(0,Math.min(rect.y,area.height-height)) };
}
export function snapRect(side, area) {
  if (side==='max') return {x:0,y:0,...area};
  const middle=Math.floor(area.width/2),halfHeight=Math.floor(area.height/2);
  if(side.startsWith('third-')){const column={left:0,center:1,right:2}[side.slice(6)];const x=Math.floor(area.width*column/3),right=Math.floor(area.width*(column+1)/3);return {x,y:0,width:right-x,height:area.height};}
  if(side.startsWith('wide-')){const edge=Math.floor(area.width/3);return {x:side==='wide-left'?0:edge,y:0,width:side==='wide-left'?Math.floor(area.width*2/3):area.width-edge,height:area.height};}
  const right=side.endsWith('right'),bottom=side.startsWith('bottom-'),quarter=side.startsWith('top-')||bottom;
  return {x:right?middle:0,y:bottom?halfHeight:0,width:right?area.width-middle:middle,height:quarter?(bottom?area.height-halfHeight:halfHeight):area.height};
}
export function initialRect(config, area, index=0) {
  const width = Math.min(config.width,Math.max(340,area.width-(area.width>680?130:0)));
  const height = Math.min(config.height,area.height-(area.width>680?80:0));
  return clampRect({width,height,x:(area.width-width)/2+28+(index%4)*18,y:(area.height-height)/2+(index%4)*15},area);
}
