const clamp=(value:number)=>Math.max(0,Math.min(1,value));

// The canvas and its copy share a viewport, then leave as one bounded scene.
export function introScrollLayout(progress:number,nextSceneTop:number,viewportHeight:number){
  return {
    exit:Math.min(0,nextSceneTop-viewportHeight),
    openingOpacity:1-clamp(progress/.28),
    numberOpacity:clamp((progress-.89)/.09),
  };
}
