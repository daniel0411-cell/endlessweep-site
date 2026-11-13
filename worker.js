const events=new Set(['endless_milestone','game_started','game_completed','game_abandoned','challenge_shared','practice_started','practice_completed','replay_opened','mistake_review_opened','game_restarted','shared_visit','shared_game_started']);
const modes=new Set(['mini','easy','beginner','intermediate','expert','custom','daily','daily-archive','daily-beginner','daily-intermediate','daily-expert','time-attack-beginner','time-attack-intermediate','zen-beginner','zen-intermediate','zen-expert','no-guess','no-guess-beginner','no-guess-intermediate','no-guess-expert','unblocked','practice','replay','endless']);

export default {
  async fetch(request,env){
    const url=new URL(request.url);
    if(url.hostname==='endlessweep.com'&&url.protocol==='http:'){
      url.protocol='https:';
      return Response.redirect(url,308);
    }
    if(url.pathname==='/api/version'&&request.method==='GET')return Response.json({commit:env.RELEASE_COMMIT||null},{headers:{'cache-control':'no-store'}});
    if(url.pathname==='/api/events'&&request.method==='POST'){
      let data;
      try{data=await request.json()}catch{return new Response(null,{status:400})}
      if(!data||typeof data!=='object'||Array.isArray(data)||!events.has(data.event)||!modes.has(data.mode))return new Response(null,{status:400});
      if(['result','device'].some(key=>data[key]!==undefined&&(typeof data[key]!=='string'||data[key].length>120))||['seconds','mistakes','streak','cleared','score'].some(key=>data[key]!==undefined&&(typeof data[key]!=='number'||!Number.isFinite(data[key]))))return new Response(null,{status:400});
      env.GAME_EVENTS.writeDataPoint({blobs:[data.event,data.mode,data.result||'',data.device||''],doubles:[data.seconds||0,data.mistakes||0,data.streak||0,data.cleared||0,data.score||0],indexes:[data.event]});
      return new Response(null,{status:204});
    }
    return env.ASSETS.fetch(request);
  }
};
