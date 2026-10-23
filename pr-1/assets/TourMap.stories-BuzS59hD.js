const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["./TourMapCanvas-Dk9hJaN9.js","./rolldown-runtime-CsOFd3vK.js","./react-BPpMo3eI.js","./iframe-Bb_OiKV0.js","./preload-helper-BprCFFoA.js","./chunk-7PIQR4A3-B40WzkBd.js","./chunk-DRQKCCAG-CwweSyot.js","./theming-OyWZp7KZ.js","./iframe--sSEo3Z2.css","./TourMapCanvas-B8-mEBLf.css"])))=>i.map(i=>d[i]);
import{n as e}from"./rolldown-runtime-CsOFd3vK.js";import{n as t,t as n}from"./preload-helper-BprCFFoA.js";import{t as r}from"./react-BPpMo3eI.js";import{a as i}from"./iframe-Bb_OiKV0.js";import{r as a,t as o}from"./Button-D9Glw2Sj.js";function s({points:e,label:t,className:n=``,workerUrl:r=`/maplibre/maplibre-gl-worker.mjs`}){let[i,a]=(0,l.useState)(!1),s=(0,l.useRef)(null);return(0,l.useEffect)(()=>{i&&s.current?.focus()},[i]),(0,c.jsxs)(`section`,{"aria-label":t,className:`space-y-4 rounded-card border border-line bg-surface p-5 ${n}`,children:[(0,c.jsx)(`ul`,{className:`space-y-2 text-sm`,children:e.map(e=>(0,c.jsxs)(`li`,{children:[(0,c.jsx)(`span`,{className:`font-semibold text-text`,children:e.label}),e.detail?(0,c.jsxs)(`span`,{className:`text-muted`,children:[` · `,e.detail]}):null]},e.id))}),i?(0,c.jsx)(`div`,{ref:s,tabIndex:-1,role:`region`,"aria-label":`Map: ${t}`,className:`h-80 overflow-hidden rounded-card border border-line focus-visible:outline-2 focus-visible:outline-cyan sm:h-96`,children:(0,c.jsx)(l.Suspense,{fallback:(0,c.jsx)(`p`,{className:`p-4 text-sm text-muted`,children:`Loading map…`}),children:(0,c.jsx)(u,{points:e,workerUrl:r})})}):(0,c.jsxs)(`div`,{className:`space-y-3`,children:[(0,c.jsx)(o,{type:`button`,variant:`outline`,onClick:()=>a(!0),children:`Show map`}),(0,c.jsx)(`p`,{className:`text-xs text-dim`,children:`Showing the map loads tiles from OpenStreetMap, which will see your IP address. Until you do, nothing is requested.`})]})]})}var c,l,u;function d(){return(d=e((()=>{c=i(),l=r(),a(),t(),u=(0,l.lazy)(()=>n(()=>import(`./TourMapCanvas-Dk9hJaN9.js`),__vite__mapDeps([0,1,2,3,4,5,6,7,8,9]),import.meta.url)),s.__docgenInfo={description:`Where a show (or every show) is. It starts as plain text: the places and their addresses. The interactive map
loads on request, so by default no map tiles are fetched and nothing about the visitor leaves the site. Say that wherever the map is used and keep the Privacy page in step.`,methods:[],displayName:`TourMap`,props:{points:{required:!0,tsType:{name:`Array`,elements:[{name:`signature`,type:`object`,raw:`{
  id: string;
  label: string;
  /** Street address or city, shown in the list and the pin's popup. */
  detail?: string;
  lat: number;
  lon: number;
  /** Where the popup's "Show details" link goes. */
  href?: string;
}`,signature:{properties:[{key:`id`,value:{name:`string`,required:!0}},{key:`label`,value:{name:`string`,required:!0}},{key:`detail`,value:{name:`string`,required:!1},description:`Street address or city, shown in the list and the pin's popup.`},{key:`lat`,value:{name:`number`,required:!0}},{key:`lon`,value:{name:`number`,required:!0}},{key:`href`,value:{name:`string`,required:!1},description:`Where the popup's "Show details" link goes.`}]}}],raw:`MapPoint[]`},description:``},label:{required:!0,tsType:{name:`string`},description:``},className:{required:!1,tsType:{name:`string`},description:``,defaultValue:{value:`""`,computed:!1}},workerUrl:{required:!1,tsType:{name:`string`},description:`Where public/maplibre/maplibre-gl-worker.mjs is served. Storybook passes a relative path, like its images.`,defaultValue:{value:`"/maplibre/maplibre-gl-worker.mjs"`,computed:!1}}}}})))()}var f,p,m,h,g,_,v,y,b,x,S,C,w,T;function E(){return(E=e((()=>{f=i(),d(),{expect:p,userEvent:m,within:h}=__STORYBOOK_MODULE_TEST__,g={id:`oakland`,label:`Paramount Theatre`,detail:`2025 Broadway, Oakland, CA`,lat:37.8099,lon:-122.2687,href:`/tickets/oakland-1997-10-18`},_=[{id:`sf`,label:`Roderick's Chamber`,detail:`715 Harrison St, San Francisco, CA`,lat:37.7821,lon:-122.3976,href:`/tickets/sf-1997-10-07`},g,{id:`portland`,label:`Satyricon`,detail:`125 NW 6th Ave, Portland, OR`,lat:45.524,lon:-122.6766,href:`/tickets/portland-1997-10-21`},{id:`seattle`,label:`Crocodile Cafe`,detail:`2200 2nd Ave, Seattle, WA`,lat:47.6136,lon:-122.3443,href:`/tickets/seattle-1997-10-23`},{id:`la`,label:`Hollywood Palace`,detail:`1735 N Vine St, Los Angeles, CA`,lat:34.1027,lon:-118.327,href:`/tickets/la-1997-10-31`},{id:`sandiego`,label:`Belly Up Tavern`,detail:`143 S Cedros Ave, Solana Beach, CA`,lat:32.991,lon:-117.2707,href:`/tickets/sandiego-1997-11-01`},{id:`phoenix`,label:`Mason Jar`,detail:`2303 E Indian School Rd, Phoenix, AZ`,lat:33.4945,lon:-112.0321,href:`/tickets/phoenix-1997-11-04`},{id:`slc`,label:`Club DV8`,detail:`115 S West Temple, Salt Lake City, UT`,lat:40.7668,lon:-111.8938,href:`/tickets/slc-1997-11-06`},{id:`denver`,label:`Ogden Theatre`,detail:`935 E Colfax Ave, Denver, CO`,lat:39.7403,lon:-104.9753,href:`/tickets/denver-1997-11-08`}],v={title:`Components/TourMap`,component:s,args:{workerUrl:`maplibre/maplibre-gl-worker.mjs`},parameters:{layout:`padded`},decorators:[e=>(0,f.jsx)(`div`,{className:`mx-auto max-w-3xl`,children:(0,f.jsx)(e,{})})]},y={args:{points:[g],label:`Paramount Theatre, Oakland`}},b={args:{points:_,label:`All tour dates`}},x={args:{points:[g],label:`Paramount Theatre, Oakland`},decorators:[e=>(0,f.jsx)(`div`,{className:`w-[22rem] max-w-full`,children:(0,f.jsx)(e,{})})]},S={args:{points:_.slice(0,4),label:`Tour dates`},decorators:[e=>(0,f.jsx)(`div`,{className:`w-[48rem] max-w-full`,children:(0,f.jsx)(e,{})})]},C={args:{points:_,label:`All tour dates`},decorators:[e=>(0,f.jsx)(`div`,{className:`w-[64rem] max-w-full`,children:(0,f.jsx)(e,{})})]},w={args:{points:[g],label:`Paramount Theatre, Oakland`},play:async({canvasElement:e})=>{await m.click(h(e).getByRole(`button`,{name:`Show map`})),await p(await h(e).findByRole(`region`,{name:/Map:/})).toBeVisible()}},T=[`SingleVenue`,`Overview`,`Phone`,`Tablet`,`Laptop`,`Loaded`],y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  args: {
    points: [oakland],
    label: "Paramount Theatre, Oakland"
  }
}`,...y.parameters?.docs?.source},description:{story:`A show's page. Plain text until "Show map" is clicked: no tiles are requested and nothing leaves the site.`,...y.parameters?.docs?.description}}},b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    points: all,
    label: "All tour dates"
  }
}`,...b.parameters?.docs?.source},description:{story:`The tour page: every venue as text, with the overview map on request.`,...b.parameters?.docs?.description}}},x.parameters={...x.parameters,docs:{...x.parameters?.docs,source:{originalSource:`{
  args: {
    points: [oakland],
    label: "Paramount Theatre, Oakland"
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
    points: [oakland],
    label: "Paramount Theatre, Oakland"
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