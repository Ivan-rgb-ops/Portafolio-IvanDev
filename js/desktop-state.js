import {apps,storage} from './config.js';
export const desktopShortcuts=['recycle','explorer','about','projects','resume','contact','terminal'];
export function shortcutLabel(id){const names=storage.get('shortcut-names',{});return typeof names?.[id]==='string'?names[id]:apps[id]?.label||id;}
export function deletedShortcuts(){const saved=storage.get('deleted-shortcuts',[]);return Array.isArray(saved)?saved.filter(id=>desktopShortcuts.includes(id)&&id!=='recycle'):[];}
function changed(){document.dispatchEvent(new Event('desktop:change'));}
export function renameShortcut(id,name){if(!desktopShortcuts.includes(id)||!name.trim())return;const names=storage.get('shortcut-names',{});storage.set('shortcut-names',{...names,[id]:name.trim().slice(0,40)});changed();}
export function deleteShortcut(id){if(!desktopShortcuts.includes(id)||id==='recycle')return;storage.set('deleted-shortcuts',[...new Set([...deletedShortcuts(),id])]);changed();}
export function restoreShortcut(id){storage.set('deleted-shortcuts',deletedShortcuts().filter(item=>item!==id));changed();}
export function restoreAllShortcuts(){storage.set('deleted-shortcuts',[]);changed();}
export function undoShortcut(){const deleted=deletedShortcuts();if(deleted.length)restoreShortcut(deleted.at(-1));}
export function resetShortcuts(){storage.set('deleted-shortcuts',[]);storage.set('shortcut-names',{});storage.set('desktop-order',desktopShortcuts);changed();}
export function sortShortcuts(){storage.set('desktop-order',[...desktopShortcuts].sort((a,b)=>shortcutLabel(a).localeCompare(shortcutLabel(b),'es')));changed();}
