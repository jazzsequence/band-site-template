import{n as e}from"./rolldown-runtime-CsOFd3vK.js";import{a as t}from"./iframe-DrCocEIN.js";function n({title:e,album:t,sections:n}){return(0,r.jsxs)(`article`,{className:`mx-auto max-w-xl space-y-10`,children:[(0,r.jsxs)(`header`,{className:`space-y-2`,children:[t&&(0,r.jsx)(`p`,{className:`font-kicker text-2xl text-accent`,children:t}),(0,r.jsx)(`h1`,{className:`text-metal font-display text-4xl font-extrabold uppercase leading-none tracking-[-0.04em] md:text-5xl`,children:e})]}),n.map((e,t)=>(0,r.jsxs)(`section`,{className:`space-y-3`,children:[e.label&&(0,r.jsx)(`h2`,{className:`font-display text-xs uppercase tracking-[0.25em] text-accent-2`,children:e.label}),(0,r.jsx)(`p`,{className:`whitespace-pre-line text-lg leading-8`,children:e.lines.join(`
`)})]},`${t}-${e.label}`))]})}var r;function i(){return(i=e((()=>{r=t(),n.__docgenInfo={description:``,methods:[],displayName:`LyricsBlock`,props:{title:{required:!0,tsType:{name:`string`},description:``},album:{required:!1,tsType:{name:`string`},description:``},sections:{required:!0,tsType:{name:`Array`,elements:[{name:`signature`,type:`object`,raw:`{ label: string; lines: string[] }`,signature:{properties:[{key:`label`,value:{name:`string`,required:!0}},{key:`lines`,value:{name:`Array`,elements:[{name:`string`}],raw:`string[]`,required:!0}}]}}],raw:`LyricSection[]`},description:``}}}})))()}var a,o,s;function c(){return(c=e((()=>{i(),a={title:`Components/LyricsBlock`,component:n},o={args:{title:`First Song`,album:`Debut Album`,sections:[{label:`Verse 1`,lines:[`Placeholder line one`,`Placeholder line two`]},{label:`Chorus`,lines:[`Placeholder chorus line one`,`Placeholder chorus line two`]}]}},s=[`Default`],o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    title: "First Song",
    album: "Debut Album",
    sections: [{
      label: "Verse 1",
      lines: ["Placeholder line one", "Placeholder line two"]
    }, {
      label: "Chorus",
      lines: ["Placeholder chorus line one", "Placeholder chorus line two"]
    }]
  }
}`,...o.parameters?.docs?.source}}}})))()}c();export{o as Default,s as __namedExportsOrder,a as default};