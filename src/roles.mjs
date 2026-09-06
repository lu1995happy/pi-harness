export function rolePresentation(role){
  return {team:role==='main',todo:['crew','reviewer','pipeline','background'].includes(role)};
}
