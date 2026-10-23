import{n as e}from"./rolldown-runtime-CsOFd3vK.js";import{a as t}from"./iframe--n2scDQD.js";import{i as n,r}from"./react-BwxS1YvO.js";import{a as i,o as a}from"./blocks-BYpT0XpJ.js";function o(e){let t={code:`code`,h1:`h1`,li:`li`,ol:`ol`,p:`p`,strong:`strong`,...n(),...e.components};return(0,c.jsxs)(c.Fragment,{children:[(0,c.jsx)(i,{title:`Process/Design approval`}),`
`,(0,c.jsx)(t.h1,{id:`design-approval`,children:`Design approval`}),`
`,(0,c.jsx)(t.p,{children:`Nothing in this design system reaches the site until a human has reviewed it here.`}),`
`,(0,c.jsxs)(t.ol,{children:[`
`,(0,c.jsxs)(t.li,{children:[`Work on a branch named `,(0,c.jsx)(t.code,{children:`design-<topic>`}),` (not `,(0,c.jsx)(t.code,{children:`design/<topic>`}),`: git cannot hold both `,(0,c.jsx)(t.code,{children:`design`}),` and `,(0,c.jsx)(t.code,{children:`design/x`}),`) and open a PR into `,(0,c.jsx)(t.code,{children:`design`}),`.`]}),`
`,(0,c.jsx)(t.li,{children:`CI builds Storybook and posts a preview link on the PR.`}),`
`,(0,c.jsx)(t.li,{children:`Review the stories in the preview, including the a11y panel.`}),`
`,(0,c.jsxs)(t.li,{children:[`Merging the PR `,(0,c.jsx)(t.strong,{children:`is`}),` the approval.`]}),`
`,(0,c.jsxs)(t.li,{children:[`Only then are tokens and components from `,(0,c.jsx)(t.code,{children:`design`}),` applied to the site, via a PR into `,(0,c.jsx)(t.code,{children:`main`}),`.`]}),`
`]})]})}function s(e={}){let{wrapper:t}={...n(),...e.components};return t?(0,c.jsx)(t,{...e,children:(0,c.jsx)(o,{...e})}):o(e)}var c;function l(){return(l=e((()=>{c=t(),r(),a()})))()}l();export{s as default};