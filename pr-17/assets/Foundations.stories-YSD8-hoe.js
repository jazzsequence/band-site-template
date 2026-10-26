import{n as e}from"./rolldown-runtime-CsOFd3vK.js";import{a as t}from"./iframe-CVwPnmUY.js";import{a as n,c as r,n as i,o as a,s as o,t as s}from"./Wordmark-CSZzs3MC.js";function c(e){if(!_(e))throw Error(`Not a #rrggbb colour: ${e}`);return[1,3,5].map(t=>parseInt(e.slice(t,t+2),16))}function l([e,t,n]){return`#${[e,t,n].map(e=>Math.round(Math.min(255,Math.max(0,e))).toString(16).padStart(2,`0`)).join(``)}`}function u(e){let[t,n,r]=c(e).map(e=>v(e/255));return .2126*t+.7152*n+.0722*r}function d(e,t){let[n,r]=[u(e),u(t)].sort((e,t)=>t-e);return(n+.05)/(r+.05)}function f(e){let[t,n,r]=c(e).map(e=>v(e/255)),i=Math.cbrt(.4122214708*t+.5363325363*n+.0514459929*r),a=Math.cbrt(.2119034982*t+.6806995451*n+.1073969566*r),o=Math.cbrt(.0883024619*t+.2817188376*n+.6299787005*r),s=.2104542553*i+.793617785*a-.0040720468*o,l=1.9779984951*i-2.428592205*a+.4505937099*o,u=.0259040371*i+.7827717662*a-.808675766*o;return[s,Math.hypot(l,u),Math.atan2(u,l)*180/Math.PI]}function p([e,t,n]){let r=t*Math.cos(n*Math.PI/180),i=t*Math.sin(n*Math.PI/180),a=(e+.3963377774*r+.2158037573*i)**3,o=(e-.1055613458*r-.0638541728*i)**3,s=(e-.0894841775*r-1.291485548*i)**3;return[4.0767416621*a-3.3077115913*o+.2309699292*s,-1.2684380046*a+2.6097574011*o-.3413193965*s,-.0041960863*a-.7034186147*o+1.707614701*s]}function m(e){let[t,n,r]=e,i=0,a=n;if(b(p([t,n,r])))i=n;else for(let e=0;e<24;e++){let e=(i+a)/2;b(p([t,e,r]))?i=e:a=e}return l(p([t,i,r]).map(e=>y(Math.min(1,Math.max(0,e)))*255))}function h(e,t,n){if(d(e,t)>=n)return e;let[r,i,a]=f(e);if(d(m([1,i,a]),t)<n)return null;let o=r,s=1;for(let e=0;e<30;e++){let e=(o+s)/2;d(m([e,i,a]),t)>=n?s=e:o=e}let c=m([s,i,a]);return d(c,t)>=n?c:null}var g,_,v,y,b;function x(){return(x=e((()=>{g=/^#[0-9a-f]{6}$/,_=e=>g.test(e),v=e=>e<=.04045?e/12.92:((e+.055)/1.055)**2.4,y=e=>e<=.0031308?e*12.92:1.055*e**(1/2.4)-.055,b=e=>e.every(e=>e>=-1e-6&&e<=1+1e-6)})))()}function S(e){let t=[];if(typeof e!=`object`||!e||Array.isArray(e))throw new M([`palette must be an object of colour roles`]);let n=e,r={};for(let e of T){let i=n[e];typeof i==`string`?_(i.toLowerCase())?r[e]=i.toLowerCase():t.push(`palette.${e} must be a #rrggbb colour, got ${JSON.stringify(i)}`):t.push(`palette.${e} is missing`)}for(let e of Object.keys(n))T.includes(e)||t.push(`palette.${e} is not a known role`);if(t.length)throw new M(t);return r}function C(e){return j.map(t=>{let n=d(e[t.fg],e[t.bg]);return{...t,ratio:n,ok:n>=D}})}function w(e){let t=[];for(let n of E)u(e[n])>A&&t.push(`palette.${n} (${e[n]}) is too light: this design system is dark-only, so surfaces must be dark`);if(t.length)throw new M(t);let n=[...E].sort((t,n)=>u(e[n])-u(e[t]))[0],r={...e},i=[];for(let a of O){let o=d(e[a],e[n]);if(o>=4.5)continue;let s=h(e[a],e[n],D);s===null?t.push(`palette.${a} (${e[a]}) cannot reach ${D}:1 on ${n} (${e[n]}) even at full lightness; darken the surface`):(r[a]=s,i.push({key:a,from:e[a],to:s,reason:`${N(o)}:1 on ${n}, needs ${D}:1`}))}if(t.length)throw new M(t);let a=C(r).filter(e=>!e.ok);if(a.length)throw new M(a.map(e=>`${e.fg} on ${e.bg} is ${N(e.ratio)}:1, needs ${D}:1`));return{palette:r,adjustments:i}}var T,E,D,O,k,A,j,M,N;function P(){return(P=e((()=>{x(),T=[`void`,`surface`,`raised`,`line`,`text`,`muted`,`dim`,`accent`,`accent-2`,`accent-3`,`metal-hi`,`metal-mid`,`metal-lo`],E=[`void`,`surface`,`raised`],D=4.5,O=[`text`,`muted`,`dim`,`accent`,`accent-2`,`accent-3`,`metal-hi`,`metal-mid`,`metal-lo`],k=[`accent`,`accent-3`,`metal-hi`],A=.1,j=[...O.flatMap(e=>E.map(t=>({fg:e,bg:t}))),...k.map(e=>({fg:`void`,bg:e}))],M=class extends Error{problems;constructor(e){super(`Palette rejected:\n- ${e.join(`
- `)}`),this.problems=e}},N=e=>(Math.floor(e*10)/10).toFixed(1)})))()}function F({pal:e}){let t=C(e);return(0,I.jsxs)(`table`,{className:`w-full max-w-3xl text-left text-sm`,children:[(0,I.jsxs)(`caption`,{className:`mb-2 text-left text-xs uppercase tracking-widest text-dim`,children:[`Every pair the generator gates on, against WCAG AA (`,D,`:1)`]}),(0,I.jsx)(`thead`,{children:(0,I.jsxs)(`tr`,{className:`text-xs uppercase tracking-widest text-dim`,children:[(0,I.jsx)(`th`,{scope:`col`,className:`py-1 pr-4 font-normal`,children:`Text or fill`}),(0,I.jsx)(`th`,{scope:`col`,className:`py-1 pr-4 font-normal`,children:`On`}),(0,I.jsx)(`th`,{scope:`col`,className:`py-1 pr-4 font-normal`,children:`Ratio`}),(0,I.jsx)(`th`,{scope:`col`,className:`py-1 font-normal`,children:`AA`})]})}),(0,I.jsx)(`tbody`,{children:t.map(t=>(0,I.jsxs)(`tr`,{className:`border-t border-line`,children:[(0,I.jsxs)(`td`,{className:`py-1 pr-4`,children:[(0,I.jsx)(`span`,{"aria-hidden":!0,className:`mr-2 inline-block size-3 border border-line align-middle`,style:{background:e[t.fg]}}),t.fg]}),(0,I.jsx)(`td`,{className:`py-1 pr-4 text-muted`,children:t.bg}),(0,I.jsx)(`td`,{className:`py-1 pr-4 tabular-nums`,children:B(e[t.fg],e[t.bg])}),(0,I.jsx)(`td`,{className:`py-1`,children:t.ok?`Pass`:`Fail`})]},`${t.fg}-${t.bg}`))})]})}var I,L,R,z,B,V,H,U,W,G,K,q,J;function Y(){return(Y=e((()=>{I=t(),r(),n(),x(),P(),i(),{palette:L,adjustments:R}=w(S(o.palette)),z={void:`Page background`,surface:`Cards, header`,raised:`Raised panels`,line:`Borders`,text:`Body text`,muted:`Secondary text`,dim:`Tertiary text`,accent:`Primary accent`,"accent-2":`Links, labels`,"accent-3":`Focus, secondary actions`,"metal-hi":`Metal, bright`,"metal-mid":`Metal, gradient mid`,"metal-lo":`Metal, dark`},B=(e,t)=>`${(Math.floor(d(e,t)*10)/10).toFixed(1)}:1`,V={title:`Foundations/Color and type`,parameters:{layout:`padded`}},H={render:()=>(0,I.jsx)(`ul`,{className:`grid grid-cols-2 gap-4 md:grid-cols-5`,children:T.map(e=>(0,I.jsxs)(`li`,{className:`overflow-hidden rounded-card border border-line`,children:[(0,I.jsx)(`div`,{className:`h-20`,style:{background:`var(--color-${e})`}}),(0,I.jsxs)(`div`,{className:`space-y-1 bg-surface p-3 text-sm`,children:[(0,I.jsx)(`p`,{className:`font-display text-xs uppercase tracking-widest`,children:e}),(0,I.jsx)(`p`,{className:`tabular-nums text-muted`,children:L[e]}),(0,I.jsxs)(`p`,{className:`text-xs text-dim`,children:[z[e],e!==`void`&&e!==`surface`&&e!==`raised`&&e!==`line`?` (${B(L[e],L.surface)} on surface)`:``]})]})]},e))})},U={name:`Contrast (active palette)`,render:()=>(0,I.jsxs)(`div`,{className:`space-y-4`,children:[R.length>0?(0,I.jsx)(`ul`,{className:`text-sm text-muted`,children:R.map(e=>(0,I.jsxs)(`li`,{children:[e.key,` lifted from `,e.from,` to `,e.to,` (`,e.reason,`)`]},e.key))}):(0,I.jsx)(`p`,{className:`text-sm text-muted`,children:`No colour needed adjusting: band.config.json passes as written.`}),(0,I.jsx)(F,{pal:L})]})},W=w({...L,accent:`#7a1450`,"accent-3":`#1d6f78`,dim:`#4a4468`}),G={name:`Contrast (a failing palette, repaired)`,render:()=>(0,I.jsxs)(`div`,{className:`space-y-4`,children:[(0,I.jsx)(`ul`,{className:`text-sm text-muted`,children:W.adjustments.map(e=>(0,I.jsxs)(`li`,{className:`flex items-center gap-3`,children:[(0,I.jsx)(`span`,{"aria-hidden":!0,className:`inline-block size-4 border border-line`,style:{background:e.from}}),(0,I.jsx)(`span`,{"aria-hidden":!0,children:`→`}),(0,I.jsx)(`span`,{"aria-hidden":!0,className:`inline-block size-4 border border-line`,style:{background:e.to}}),e.key,`: `,e.from,` to `,e.to,` (`,e.reason,`)`]},e.key))}),(0,I.jsx)(F,{pal:W.palette})]})},K={render:()=>(0,I.jsxs)(`div`,{className:`space-y-4`,children:[(0,I.jsx)(`div`,{className:`h-16 rounded-card`,style:{background:`var(--grad-accent)`}}),(0,I.jsx)(`div`,{className:`h-16 rounded-card`,style:{background:`var(--grad-metal)`}})]})},q={render:()=>(0,I.jsxs)(`div`,{className:`space-y-8`,children:[(0,I.jsxs)(`div`,{children:[(0,I.jsx)(`p`,{className:`mb-1 text-xs uppercase tracking-widest text-dim`,children:`Headings · Encode Sans Expanded 800, -0.04em`}),(0,I.jsx)(`p`,{className:`text-metal font-display text-6xl font-extrabold uppercase leading-none tracking-[-0.04em]`,children:`Placeholder heading`})]}),(0,I.jsxs)(`div`,{children:[(0,I.jsxs)(`p`,{className:`mb-1 text-xs uppercase tracking-widest text-dim`,children:[`Wordmark · `,a.wordmarkFace?`Unbounded, capitals, -0.05em`:`the display face, as typed`,` (typography.wordmarkFace in band.config.json)`]}),(0,I.jsx)(s,{size:`lg`})]}),(0,I.jsxs)(`div`,{children:[(0,I.jsxs)(`p`,{className:`mb-1 text-xs uppercase tracking-widest text-dim`,children:[`Kickers · `,a.accentFace?`UnifrakturCook, for kickers and flourishes only`:`the display face`,` (typography.accentFace in band.config.json)`]}),(0,I.jsx)(`p`,{className:`font-gothic text-4xl text-accent`,children:`On the road`})]}),(0,I.jsxs)(`div`,{className:`max-w-xl`,children:[(0,I.jsx)(`p`,{className:`mb-1 text-xs uppercase tracking-widest text-dim`,children:`Body · Space Grotesk`}),(0,I.jsx)(`p`,{className:`text-lg leading-8`,children:`Placeholder body copy sits at 18px on a 32px line. Replace this sentence with a longer one to judge line length and rhythm.`})]})]})},J=[`Palette`,`Contrast`,`AdjustedExample`,`Gradients`,`Typography`],H.parameters={...H.parameters,docs:{...H.parameters?.docs,source:{originalSource:`{
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
}`,...H.parameters?.docs?.source}}},U.parameters={...U.parameters,docs:{...U.parameters?.docs,source:{originalSource:`{
  name: "Contrast (active palette)",
  render: () => <div className="space-y-4">
      {adjustments.length > 0 ? <ul className="text-sm text-muted">
          {adjustments.map(a => <li key={a.key}>
              {a.key} lifted from {a.from} to {a.to} ({a.reason})
            </li>)}
        </ul> : <p className="text-sm text-muted">No colour needed adjusting: band.config.json passes as written.</p>}
      <PairTable pal={palette} />
    </div>
}`,...U.parameters?.docs?.source}}},G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
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
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-4">
      <div className="h-16 rounded-card" style={{
      background: "var(--grad-accent)"
    }} />
      <div className="h-16 rounded-card" style={{
      background: "var(--grad-metal)"
    }} />
    </div>
}`,...K.parameters?.docs?.source}}},q.parameters={...q.parameters,docs:{...q.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-8">
      <div>
        <p className="mb-1 text-xs uppercase tracking-widest text-dim">Headings · Encode Sans Expanded 800, -0.04em</p>
        <p className="text-metal font-display text-6xl font-extrabold uppercase leading-none tracking-[-0.04em]">Placeholder heading</p>
      </div>
      <div>
        <p className="mb-1 text-xs uppercase tracking-widest text-dim">
          Wordmark · {typography.wordmarkFace ? "Unbounded, capitals, -0.05em" : "the display face, as typed"} (typography.wordmarkFace in band.config.json)
        </p>
        <Wordmark size="lg" />
      </div>
      <div>
        <p className="mb-1 text-xs uppercase tracking-widest text-dim">
          Kickers · {typography.accentFace ? "UnifrakturCook, for kickers and flourishes only" : "the display face"} (typography.accentFace in band.config.json)
        </p>
        <p className="font-gothic text-4xl text-accent">On the road</p>
      </div>
      <div className="max-w-xl">
        <p className="mb-1 text-xs uppercase tracking-widest text-dim">Body · Space Grotesk</p>
        <p className="text-lg leading-8">Placeholder body copy sits at 18px on a 32px line. Replace this sentence with a longer one to judge line length and rhythm.</p>
      </div>
    </div>
}`,...q.parameters?.docs?.source}}}})))()}Y();export{G as AdjustedExample,U as Contrast,K as Gradients,H as Palette,q as Typography,J as __namedExportsOrder,V as default};