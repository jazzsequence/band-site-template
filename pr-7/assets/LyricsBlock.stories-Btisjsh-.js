import{n as e}from"./rolldown-runtime-CsOFd3vK.js";import{a as t}from"./iframe-feJbRxW8.js";import{n,t as r}from"./lang-C03raMOm.js";function i({title:e,album:t,sections:r}){return(0,a.jsxs)(`article`,{className:`mx-auto max-w-xl space-y-10`,children:[(0,a.jsxs)(`header`,{className:`space-y-2`,children:[t&&(0,a.jsx)(`p`,{className:`font-gothic text-2xl text-magenta`,children:t}),(0,a.jsx)(`h1`,{lang:n(e),className:`text-chrome font-display text-4xl font-extrabold uppercase leading-none tracking-[-0.04em] md:text-5xl`,children:e})]}),r.map((e,t)=>(0,a.jsxs)(`section`,{className:`space-y-3`,children:[e.label&&(0,a.jsx)(`h2`,{className:`font-display text-xs uppercase tracking-[0.25em] text-violet`,children:e.label}),(0,a.jsx)(`p`,{lang:n(e.lines.join(` `)),className:`whitespace-pre-line text-lg leading-8`,children:e.lines.join(`
`)})]},`${t}-${e.label}`))]})}var a;function o(){return(o=e((()=>{a=t(),r(),i.__docgenInfo={description:``,methods:[],displayName:`LyricsBlock`,props:{title:{required:!0,tsType:{name:`string`},description:``},album:{required:!1,tsType:{name:`string`},description:``},sections:{required:!0,tsType:{name:`Array`,elements:[{name:`signature`,type:`object`,raw:`{ label: string; lines: string[] }`,signature:{properties:[{key:`label`,value:{name:`string`,required:!0}},{key:`lines`,value:{name:`Array`,elements:[{name:`string`}],raw:`string[]`,required:!0}}]}}],raw:`LyricSection[]`},description:``}}}})))()}var s,c,l;function u(){return(u=e((()=>{o(),s={title:`Components/LyricsBlock`,component:i},c={args:{title:`Consent of the Quiet`,album:`Well Enough`,sections:[{label:`Pre-Chorus`,lines:[`Don’t scream`,`They love you better when you don’t scream`]},{label:`Chorus`,lines:[`You didn’t rule us`,`We let you`,`You didn’t own us`,`We bent`]}]}},l=[`Default`],c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  args: {
    title: "Consent of the Quiet",
    album: "Well Enough",
    sections: [{
      label: "Pre-Chorus",
      lines: ["Don’t scream", "They love you better when you don’t scream"]
    }, {
      label: "Chorus",
      lines: ["You didn’t rule us", "We let you", "You didn’t own us", "We bent"]
    }]
  }
}`,...c.parameters?.docs?.source}}}})))()}u();export{c as Default,l as __namedExportsOrder,s as default};