export function workArea(width, height) { return { width, height: Math.max(0,height-48) }; }
export function clampRect(rect, area) {
  const width = Math.min(Math.max(340,rect.width),area.width);
  const height = Math.min(Math.max(240,rect.height),area.height);
  return { width, height, x: Math.max(0,Math.min(rect.x,area.width-width)), y:Math.max(0,Math.min(rect.y,area.height-height)) };
}
export function snapRect(side, area) {
  if (side==='max') return {x:0,y:0,...area};
  const middle = Math.floor(area.width/2);
  return { x:side==='left'?0:middle, y:0, width:side==='left'?middle:area.width-middle, height:area.height };
}
export function initialRect(config, area, index=0) {
  const width = Math.min(config.width,Math.max(340,area.width-(area.width>680?130:0)));
  const height = Math.min(config.height,area.height-(area.width>680?80:0));
  return clampRect({width,height,x:(area.width-width)/2+28+(index%4)*18,y:(area.height-height)/2+(index%4)*15},area);
}
