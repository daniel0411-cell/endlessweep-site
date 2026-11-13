import fs from 'node:fs';
import vm from 'node:vm';

export class Element {
  constructor(){this.children=[];this.dataset={};this.style={setProperty(){}};this.handlers={};this.attrs={};this.value='';this.textContent='';this.hidden=false;this.checked=false;this.className='';this.html='';const classes=new Set();this.classList={toggle(c,v){if(v===undefined)v=!classes.has(c);v?classes.add(c):classes.delete(c)},add:c=>classes.add(c),remove:c=>classes.delete(c),contains:c=>classes.has(c)}}
  set innerHTML(value){this.html=value;this.children=[]}get innerHTML(){return this.html}
  setAttribute(name,value){this.attrs[name]=value}removeAttribute(name){delete this.attrs[name]}
  addEventListener(name,fn){(this.handlers[name]??=[]).push(fn)}
  appendChild(el){this.children.push(el)}querySelectorAll(){return []}focus(){}
  getBoundingClientRect(){return {width:32,height:32}}
  fire(name,event={}){for(const fn of this.handlers[name]||[])fn({preventDefault(){},target:this,...event})}
}
export function page(file='index.html',initial={},location={pathname:'/',search:''}) {
  const elements=new Map(),saved=new Map(Object.entries(initial)),beacons=[],intervals=new Map(),timeouts=new Map();let timerId=0;
  const document={documentElement:new Element(),querySelector(selector){if(!elements.has(selector))elements.set(selector,new Element());return elements.get(selector)},querySelectorAll(){return []},createElement(){return new Element()},addEventListener(){}};
  document.querySelector('#difficulty').value='beginner';
  for(const [id,value] of [['width',9],['height',9],['mines',10]])document.querySelector('#custom-'+id).value=value;
  const ctx=vm.createContext({document,window:{addEventListener(){}},location,URLSearchParams,crypto:globalThis.crypto,performance:{now:()=>1000},navigator:{sendBeacon:(url,blob)=>beacons.push(blob),clipboard:{writeText:async()=>{}}},Blob,matchMedia:()=>({matches:false}),localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value),removeItem:key=>saved.delete(key)},setInterval:fn=>{intervals.set(++timerId,fn);return timerId},clearInterval:id=>intervals.delete(id),setTimeout:fn=>{timeouts.set(++timerId,fn);return timerId},clearTimeout:id=>timeouts.delete(id),console,confirm:()=>false});
  const run=s=>vm.runInContext(s,ctx);
  run(fs.readFileSync(file,'utf8').match(/<script>([\s\S]*?)<\/script>/)[1]);
  return {ctx,run,document,saved,beacons,intervals,timeouts,el:s=>document.querySelector(s)};
}
