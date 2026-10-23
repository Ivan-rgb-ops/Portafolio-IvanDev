import test from 'node:test';
import assert from 'node:assert/strict';
import {workArea,clampRect,snapRect,initialRect} from '../js/geometry.js';

test('maximized windows leave the 48px taskbar reachable',()=>{
  const area=workArea(1440,900);
  assert.deepEqual(snapRect('max',area),{x:0,y:0,width:1440,height:852});
});
test('snapped halves tile odd width displays without gaps',()=>{
  const area=workArea(1365,768),left=snapRect('left',area),right=snapRect('right',area);
  assert.equal(left.x+left.width,right.x);
  assert.equal(right.x+right.width,area.width);
  assert.equal(left.height,720);
});
test('moving or resizing cannot lose a window outside the work area',()=>{
  const area=workArea(800,600);
  assert.deepEqual(clampRect({x:-900,y:5000,width:700,height:400},area),{x:0,y:152,width:700,height:400});
});
test('large desktop windows remain reachable after resizing to a phone',()=>{
  const area=workArea(390,844);
  const rect=clampRect({x:900,y:600,width:1000,height:900},area);
  assert.deepEqual(rect,{x:0,y:0,width:390,height:796});
});
test('initial and restored windows fit small screens and landscape viewports',()=>{
  for(const [width,height] of [[320,568],[390,844],[844,390],[782,884],[1920,1080]]){
    const area=workArea(width,height),rect=initialRect({width:1000,height:650},area,6);
    assert.ok(rect.x>=0&&rect.y>=0);
    assert.ok(rect.x+rect.width<=area.width);
    assert.ok(rect.y+rect.height<=area.height);
  }
});
