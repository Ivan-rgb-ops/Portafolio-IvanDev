export const wallpapers = [
  {id:'bloom',name:'Bloom · según el tema',image:'assets/bloom-light.jpg',dark:'assets/bloom-dark.jpg'},
  {id:'bloom-light',name:'Bloom azul',image:'assets/bloom-light.jpg'},
  {id:'bloom-dark',name:'Bloom nocturno',image:'assets/bloom-dark.jpg'},
  {id:'silver',name:'Bloom plateado',image:'assets/bloom-silver.jpg'},
  {id:'glow',name:'Resplandor',image:'assets/glow.jpg'},
  {id:'flow',name:'Flujo',image:'assets/flow.jpg'},
  {id:'sunrise',name:'Amanecer',image:'assets/sunrise.jpg'},
  {id:'space',name:'Espacio',image:'wallpaper.jpg'},
  {id:'city',name:'Ciudad',image:'wallpaper2.jpg'},
  {id:'aurora',name:'Aurora',gradient:'radial-gradient(ellipse at 20% 90%,#00ab9d,transparent 65%),radial-gradient(ellipse at 85% 15%,#7365c9,transparent 60%),linear-gradient(145deg,#061c36,#153d52)'},
  {id:'dusk',name:'Atardecer',gradient:'radial-gradient(ellipse at 15% 20%,#f6a77b,transparent 65%),radial-gradient(ellipse at 90% 80%,#6063a5,transparent 70%),linear-gradient(135deg,#d9bac7,#734f84)'},
  {id:'midnight',name:'Medianoche',gradient:'radial-gradient(ellipse at 70% 100%,#163b69,transparent 70%),linear-gradient(140deg,#090f1c,#161d30)'},
];

export function wallpaperBackground(id,theme='light',customURL='') {
  if(id==='custom'&&customURL)return `url("${customURL}")`;
  const entry=wallpapers.find(item=>item.id===id)||wallpapers[0];
  return entry.gradient||`url("${theme==='dark'&&entry.dark?entry.dark:entry.image}")`;
}

async function imageDatabase() {
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open('ivanos-images',1);
    request.onupgradeneeded=()=>request.result.createObjectStore('wallpapers');
    request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
  });
}
export async function readCustomWallpaper() {
  const db=await imageDatabase();
  return new Promise((resolve,reject)=>{const transaction=db.transaction('wallpapers');const request=transaction.objectStore('wallpapers').get('custom');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);transaction.oncomplete=()=>db.close();});
}
export async function storeCustomWallpaper(file) {
  if(!['image/jpeg','image/png','image/webp','image/avif'].includes(file.type))throw new Error('Elegí una imagen JPG, PNG, WebP o AVIF.');
  if(file.size>12*1024*1024)throw new Error('La imagen debe pesar menos de 12 MB.');
  const db=await imageDatabase();
  return new Promise((resolve,reject)=>{const transaction=db.transaction('wallpapers','readwrite');transaction.objectStore('wallpapers').put(file,'custom');transaction.oncomplete=()=>{db.close();resolve(file);};transaction.onerror=()=>{db.close();reject(new Error('No se pudo guardar el fondo en este navegador.'));};});
}
