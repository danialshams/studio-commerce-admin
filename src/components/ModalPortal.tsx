"use client";
import {useEffect,useLayoutEffect,useRef,useState,type ReactNode} from "react";
import {createPortal} from "react-dom";

/**
 * Route-independent dialog layer. Rendering the overlay under document.body
 * avoids the transformed .page-anim ancestor establishing a containing block
 * for position:fixed (which previously caused mobile/desktop misalignment).
 */
export function ModalPortal({children,onClose,variant="drawer"}:{
 children:ReactNode;onClose:()=>void;variant?:"drawer"|"confirm";
}){
 const [mounted,setMounted]=useState(false);
 const rootRef=useRef<HTMLDivElement>(null);
 const closeRef=useRef(onClose);
 closeRef.current=onClose;

 useEffect(()=>setMounted(true),[]);
 useLayoutEffect(()=>{
  if(!mounted)return;
  const previousOverflow=document.body.style.overflow;
  const previousPadding=document.body.style.paddingRight;
  const active=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const scrollbar=window.innerWidth-document.documentElement.clientWidth;
  // Preserve document position when opening tall editors on touch screens.
  document.body.style.overflow="hidden";
  if(scrollbar>0)document.body.style.paddingRight=`${scrollbar}px`;
  const raf=requestAnimationFrame(()=>{
   const root=rootRef.current;
   const initial=root?.querySelector<HTMLElement>("[data-dialog-initial-focus]")
     ??root?.querySelector<HTMLElement>("button:not([disabled]),input:not([disabled]),select:not([disabled])");
   initial?.focus({preventScroll:true});
  });
  function onKeyDown(event:KeyboardEvent){
   // A media chooser can open above a product editor. Only the topmost
   // modal owns Escape and focus cycling; don't close both at once.
   const overlays=Array.from(document.body.querySelectorAll(".modal-backdrop"));
   if(overlays[overlays.length-1]!==rootRef.current)return;
   if(event.key==="Escape"){event.preventDefault();closeRef.current();return}
   if(event.key!=="Tab")return;
   const focusables=Array.from(rootRef.current?.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')||[])
    .filter(el=>el.getClientRects().length>0 && el.getAttribute("aria-hidden")!=="true");
   if(!focusables.length)return;
   const first=focusables[0],last=focusables[focusables.length-1];
   if(event.shiftKey && document.activeElement===first){event.preventDefault();last.focus()}
   else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first.focus()}
  }
  document.addEventListener("keydown",onKeyDown);
  return ()=>{
   cancelAnimationFrame(raf);
   document.removeEventListener("keydown",onKeyDown);
   document.body.style.overflow=previousOverflow;
   document.body.style.paddingRight=previousPadding;
   active?.focus({preventScroll:true});
  };
 },[mounted]);

 if(!mounted)return null;
 return createPortal(
  <div ref={rootRef} className={`modal-backdrop modal-backdrop--${variant}`}
    onMouseDown={event=>{if(event.target===event.currentTarget)closeRef.current()}}>
   {children}
  </div>,document.body);
}
