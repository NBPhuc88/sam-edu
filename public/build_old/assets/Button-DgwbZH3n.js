import{r as f,j as w}from"./index-CnymEz8z.js";import{c as E}from"./compiler-runtime-Diw4zTz0.js";/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const L=(...e)=>e.filter((t,o,s)=>!!t&&t.trim()!==""&&s.indexOf(t)===o).join(" ").trim();/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=e=>e.replace(/([a-z0-9])([A-Z])/g,"$1-$2").toLowerCase();/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const S=e=>e.replace(/^([A-Z])|[\s-_]+(\w)/g,(t,o,s)=>s?s.toUpperCase():o.toLowerCase());/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const A=e=>{const t=S(e);return t.charAt(0).toUpperCase()+t.slice(1)};/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */var k={xmlns:"http://www.w3.org/2000/svg",width:24,height:24,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round",strokeLinejoin:"round"};/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $=e=>{for(const t in e)if(t.startsWith("aria-")||t==="role"||t==="title")return!0;return!1},B=f.createContext({}),R=()=>f.useContext(B),_=f.forwardRef(({color:e,size:t,strokeWidth:o,absoluteStrokeWidth:s,className:r="",children:n,iconNode:i,...c},m)=>{const{size:a=24,strokeWidth:l=2,absoluteStrokeWidth:b=!1,color:g="currentColor",className:d=""}=R()??{},y=s??b?Number(o??l)*24/Number(t??a):o??l;return f.createElement("svg",{ref:m,...k,width:t??a??k.width,height:t??a??k.height,stroke:e??g,strokeWidth:y,className:L("lucide",d,r),...!n&&!$(c)&&{"aria-hidden":"true"},...c},[...i.map(([u,p])=>f.createElement(u,p)),...Array.isArray(n)?n:[n]])});/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const I=(e,t)=>{const o=f.forwardRef(({className:s,...r},n)=>f.createElement(_,{ref:n,iconNode:t,className:L(`lucide-${z(A(e))}`,`lucide-${e}`,s),...r}));return o.displayName=A(e),o};/**
 * @license lucide-react v1.31.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const P=[["path",{d:"M21 12a9 9 0 1 1-6.219-8.56",key:"13zald"}]],U=I("loader-circle",P);function j(e){var t,o,s="";if(typeof e=="string"||typeof e=="number")s+=e;else if(typeof e=="object")if(Array.isArray(e)){var r=e.length;for(t=0;t<r;t++)e[t]&&(o=j(e[t]))&&(s&&(s+=" "),s+=o)}else for(o in e)e[o]&&(s&&(s+=" "),s+=o);return s}function Z(){for(var e,t,o=0,s="",r=arguments.length;o<r;o++)(e=arguments[o])&&(t=j(e))&&(s&&(s+=" "),s+=t);return s}const O=e=>{const t=E.c(31);let o,s,r,n,i,c,m,a,l;t[0]!==e?({children:o,className:s,variant:c,size:m,isLoading:a,disabled:r,icon:n,type:l,...i}=e,t[0]=e,t[1]=o,t[2]=s,t[3]=r,t[4]=n,t[5]=i,t[6]=c,t[7]=m,t[8]=a,t[9]=l):(o=t[1],s=t[2],r=t[3],n=t[4],i=t[5],c=t[6],m=t[7],a=t[8],l=t[9]);const b=c===void 0?"success":c,g=m===void 0?"md":m,d=a===void 0?!1:a,y=l===void 0?"button":l;let u,p,x;if(t[10]!==s||t[11]!==r||t[12]!==d||t[13]!==g||t[14]!==y||t[15]!==b){const N={sm:"px-3 py-1.5 text-xs",md:"px-4 py-2 text-sm",lg:"px-5 py-2.5 text-base"},W={success:"btn-success",edit:"btn-edit",danger:"btn-danger",secondary:"btn-secondary",outline:"btn-outline"};u=y,p=r||d,x=Z("btn-base",W[b],N[g],s),t[10]=s,t[11]=r,t[12]=d,t[13]=g,t[14]=y,t[15]=b,t[16]=u,t[17]=p,t[18]=x}else u=t[16],p=t[17],x=t[18];let h;t[19]!==n||t[20]!==d?(h=d?w.jsx(U,{className:"w-4 h-4 animate-spin"}):n?w.jsx("span",{className:"shrink-0",children:n}):null,t[19]=n,t[20]=d,t[21]=h):h=t[21];let C;t[22]!==o?(C=w.jsx("span",{children:o}),t[22]=o,t[23]=C):C=t[23];let v;return t[24]!==i||t[25]!==u||t[26]!==p||t[27]!==x||t[28]!==h||t[29]!==C?(v=w.jsxs("button",{type:u,disabled:p,className:x,...i,children:[h,C]}),t[24]=i,t[25]=u,t[26]=p,t[27]=x,t[28]=h,t[29]=C,t[30]=v):v=t[30],v};export{O as B,Z as a,I as c};
