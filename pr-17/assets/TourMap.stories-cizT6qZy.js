const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./TourMapCanvas-lxv-p8Yv.js","./rolldown-runtime-CsOFd3vK.js","./react-BPpMo3eI.js","./iframe-DVqd_E1V.js","./preload-helper-BprCFFoA.js","./chunk-7PIQR4A3-B40WzkBd.js","./chunk-DRQKCCAG-CwweSyot.js","./theming-OyWZp7KZ.js","./iframe-lbxSSXyk.css","./TourMapCanvas-DBE96hFo.css"])))=>i.map(i=>d[i]);
import{n as e}from"./rolldown-runtime-CsOFd3vK.js";import{n as t,t as n}from"./preload-helper-BprCFFoA.js";import{t as r}from"./react-BPpMo3eI.js";import{a as i}from"./iframe-DVqd_E1V.js";import{r as a,t as o}from"./Button-D3i5aFHD.js";function s({points:e,label:t,className:n=``,workerUrl:r=`/maplibre/maplibre-gl-worker.mjs`}){let[i,a]=(0,l.useState)(!1),s=(0,l.useRef)(null);return(0,l.useEffect)(()=>{i&&s.current?.focus()},[i]),(0,c.jsxs)(`section`,{"aria-label":t,className:`space-y-4 rounded-card border border-line bg-surface p-5 ${n}`,children:[(0,c.jsx)(`ul`,{className:`space-y-2 text-sm`,children:e.map(e=>(0,c.jsxs)(`li`,{children:[(0,c.jsx)(`span`,{className:`font-semibold text-text`,children:e.label}),e.detail?(0,c.jsxs)(`span`,{className:`text-muted`,children:[` · `,e.detail]}):null]},e.id))}),i?(0,c.jsx)(`div`,{ref:s,tabIndex:-1,role:`region`,"aria-label":`Map: ${t}`,className:`h-80 overflow-hidden rounded-card border border-line focus-visible:outline-2 focus-visible:outline-accent-3 sm:h-96`,children:(0,c.jsx)(l.Suspense,{fallback:(0,c.jsx)(`p`,{className:`p-4 text-sm text-muted`,children:`Loading map…`}),children:(0,c.jsx)(u,{points:e,workerUrl:r})})}):(0,c.jsxs)(`div`,{className:`space-y-3`,children:[(0,c.jsx)(o,{type:`button`,variant:`outline`,onClick:()=>a(!0),children:`Show map`}),(0,c.jsx)(`p`,{className:`text-xs text-dim`,children:`Showing the map loads tiles from OpenStreetMap, which will see your IP address. Until you do, nothing is requested.`})]})]})}var c,l,u;function d(){return(d=e((()=>{c=i(),l=r(),a(),t(),u=(0,l.lazy)(()=>n(()=>import(`./TourMapCanvas-lxv-p8Yv.js`),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9]),import.meta.url)),s.__docgenInfo={description:`Where a show (or every show) is. It starts as plain text: the places and their addresses. The interactive map
loads on request, so by default no map tiles are fetched and nothing about the visitor leaves the site. Say that wherever the map is used and keep the Privacy page in step.`,methods:[],displayName:`TourMap`,props:{points:{required:!0,tsType:{name:`Array`,elements:[{name:`signature`,type:`object`,raw:`{
  id: string;
  label: string;
  /** Street address or city, shown in the list and the pin's popup. */
  detail?: string;
  lat: number;
  lon: number;
  /** Where the popup's "Show details" link goes. */
  href?: string;
}`,signature:{properties:[{key:`id`,value:{name:`string`,required:!0}},{key:`label`,value:{name:`string`,required:!0}},{key:`detail`,value:{name:`string`,required:!1},description:`Street address or city, shown in the list and the pin's popup.`},{key:`lat`,value:{name:`number`,required:!0}},{key:`lon`,value:{name:`number`,required:!0}},{key:`href`,value:{name:`string`,required:!1},description:`Where the popup's "Show details" link goes.`}]}}],raw:`MapPoint[]`},description:``},label:{required:!0,tsType:{name:`string`},description:``},className:{required:!1,tsType:{name:`string`},description:``,defaultValue:{value:`""`,computed:!1}},workerUrl:{required:!1,tsType:{name:`string`},description:`Where public/maplibre/maplibre-gl-worker.mjs is served. Storybook passes a relative path, like its images.`,defaultValue:{value:`"/maplibre/maplibre-gl-worker.mjs"`,computed:!1}}}}})))()}var f,p,m,h,g,_,v,y,b,x,S,C,w,T;function E(){return(E=e((()=>{f=i(),d(),{expect:p,userEvent:m,within:h}=__STORYBOOK_MODULE_TEST__,g={id:`sample-town`,label:`Placeholder Theatre`,detail:`2 Main St, Sample Town, OR`,lat:44,lon:-120.5,href:`/tickets/sample-town-2027-03-14`},_=[{id:`sample-city`,label:`Example Hall`,detail:`1 Main St, Sample City, CA`,lat:36.7783,lon:-119.4179,href:`/tickets/sample-city-2027-03-12`},g,{id:`portland`,label:`Venue C`,detail:`3 Main St, Portland, OR`,lat:45.524,lon:-122.6766,href:`/tickets/portland-2027-03-16`},{id:`seattle`,label:`Venue D`,detail:`4 Main St, Seattle, WA`,lat:47.6136,lon:-122.3443,href:`/tickets/seattle-2027-03-18`},{id:`la`,label:`Venue E`,detail:`5 Main St, Los Angeles, CA`,lat:34.1027,lon:-118.327,href:`/tickets/la-2027-03-26`},{id:`sandiego`,label:`Venue F`,detail:`6 Main St, San Diego, CA`,lat:32.7157,lon:-117.1611,href:`/tickets/sandiego-2027-03-27`},{id:`phoenix`,label:`Venue G`,detail:`7 Main St, Phoenix, AZ`,lat:33.4945,lon:-112.0321,href:`/tickets/phoenix-2027-03-30`},{id:`slc`,label:`Venue H`,detail:`8 Main St, Salt Lake City, UT`,lat:40.7668,lon:-111.8938,href:`/tickets/slc-2027-04-01`},{id:`denver`,label:`Venue I`,detail:`9 Main St, Denver, CO`,lat:39.7403,lon:-104.9753,href:`/tickets/denver-2027-04-03`}],v={title:`Components/TourMap`,component:s,args:{workerUrl:`maplibre/maplibre-gl-worker.mjs`},parameters:{layout:`padded`},decorators:[e=>(0,f.jsx)(`div`,{className:`mx-auto max-w-3xl`,children:(0,f.jsx)(e,{})})]},y={args:{points:[g],label:`Placeholder Theatre, Sample Town`}},b={args:{points:_,label:`All tour dates`}},x={args:{points:[g],label:`Placeholder Theatre, Sample Town`},decorators:[e=>(0,f.jsx)(`div`,{className:`w-[22rem] max-w-full`,children:(0,f.jsx)(e,{})})]},S={args:{points:_.slice(0,4),label:`Tour dates`},decorators:[e=>(0,f.jsx)(`div`,{className:`w-[48rem] max-w-full`,children:(0,f.jsx)(e,{})})]},C={args:{points:_,label:`All tour dates`},decorators:[e=>(0,f.jsx)(`div`,{className:`w-[64rem] max-w-full`,children:(0,f.jsx)(e,{})})]},w={args:{points:[g],label:`Placeholder Theatre, Sample Town`},play:async({canvasElement:e})=>{await m.click(h(e).getByRole(`button`,{name:`Show map`})),await p(await h(e).findByRole(`region`,{name:/Map:/})).toBeVisible()}},T=[`SingleVenue`,`Overview`,`Phone`,`Tablet`,`Laptop`,`Loaded`],y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    points: [placeholderTheatre],
    label: "Placeholder Theatre, Sample Town"
  }
}`,...y.parameters?.docs?.source},description:{story:`A show's page. Plain text until "Show map" is clicked: no tiles are requested and nothing leaves the site.`,...y.parameters?.docs?.description}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    points: all,
    label: "All tour dates"
  }
}`,...b.parameters?.docs?.source},description:{story:`The tour page: every venue as text, with the overview map on request.`,...b.parameters?.docs?.description}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    points: [placeholderTheatre],
    label: "Placeholder Theatre, Sample Town"
  },
  decorators: [Story => <div className="w-[22rem] max-w-full"><Story /></div>]
}`,...x.parameters?.docs?.source},description:{story:`Phone width, where the list wraps and the map is shorter than wide.`,...x.parameters?.docs?.description}}},S.parameters={...S.parameters,docs:{...S.parameters?.docs,source:{originalSource:`{
  args: {
    points: all.slice(0, 4),
    label: "Tour dates"
  },
  decorators: [Story => <div className="w-[48rem] max-w-full"><Story /></div>]
}`,...S.parameters?.docs?.source},description:{story:`Tablet width. The list sits on one line per venue and the map is as wide as the card.`,...S.parameters?.docs?.description}}},C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    points: all,
    label: "All tour dates"
  },
  decorators: [Story => <div className="w-[64rem] max-w-full"><Story /></div>]
}`,...C.parameters?.docs?.source},description:{story:`Laptop width, with the whole tour listed.`,...C.parameters?.docs?.description}}},w.parameters={...w.parameters,docs:{...w.parameters?.docs,source:{originalSource:`{
  args: {
    points: [placeholderTheatre],
    label: "Placeholder Theatre, Sample Town"
  },
  play: async ({
    canvasElement
  }) => {
    await userEvent.click(within(canvasElement).getByRole("button", {
      name: "Show map"
    }));
    await expect(await within(canvasElement).findByRole("region", {
      name: /Map:/
    })).toBeVisible();
  }
}`,...w.parameters?.docs?.source},description:{story:`The map after the visitor asks for it. This story clicks the button, so it contacts OpenStreetMap when it runs.`,...w.parameters?.docs?.description}}}})))()}E();export{C as Laptop,w as Loaded,b as Overview,x as Phone,y as SingleVenue,S as Tablet,T as __namedExportsOrder,v as default};