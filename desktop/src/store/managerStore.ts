import { create } from "zustand";
import type { DesktopWidget } from "../types/widget";

export interface SavedLayout { id: string; name: string; widgets: DesktopWidget[]; updatedAt: string }
export interface ManagerNotice { id: string; message: string; createdAt: string; read: boolean }
interface ManagerState {
  layouts: SavedLayout[]; installed: string[]; favorites: string[]; notices: ManagerNotice[]; lastBackup?: string;
  saveLayout: (name: string, widgets: DesktopWidget[]) => void; deleteLayout: (id: string) => void;
  renameLayout: (id: string, name: string) => void;
  updateLayout: (id: string, widgets: DesktopWidget[]) => void;
  install: (name: string) => void; toggleFavorite: (name: string) => void; addNotice: (message: string) => void;
  markAllRead: () => void; backup: (widgets: DesktopWidget[]) => void; restoreBackup: () => DesktopWidget[] | null;
}
const KEY="widget-studio-manager"; const BACKUP="widget-studio-backup";
const initial=()=>{try{return JSON.parse(localStorage.getItem(KEY)??"{}")}catch{return {}}};
const persist=(state:ManagerState)=>localStorage.setItem(KEY,JSON.stringify({layouts:state.layouts,installed:state.installed,favorites:state.favorites,notices:state.notices,lastBackup:state.lastBackup}));
export const useManagerStore=create<ManagerState>((set,get)=>({
  layouts:initial().layouts??[], installed:initial().installed??[], favorites:initial().favorites??[], notices:initial().notices??[], lastBackup:initial().lastBackup,
  saveLayout:(name,widgets)=>set(s=>{const next={...s,layouts:[...s.layouts,{id:crypto.randomUUID(),name,widgets:structuredClone(widgets),updatedAt:new Date().toISOString()}]};persist(next);return next}),
  deleteLayout:id=>set(s=>{const next={...s,layouts:s.layouts.filter(x=>x.id!==id)};persist(next);return next}),
  renameLayout:(id,name)=>set(s=>{const next={...s,layouts:s.layouts.map(x=>x.id===id?{...x,name,updatedAt:new Date().toISOString()}:x)};persist(next);return next}),
  updateLayout:(id,widgets)=>set(s=>{const next={...s,layouts:s.layouts.map(x=>x.id===id?{...x,widgets:structuredClone(widgets),updatedAt:new Date().toISOString()}:x)};persist(next);return next}),
  install:name=>set(s=>{if(s.installed.includes(name))return s;const next={...s,installed:[...s.installed,name],notices:[{id:crypto.randomUUID(),message:`${name} installed`,createdAt:new Date().toISOString(),read:false},...s.notices]};persist(next);return next}),
  toggleFavorite:name=>set(s=>{const next={...s,favorites:s.favorites.includes(name)?s.favorites.filter(x=>x!==name):[...s.favorites,name]};persist(next);return next}),
  addNotice:message=>set(s=>{const next={...s,notices:[{id:crypto.randomUUID(),message,createdAt:new Date().toISOString(),read:false},...s.notices]};persist(next);return next}),
  markAllRead:()=>set(s=>{const next={...s,notices:s.notices.map(x=>({...x,read:true}))};persist(next);return next}),
  backup:widgets=>set(s=>{const at=new Date().toISOString();localStorage.setItem(BACKUP,JSON.stringify(widgets));const next={...s,lastBackup:at,notices:[{id:crypto.randomUUID(),message:"Local backup completed",createdAt:at,read:false},...s.notices]};persist(next);return next}),
  restoreBackup:()=>{try{return JSON.parse(localStorage.getItem(BACKUP)??"null")}catch{return null}}
}));
