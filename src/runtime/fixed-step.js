// ROJ-0011: only native Motion advances simulation; camera and renderer interpolate separately.
export const STEP_SECONDS=1/60;
export function createFixedStepper({step=STEP_SECONDS,maxSteps=6}={}){
 if(!(step>0)||!(maxSteps>=1))throw new RangeError('Invalid simulation step');
 let accumulator=0,stepsTotal=0;
 return {
  advance(rawDelta,callback){
   const delta=Number.isFinite(rawDelta)?Math.max(0,Math.min(rawDelta,step*maxSteps)):0;
   accumulator=Math.min(accumulator+delta,step*maxSteps);
   let steps=0;
   while(accumulator+1e-10>=step&&steps<maxSteps){callback(step,steps);accumulator-=step;steps++;stepsTotal++;}
   return {steps,alpha:Math.max(0,Math.min(1,accumulator/step)),stepsTotal};
  },
  reset(){accumulator=0;stepsTotal=0;},
  snapshot(){return {accumulator,stepsTotal}} 
 };
}
