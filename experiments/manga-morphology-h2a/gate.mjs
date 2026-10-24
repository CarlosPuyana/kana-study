export function automaticSelectionGate(report,{humanReviewedCases=0,lexiconCertified=false,mobileValidated=false}={}){
 const reasons=[];if(report.corpus.cases<200||humanReviewedCases<200)reasons.push('insufficient-independent-reference');if(report.corpus.difficult<50)reasons.push('insufficient-hard-cases');if(!lexiconCertified)reasons.push('lexical-identity-not-certified');if(!mobileValidated)reasons.push('mobile-performance-not-validated');
 for(const [engine,result] of Object.entries(report.engines)){
  if(result.pipeline.precision===null||result.counts.acceptedTP+result.counts.acceptedFP===0)reasons.push(engine+':no-accepted-sample');
  else if(result.pipeline.precision<.98)reasons.push(engine+':precision-below-98');
  if(result.counts.unsafeFixturesAccepted>0)reasons.push(engine+':unsafe-fixtures-accepted');
 }
 return {allowed:reasons.length===0,reasons};
}
