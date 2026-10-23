import{n as e}from"./rolldown-runtime-CsOFd3vK.js";import{a as t}from"./iframe-CwvoiAPh.js";var n,r;function i(){return(i=e((()=>{n={void:`#07050d`,surface:`#0e0a18`,raised:`#17112a`,line:`#2c2250`,text:`#f5f0ff`,muted:`#b9aed6`,dim:`#8f84ad`,accent:`#ff3fa4`,"accent-2":`#a98bff`,"accent-3":`#3ef0ff`,"metal-hi":`#f1effa`,"metal-mid":`#d9d6ea`,"metal-lo":`#8d8aa6`},r={palette:n}})))()}function a(e){if(!m(e))throw Error(`Not a #rrggbb colour: ${e}`);return[1,3,5].map(t=>parseInt(e.slice(t,t+2),16))}function o([e,t,n]){return`#${[e,t,n].map(e=>Math.round(Math.min(255,Math.max(0,e))).toString(16).padStart(2,`0`)).join(``)}`}function s(e){let[t,n,r]=a(e).map(e=>h(e/255));return .2126*t+.7152*n+.0722*r}function c(e,t){let[n,r]=[s(e),s(t)].sort((e,t)=>t-e);return(n+.05)/(r+.05)}function l(e){let[t,n,r]=a(e).map(e=>h(e/255)),i=Math.cbrt(.4122214708*t+.5363325363*n+.0514459929*r),o=Math.cbrt(.2119034982*t+.6806995451*n+.1073969566*r),s=Math.cbrt(.0883024619*t+.2817188376*n+.6299787005*r),c=.2104542553*i+.793617785*o-.0040720468*s,l=1.9779984951*i-2.428592205*o+.4505937099*s,u=.0259040371*i+.7827717662*o-.808675766*s;return[c,Math.hypot(l,u),Math.atan2(u,l)*180/Math.PI]}function u([e,t,n]){let r=t*Math.cos(n*Math.PI/180),i=t*Math.sin(n*Math.PI/180),a=(e+.3963377774*r+.2158037573*i)**3,o=(e-.1055613458*r-.0638541728*i)**3,s=(e-.0894841775*r-1.291485548*i)**3;return[4.0767416621*a-3.3077115913*o+.2309699292*s,-1.2684380046*a+2.6097574011*o-.3413193965*s,-.0041960863*a-.7034186147*o+1.707614701*s]}function d(e){let[t,n,r]=e,i=0,a=n;if(_(u([t,n,r])))i=n;else for(let e=0;e<24;e++){let e=(i+a)/2;_(u([t,e,r]))?i=e:a=e}return o(u([t,i,r]).map(e=>g(Math.min(1,Math.max(0,e)))*255))}function f(e,t,n){if(c(e,t)>=n)return e;let[r,i,a]=l(e);if(c(d([1,i,a]),t)<n)return null;let o=r,s=1;for(let e=0;e<30;e++){let e=(o+s)/2;c(d([e,i,a]),t)>=n?s=e:o=e}let u=d([s,i,a]);return c(u,t)>=n?u:null}var p,m,h,g,_;function v(){return(v=e((()=>{p=/^#[0-9a-f]{6}$/,m=e=>p.test(e),h=e=>e<=.04045?e/12.92:((e+.055)/1.055)**2.4,g=e=>e<=.0031308?e*12.92:1.055*e**(1/2.4)-.055,_=e=>e.every(e=>e>=-1e-6&&e<=1+1e-6)})))()}function y(e){let t=[];if(typeof e!=`object`||!e||Array.isArray(e))throw new k([`palette must be an object of colour roles`]);let n=e,r={};for(let e of S){let i=n[e];typeof i==`string`?m(i.toLowerCase())?r[e]=i.toLowerCase():t.push(`palette.${e} must be a #rrggbb colour, got ${JSON.stringify(i)}`):t.push(`palette.${e} is missing`)}for(let e of Object.keys(n))S.includes(e)||t.push(`palette.${e} is not a known role`);if(t.length)throw new k(t);return r}function b(e){return O.map(t=>{let n=c(e[t.fg],e[t.bg]);return{...t,ratio:n,ok:n>=w}})}function x(e){let t=[];for(let n of C)s(e[n])>D&&t.push(`palette.${n} (${e[n]}) is too light: this design system is dark-only, so surfaces must be dark`);if(t.length)throw new k(t);let n=[...C].sort((t,n)=>s(e[n])-s(e[t]))[0],r={...e},i=[];for(let a of T){let o=c(e[a],e[n]);if(o>=4.5)continue;let s=f(e[a],e[n],w);s===null?t.push(`palette.${a} (${e[a]}) cannot reach ${w}:1 on ${n} (${e[n]}) even at full lightness; darken the surface`):(r[a]=s,i.push({key:a,from:e[a],to:s,reason:`${A(o)}:1 on ${n}, needs ${w}:1`}))}if(t.length)throw new k(t);let a=b(r).filter(e=>!e.ok);if(a.length)throw new k(a.map(e=>`${e.fg} on ${e.bg} is ${A(e.ratio)}:1, needs ${w}:1`));return{palette:r,adjustments:i}}var S,C,w,T,E,D,O,k,A;function j(){return(j=e((()=>{v(),S=[`void`,`surface`,`raised`,`line`,`text`,`muted`,`dim`,`accent`,`accent-2`,`accent-3`,`metal-hi`,`metal-mid`,`metal-lo`],C=[`void`,`surface`,`raised`],w=4.5,T=[`text`,`muted`,`dim`,`accent`,`accent-2`,`accent-3`,`metal-hi`,`metal-mid`,`metal-lo`],E=[`accent`,`accent-3`,`metal-hi`],D=.1,O=[...T.flatMap(e=>C.map(t=>({fg:e,bg:t}))),...E.map(e=>({fg:`void`,bg:e}))],k=class extends Error{problems;constructor(e){super(`Palette rejected:\n- ${e.join(`
- `)}`),this.problems=e}},A=e=>(Math.floor(e*10)/10).toFixed(1)})))()}function M({pal:e}){let t=b(e);return(0,N.jsxs)(`table`,{className:`w-full max-w-3xl text-left text-sm`,children:[(0,N.jsxs)(`caption`,{className:`mb-2 text-left text-xs uppercase tracking-widest text-dim`,children:[`Every pair the generator gates on, against WCAG AA (`,w,`:1)`]}),(0,N.jsx)(`thead`,{children:(0,N.jsxs)(`tr`,{className:`text-xs uppercase tracking-widest text-dim`,children:[(0,N.jsx)(`th`,{scope:`col`,className:`py-1 pr-4 font-normal`,children:`Text or fill`}),(0,N.jsx)(`th`,{scope:`col`,className:`py-1 pr-4 font-normal`,children:`On`}),(0,N.jsx)(`th`,{scope:`col`,className:`py-1 pr-4 font-normal`,children:`Ratio`}),(0,N.jsx)(`th`,{scope:`col`,className:`py-1 font-normal`,children:`AA`})]})}),(0,N.jsx)(`tbody`,{children:t.map(t=>(0,N.jsxs)(`tr`,{className:`border-t border-line`,children:[(0,N.jsxs)(`td`,{className:`py-1 pr-4`,children:[(0,N.jsx)(`span`,{"aria-hidden":!0,className:`mr-2 inline-block size-3 border border-line align-middle`,style:{background:e[t.fg]}}),t.fg]}),(0,N.jsx)(`td`,{className:`py-1 pr-4 text-muted`,children:t.bg}),(0,N.jsx)(`td`,{className:`py-1 pr-4 tabular-nums`,children:L(e[t.fg],e[t.bg])}),(0,N.jsx)(`td`,{className:`py-1`,children:t.ok?`Pass`:`Fail`})]},`${t.fg}-${t.bg}`))})]})}var N,P,F,I,L,R,z,B,V,H,U,W,G;function K(){return(K=e((()=>{N=t(),i(),v(),j(),{palette:P,adjustments:F}=x(y(r.palette)),I={void:`Page background`,surface:`Cards, header`,raised:`Raised panels`,line:`Borders`,text:`Body text`,muted:`Secondary text`,dim:`Tertiary text`,accent:`Primary accent`,"accent-2":`Links, labels`,"accent-3":`Focus, secondary actions`,"metal-hi":`Metal, bright`,"metal-mid":`Metal, gradient mid`,"metal-lo":`Metal, dark`},L=(e,t)=>`${(Math.floor(c(e,t)*10)/10).toFixed(1)}:1`,R={title:`Foundations/Color and type`,parameters:{layout:`padded`}},z={render:()=>(0,N.jsx)(`ul`,{className:`grid grid-cols-2 gap-4 md:grid-cols-5`,children:S.map(e=>(0,N.jsxs)(`li`,{className:`overflow-hidden rounded-card border border-line`,children:[(0,N.jsx)(`div`,{className:`h-20`,style:{background:`var(--color-${e})`}}),(0,N.jsxs)(`div`,{className:`space-y-1 bg-surface p-3 text-sm`,children:[(0,N.jsx)(`p`,{className:`font-display text-xs uppercase tracking-widest`,children:e}),(0,N.jsx)(`p`,{className:`tabular-nums text-muted`,children:P[e]}),(0,N.jsxs)(`p`,{className:`text-xs text-dim`,children:[I[e],e!==`void`&&e!==`surface`&&e!==`raised`&&e!==`line`?` (${L(P[e],P.surface)} on surface)`:``]})]})]},e))})},B={name:`Contrast (active palette)`,render:()=>(0,N.jsxs)(`div`,{className:`space-y-4`,children:[F.length>0?(0,N.jsx)(`ul`,{className:`text-sm text-muted`,children:F.map(e=>(0,N.jsxs)(`li`,{children:[e.key,` lifted from `,e.from,` to `,e.to,` (`,e.reason,`)`]},e.key))}):(0,N.jsx)(`p`,{className:`text-sm text-muted`,children:`No colour needed adjusting: band.config.json passes as written.`}),(0,N.jsx)(M,{pal:P})]})},V=x({...P,accent:`#7a1450`,"accent-3":`#1d6f78`,dim:`#4a4468`}),H={name:`Contrast (a failing palette, repaired)`,render:()=>(0,N.jsxs)(`div`,{className:`space-y-4`,children:[(0,N.jsx)(`ul`,{className:`text-sm text-muted`,children:V.adjustments.map(e=>(0,N.jsxs)(`li`,{className:`flex items-center gap-3`,children:[(0,N.jsx)(`span`,{"aria-hidden":!0,className:`inline-block size-4 border border-line`,style:{background:e.from}}),(0,N.jsx)(`span`,{"aria-hidden":!0,children:`→`}),(0,N.jsx)(`span`,{"aria-hidden":!0,className:`inline-block size-4 border border-line`,style:{background:e.to}}),e.key,`: `,e.from,` to `,e.to,` (`,e.reason,`)`]},e.key))}),(0,N.jsx)(M,{pal:V.palette})]})},U={render:()=>(0,N.jsxs)(`div`,{className:`space-y-4`,children:[(0,N.jsx)(`div`,{className:`h-16 rounded-card`,style:{background:`var(--grad-accent)`}}),(0,N.jsx)(`div`,{className:`h-16 rounded-card`,style:{background:`var(--grad-metal)`}})]})},W={render:()=>(0,N.jsxs)(`div`,{className:`space-y-8`,children:[(0,N.jsxs)(`div`,{children:[(0,N.jsx)(`p`,{className:`mb-1 text-xs uppercase tracking-widest text-dim`,children:`Headings · Encode Sans Expanded 800, -0.04em`}),(0,N.jsx)(`p`,{className:`text-metal font-display text-6xl font-extrabold uppercase leading-none tracking-[-0.04em]`,children:`Well Enough`})]}),(0,N.jsxs)(`div`,{children:[(0,N.jsx)(`p`,{className:`mb-1 text-xs uppercase tracking-widest text-dim`,children:`Wordmark · Unbounded, always capitals, -0.05em`}),(0,N.jsx)(`p`,{className:`font-wordmark text-5xl font-extrabold uppercase tracking-[-0.05em] text-text`,children:`Paris`})]}),(0,N.jsxs)(`div`,{children:[(0,N.jsx)(`p`,{className:`mb-1 text-xs uppercase tracking-widest text-dim`,children:`Accent · UnifrakturCook (kickers and flourishes only, never the PARIS name)`}),(0,N.jsx)(`p`,{className:`font-gothic text-4xl text-accent`,children:`On the road`})]}),(0,N.jsxs)(`div`,{className:`max-w-xl`,children:[(0,N.jsx)(`p`,{className:`mb-1 text-xs uppercase tracking-widest text-dim`,children:`Body · Space Grotesk`}),(0,N.jsx)(`p`,{className:`text-lg leading-8`,children:`They sell you fear in holy clothes and call it protecting you. Body copy sits at 18px on a 32px line.`})]})]})},G=[`Palette`,`Contrast`,`AdjustedExample`,`Gradients`,`Typography`],z.parameters={...z.parameters,docs:{...z.parameters?.docs,source:{originalSource:`{
  render: () => <ul className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {PALETTE_KEYS.map(name => <li key={name} className="overflow-hidden rounded-card border border-line">
          <div className="h-20" style={{
        background: \`var(--color-\${name})\`
      }} />
          <div className="space-y-1 bg-surface p-3 text-sm">
            <p className="font-display text-xs uppercase tracking-widest">{name}</p>
            <p className="tabular-nums text-muted">{palette[name]}</p>
            <p className="text-xs text-dim">
              {NOTES[name]}
              {name !== "void" && name !== "surface" && name !== "raised" && name !== "line" ? \` (\${ratio(palette[name], palette.surface)} on surface)\` : ""}
            </p>
          </div>
        </li>)}
    </ul>
}`,...z.parameters?.docs?.source}}},B.parameters={...B.parameters,docs:{...B.parameters?.docs,source:{originalSource:`{
  name: "Contrast (active palette)",
  render: () => <div className="space-y-4">
      {adjustments.length > 0 ? <ul className="text-sm text-muted">
          {adjustments.map(a => <li key={a.key}>
              {a.key} lifted from {a.from} to {a.to} ({a.reason})
            </li>)}
        </ul> : <p className="text-sm text-muted">No colour needed adjusting: band.config.json passes as written.</p>}
      <PairTable pal={palette} />
    </div>
}`,...B.parameters?.docs?.source}}},H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
  name: "Contrast (a failing palette, repaired)",
  render: () => <div className="space-y-4">
      <ul className="text-sm text-muted">
        {dim.adjustments.map(a => <li key={a.key} className="flex items-center gap-3">
            <span aria-hidden className="inline-block size-4 border border-line" style={{
          background: a.from
        }} />
            <span aria-hidden>→</span>
            <span aria-hidden className="inline-block size-4 border border-line" style={{
          background: a.to
        }} />
            {a.key}: {a.from} to {a.to} ({a.reason})
          </li>)}
      </ul>
      <PairTable pal={dim.palette} />
    </div>
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-4">
      <div className="h-16 rounded-card" style={{
      background: "var(--grad-accent)"
    }} />
      <div className="h-16 rounded-card" style={{
      background: "var(--grad-metal)"
    }} />
    </div>
}`,...U.parameters?.docs?.source}}},W.parameters={...W.parameters,docs:{...W.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-8">
      <div>
        <p className="mb-1 text-xs uppercase tracking-widest text-dim">Headings · Encode Sans Expanded 800, -0.04em</p>
        <p className="text-metal font-display text-6xl font-extrabold uppercase leading-none tracking-[-0.04em]">Well Enough</p>
      </div>
      <div>
        <p className="mb-1 text-xs uppercase tracking-widest text-dim">Wordmark · Unbounded, always capitals, -0.05em</p>
        <p className="font-wordmark text-5xl font-extrabold uppercase tracking-[-0.05em] text-text">Paris</p>
      </div>
      <div>
        <p className="mb-1 text-xs uppercase tracking-widest text-dim">Accent · UnifrakturCook (kickers and flourishes only, never the PARIS name)</p>
        <p className="font-gothic text-4xl text-accent">On the road</p>
      </div>
      <div className="max-w-xl">
        <p className="mb-1 text-xs uppercase tracking-widest text-dim">Body · Space Grotesk</p>
        <p className="text-lg leading-8">They sell you fear in holy clothes and call it protecting you. Body copy sits at 18px on a 32px line.</p>
      </div>
    </div>
}`,...W.parameters?.docs?.source}}}})))()}K();export{H as AdjustedExample,B as Contrast,U as Gradients,z as Palette,W as Typography,G as __namedExportsOrder,R as default};