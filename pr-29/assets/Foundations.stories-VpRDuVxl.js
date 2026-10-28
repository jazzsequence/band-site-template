import{n as e}from"./rolldown-runtime-CsOFd3vK.js";import{a as t}from"./iframe-DrCocEIN.js";import{a as n,c as r,d as i,l as a,n as o,o as s,s as c,t as l,u}from"./Wordmark-Cu5vZSuo.js";function d(e){if(!b(e))throw Error(`Not a #rrggbb colour: ${e}`);return[1,3,5].map(t=>parseInt(e.slice(t,t+2),16))}function f([e,t,n]){return`#${[e,t,n].map(e=>Math.round(Math.min(255,Math.max(0,e))).toString(16).padStart(2,`0`)).join(``)}`}function p(e){let[t,n,r]=d(e).map(e=>x(e/255));return .2126*t+.7152*n+.0722*r}function m(e,t){let[n,r]=[p(e),p(t)].sort((e,t)=>t-e);return(n+.05)/(r+.05)}function h(e){let[t,n,r]=d(e).map(e=>x(e/255)),i=Math.cbrt(.4122214708*t+.5363325363*n+.0514459929*r),a=Math.cbrt(.2119034982*t+.6806995451*n+.1073969566*r),o=Math.cbrt(.0883024619*t+.2817188376*n+.6299787005*r),s=.2104542553*i+.793617785*a-.0040720468*o,c=1.9779984951*i-2.428592205*a+.4505937099*o,l=.0259040371*i+.7827717662*a-.808675766*o;return[s,Math.hypot(c,l),Math.atan2(l,c)*180/Math.PI]}function g([e,t,n]){let r=t*Math.cos(n*Math.PI/180),i=t*Math.sin(n*Math.PI/180),a=(e+.3963377774*r+.2158037573*i)**3,o=(e-.1055613458*r-.0638541728*i)**3,s=(e-.0894841775*r-1.291485548*i)**3;return[4.0767416621*a-3.3077115913*o+.2309699292*s,-1.2684380046*a+2.6097574011*o-.3413193965*s,-.0041960863*a-.7034186147*o+1.707614701*s]}function _(e){let[t,n,r]=e,i=0,a=n;if(C(g([t,n,r])))i=n;else for(let e=0;e<24;e++){let e=(i+a)/2;C(g([t,e,r]))?i=e:a=e}return f(g([t,i,r]).map(e=>S(Math.min(1,Math.max(0,e)))*255))}function v(e,t,n){if(m(e,t)>=n)return e;let[r,i,a]=h(e);if(m(_([1,i,a]),t)<n)return null;let o=r,s=1;for(let e=0;e<30;e++){let e=(o+s)/2;m(_([e,i,a]),t)>=n?s=e:o=e}let c=_([s,i,a]);return m(c,t)>=n?c:null}var y,b,x,S,C;function w(){return(w=e((()=>{y=/^#[0-9a-f]{6}$/,b=e=>y.test(e),x=e=>e<=.04045?e/12.92:((e+.055)/1.055)**2.4,S=e=>e<=.0031308?e*12.92:1.055*e**(1/2.4)-.055,C=e=>e.every(e=>e>=-1e-6&&e<=1+1e-6)})))()}function T(e){let t=[];if(typeof e!=`object`||!e||Array.isArray(e))throw new F([`palette must be an object of colour roles`]);let n=e,r={};for(let e of O){let i=n[e];typeof i==`string`?b(i.toLowerCase())?r[e]=i.toLowerCase():t.push(`palette.${e} must be a #rrggbb colour, got ${JSON.stringify(i)}`):t.push(`palette.${e} is missing`)}for(let e of Object.keys(n))O.includes(e)||t.push(`palette.${e} is not a known role`);if(t.length)throw new F(t);return r}function E(e){return P.map(t=>{let n=m(e[t.fg],e[t.bg]);return{...t,ratio:n,ok:n>=A}})}function D(e){let t=[];for(let n of k)p(e[n])>N&&t.push(`palette.${n} (${e[n]}) is too light: this design system is dark-only, so surfaces must be dark`);if(t.length)throw new F(t);let n=[...k].sort((t,n)=>p(e[n])-p(e[t]))[0],r={...e},i=[];for(let a of j){let o=m(e[a],e[n]);if(o>=4.5)continue;let s=v(e[a],e[n],A);s===null?t.push(`palette.${a} (${e[a]}) cannot reach ${A}:1 on ${n} (${e[n]}) even at full lightness; darken the surface`):(r[a]=s,i.push({key:a,from:e[a],to:s,reason:`${I(o)}:1 on ${n}, needs ${A}:1`}))}if(t.length)throw new F(t);let a=E(r).filter(e=>!e.ok);if(a.length)throw new F(a.map(e=>`${e.fg} on ${e.bg} is ${I(e.ratio)}:1, needs ${A}:1`));return{palette:r,adjustments:i}}var O,k,A,j,M,N,P,F,I;function L(){return(L=e((()=>{w(),O=[`void`,`surface`,`raised`,`line`,`text`,`muted`,`dim`,`accent`,`accent-2`,`accent-3`,`metal-hi`,`metal-mid`,`metal-lo`],k=[`void`,`surface`,`raised`],A=4.5,j=[`text`,`muted`,`dim`,`accent`,`accent-2`,`accent-3`,`metal-hi`,`metal-mid`,`metal-lo`],M=[`accent`,`accent-3`,`metal-hi`],N=.1,P=[...j.flatMap(e=>k.map(t=>({fg:e,bg:t}))),...M.map(e=>({fg:`void`,bg:e}))],F=class extends Error{problems;constructor(e){super(`Palette rejected:\n- ${e.join(`
- `)}`),this.problems=e}},I=e=>(Math.floor(e*10)/10).toFixed(1)})))()}function R({pal:e}){let t=E(e);return(0,z.jsxs)(`table`,{className:`w-full max-w-3xl text-left text-sm`,children:[(0,z.jsxs)(`caption`,{className:`mb-2 text-left text-xs uppercase tracking-widest text-dim`,children:[`Every pair the generator gates on, against WCAG AA (`,A,`:1)`]}),(0,z.jsx)(`thead`,{children:(0,z.jsxs)(`tr`,{className:`text-xs uppercase tracking-widest text-dim`,children:[(0,z.jsx)(`th`,{scope:`col`,className:`py-1 pr-4 font-normal`,children:`Text or fill`}),(0,z.jsx)(`th`,{scope:`col`,className:`py-1 pr-4 font-normal`,children:`On`}),(0,z.jsx)(`th`,{scope:`col`,className:`py-1 pr-4 font-normal`,children:`Ratio`}),(0,z.jsx)(`th`,{scope:`col`,className:`py-1 font-normal`,children:`AA`})]})}),(0,z.jsx)(`tbody`,{children:t.map(t=>(0,z.jsxs)(`tr`,{className:`border-t border-line`,children:[(0,z.jsxs)(`td`,{className:`py-1 pr-4`,children:[(0,z.jsx)(`span`,{"aria-hidden":!0,className:`mr-2 inline-block size-3 border border-line align-middle`,style:{background:e[t.fg]}}),t.fg]}),(0,z.jsx)(`td`,{className:`py-1 pr-4 text-muted`,children:t.bg}),(0,z.jsx)(`td`,{className:`py-1 pr-4 tabular-nums`,children:U(e[t.fg],e[t.bg])}),(0,z.jsx)(`td`,{className:`py-1`,children:t.ok?`Pass`:`Fail`})]},`${t.fg}-${t.bg}`))})]})}var z,B,V,H,U,W,G,K,q,J,Y,X,Z,Q;function $(){return($=e((()=>{z=t(),i(),n(),w(),r(),L(),o(),{palette:B,adjustments:V}=D(T(u.palette)),H={void:`Page background`,surface:`Cards, header`,raised:`Raised panels`,line:`Borders`,text:`Body text`,muted:`Secondary text`,dim:`Tertiary text`,accent:`Primary accent`,"accent-2":`Links, labels`,"accent-3":`Focus, secondary actions`,"metal-hi":`Metal, bright`,"metal-mid":`Metal, gradient mid`,"metal-lo":`Metal, dark`},U=(e,t)=>`${(Math.floor(m(e,t)*10)/10).toFixed(1)}:1`,W={title:`Foundations/Color and type`,parameters:{layout:`padded`}},G={render:()=>(0,z.jsx)(`ul`,{className:`grid grid-cols-2 gap-4 md:grid-cols-5`,children:O.map(e=>(0,z.jsxs)(`li`,{className:`overflow-hidden rounded-card border border-line`,children:[(0,z.jsx)(`div`,{className:`h-20`,style:{background:`var(--color-${e})`}}),(0,z.jsxs)(`div`,{className:`space-y-1 bg-surface p-3 text-sm`,children:[(0,z.jsx)(`p`,{className:`font-display text-xs uppercase tracking-widest`,children:e}),(0,z.jsx)(`p`,{className:`tabular-nums text-muted`,children:B[e]}),(0,z.jsxs)(`p`,{className:`text-xs text-dim`,children:[H[e],e!==`void`&&e!==`surface`&&e!==`raised`&&e!==`line`?` (${U(B[e],B.surface)} on surface)`:``]})]})]},e))})},K={name:`Contrast (active palette)`,render:()=>(0,z.jsxs)(`div`,{className:`space-y-4`,children:[V.length>0?(0,z.jsx)(`ul`,{className:`text-sm text-muted`,children:V.map(e=>(0,z.jsxs)(`li`,{children:[e.key,` lifted from `,e.from,` to `,e.to,` (`,e.reason,`)`]},e.key))}):(0,z.jsx)(`p`,{className:`text-sm text-muted`,children:`No colour needed adjusting: band.config.json passes as written.`}),(0,z.jsx)(R,{pal:B})]})},q=D({...B,accent:`#7a1450`,"accent-3":`#1d6f78`,dim:`#4a4468`}),J={name:`Contrast (a failing palette, repaired)`,render:()=>(0,z.jsxs)(`div`,{className:`space-y-4`,children:[(0,z.jsx)(`ul`,{className:`text-sm text-muted`,children:q.adjustments.map(e=>(0,z.jsxs)(`li`,{className:`flex items-center gap-3`,children:[(0,z.jsx)(`span`,{"aria-hidden":!0,className:`inline-block size-4 border border-line`,style:{background:e.from}}),(0,z.jsx)(`span`,{"aria-hidden":!0,children:`→`}),(0,z.jsx)(`span`,{"aria-hidden":!0,className:`inline-block size-4 border border-line`,style:{background:e.to}}),e.key,`: `,e.from,` to `,e.to,` (`,e.reason,`)`]},e.key))}),(0,z.jsx)(R,{pal:q.palette})]})},Y={render:()=>(0,z.jsxs)(`div`,{className:`space-y-4`,children:[(0,z.jsx)(`div`,{className:`h-16 rounded-card`,style:{background:`var(--grad-accent)`}}),(0,z.jsx)(`div`,{className:`h-16 rounded-card`,style:{background:`var(--grad-metal)`}})]})},X=e=>{let t=s[e];return t?`${t.family}${t.variable?`, variable`:`, ${a(t.weights,c[e]).join(`/`)}`}`:null},Z={render:()=>(0,z.jsxs)(`div`,{className:`space-y-8`,children:[(0,z.jsxs)(`div`,{children:[(0,z.jsxs)(`p`,{className:`mb-1 text-xs uppercase tracking-widest text-dim`,children:[`Headings · `,X(`display`),`, -0.04em (typography.display in band.config.json)`]}),(0,z.jsx)(`p`,{className:`text-metal font-display text-6xl font-extrabold uppercase leading-none tracking-[-0.04em]`,children:`Placeholder heading`})]}),(0,z.jsxs)(`div`,{children:[(0,z.jsxs)(`p`,{className:`mb-1 text-xs uppercase tracking-widest text-dim`,children:[`Wordmark · `,s.wordmark?`${X(`wordmark`)}${s.wordmark.uppercase?`, capitals`:``}, -0.05em`:`the display face, as typed`,` (typography.wordmark in band.config.json)`]}),(0,z.jsx)(l,{size:`lg`})]}),(0,z.jsxs)(`div`,{children:[(0,z.jsxs)(`p`,{className:`mb-1 text-xs uppercase tracking-widest text-dim`,children:[`Kickers · `,s.kicker?`${X(`kicker`)}, for kickers and flourishes only`:`the display face`,` (typography.kicker in band.config.json)`]}),(0,z.jsx)(`p`,{className:`font-kicker text-4xl text-accent`,children:`On the road`})]}),(0,z.jsxs)(`div`,{className:`max-w-xl`,children:[(0,z.jsxs)(`p`,{className:`mb-1 text-xs uppercase tracking-widest text-dim`,children:[`Body · `,X(`body`),` (typography.body in band.config.json)`]}),(0,z.jsx)(`p`,{className:`text-lg leading-8`,children:`Placeholder body copy sits at 18px on a 32px line. Replace this sentence with a longer one to judge line length and rhythm.`})]})]})},Q=[`Palette`,`Contrast`,`AdjustedExample`,`Gradients`,`Typography`],G.parameters={...G.parameters,docs:{...G.parameters?.docs,source:{originalSource:`{
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
}`,...G.parameters?.docs?.source}}},K.parameters={...K.parameters,docs:{...K.parameters?.docs,source:{originalSource:`{
  name: "Contrast (active palette)",
  render: () => <div className="space-y-4">
      {adjustments.length > 0 ? <ul className="text-sm text-muted">
          {adjustments.map(a => <li key={a.key}>
              {a.key} lifted from {a.from} to {a.to} ({a.reason})
            </li>)}
        </ul> : <p className="text-sm text-muted">No colour needed adjusting: band.config.json passes as written.</p>}
      <PairTable pal={palette} />
    </div>
}`,...K.parameters?.docs?.source}}},J.parameters={...J.parameters,docs:{...J.parameters?.docs,source:{originalSource:`{
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
}`,...J.parameters?.docs?.source}}},Y.parameters={...Y.parameters,docs:{...Y.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-4">
      <div className="h-16 rounded-card" style={{
      background: "var(--grad-accent)"
    }} />
      <div className="h-16 rounded-card" style={{
      background: "var(--grad-metal)"
    }} />
    </div>
}`,...Y.parameters?.docs?.source}}},Z.parameters={...Z.parameters,docs:{...Z.parameters?.docs,source:{originalSource:`{
  render: () => <div className="space-y-8">
      <div>
        <p className="mb-1 text-xs uppercase tracking-widest text-dim">Headings · {faceNote("display")}, -0.04em (typography.display in band.config.json)</p>
        <p className="text-metal font-display text-6xl font-extrabold uppercase leading-none tracking-[-0.04em]">Placeholder heading</p>
      </div>
      <div>
        <p className="mb-1 text-xs uppercase tracking-widest text-dim">
          Wordmark · {typography.wordmark ? \`\${faceNote("wordmark")}\${typography.wordmark.uppercase ? ", capitals" : ""}, -0.05em\` : "the display face, as typed"} (typography.wordmark in band.config.json)
        </p>
        <Wordmark size="lg" />
      </div>
      <div>
        <p className="mb-1 text-xs uppercase tracking-widest text-dim">
          Kickers · {typography.kicker ? \`\${faceNote("kicker")}, for kickers and flourishes only\` : "the display face"} (typography.kicker in band.config.json)
        </p>
        <p className="font-kicker text-4xl text-accent">On the road</p>
      </div>
      <div className="max-w-xl">
        <p className="mb-1 text-xs uppercase tracking-widest text-dim">Body · {faceNote("body")} (typography.body in band.config.json)</p>
        <p className="text-lg leading-8">Placeholder body copy sits at 18px on a 32px line. Replace this sentence with a longer one to judge line length and rhythm.</p>
      </div>
    </div>
}`,...Z.parameters?.docs?.source}}}})))()}$();export{J as AdjustedExample,K as Contrast,Y as Gradients,G as Palette,Z as Typography,Q as __namedExportsOrder,W as default};